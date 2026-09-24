import fs from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, mock, test } from "bun:test";

const fixtures = path.resolve(import.meta.dir, "../../../test-compose");
const commands: string[] = [];

mock.module("@/config/environment.js", () => ({
  environment: { DEVICE_NAME: "emu" },
}));

// Stands in for `docker compose config`, which normalizes `restart` the same way.
mock.module("./exec.js", () => ({
  exec: async (command: string) => {
    const config = command.match(/^cd (\S+) && docker compose -f (\S+) config/);
    if (config) {
      const file = path.join(config[1]!, config[2]!);
      const parsed = Bun.YAML.parse(fs.readFileSync(file, "utf-8"));
      return { stdout: JSON.stringify(parsed), stderr: "" };
    }
    commands.push(command);
    return { stdout: "", stderr: "" };
  },
}));

const { recreate } = await import("./restart.js");

async function run(folder: string) {
  const folderPath = path.join(fixtures, folder);
  await recreate(folderPath, path.join(folderPath, "docker-compose.yaml"));
  return commands.map((c) => c.replace(`cd ${folderPath} && `, ""));
}

describe("recreate", () => {
  beforeEach(() => {
    commands.length = 0;
  });

  test("starts long-running services", async () => {
    expect(await run(".")).toEqual([
      "docker compose up -d --force-recreate espresso-generator",
    ]);
  });

  test("does not start cron job services", async () => {
    expect(await run("cronjob")).toEqual([
      "docker compose up --force-recreate --no-start renovate",
    ]);
  });

  test("splits mixed compose file by restart policy", async () => {
    expect(await run("mixed")).toEqual([
      "docker compose up --force-recreate --no-start backup migrate",
      "docker compose up -d --force-recreate web",
    ]);
  });

  test("falls back to starting everything when config is unreadable", async () => {
    expect(await run("does-not-exist")).toEqual([
      "docker compose up -d --force-recreate",
    ]);
  });
});
