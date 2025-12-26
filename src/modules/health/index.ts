import { Elysia } from "elysia";

export const healthController = new Elysia({
  detail: {
    tags: ["Health"],
  },
}).get("/health", () => "OK\n", {
  detail: {
    summary: "Health check",
    description: "Returns OK if the service is running",
    tags: ["Health"],
  },
});
