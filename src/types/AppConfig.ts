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
