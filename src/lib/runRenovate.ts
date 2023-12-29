import { sendMessage } from "./discord.js";
import { exec } from "./exec.js";
import { log } from "./logger.js";

let renovateRunning = false;

export async function runRenovate() {
  if (renovateRunning) {
    log.info("Renovate already running, skipping...");
    return;
  }

  renovateRunning = true;

  log.info("Running Renovate...");
  try {
    const { stderr, stdout } = await exec("pnpm run renovate");
    log.normal(stdout);
    stderr && log.error(stderr);
  } catch (err) {
    log.error("Renovate failed!");
    log.normal(`${err}`);
    await sendMessage(`# RENOVATE: Run failed\n${err}`.slice(0, 2000));
  } finally {
    renovateRunning = false;
  }
}
