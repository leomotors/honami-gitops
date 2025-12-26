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
    const composeFiles = await scanComposeFiles();

    return {
      composeFiles,
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
