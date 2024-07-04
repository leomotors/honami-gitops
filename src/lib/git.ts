import { exec } from "./exec.js";
import { log } from "./logger.js";

export async function getChangedFiles(
  path: string,
  before: string,
  after: string,
) {
  const cmd = `cd ${path} && git diff --name-only ${before} ${after}`;
  const { stdout: result } = await exec(cmd);
  log.normal(`Git Diff: ${result}`);
  return result.split("\n").filter((item) => item);
}

export async function getCurrentHash(path: string) {
  const cmd = `cd ${path} && git rev-parse HEAD`;
  const { stdout: result } = await exec(cmd);
  return result.trim();
}
