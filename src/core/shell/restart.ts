import fs from "node:fs/promises";

import postgres from "postgres";

import { environment } from "@/config/environment.js";
import { getComposeConfig } from "@/modules/compose/utils/compose-file.js";

import type { DiscordLiveMessage } from "../discord.js";
import { exec } from "./exec.js";

/**
 * Returns true if proceed with restart
 */
async function checkRestart(
  fileName: string,
  filePath: string,
  folderPath: string,
  status: DiscordLiveMessage,
) {
  const content = await fs.readFile(filePath, { encoding: "utf-8" });

  const firstLine = content.split("\n")[0];

  if (!firstLine?.includes("runs-on:")) {
    status.add(
      `⚠️ (${environment.DEVICE_NAME}) File ${fileName} does not have runs-on tag`,
    );
    return false;
  }

  const listStr = firstLine.split(":")[1]?.trim();
  const list = listStr?.split(",").map((item) => item.trim());

  if (!list || list.length < 1) {
    status.add(`⚠️ Fail to parse runs-on tag in ${fileName}`);
    return false;
  }

  if (!list.includes(environment.DEVICE_NAME)) {
    status.add(`⏩ (${environment.DEVICE_NAME}) Skip ${fileName}`);
    await exec(`cd ${folderPath} && docker compose down`);

    return false;
  }

  return true;
}

/**
 * Cron / manual jobs (no restart policy or `restart: no`) are recreated
 * without starting, so a git sync does not trigger an unscheduled run.
 */
export async function recreate(folderPath: string, filePath: string) {
  const config = await getComposeConfig(filePath);
  if (!config) {
    await exec(`cd ${folderPath} && docker compose up -d --force-recreate`);
    return;
  }

  const jobs: string[] = [];
  const services: string[] = [];
  for (const [name, service] of Object.entries(config.services)) {
    const isJob = !service.restart || service.restart === "no";
    (isJob ? jobs : services).push(name);
  }

  // Services first so jobs attach to the new containers (network_mode:
  // service:x); --no-deps keeps jobs from recreating them and leaving them down.
  if (services.length > 0) {
    await exec(
      `cd ${folderPath} && docker compose up -d --force-recreate ${services.join(" ")}`,
    );
  }
  if (jobs.length > 0) {
    await exec(
      `cd ${folderPath} && docker compose up --force-recreate --no-start --no-deps ${jobs.join(" ")}`,
    );
  }
}

export async function restart(
  path: string,
  files: string[],
  status: DiscordLiveMessage,
) {
  const sql = postgres(environment.DATABASE_URL);

  type SqlPayload = {
    file_path: string;
    time_pull: number;
    time_restart: number;
  };
  const sqlPayload: SqlPayload[] = [];
  let consecutiveFailures = 0;

  try {
    for (const file of files) {
      const targetPath =
        path + "/" + file.replace(/\/docker-compose.ya?ml$/, "");

      try {
        if (
          !(await checkRestart(file, path + "/" + file, targetPath, status))
        ) {
          await status.flush();
          continue;
        }

        status.setFooter(`⏳ Restarting ${file}...`);
        await status.flush();

        const start = performance.now();

        await exec(`cd ${targetPath} && docker compose pull`);
        const download = performance.now();

        await recreate(targetPath, path + "/" + file);
        const restarted = performance.now();

        const downloadTime = download - start;
        const restartTime = restarted - download;

        consecutiveFailures = 0;
        status.add(
          `✅ (${environment.DEVICE_NAME}) Restarted ${file}, Download: ${downloadTime}ms, Restart: ${restartTime}ms`,
        );

        sqlPayload.push({
          file_path: file,
          time_pull: downloadTime,
          time_restart: restartTime,
        });
      } catch (err) {
        consecutiveFailures++;
        const detail = err instanceof Error ? err.message : String(err);
        status.add(`❌ (${environment.DEVICE_NAME}) Failed ${file}: ${detail}`);

        if (consecutiveFailures >= 2) {
          status.add("🛑 Stopped after two consecutive restart failures");
          await status.flush();
          break;
        }
      }

      status.setFooter("⏳ In progress");
      await status.flush();
    }

    status.setFooter("⏳ Saving analytics...");
    await status.flush();

    if (sqlPayload.length === 0) {
      status.add(`📊 (${environment.DEVICE_NAME}) No analytics rows to save`);
    } else {
      try {
        await sql`INSERT INTO gitops ${sql(
          sqlPayload,
          "file_path",
          "time_pull",
          "time_restart",
        )}`;
        status.add(
          `📊 (${environment.DEVICE_NAME}) Analytics saved (${sqlPayload.length})`,
        );
      } catch (_) {
        status.add(
          `⚠️ (${environment.DEVICE_NAME}) Failed to insert to database`,
        );
      }
    }

    status.setFooter("✅ All work complete");
    await status.flush();
  } finally {
    await sql.end();
  }
}
