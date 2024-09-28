import { FastifyReply, FastifyRequest } from "fastify";

import { environment } from "../environment.js";
import { runRenovate } from "../lib/runRenovate.js";

export async function renovate(request: FastifyRequest, reply: FastifyReply) {
  const authorization = request.headers.authorization;

  if (authorization !== environment.WEBHOOK_PASSWORD) {
    reply.status(401);
    return "Unauthorized";
  }

  if (environment.RUNS_RENOVATE !== "true") {
    reply.status(418);
    return "Renovate is disabled";
  }

  runRenovate();

  return "Task started";
}
