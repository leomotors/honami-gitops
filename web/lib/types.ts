export type Status =
  | "Down"
  | "Outdated"
  | "Up"
  | "Unhealthy"
  | "Healthy"
  | "Completed";

export type OutdatedDetail = {
  type: string;
  message: string;
};

export type Container = {
  name: string;
  image: string;
  status: Status;
  outdatedDetails?: OutdatedDetail[];
  ports: {
    target: number;
    published?: string;
    hostIp?: string;
    protocol?: string;
  }[];
  environment: Record<string, string | null>;
  volumes: {
    type: string;
    source?: string;
    target: string;
    read_only?: boolean;
  }[];
  labels: Record<string, string>;
};

export type ComposeFile = {
  path: string;
  status: Status;
  containers: Container[];
};

export type ComposeData = {
  metadata: { datetime: string; timeTaken: number };
  composeFiles: ComposeFile[];
};

export const STATUS_PRIORITY: Status[] = [
  "Down",
  "Unhealthy",
  "Outdated",
  "Up",
  "Healthy",
  "Completed",
];

export const DISPLAY_STATUSES: Status[] = [
  "Healthy",
  "Up",
  "Completed",
  "Outdated",
  "Unhealthy",
  "Down",
];

export const STATUS_STYLES: Record<
  Status,
  { text: string; bg: string; dot: string; ring: string }
> = {
  Healthy: {
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
  },
  Up: {
    text: "text-sky-700",
    bg: "bg-sky-50",
    dot: "bg-sky-500",
    ring: "ring-sky-200",
  },
  Completed: {
    text: "text-slate-500",
    bg: "bg-slate-50",
    dot: "bg-slate-400",
    ring: "ring-slate-200",
  },
  Outdated: {
    text: "text-rose-700",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
    ring: "ring-rose-200",
  },
  Unhealthy: {
    text: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
  },
  Down: {
    text: "text-red-700",
    bg: "bg-red-50",
    dot: "bg-red-600",
    ring: "ring-red-200",
  },
};

export function getWorstStatus(counts: Record<Status, number>): Status {
  for (const s of STATUS_PRIORITY) {
    if (counts[s] > 0) return s;
  }
  return "Healthy";
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function getFolderName(path: string): string {
  const idx = path.indexOf("/");
  return idx > 0 ? path.substring(0, idx) : "(root)";
}
