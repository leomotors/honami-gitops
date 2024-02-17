import chalk from "chalk";
import Fastify from "fastify";

import { runRenovate } from "./lib/runRenovate.js";
import { gitsync } from "./routes/gitsync.js";
import { renovate } from "./routes/renovate.js";

const fastify = Fastify({
  logger: true,
});

// Declare routes
fastify.get("/health", (_, __) => {
  return "OK\n";
});
fastify.post("/webhook/gitsync", gitsync);
fastify.post("/webhook/renovate", renovate);

// Run the server!
try {
  await fastify.listen({ port: 8940 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

process.on("SIGINT", async () => {
  console.log(chalk.yellow("Recieved shutdown signal, closing..."));
  await fastify.close();
});

runRenovate();

setTimeout(
  () =>
    setInterval(
      () => {
        runRenovate();
      },
      1000 * 60 * 60,
    ),
  // Delay the first run by 3 minutes to not consume too much resources
  1000 * 60 * 3,
);
