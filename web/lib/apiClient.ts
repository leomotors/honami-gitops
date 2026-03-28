import { treaty } from "@elysiajs/eden";

import type { App } from "../../src/index";

const origin = typeof window !== "undefined" ? window.location.origin : "";

const api = treaty<App>(origin);

export { api };
