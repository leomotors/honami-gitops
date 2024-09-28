import chalk from "chalk";
import Fastify, { FastifyRequest } from "fastify";

import { runRenovate } from "./lib/runRenovate.js";
import { gitsync } from "./routes/gitsync.js";
import { renovate } from "./routes/renovate.js";

function getIP(req: FastifyRequest) {
  return req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || req.ip;
}

const fastify = Fastify({
  logger: {
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          ip: getIP(req),
        };
      },
    },
  },
});

// Declare routes
fastify.get("/health", { logLevel: "warn" }, (_, __) => {
  return "OK\n";
});
fastify.post("/webhook/gitsync", gitsync);
fastify.post("/webhook/renovate", renovate);

// Run the server!
try {
  await fastify.listen({ port: 8940, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

process.on("SIGINT", async () => {
  console.log(chalk.yellow("Recieved shutdown signal, closing..."));
  await fastify.close();
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
