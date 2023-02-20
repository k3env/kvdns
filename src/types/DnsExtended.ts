import { DnsAnswer, DnsResponse } from 'dns2';

export interface DnsRequestExtended {
  type: number;
  class: number;
  name: string;
}
export interface DnsResponseExtended extends DnsResponse {
  authorities: DnsAnswer[];
  additionals: DnsAnswer[];
}
