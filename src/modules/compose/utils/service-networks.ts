import type {
  ComposeNetworkDefinition,
  ComposeServiceDefinition,
} from "../types/docker.js";

export type ComposeServiceNetwork = {
  name: string;
  external: boolean;
};

function serviceNetworkNames(service: ComposeServiceDefinition): string[] {
  const n = service.networks;
  if (!n) return [];
  if (Array.isArray(n)) return n;
  return Object.keys(n);
}

/** Every compose network this service is attached to, with external flag from project `networks:` */
export function getServiceComposeNetworks(
  service: ComposeServiceDefinition,
  projectNetworks: Record<string, ComposeNetworkDefinition> | undefined,
): ComposeServiceNetwork[] {
  const rows: ComposeServiceNetwork[] = [];
  for (const name of serviceNetworkNames(service)) {
    const net = projectNetworks?.[name];
    rows.push({
      name,
      external: net?.external === true,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}
