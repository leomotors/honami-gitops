import { Context } from "elysia";

import { environment } from "../environment.js";
import { runRenovate } from "../lib/runRenovate.js";

export async function renovate({ request, set }: Context) {
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
