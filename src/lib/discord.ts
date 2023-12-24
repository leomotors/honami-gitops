import { Routes } from "discord-api-types/v10";

import { environment } from "../environment.js";

import { log } from "./logger.js";

const endpoint = "https://discord.com/api/v10";

export async function sendMessage(content: string) {
  log.normal("Sending message to discord...");

  const res = await fetch(
    endpoint + Routes.channelMessages(environment.DISCORD_CHANNEL_ID),
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${environment.DISCORD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );

  if (!res.ok) {
    log.error(`Discord API Failed ${res.status} ${res.statusText}`);
    log.error(await res.text());
  }
}
