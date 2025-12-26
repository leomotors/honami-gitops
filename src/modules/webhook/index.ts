import { Elysia } from "elysia";

import { handleGitSyncWebhook } from "./gitsync.js";
import { handleRenovateWebhook } from "./renovate.js";

export const webhookController = new Elysia({
  prefix: "/webhook",
  detail: {
    tags: ["Webhook"],
  },
})
  .post("/webhook/gitsync", handleGitSyncWebhook, {
    detail: {
      summary: "Git sync webhook",
      description:
        "Triggers a git pull operation and restarts docker-compose services if compose files are changed. Requires authentication via the authorization header.",
      tags: ["Webhook"],
      security: [
        {
          webhookAuth: [],
        },
      ],
    },
  })
  .post("/webhook/renovate", handleRenovateWebhook, {
    detail: {
      summary: "Renovate webhook",
      description:
        "Triggers a Renovate bot run for dependency updates. Requires authentication via the authorization header.",
      tags: ["Webhook"],
      security: [
        {
          webhookAuth: [],
        },
      ],
    },
  });
