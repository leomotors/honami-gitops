import { exec } from "@/core/shell/exec.js";

import type { ContainerStatus, OutdatedDetail } from "../schema.js";
import type { DockerInspect } from "../types/docker.js";

export interface ContainerStatusResult {
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

export async function getContainerStatus(
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
