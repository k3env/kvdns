export interface AppConfig {
  HTTP_PORT: number;
  DNS_PORT_TCP: number;
  DNS_PORT_UDP: number;

  DNS_TCP_ENABLED: boolean;
  DNS_UDP_ENABLED: boolean;

  CONSUL_ENDPOINT: string;
  CONSUL_KV_ROOT: string;
}
