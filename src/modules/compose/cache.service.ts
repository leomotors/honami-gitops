import { environment } from "@/config/environment.js";
import { log } from "@/core/logger.js";

import { scanComposeFiles } from "./scanner.service.js";
import type { ComposeListResponse } from "./schema.js";

// In-memory cache for compose scan results
let cachedResult: ComposeListResponse | null = null;
let scanInterval: NodeJS.Timeout | null = null;

export function getCachedResult(): ComposeListResponse | null {
  return cachedResult;
}

export async function triggerScan(): Promise<ComposeListResponse> {
  const startTime = Date.now();
  const composeFiles = await scanComposeFiles();
  const timeTaken = Date.now() - startTime;

  cachedResult = {
    composeFiles,
    metadata: {
      datetime: new Date().toISOString(),
      timeTaken,
    },
  };

  log.info(
    `Compose scan completed in ${timeTaken}ms, found ${composeFiles.length} compose files`,
  );

  return cachedResult;
}

function resetScanInterval() {
  if (scanInterval) {
    clearInterval(scanInterval);
  }

  const intervalMs = environment.COMPOSE_SCAN_INTERVAL * 1000;

  scanInterval = setInterval(() => {
    log.info("Running scheduled compose scan");
    triggerScan().catch((error) => {
      log.error("Scheduled compose scan failed");
      console.error(error);
    });
  }, intervalMs);

  log.info(
    `Compose scan interval set to ${environment.COMPOSE_SCAN_INTERVAL} seconds`,
  );
}

export function startBackgroundScanning() {
  log.info("Starting compose background scanning");
  // Run initial scan
  triggerScan().catch((error) => {
    log.error("Initial compose scan failed");
    console.error(error);
  });

  // Set up interval
  resetScanInterval();
}

export function postponeNextScan() {
  log.info("Postponing next scheduled compose scan");
  resetScanInterval();
}
