import { openapi } from "@elysiajs/openapi";
import chalk from "chalk";
import { Elysia } from "elysia";

import { getIP, isLocalIP } from "./core/ip.js";
import { log } from "./core/logger.js";
import { startBackgroundScanning } from "./modules/compose/cache.service.js";
import { composeController } from "./modules/compose/index.js";
import { healthController } from "./modules/health/index.js";
import { webhookController } from "./modules/webhook/index.js";
import { setupRenovate } from "./modules/webhook/renovate.js";

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
      console.log(`🌐 Found forbidden request from IP: ${ip} to ${pathName}`);
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
          {
            name: "Compose",
            description:
              "Docker Compose management endpoints for monitoring container status",
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
  .use(healthController)
  .use(composeController)
  .use(webhookController)
  .listen(8940);

console.log(
  chalk.green(
    `Starting Honami GitOps v${APP_VERSION} at PORT ${app.server?.port}`,
  ),
);
console.log(
  `📖 See OpenAPI docs at http://localhost:${app.server?.port}/openapi`,
);

process.on("SIGINT", async () => {
  console.log(chalk.yellow("Recieved shutdown signal, closing..."));
  app.stop();
  process.exit(0);
});

setupRenovate();
startBackgroundScanning();
