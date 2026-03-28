export interface DockerInspect {
  Id: string;
  Name: string;
  State: {
    Status: string;
    ExitCode: number;
    Health?: {
      Status: string;
    };
  };
  Config: {
    Image: string;
    Env?: string[];
    Labels?: Record<string, string>;
  };
  Image: string;
  HostConfig?: {
    PortBindings?: Record<string, Array<{ HostIp: string; HostPort: string }>>;
    Binds?: string[];
  };
  Mounts?: Array<{
    Type: string;
    Source?: string;
    Destination: string;
    RW: boolean;
  }>;
  NetworkSettings?: {
    Ports?: Record<string, Array<{ HostIp: string; HostPort: string }> | null>;
  };
}

export interface ComposeServiceDefinition {
  container_name?: string;
  image: string;
  restart?: string;
  ports?: Array<{
    target: number;
    published?: string;
    protocol?: string;
  }>;
  environment?: Record<string, string | null>;
  volumes?: Array<{
    type: string;
    source?: string;
    target: string;
    read_only?: boolean;
  }>;
  labels?: Record<string, string>;
  /** Normalized compose JSON uses an object keyed by network name */
  networks?: Record<string, unknown> | string[];
}

export interface ComposeNetworkDefinition {
  name?: string;
  external?: boolean;
}

export interface ComposeConfig {
  networks?: Record<string, ComposeNetworkDefinition>;
  services: Record<string, ComposeServiceDefinition>;
}
