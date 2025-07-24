import { environment } from "../environment.js";
import { log } from "./logger.js";

const endpoint = "https://discord.com/api/v10";

const messages: string[] = [];

export function addMessage(content: string) {
  log.normal(`[Discord] Added: ${content}`);
  messages.push(content);
}

export async function sendMessage() {
  const content = messages.join("\n");

  log.normal("[Discord] Sending message...");

  try {
    const res = await fetch(
      `${endpoint}/channels/${environment.DISCORD_CHANNEL_ID}/messages`,
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
  } catch (err) {
    log.error(`Fatal Error! Cannot send message to discord: ${err}`);
  } finally {
    messages.length = 0;
  }
}
