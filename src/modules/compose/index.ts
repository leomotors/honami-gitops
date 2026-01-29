import { Elysia, t } from "elysia";

import { ErrorSchema } from "@/shared/schema.js";

import {
  getCachedResult,
  postponeNextScan,
  triggerScan,
} from "./cache.service.js";
import { restartComposeFiles } from "./operations.js";
import { ComposeListResponseSchema } from "./schema.js";

export const composeController = new Elysia({
  prefix: "/compose",
  detail: {
    tags: ["Compose"],
  },
})
  .get(
    "/",
    async ({ set }) => {
      const cachedResult = getCachedResult();

      if (!cachedResult) {
        set.status = 503;
        return {
          message: "No cached scan results available",
        };
      }

      return cachedResult;
    },
    {
      detail: {
        summary: "Get cached compose files",
        description:
          "Returns cached scan results for all docker-compose files. Returns 503 if no cache is available.",
        tags: ["Compose"],
      },
      response: {
        200: ComposeListResponseSchema,
        503: ErrorSchema,
      },
    },
  )
  .post(
    "/",
    () => {
      triggerScan();
      postponeNextScan();
      return {
        message: "Compose scan triggered",
        status: "started",
      };
    },
    {
      detail: {
        summary: "Trigger compose file scan",
        description:
          "Triggers a new scan of all docker-compose files in the background. Returns immediately. Also postpones the next scheduled scan.",
        tags: ["Compose"],
      },
      response: {
        200: t.Object({
          message: t.String(),
          status: t.String(),
        }),
      },
    },
  )
  .post(
    "/outdated",
    async ({ set }) => {
      const cachedResult = getCachedResult();

      if (!cachedResult) {
        set.status = 503;
        return {
          message: "No cached scan results available",
        };
      }

      // Find all compose files with outdated containers
      const outdatedComposeFiles = cachedResult.composeFiles
        .filter((compose) =>
          compose.containers.some(
            (container) => container.status === "Outdated",
          ),
        )
        .map((compose) => compose.path);

      if (outdatedComposeFiles.length === 0) {
        return {
          message: "No outdated containers found",
          status: "skipped",
          outdatedFiles: [],
        };
      }

      // Restart outdated compose files in the background
      restartComposeFiles(outdatedComposeFiles, "OUTDATED CHECK");

      return {
        message: "Outdated containers restart triggered",
        status: "started",
        outdatedFiles: outdatedComposeFiles,
      };
    },
    {
      detail: {
        summary: "Restart outdated compose files",
        description:
          "Identifies all compose files with outdated containers and triggers a restart. Uses cached scan results. Returns 503 if no cache is available.",
        tags: ["Compose"],
      },
      response: {
        200: t.Object({
          message: t.String(),
          status: t.String(),
          outdatedFiles: t.Array(t.String()),
        }),
        503: ErrorSchema,
      },
    },
  );
