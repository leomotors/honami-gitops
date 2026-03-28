import {
  type ComposeData,
  type ComposeFile,
  type Container,
  getFolderName,
  getWorstStatus,
  type Status,
  STATUS_PRIORITY,
} from "$lib/types";

export type FolderGroup = {
  name: string;
  composeFiles: ComposeFile[];
  statusCounts: Record<Status, number>;
  totalContainers: number;
  worstStatus: Status;
};

export function emptyStatusCounts(): Record<Status, number> {
  return {
    Down: 0,
    Outdated: 0,
    Up: 0,
    Unhealthy: 0,
    Healthy: 0,
    Completed: 0,
  };
}

export function summarizeComposeData(data: ComposeData) {
  const counts = emptyStatusCounts();
  let total = 0;
  for (const cf of data.composeFiles) {
    for (const c of cf.containers) {
      counts[c.status as Status]++;
      total++;
    }
  }
  return { counts, total, composeCount: data.composeFiles.length };
}

export function groupByFolder(files: ComposeFile[]): FolderGroup[] {
  const groups = new Map<string, ComposeFile[]>();
  for (const file of files) {
    const folder = getFolderName(file.path);
    if (!groups.has(folder)) groups.set(folder, []);
    groups.get(folder)!.push(file);
  }
  return Array.from(groups.entries())
    .map(([name, composeFiles]) => {
      const statusCounts = emptyStatusCounts();
      let totalContainers = 0;
      for (const cf of composeFiles) {
        for (const c of cf.containers) {
          statusCounts[c.status as Status]++;
          totalContainers++;
        }
      }
      return {
        name,
        composeFiles,
        statusCounts,
        totalContainers,
        worstStatus: getWorstStatus(statusCounts),
      };
    })
    .sort((a, b) => {
      const ap = STATUS_PRIORITY.indexOf(a.worstStatus);
      const bp = STATUS_PRIORITY.indexOf(b.worstStatus);
      return ap !== bp ? ap - bp : a.name.localeCompare(b.name);
    });
}

export function shortPath(path: string): string {
  const idx = path.indexOf("/");
  return idx > 0 ? path.substring(idx + 1) : path;
}

export function formatPorts(ports: Container["ports"]): string {
  if (!ports.length) return "—";
  return ports
    .map((p) => (p.published ? `${p.published}:${p.target}` : String(p.target)))
    .join(", ");
}

/** Bind mounts under `/mnt/<disk>/…` are shown as the disk id only (e.g. md0, md1). */
export function formatBindSourceDisplay(source: string): string {
  const m = /^\/mnt\/([^/]+)(?:\/.*)?$/.exec(source);
  if (m) return m[1];
  return source;
}

export function formatVolumeSummary(container: Container): string {
  const vols = container.volumes;
  if (!vols.length) return "—";
  return vols
    .map((v) => {
      if (v.type === "bind" && v.source) {
        const src = formatBindSourceDisplay(v.source);
        return `${src} → ${v.target}`;
      }
      if (v.source) return `${v.source} → ${v.target}`;
      return v.target;
    })
    .join(", ");
}

export function formatComposeNetworks(
  networks: Container["networks"] | undefined,
): string {
  const list = networks ?? [];
  if (!list.length) return "—";
  return list
    .map((n) => (n.external ? `${n.name} (external)` : n.name))
    .join(", ");
}
