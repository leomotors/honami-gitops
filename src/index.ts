import chalk from "chalk";
import Fastify from "fastify";

import { runRenovate } from "./lib/runRenovate.js";
import { gitsync } from "./routes/gitsync.js";
import { renovate } from "./routes/renovate.js";

const fastify = Fastify({
  logger: true,
});

// Declare routes
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

setInterval(
  () => {
    runRenovate();
  },
  1000 * 60 * 60,
);
