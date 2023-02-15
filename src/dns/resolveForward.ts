import { MxRecord, SrvRecord } from 'dns';
import { Resolver } from 'dns/promises';
import dns2 from 'dns2';
import { RecordToArray } from '../helpers/RecordToArray';
import { RecursionConfig } from '../types/AppConfig';
import { DnsRequestExtended } from '../types/DnsExtended';
import {
  NSRecord,
  NSRecordType,
  NSRecordDataA,
  NSRecordDataCNAME,
  NSRecordDataMX,
  NSRecordDataNS,
  NSRecordDataSRV,
  NSRecordDataTXT,
} from '../types/Schema';

const { Packet } = dns2;

export async function makeRecursionRequest(req: DnsRequestExtended, config: RecursionConfig): Promise<NSRecord[]> {
  const recs: NSRecord[] = [];
  const rrtype = RecordToArray<number>(Packet.TYPE);
  const resolver = new Resolver();
  resolver.setServers(config.upstreams ?? ['1.1.1.1', '1.0.0.1']);

  const qtype = rrtype.find((r) => r.value === req.type)?.key ?? 'A';
  try {
    const addr = await resolver.resolve(req.name, qtype);
    switch (qtype as NSRecordType) {
      case 'A':
        recs.push(
          ...(addr as string[]).map((address) => {
            const data: NSRecordDataA = {
              class: 1,
              address,
            };
            const _rr: NSRecord = { zoneId: 'external', name: req.name, type: 'A', ttl: 60, data: data };
            return _rr;
          }),
        );
        break;
      case 'CNAME':
        recs.push(
          ...(addr as string[]).map((domain) => {
            const data: NSRecordDataCNAME = {
              class: 1,
              domain,
            };
            const _rr: NSRecord = { zoneId: 'external', name: req.name, type: 'A', ttl: 60, data: data };
            return _rr;
          }),
        );
        break;
      case 'MX':
        recs.push(
          ...(addr as MxRecord[]).map((r) => {
            const data: NSRecordDataMX = {
              class: 1,
              ...r,
            };
            const _rr: NSRecord = { zoneId: 'external', name: req.name, type: 'MX', ttl: 60, data: data };
            return _rr;
          }),
        );
        break;
      case 'NS':
        recs.push(
          ...(addr as string[]).map((ns) => {
            const data: NSRecordDataNS = {
              class: 1,
              ns,
            };
            const _rr: NSRecord = { zoneId: 'external', name: req.name, type: 'NS', ttl: 60, data: data };
            return _rr;
          }),
        );
        break;
      case 'SRV':
        recs.push(
          ...(addr as SrvRecord[]).map((r) => {
            const data: NSRecordDataSRV = {
              class: 1,
              ...r,
              target: r.name,
            };
            const _rr: NSRecord = { zoneId: 'external', name: req.name, type: 'SRV', ttl: 60, data: data };
            return _rr;
          }),
        );
        break;
      case 'TXT':
        recs.push(
          ...(addr as string[][]).flat(1).map((data) => {
            const rdata: NSRecordDataTXT = {
              class: 1,
              data,
            };
            const _rr: NSRecord = { zoneId: 'external', name: req.name, type: 'TXT', ttl: 60, data: rdata };
            return _rr;
          }),
        );
        break;
    }
  } catch (e) {
    return [];
  }
  return recs;
}
