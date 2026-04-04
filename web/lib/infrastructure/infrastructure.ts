import { type ComposeData, getFolderName, type Status } from "$lib/types";

export type NetworkGroup = {
  networkName: string;
  external: boolean;
  services: NetworkService[];
};

export type NetworkService = {
  containerName: string;
  image: string;
  status: Status;
  folder: string;
  composePath: string;
};

export type DriveInfo = {
  name: string;
  paths: string[];
};

export type StorageService = {
  containerName: string;
  image: string;
  status: Status;
  folder: string;
  drives: DriveInfo[];
};

const NO_NETWORK_GROUP = "(default)";

// System directories that are functional mounts, not data storage
const SYSTEM_DIRS = new Set([
  "/etc",
  "/var",
  "/run",
  "/sys",
  "/proc",
  "/dev",
  "/tmp",
  "/usr",
  "/lib",
  "/bin",
  "/sbin",
  "/boot",
]);

function isSystemMount(source: string): boolean {
  const top = "/" + source.split("/").filter(Boolean)[0];
  return SYSTEM_DIRS.has(top);
}

function getDriveName(source: string): string | null {
  if (isSystemMount(source)) return null;
  // Match /mnt/<name> or /mnt/<name>/...
  const mntMatch = source.match(/^\/mnt\/([^/]+)/);
  if (mntMatch) return mntMatch[1];
  // Everything else is root
  return "root";
}

export function extractNetworkGroups(data: ComposeData): NetworkGroup[] {
  const map = new Map<
    string,
    { external: boolean; services: NetworkService[] }
  >();

  for (const file of data.composeFiles) {
    const folder = getFolderName(file.path);
    for (const container of file.containers) {
      if (container.networks.length === 0) {
        // Services with no networks go into the default group
        let group = map.get(NO_NETWORK_GROUP);
        if (!group) {
          group = { external: false, services: [] };
          map.set(NO_NETWORK_GROUP, group);
        }
        group.services.push({
          containerName: container.name,
          image: container.image,
          status: container.status,
          folder,
          composePath: file.path,
        });
        continue;
      }

      for (const net of container.networks) {
        let group = map.get(net.name);
        if (!group) {
          group = { external: net.external, services: [] };
          map.set(net.name, group);
        }
        // If any declaration says external, treat it as external
        if (net.external) group.external = true;

        group.services.push({
          containerName: container.name,
          image: container.image,
          status: container.status,
          folder,
          composePath: file.path,
        });
      }
    }
  }

  return Array.from(map.entries())
    .map(([name, g]) => ({
      networkName: name,
      external: g.external,
      services: g.services.sort((a, b) =>
        a.containerName.localeCompare(b.containerName),
      ),
    }))
    .sort((a, b) => {
      // Default group last
      if (a.networkName === NO_NETWORK_GROUP) return 1;
      if (b.networkName === NO_NETWORK_GROUP) return -1;
      // External networks first, then alphabetical
      if (a.external !== b.external) return a.external ? -1 : 1;
      return a.networkName.localeCompare(b.networkName);
    });
}

export function extractStorageServices(data: ComposeData): {
  services: StorageService[];
  allDrives: string[];
} {
  // key = containerName, value = drives with paths
  const serviceMap = new Map<
    string,
    {
      image: string;
      status: Status;
      folder: string;
      drives: Map<string, Set<string>>;
    }
  >();
  const allDrivesSet = new Set<string>();

  for (const file of data.composeFiles) {
    const folder = getFolderName(file.path);
    for (const container of file.containers) {
      for (const vol of container.volumes) {
        if (vol.type !== "bind" || !vol.source) continue;

        const drive = getDriveName(vol.source);
        if (!drive) continue;

        allDrivesSet.add(drive);

        let entry = serviceMap.get(container.name);
        if (!entry) {
          entry = {
            image: container.image,
            status: container.status,
            folder,
            drives: new Map(),
          };
          serviceMap.set(container.name, entry);
        }
        let paths = entry.drives.get(drive);
        if (!paths) {
          paths = new Set();
          entry.drives.set(drive, paths);
        }
        paths.add(vol.source);
      }
    }
  }

  const sortDriveNames = (names: string[]) =>
    names.sort((a, b) => {
      if (a === "root") return -1;
      if (b === "root") return 1;
      return a.localeCompare(b);
    });

  const services = Array.from(serviceMap.entries())
    .map(([name, e]) => ({
      containerName: name,
      image: e.image,
      status: e.status,
      folder: e.folder,
      drives: sortDriveNames([...e.drives.keys()]).map((d) => ({
        name: d,
        paths: [...e.drives.get(d)!].sort(),
      })),
    }))
    .sort((a, b) => a.containerName.localeCompare(b.containerName));

  return { services, allDrives: sortDriveNames([...allDrivesSet]) };
}
