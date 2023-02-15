export interface Config {
  http: HttpConfig;
  dns: DnsConfig;
  backend: BackendConfig;
  experimental?: ExperimantalConfig;
}

export interface HttpConfig {
  enabled: boolean;
  port: number;
  log: boolean;
}
export interface DnsConfig {
  ports: {
    tcp?: number;
    udp?: number;
  };
  requestLog: boolean;
  recursion: RecursionConfig;
  local: LocalConfig;
}
export interface BackendConfig {
  uri: string;
  adapter: AdapterConfig;
}
export interface ExperimantalConfig {
  ui: boolean;
}
export interface RecursionConfig {
  enabled: boolean;
  upstreams: string[];
  denyRecursion: string[];
}
export interface LocalConfig {
  enabled: boolean;
  domains: string[];
}
export type AdapterConfig = 'redis' | 'mongodb' | 'mongo' | 'sqlite' | 'postgresql' | 'postgres' | 'mysql' | undefined;
