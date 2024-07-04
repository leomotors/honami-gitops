import { exec as execCallback } from "node:child_process";
import { promisify } from "node:util";

import { log } from "./logger.js";

const _exec = promisify(execCallback);

export async function exec(command: string) {
  log.normal(`[EXEC]: ${command}`);
  const { stderr, stdout } = await _exec(command);

  log.normal(`[EXEC RESULT]: ${stdout}`);
  if (stderr) {
    log.error(`[EXEC ERROR]: ${stderr}`);
  }

  return { stdout, stderr };
}
