import { Context } from "elysia";

import { environment } from "@/config/environment.js";
import { addMessage, sendMessage } from "@/core/discord.js";
import { log } from "@/core/logger.js";
import { exec } from "@/core/shell/exec.js";
import { getChangedFiles, getCurrentHash } from "@/core/shell/git.js";
import { restartComposeFiles } from "@/modules/compose/operations.js";

export async function handleGitSyncWebhook({ request, set }: Context) {
  const authorization = request.headers.get("authorization");

  if (authorization !== environment.WEBHOOK_PASSWORD) {
    set.status = 401;
    return "Unauthorized";
  }

  gitSync();

  return "Task started";
}

async function gitSync() {
  const before = await getCurrentHash(environment.REPO_PATH);

  try {
    await exec(`cd ${environment.REPO_PATH} && git pull`);
  } catch (err) {
    log.error("GIT SYNC: Pull failed!");
    log.normal(`${err} ${(err as Error)?.stack}`);
    addMessage(`# GIT SYNC (${environment.DEVICE_NAME}): Pull failed`);
    await sendMessage();
    return;
  }

  const after = await getCurrentHash(environment.REPO_PATH);

  if (before === after) {
    log.normal("GIT SYNC: No changes, skipped");
    return;
  }

  const changedFiles = await getChangedFiles(
    environment.REPO_PATH,
    before,
    after,
  );

  await exec(
    `chown ${environment.UID}:${environment.GID} ${changedFiles.map((s) => `"${s}"`).join(" ")}`,
  );

  const composeFiles = changedFiles.filter(
    (file: string) =>
      file.endsWith("docker-compose.yml") ||
      file.endsWith("docker-compose.yaml"),
  );

  await restartComposeFiles(composeFiles, "GIT SYNC");
}
