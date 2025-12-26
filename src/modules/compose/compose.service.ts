import fs from "node:fs/promises";
import path from "node:path";

import { environment } from "@/config/environment.js";
import { exec } from "@/core/shell/exec.js";

import type { ComposeInfo, ContainerInfo, ContainerStatus } from "./schema.js";

interface ComposeConfig {
  services: Record<
    string,
    {
      container_name?: string;
      image: string;
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

async function getContainerStatus(
  containerName: string,
  expectedImage: string,
): Promise<ContainerStatus> {
  try {
    const { stdout } = await exec(`docker inspect ${containerName}`, false);
    const containerInfo: DockerInspect[] = JSON.parse(stdout);

    if (containerInfo.length === 0 || !containerInfo[0]) {
      return "Down";
    }

    const container = containerInfo[0];

    // Check if image is outdated
    if (container.Config.Image !== expectedImage) {
      return "Outdated";
    }

    // Check health status
    if (container.State.Health) {
      if (container.State.Health.Status === "healthy") {
        return "Healthy";
      } else if (container.State.Health.Status === "unhealthy") {
        return "Unhealthy";
      }
    }

    // Check if running
    if (container.State.Status === "running") {
      return "Up";
    }

    return "Down";
  } catch {
    return "Down";
  }
}

function getOverallStatus(containers: ContainerInfo[]): ContainerStatus {
  if (containers.length === 0) return "Down";

  const statuses = containers.map((c) => c.status);

  if (statuses.every((s) => s === "Healthy")) return "Healthy";
  if (statuses.some((s) => s === "Unhealthy")) return "Unhealthy";
  if (statuses.some((s) => s === "Outdated")) return "Outdated";
  if (statuses.some((s) => s === "Down")) return "Down";
  if (statuses.every((s) => s === "Up" || s === "Healthy")) return "Up";

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
      const status = await getContainerStatus(containerName, service.image);

      containers.push({
        name: containerName,
        image: service.image,
        status,
        ports: service.ports || [],
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
