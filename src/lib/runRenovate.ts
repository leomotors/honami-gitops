import { environment } from "../environment.js";
import { addMessage, sendMessage } from "./discord.js";
import { exec } from "./exec.js";
import { log } from "./logger.js";

let renovateRunning = false;

export async function runRenovate() {
  if (process.env.RUNS_RENOVATE !== "true") {
    log.error("Renovate is disabled but requested to run!");
    return;
  }

  if (renovateRunning) {
    log.info("Renovate already running, skipping...");
    return;
  }

  renovateRunning = true;

  log.info("Running Renovate...");
  try {
    const { stderr, stdout } = await exec(
      `docker run -a ${environment.RENOVATE_CONTAINER_NAME}`,
    );
    log.normal(stdout);

    if (stderr) {
      log.error(stderr);
    }
  } catch (err) {
    log.error("Renovate failed!");
    log.normal(`${err}`);
    addMessage(`# RENOVATE: Run failed\n${err}`.slice(0, 2000));
    await sendMessage();
  } finally {
    renovateRunning = false;
  }
}
