import fs from "node:fs/promises";
import postgres from "postgres";

import { environment } from "../environment.js";

import { addMessage } from "./discord.js";
import { exec } from "./exec.js";

/**
 * Returns true if proceed with restart
 */
async function checkRestart(
  fileName: string,
  filePath: string,
  folderPath: string,
) {
  const content = await fs.readFile(filePath, { encoding: "utf-8" });

  const firstLine = content.split("\n")[0];

  if (!firstLine?.includes("runs-on:")) {
    addMessage(
      `:warning: (${environment.DEVICE_NAME}) File ${fileName} does not have runs-on tag`,
    );
    return false;
  }

  const listStr = firstLine.split(":")[1]?.trim();
  const list = listStr?.split(",").map((item) => item.trim());

  if (!list || list.length < 1) {
    addMessage(`:warning: Fail to parse runs-on tag in ${fileName}`);
    return false;
  }

  if (!list.includes(environment.DEVICE_NAME)) {
    addMessage(`:fast_forward: (${environment.DEVICE_NAME}) Skip ${fileName}`);
    await exec(`cd ${folderPath} && sudo docker compose down`);

    return false;
  }

  return true;
}

export async function restart(path: string, files: string[]) {
  const sql = postgres(environment.DATABASE_URL);

  type SqlPayload = {
    file_path: string;
    time_pull: number;
    time_restart: number;
  };
  const sqlPayload: SqlPayload[] = [];

  for (const file of files) {
    const targetPath = path + "/" + file.replace(/\/docker-compose.ya?ml$/, "");

    if (!(await checkRestart(file, path + "/" + file, targetPath))) {
      continue;
    }

    const start = performance.now();

    await exec(`cd ${targetPath} && sudo docker compose pull`);
    const download = performance.now();

    await exec(
      `cd ${targetPath} && sudo docker compose up -d --force-recreate`,
    );
    const restarted = performance.now();

    const downloadTime = download - start;
    const restartTime = restarted - download;

    addMessage(
      `:white_check_mark: (${environment.DEVICE_NAME}) Restarted ${file}, Download: ${downloadTime}ms, Restart: ${restartTime}ms`,
    );

    sqlPayload.push({
      file_path: file,
      time_pull: downloadTime,
      time_restart: restartTime,
    });
  }

  try {
    await sql`INSERT INTO gitops ${sql(sqlPayload, "file_path", "time_pull", "time_restart")}`;
  } catch (err) {
    addMessage(
      `:warning: (${environment.DEVICE_NAME}) Failed to insert to database`,
    );
  } finally {
    await sql.end();
  }
}
