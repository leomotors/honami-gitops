import fs from "node:fs/promises";
import path from "node:path";

import { environment } from "@/config/environment.js";
import { exec } from "@/core/shell/exec.js";

import type { ComposeConfig } from "../types/docker.js";

export async function findComposeFiles(repoPath: string): Promise<string[]> {
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

export async function checkRunsOn(filePath: string): Promise<boolean> {
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

export async function getComposeConfig(
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
