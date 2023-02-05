export type Schema = Record<string, NSRecord[]>;

export interface NSRecord {
  id: string;
  name: string;
  type: NSRecordType;
  ttl: number;
  data: NSRecordData;
}

export interface NSRecordPayload {
  name: string;
  type: NSRecordType;
  ttl: number;
  data: NSRecordData;
}

export type NSRecordType = 'A' | 'NS' | 'MX' | 'SRV' | 'TXT' | 'CNAME';

export interface NSRecordData {
  class: 1;
}

export interface NSRecordDataA extends NSRecordData {
  address: string;
}
export interface NSRecordDataNS extends NSRecordData {
  ns: string;
}
export interface NSRecordDataMX extends NSRecordData {
  priority: number;
  exchange: string;
}
export interface NSRecordDataTXT extends NSRecordData {
  data: string;
}
export interface NSRecordDataSRV extends NSRecordData {
  priority: number;
  weight: number;
  port: number;
  target: string;
}
export interface NSRecordDataCNAME extends NSRecordData {
  domain: string;
}
