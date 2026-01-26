import { Elysia } from "elysia";

import { scanComposeFiles } from "./compose.service.js";
import { ComposeListResponseSchema } from "./schema.js";

export const composeController = new Elysia({
  prefix: "/compose",
  detail: {
    tags: ["Compose"],
  },
}).get(
  "/",
  async () => {
    const startTime = Date.now();
    const composeFiles = await scanComposeFiles();
    const timeTaken = Date.now() - startTime;

    return {
      composeFiles,
      metadata: {
        datetime: new Date().toISOString(),
        timeTaken,
      },
    };
  },
  {
    detail: {
      summary: "List compose files",
      description:
        "Scans for all docker-compose files in the repository that are configured to run on this device. Returns detailed information about containers, their status, ports, environment variables, volumes, and labels.",
      tags: ["Compose"],
    },
    response: {
      200: ComposeListResponseSchema,
    },
  },
);
