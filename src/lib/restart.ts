import { sendMessage } from "./discord.js";
import { exec } from "./exec.js";

export async function restart(path: string, files: string[]) {
  for (const file of files) {
    const start = performance.now();

    const targetPath = path + "/" + file.replace("/docker-compose.yml", "");

    await exec(`cd ${targetPath} && sudo docker compose pull`);
    const download = performance.now();

    await exec(`cd ${targetPath} && sudo docker compose up -d --force-recreate`);
    const restarted = performance.now();

    await sendMessage(
      `:white_check_mark: Restarted ${file}, Download: ${download - start}ms, Restart: ${performance.now() - restarted}ms`,
    );
  }
}
