import path from "node:path";

import { environment } from "@/config/environment.js";
import { exec } from "@/core/shell/exec.js";

import type { ComposeInfo, ContainerInfo, ContainerStatus } from "./schema.js";
import type { DockerInspect } from "./types/docker.js";
import {
  checkRunsOn,
  findComposeFiles,
  getComposeConfig,
} from "./utils/compose-file.js";
import { getContainerStatus } from "./utils/docker-inspect.js";
import { getActualPorts } from "./utils/port-mapper.js";

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
