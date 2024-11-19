import { FastifyReply, FastifyRequest } from "fastify";

import { environment } from "../environment.js";
import { addMessage, sendMessage } from "../lib/discord.js";
import { exec } from "../lib/exec.js";
import { getChangedFiles, getCurrentHash } from "../lib/git.js";
import { log } from "../lib/logger.js";
import { restart } from "../lib/restart.js";

export async function gitsync(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;

  if (authorization !== environment.WEBHOOK_PASSWORD) {
    reply.status(401);
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
  const composeFiles = changedFiles.filter(
    (file) =>
      file.endsWith("docker-compose.yml") ||
      file.endsWith("docker-compose.yaml"),
  );

  if (composeFiles.length === 0) {
    log.normal("GIT SYNC: No files, skipped");
    return;
  }

  log.normal(`GIT SYNC: ${composeFiles}`);
  addMessage(
    `# GIT SYNC (${environment.DEVICE_NAME}): ${composeFiles.length} compose files changed\n${composeFiles
      .map((f) => `- ${f}`)
      .join("\n")}`,
  );

  try {
    await restart(environment.REPO_PATH, composeFiles);
  } catch (err) {
    log.error("GIT SYNC : Restart failed!");
    log.normal(`${err} ${(err as Error).stack}`);
    addMessage(`# GIT SYNC (${environment.DEVICE_NAME}): Restart failed`);
  } finally {
    await sendMessage();
  }
}
