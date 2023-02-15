export interface NSZone {
  name: string;
  authority: AuthorityInfo;
}

export interface NSRecord {
  zoneId: string; // Foreign key field
  name: string;
  type: NSRecordType;
  ttl: number;
  data: NSRecordDataA | NSRecordDataMX | NSRecordDataCNAME | NSRecordDataNS | NSRecordDataSRV | NSRecordDataTXT;
}

export type UUID = string;

export type ZoneTable = Map<UUID, NSZone>;
export type RecordTable = Map<UUID, NSRecord>;

export interface AuthorityInfo {
  primary: string;
  admin: string;
  serial: number;
  refresh: number;
  retry: number;
  expiration: number;
  minimum: number;
}
export type NSRecordType = 'A' | 'NS' | 'MX' | 'SRV' | 'TXT' | 'CNAME';

export type ZoneAssociation = { id: string; zone: NSZone };
export type RecordAssociation = { id: string; record: NSRecord };
export type LookupInfo = { zone: ZoneAssociation; record: string };

export interface NSRecordPayload {
  name: string;
  type: NSRecordType;
  ttl: number;
  data: NSRecordDataA | NSRecordDataMX | NSRecordDataCNAME | NSRecordDataNS | NSRecordDataSRV | NSRecordDataTXT;
}

export interface NSRecordDataA {
  class: 1;
  address: string;
}
export interface NSRecordDataNS {
  class: 1;
  ns: string;
}
export interface NSRecordDataMX {
  class: 1;
  priority: number;
  exchange: string;
}
export interface NSRecordDataTXT {
  class: 1;
  data: string;
}
export interface NSRecordDataSRV {
  class: 1;
  priority: number;
  weight: number;
  port: number;
  target: string;
}
export interface NSRecordDataCNAME {
  class: 1;
  domain: string;
}
