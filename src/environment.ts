import { z } from "zod";

const environmentSchema = z.object({
  WEBHOOK_PASSWORD: z.string().min(10),
  REPO_PATH: z.string().nonempty(),

  DISCORD_TOKEN: z.string().nonempty(),
  DISCORD_CHANNEL_ID: z.string().nonempty(),

  DATABASE_URL: z.string().nonempty(),

  DEVICE_NAME: z.string().nonempty(),
  RUNS_RENOVATE: z.string().nonempty(),
  RENOVATE_CONTAINER_NAME: z.string().nonempty().default("renovate"),
});

export const environment = environmentSchema.parse(process.env);
