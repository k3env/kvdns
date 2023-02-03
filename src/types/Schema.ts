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

export type NSRecordType = 'A' | 'NS' | 'MX' | 'SRV' | 'TXT';

export interface NSRecordData {
  class: 'IN';
}

export interface NSRecordDataA extends NSRecordData {
  address: string;
}
export interface NSRecordDataNS extends NSRecordData {
  cname: string;
}
export interface NSRecordDataMX extends NSRecordData {
  priority: number;
  cname: string;
}
export interface NSRecordDataTXT extends NSRecordData {
  value: string;
}
export interface NSRecordDataSRV extends NSRecordData {
  priority: number;
  weight: number;
  port: number;
  target: string;
}
