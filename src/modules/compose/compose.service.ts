import fs from "node:fs/promises";
import path from "node:path";

import { environment } from "@/config/environment.js";
import { exec } from "@/core/shell/exec.js";

import type {
  ComposeInfo,
  ContainerInfo,
  ContainerStatus,
  OutdatedDetail,
} from "./schema.js";

interface ComposeConfig {
  services: Record<
    string,
    {
      container_name?: string;
      image: string;
      restart?: string;
      ports?: Array<{
        target: number;
        published?: string;
        protocol?: string;
      }>;
      environment?: Record<string, string | null>;
      volumes?: Array<{
        type: string;
        source?: string;
        target: string;
        read_only?: boolean;
      }>;
      labels?: Record<string, string>;
    }
  >;
}

interface DockerInspect {
  Id: string;
  Name: string;
  State: {
    Status: string;
    ExitCode: number;
    Health?: {
      Status: string;
    };
  };
  Config: {
    Image: string;
    Env?: string[];
    Labels?: Record<string, string>;
  };
  Image: string;
  HostConfig?: {
    PortBindings?: Record<string, Array<{ HostIp: string; HostPort: string }>>;
    Binds?: string[];
  };
  Mounts?: Array<{
    Type: string;
    Source?: string;
    Destination: string;
    RW: boolean;
  }>;
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostIp: string; HostPort: string }> | null>;
  };
}

async function findComposeFiles(repoPath: string): Promise<string[]> {
  const composeFiles: string[] = [];

  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (
        entry.name === "docker-compose.yml" ||
        entry.name === "docker-compose.yaml"
      ) {
        const relativePath = path.relative(repoPath, fullPath);
        composeFiles.push(relativePath);
      }
    }
  }

  await scanDirectory(repoPath);
  return composeFiles;
}

async function checkRunsOn(filePath: string): Promise<boolean> {
  const content = await fs.readFile(filePath, { encoding: "utf-8" });
  const firstLine = content.split("\n")[0];

  if (!firstLine?.includes("runs-on:")) {
    return false;
  }

  const listStr = firstLine.split(":")[1]?.trim();
  const list = listStr?.split(",").map((item) => item.trim());

  if (!list || list.length < 1) {
    return false;
  }

  return list.includes(environment.DEVICE_NAME);
}

async function getComposeConfig(
  composePath: string,
): Promise<ComposeConfig | null> {
  try {
    const { stdout } = await exec(
      `cd ${path.dirname(composePath)} && docker compose -f ${path.basename(composePath)} config --format json`,
      false,
    );
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

interface ContainerStatusResult {
  status: ContainerStatus;
  outdatedDetails?: OutdatedDetail[];
}

function parseEnvArray(envArray?: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  if (!envArray) return result;

  for (const env of envArray) {
    const idx = env.indexOf("=");
    if (idx === -1) {
      result[env] = null;
    } else {
      result[env.slice(0, idx)] = env.slice(idx + 1);
    }
  }
  return result;
}

function getActualPorts(container: DockerInspect): Array<{
  target: number;
  published?: string;
  hostIp?: string;
  protocol?: string;
}> {
  const ports: Array<{
    target: number;
    published?: string;
    hostIp?: string;
    protocol?: string;
  }> = [];
  const actualPorts = container.NetworkSettings?.Ports || {};

  for (const [portKey, bindings] of Object.entries(actualPorts)) {
    const [targetStr, protocol] = portKey.split("/");
    const target = parseInt(targetStr || "0", 10);

    if (bindings && bindings.length > 0 && bindings[0]) {
      const binding = bindings[0];
      ports.push({
        target,
        published: binding.HostPort,
        hostIp: binding.HostIp || undefined,
        protocol: protocol || "tcp",
      });
    } else {
      // Port exposed but not published
      ports.push({
        target,
        protocol: protocol || "tcp",
      });
    }
  }

  return ports;
}

async function getContainerStatus(
  containerName: string,
  expectedImage: string,
  expectedEnv: Record<string, string | null>,
  expectedLabels: Record<string, string>,
  expectedVolumes: Array<{
    type: string;
    source?: string;
    target: string;
    read_only?: boolean;
  }>,
  expectedPorts: Array<{
    target: number;
    published?: string;
    protocol?: string;
  }>,
  restartPolicy?: string,
): Promise<ContainerStatusResult> {
  try {
    const { stdout } = await exec(`docker inspect ${containerName}`, false);
    const containerInfo: DockerInspect[] = JSON.parse(stdout);

    if (containerInfo.length === 0 || !containerInfo[0]) {
      return { status: "Down" };
    }

    const container = containerInfo[0];
    const outdatedDetails: OutdatedDetail[] = [];

    // Check if image is outdated
    if (container.Config.Image !== expectedImage) {
      outdatedDetails.push({
        type: "image",
        message: `Image differs: expected '${expectedImage}' but running '${container.Config.Image}'`,
      });
    }

    // Check environment variables
    const actualEnv = parseEnvArray(container.Config.Env);
    for (const [key, expectedValue] of Object.entries(expectedEnv)) {
      const actualValue = actualEnv[key];
      if (actualValue !== expectedValue) {
        const expectedStr = expectedValue === null ? "(empty)" : expectedValue;
        const actualStr =
          actualValue === undefined
            ? "(not set)"
            : actualValue === null
              ? "(empty)"
              : actualValue;
        outdatedDetails.push({
          type: "environment",
          message: `Environment variable '${key}' differs: expected '${expectedStr}' but running '${actualStr}'`,
        });
      }
    }

    // Check labels
    const actualLabels = container.Config.Labels || {};
    for (const [key, expectedValue] of Object.entries(expectedLabels)) {
      const actualValue = actualLabels[key];
      if (actualValue !== expectedValue) {
        const actualStr = actualValue === undefined ? "(not set)" : actualValue;
        outdatedDetails.push({
          type: "labels",
          message: `Label '${key}' differs: expected '${expectedValue}' but running '${actualStr}'`,
        });
      }
    }

    // Check volumes
    const actualMounts = container.Mounts || [];
    for (const expectedVol of expectedVolumes) {
      const actualMount = actualMounts.find(
        (m) => m.Destination === expectedVol.target,
      );
      if (!actualMount) {
        outdatedDetails.push({
          type: "volumes",
          message: `Volume '${expectedVol.target}' is not mounted`,
        });
      } else {
        if (expectedVol.source && actualMount.Source !== expectedVol.source) {
          outdatedDetails.push({
            type: "volumes",
            message: `Volume source for '${expectedVol.target}' differs: expected '${expectedVol.source}' but running '${actualMount.Source}'`,
          });
        }
        const expectedReadOnly = expectedVol.read_only || false;
        const actualReadOnly = !actualMount.RW;
        if (expectedReadOnly !== actualReadOnly) {
          outdatedDetails.push({
            type: "volumes",
            message: `Volume '${expectedVol.target}' read-only setting differs: expected ${expectedReadOnly} but running ${actualReadOnly}`,
          });
        }
      }
    }

    // Check ports
    const actualPorts = container.NetworkSettings?.Ports || {};
    for (const expectedPort of expectedPorts) {
      const protocol = expectedPort.protocol || "tcp";
      const portKey = `${expectedPort.target}/${protocol}`;
      const actualPortBindings = actualPorts[portKey];

      if (expectedPort.published) {
        if (!actualPortBindings || actualPortBindings.length === 0) {
          outdatedDetails.push({
            type: "ports",
            message: `Port ${expectedPort.target}/${protocol} is not published (expected ${expectedPort.published})`,
          });
        } else {
          const actualPublished = actualPortBindings[0]?.HostPort;
          if (actualPublished !== expectedPort.published) {
            outdatedDetails.push({
              type: "ports",
              message: `Port ${expectedPort.target}/${protocol} differs: expected published on ${expectedPort.published} but running on ${actualPublished}`,
            });
          }
        }
      }
    }

    // Determine status
    if (outdatedDetails.length > 0) {
      return { status: "Outdated", outdatedDetails };
    }

    // Check health status
    if (container.State.Health) {
      if (container.State.Health.Status === "healthy") {
        return { status: "Healthy" };
      } else if (container.State.Health.Status === "unhealthy") {
        return { status: "Unhealthy" };
      }
    }

    // Check if running
    if (container.State.Status === "running") {
      return { status: "Up" };
    }

    // Check if exited successfully (cron job)
    if (container.State.Status === "exited") {
      const isCronJob = !restartPolicy || restartPolicy === "no";
      if (isCronJob && container.State.ExitCode === 0) {
        return { status: "Completed" };
      }
    }

    return { status: "Down" };
  } catch {
    return { status: "Down" };
  }
}

function getOverallStatus(containers: ContainerInfo[]): ContainerStatus {
  if (containers.length === 0) return "Down";

  const statuses = containers.map((c) => c.status);

  if (statuses.every((s) => s === "Healthy")) return "Healthy";
  if (statuses.some((s) => s === "Unhealthy")) return "Unhealthy";
  if (statuses.some((s) => s === "Outdated")) return "Outdated";
  if (statuses.some((s) => s === "Down")) return "Down";
  if (statuses.every((s) => s === "Completed")) return "Completed";
  if (statuses.every((s) => s === "Up" || s === "Healthy" || s === "Completed"))
    return "Up";

  return "Down";
}

export async function scanComposeFiles(): Promise<ComposeInfo[]> {
  const repoPath = environment.REPO_PATH;
  const composeFiles = await findComposeFiles(repoPath);

  const results: ComposeInfo[] = [];

  for (const file of composeFiles) {
    const fullPath = path.join(repoPath, file);

    // Check runs-on tag
    if (!(await checkRunsOn(fullPath))) {
      continue;
    }

    // Get compose config
    const config = await getComposeConfig(fullPath);
    if (!config || !config.services) {
      continue;
    }

    // Get container information
    const containers: ContainerInfo[] = [];

    for (const [serviceName, service] of Object.entries(config.services)) {
      const containerName = service.container_name || serviceName;
      const { status, outdatedDetails } = await getContainerStatus(
        containerName,
        service.image,
        service.environment || {},
        service.labels || {},
        service.volumes || [],
        service.ports || [],
        service.restart,
      );

      // Get actual port info from running container
      let actualPorts = service.ports || [];
      try {
        const { stdout } = await exec(`docker inspect ${containerName}`, false);
        const containerInfo: DockerInspect[] = JSON.parse(stdout);
        if (containerInfo.length > 0 && containerInfo[0]) {
          actualPorts = getActualPorts(containerInfo[0]);
        }
      } catch {
        // If container is not running, use compose config
      }

      containers.push({
        name: containerName,
        image: service.image,
        status,
        ...(outdatedDetails && outdatedDetails.length > 0
          ? { outdatedDetails }
          : {}),
        ports: actualPorts,
        environment: service.environment || {},
        volumes: service.volumes || [],
        labels: service.labels || {},
      });
    }

    const overallStatus = getOverallStatus(containers);

    results.push({
      path: file,
      status: overallStatus,
      containers,
    });
  }

  return results;
}
