import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

import { log } from "../logger.js";

const _exec = promisify(execCallback);

export async function exec(command: string, doLog = true) {
  if (doLog) {
    log.normal(`▶️ ${command}`);
  }
  const { stderr, stdout } = await _exec(command);

  if (doLog) {
    log.normal(`✅ ${stdout}`);
  }
  if (stderr) {
    log.error(`🚨 ${stderr}`);
  }

  return { stdout, stderr };
}
