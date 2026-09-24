import { environment } from "@/config/environment.js";
import { createLiveMessage } from "@/core/discord.js";
import { log } from "@/core/logger.js";
import { restart } from "@/core/shell/restart.js";

/**
 * Restart compose files with Discord messaging
 * @param composeFiles Array of compose file paths relative to REPO_PATH
 * @param source Source identifier for Discord messages (e.g., "GIT SYNC", "OUTDATED CHECK")
 */
export async function restartComposeFiles(
  composeFiles: string[],
  source: string,
) {
  if (composeFiles.length === 0) {
    log.normal(`${source}: No files, skipped`);
    return;
  }

  log.normal(`${source}: ${composeFiles}`);

  const status = createLiveMessage();
  status.add(
    `# ${source} (${environment.DEVICE_NAME}): ${composeFiles.length} compose files changed\n${composeFiles
      .map((f: string) => `- ${f}`)
      .join("\n")}`,
  );
  await status.flush();

  try {
    await restart(environment.REPO_PATH, composeFiles, status);
  } catch (err) {
    log.error(`${source}: Restart failed!`);
    log.normal(`${err} ${(err as Error).stack}`);
    status.add(`# ${source} (${environment.DEVICE_NAME}): Restart failed`);
    status.setFooter("❌ Stopped with an unexpected error");
    await status.flush();
  }
}
