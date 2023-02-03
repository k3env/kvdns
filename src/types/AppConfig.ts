export interface AppConfig {
  HTTP_PORT: number;

  DNS_PORT_TCP: number;
  DNS_PORT_UDP: number;

  DNS_TCP_ENABLED: boolean;
  DNS_UDP_ENABLED: boolean;

  BACKEND: BackendDriver;

  CONSUL_ENDPOINT: string;
  CONSUL_KV_ROOT: string;

  LOCAL_DB_LOCATION: string;
}

export type BackendDriver = 'local' | 'consul';
export interface Config {
  http: {
    enabled: boolean;
    port: number;
  };
  dns: {
    ports: {
      tcp?: number;
      udp?: number;
    };
  };
  backend: {
    driver: BackendDriver;
    local?: {
      dbLocation: string;
    };
    consul?: {
      endpoint: string;
      port?: number;
      kvRoot: string;
    };
  };
  experimental?: {
    ui: boolean;
    recursion: {
      enabled: boolean;
      upstreams: string[];
    };
  };
}
