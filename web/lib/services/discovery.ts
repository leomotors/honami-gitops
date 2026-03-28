import {
  type ComposeData,
  type Container,
  getFolderName,
  type Status,
} from "$lib/types";

export type TraefikService = {
  containerName: string;
  image: string;
  status: Status;
  url: string;
  folder: string;
};

export type PortService = {
  containerName: string;
  image: string;
  status: Status;
  ports: { published: string; target: number; protocol?: string }[];
  folder: string;
};

function extractTraefikUrl(labels: Record<string, string>): string | null {
  if (labels["traefik.enable"] !== "true") return null;

  for (const [key, value] of Object.entries(labels)) {
    if (!key.match(/^traefik\.http\.routers\..+\.rule$/)) continue;
    const hostMatch = value.match(/Host\(`([^`]+)`\)/);
    if (!hostMatch) continue;

    const host = hostMatch[1];
    const routerName = key.split(".")[3];
    const tlsKey = `traefik.http.routers.${routerName}.tls`;
    const scheme = labels[tlsKey] === "true" ? "https" : "http";
    return `${scheme}://${host}`;
  }
  return null;
}

function hasPublicPorts(container: Container): boolean {
  return container.ports.some((p) => p.published && p.hostIp !== "127.0.0.1");
}

function compareByFolderThenContainerName<
  T extends { folder: string; containerName: string },
>(a: T, b: T): number {
  const folderCmp = a.folder.localeCompare(b.folder);
  if (folderCmp !== 0) return folderCmp;
  return a.containerName.localeCompare(b.containerName);
}

export function extractDiscoveredServices(composeData: ComposeData): {
  traefik: TraefikService[];
  other: PortService[];
} {
  const traefik: TraefikService[] = [];
  const other: PortService[] = [];

  for (const file of composeData.composeFiles) {
    const folder = getFolderName(file.path);
    for (const container of file.containers) {
      const url = extractTraefikUrl(container.labels);
      if (url) {
        traefik.push({
          containerName: container.name,
          image: container.image,
          status: container.status,
          url,
          folder,
        });
        continue;
      }

      if (hasPublicPorts(container)) {
        other.push({
          containerName: container.name,
          image: container.image,
          status: container.status,
          ports: container.ports
            .filter((p) => p.published && p.hostIp !== "127.0.0.1")
            .map((p) => ({
              published: p.published!,
              target: p.target,
              protocol: p.protocol,
            })),
          folder,
        });
      }
    }
  }

  traefik.sort(compareByFolderThenContainerName);
  other.sort(compareByFolderThenContainerName);
  return { traefik, other };
}
