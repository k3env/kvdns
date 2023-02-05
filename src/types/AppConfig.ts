export type BackendDriver = 'local' | 'consul' | 'memory';

export interface Config {
  http: HttpConfig;
  dns: DnsConfig;
  backend: BackendConfig;
  experimental?: ExperimantalConfig;
}

interface HttpConfig {
  enabled: boolean;
  port: number;
}
interface DnsConfig {
  ports: {
    tcp?: number;
    udp?: number;
  };
}
interface BackendConfig {
  driver: BackendDriver;
  local?: LocalBackendConfig;
  consul?: ConsulBackendConfig;
}
interface ExperimantalConfig {
  ui: boolean;
  recursion: RecursionConfig;
  local: LocalConfig;
}
interface ConsulBackendConfig {
  endpoint: string;
  port?: number;
  kvRoot: string;
}
interface LocalBackendConfig {
  dbLocation: string;
}
interface RecursionConfig {
  enabled: boolean;
  upstreams: string[];
}
interface LocalConfig {
  enabled: boolean;
  domains: string[];
}
