import postgres from "postgres";

import { environment } from "../environment.js";

import { sendMessage } from "./discord.js";
import { exec } from "./exec.js";

export async function restart(path: string, files: string[]) {
  const sql = postgres(environment.DATABASE_URL);

  type SqlPayload = {
    file_path: string;
    time_pull: number;
    time_restart: number;
  };
  const sqlPayload: SqlPayload[] = [];

  for (const file of files) {
    const targetPath = path + "/" + file.replace("/docker-compose.yml", "");

    const start = performance.now();

    await exec(`cd ${targetPath} && sudo docker compose pull`);
    const download = performance.now();

    await exec(
      `cd ${targetPath} && sudo docker compose up -d --force-recreate`,
    );
    const restarted = performance.now();

    const downloadTime = download - start;
    const restartTime = restarted - download;

    await sendMessage(
      `:white_check_mark: Restarted ${file}, Download: ${downloadTime}ms, Restart: ${restartTime}ms`,
    );

    sqlPayload.push({
      file_path: file,
      time_pull: downloadTime,
      time_restart: restartTime,
    });
  }

  sql`INSERT INTO gitops ${sql(sqlPayload, "file_path", "time_pull", "time_restart")}`;

  await sql.end();
}
