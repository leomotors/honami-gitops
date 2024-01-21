import { sendMessage } from "./discord.js";
import { exec } from "./exec.js";

export async function restart(path: string, files: string[]) {
  for (const file of files) {
    const start = performance.now();

    const targetPath = path + "/" + file.replace("/docker-compose.yml", "");

    await exec(
      `cd ${targetPath} && sudo docker compose pull && sudo docker compose down && sudo docker compose up -d`,
    );

    await sendMessage(
      `:white_check_mark: Restarted ${file} in ${performance.now() - start}ms`,
    );
  }
}
