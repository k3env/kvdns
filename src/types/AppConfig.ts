export type BackendDriver = 'local' | 'consul' | 'memory';
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
