export type BackendDriver = 'local' | 'consul' | 'memory';

export interface Config {
  http: HttpConfig;
  dns: DnsConfig;
  backend: BackendConfig;
  experimental?: ExperimantalConfig;
}

export interface HttpConfig {
  enabled: boolean;
  port: number;
}
export interface DnsConfig {
  ports: {
    tcp?: number;
    udp?: number;
  };
}
export interface BackendConfig {
  driver: BackendDriver;
  local?: LocalBackendConfig;
  consul?: ConsulBackendConfig;
}
export interface ExperimantalConfig {
  ui: boolean;
  recursion: RecursionConfig;
  local: LocalConfig;
}
export interface ConsulBackendConfig {
  endpoint: string;
  port?: number;
  kvRoot: string;
}
export interface LocalBackendConfig {
  dbLocation: string;
}
export interface RecursionConfig {
  enabled: boolean;
  upstreams: string[];
}
export interface LocalConfig {
  enabled: boolean;
  domains: string[];
}
