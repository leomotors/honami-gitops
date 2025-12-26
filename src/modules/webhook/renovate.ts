import chalk from "chalk";
import { Context } from "elysia";

import { environment } from "@/config/environment.js";
import { addMessage, sendMessage } from "@/core/discord.js";
import { log } from "@/core/logger.js";
import { exec } from "@/core/shell/exec.js";

let renovateRunning = false;

async function runRenovate() {
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
      `docker start -a ${environment.RENOVATE_CONTAINER_NAME}`,
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

export async function handleRenovateWebhook({ request, set }: Context) {
  const authorization = request.headers.get("authorization");

  if (authorization !== environment.WEBHOOK_PASSWORD) {
    set.status = 401;
    return "Unauthorized";
  }

  if (environment.RUNS_RENOVATE !== "true") {
    set.status = 418;
    return "Renovate is disabled";
  }

  runRenovate();

  return "Task started";
}

/**
 * Setup automatic Renovate runs if enabled
 */
export function setupRenovate() {
  if (process.env.RUNS_RENOVATE === "true") {
    console.log(chalk.green("Renovate is enabled"));
    setTimeout(
      () => {
        // After 3 Minutes
        runRenovate();

        // Then, run every hour
        setInterval(
          () => {
            runRenovate();
          },
          1000 * 60 * 60,
        );
      },
      // Delay the first run by 3 minutes to not consume too much resources
      1000 * 60 * 3,
    );
  } else {
    console.log(chalk.yellow("Renovate is disabled"));
  }
}
