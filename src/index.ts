import { openapi } from "@elysiajs/openapi";
import chalk from "chalk";
import { Elysia } from "elysia";

import { log } from "./lib/logger.js";
import { runRenovate } from "./lib/runRenovate.js";
import { gitsync } from "./routes/gitsync.js";
import { renovate } from "./routes/renovate.js";
import { getIP, isLocalIP } from "./utils.js";

type RequestState = {
  ip?: string;
};

const app = new Elysia()
  .decorate("requestState", {} as RequestState)
  .onRequest(({ request, requestState, server, set }) => {
    const ip = getIP(request, server);

    requestState.ip = ip;

    const pathName = new URL(request.url).pathname;
    // Block non-local requests to non-webhook endpoints
    if (!isLocalIP(ip) && !pathName.startsWith("/webhook/")) {
      set.status = 403;
      return "Forbidden";
    }
  })
  .onAfterResponse(({ set, request, path, requestState }) => {
    const ip = requestState.ip ?? "Undefined Shit";

    // Skip logging for health check from local IP
    if (path === "/health" && isLocalIP(ip)) {
      return;
    }

    log.normal(`🌐 ${request.method} ${path} ${set.status} - ${ip}`);
  })
  .use(
    openapi({
      documentation: {
        info: {
          title: "Honami GitOps API",
          version: APP_VERSION,
          description: "GitOps automation service for managing deployments",
        },
        tags: [
          { name: "Health", description: "Health check endpoints" },
          {
            name: "Webhook",
            description:
              "Webhook endpoints intended to be called by external services",
          },
        ],
        components: {
          securitySchemes: {
            webhookAuth: {
              type: "apiKey",
              in: "header",
              name: "authorization",
              description: "Webhook authentication password",
            },
          },
        },
      },
    }),
  )
  .get("/health", () => "OK\n", {
    detail: {
      summary: "Health check",
      description: "Returns OK if the service is running",
      tags: ["Health"],
    },
  })
  .post("/webhook/gitsync", gitsync, {
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
  .post("/webhook/renovate", renovate, {
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
  })
  .listen(8940);

console.log(
  chalk.green(
    `Starting Honami GitOps v${APP_VERSION} at PORT ${app.server?.port}`,
  ),
);

process.on("SIGINT", async () => {
  console.log(chalk.yellow("Recieved shutdown signal, closing..."));
  app.stop();
  process.exit(0);
});

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
