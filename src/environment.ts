import { z } from "zod";

const environmentSchema = z.object({
  WEBHOOK_PASSWORD: z.string().min(10),
  REPO_PATH: z.string(),

  DISCORD_TOKEN: z.string(),
  DISCORD_CHANNEL_ID: z.string(),

  DATABASE_URL: z.string(),
});

export const environment = environmentSchema.parse(process.env);
