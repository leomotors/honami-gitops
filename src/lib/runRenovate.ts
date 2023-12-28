import { sendMessage } from "./discord.js";
import { exec } from "./exec.js";
import { log } from "./logger.js";

export async function runRenovate() {
  log.info("Running Renovate...");
  try {
    const { stderr, stdout } = await exec("pnpm run renovate");
    console.log(stdout);
    stderr && console.error(stderr);
  } catch (err) {
    log.error("Renovate failed!");
    log.normal(`${err}`);
    await sendMessage("# RENOVATE: Run failed");
  }
}
