import type { DockerInspect } from "../types/docker.js";

export function getActualPorts(container: DockerInspect): Array<{
  target: number;
  published?: string;
  hostIp?: string;
  protocol?: string;
}> {
  const ports: Array<{
    target: number;
    published?: string;
    hostIp?: string;
    protocol?: string;
  }> = [];
  const actualPorts = container.NetworkSettings?.Ports || {};

  for (const [portKey, bindings] of Object.entries(actualPorts)) {
    const [targetStr, protocol] = portKey.split("/");
    const target = parseInt(targetStr || "0", 10);

    if (bindings && bindings.length > 0 && bindings[0]) {
      const binding = bindings[0];
      ports.push({
        target,
        published: binding.HostPort,
        hostIp: binding.HostIp || undefined,
        protocol: protocol || "tcp",
      });
    } else {
      // Port exposed but not published
      ports.push({
        target,
        protocol: protocol || "tcp",
      });
    }
  }

  return ports;
}
