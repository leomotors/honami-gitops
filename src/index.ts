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
  .use(openapi())
  .decorate("requestState", {} as RequestState)
  .onRequest(({ request, requestState, server }) => {
    const ip = getIP(request, server);

    requestState.ip = ip;
  })
  .onAfterResponse(({ set, request, path, requestState }) => {
    const ip = requestState.ip ?? "Undefined Shit";

    // Skip logging for health check from local IP
    if (path === "/health" && isLocalIP(ip)) {
      return;
    }

    log.normal(`🌐 ${request.method} ${path} ${set.status} - ${ip}`);
  })
  .get("/health", () => "OK\n")
  .post("/webhook/gitsync", gitsync)
  .post("/webhook/renovate", renovate)
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
