import { environment } from "@/config/environment.js";

import { log } from "./logger.js";

const endpoint = "https://discord.com/api/v10";
const CONTENT_LIMIT = 2000;

const messages: string[] = [];

export function addMessage(content: string) {
  log.normal(`[Discord] Added: ${content}`);
  messages.push(content);
}

export async function sendMessage() {
  const content = messages.join("\n");

  log.normal("[Discord] Sending message...");

  try {
    const res = await discordRequest(
      `/channels/${environment.DISCORD_CHANNEL_ID}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
    );

    if (!res) return;
  } catch (err) {
    log.error(`Fatal Error! Cannot send message to discord: ${err}`);
  } finally {
    messages.length = 0;
  }
}

export type DiscordLiveMessage = {
  add(line: string): void;
  setFooter(line: string): void;
  flush(): Promise<void>;
};

export function createLiveMessage(): DiscordLiveMessage {
  const lines: string[] = [];
  let footer = "⏳ In progress";
  let id: string | undefined;

  function content() {
    const body = [...lines, "", footer].join("\n");
    return body.length <= CONTENT_LIMIT
      ? body
      : `${body.slice(0, CONTENT_LIMIT - 3)}...`;
  }

  return {
    add(line) {
      log.normal(`[Discord] Added: ${line}`);
      lines.push(line);
    },
    setFooter(line) {
      footer = line;
    },
    async flush() {
      const payload = JSON.stringify({ content: content() });

      if (!id) {
        log.normal("[Discord] Sending message...");
        const res = await discordRequest(
          `/channels/${environment.DISCORD_CHANNEL_ID}/messages`,
          { method: "POST", body: payload },
        );
        if (!res) return;

        const data = (await res.json()) as { id?: string };
        id = data.id;
        return;
      }

      log.normal("[Discord] Editing message...");
      await discordRequest(
        `/channels/${environment.DISCORD_CHANNEL_ID}/messages/${id}`,
        { method: "PATCH", body: payload },
      );
    },
  };
}

async function discordRequest(
  path: string,
  init: RequestInit,
): Promise<Response | null> {
  const headers = {
    Authorization: `Bot ${environment.DISCORD_TOKEN}`,
    "Content-Type": "application/json",
    ...init.headers,
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${endpoint}${path}`, { ...init, headers });

      if (res.status === 429) {
        const retryAfterSec = await retryAfterSeconds(res);
        log.error(`Discord rate limited, retrying in ${retryAfterSec}s`);
        await sleep(retryAfterSec * 1000);
        continue;
      }

      if (!res.ok) {
        log.error(`Discord API Failed ${res.status} ${res.statusText}`);
        log.error(await res.text());
        return null;
      }

      return res;
    } catch (err) {
      log.error(`Fatal Error! Cannot send message to discord: ${err}`);
      return null;
    }
  }

  log.error("Discord API: gave up after rate limit retries");
  return null;
}

async function retryAfterSeconds(res: Response): Promise<number> {
  const header = Number(res.headers.get("Retry-After"));
  if (Number.isFinite(header) && header > 0) return header;

  try {
    const body = (await res.json()) as { retry_after?: number };
    if (typeof body.retry_after === "number" && body.retry_after > 0) {
      return body.retry_after;
    }
  } catch {
    // body missing or already consumed
  }

  return 1;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
