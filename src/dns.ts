import { RemoteInfo } from 'dgram';
import { MxRecord, SrvRecord } from 'dns';
import { lookup, Resolver } from 'dns/promises';
import dns2, { DnsAnswer } from 'dns2';
import { Backend } from './backend';
import { RecordToArray } from './helpers/RecordToArray';
import { Config } from './types';
import { RecursionConfig } from './types/AppConfig';
import {
  NSRecordDataA,
  NSRecord,
  NSRecordType,
  NSRecordDataMX,
  NSRecordDataNS,
  NSRecordDataSRV,
  NSRecordDataTXT,
  NSRecordDataCNAME,
} from './types/Schema';

const { Packet } = dns2;

interface DnsRequestExtended {
  type: number;
  class: number;
  name: string;
}

export async function handleDnsRequest(
  req: dns2.DnsRequest,
  backend: Backend,
  config: Config,
  info: RemoteInfo,
): Promise<dns2.DnsResponse> {
  const response = Packet.createResponseFromRequest(req);
  const [question] = req.questions;
  const { name } = question;
  const q: DnsRequestExtended = JSON.parse(JSON.stringify(question));

  const rrtype = RecordToArray<number>(Packet.TYPE);
  const rrclass = RecordToArray<number>(Packet.CLASS);

  const qtype = rrtype.find((r) => r.value === q.type) ?? { key: 'A', value: 1 };

  const clientInfo = `${info.address} ${rrclass.find((r) => r.value === q.class)?.key ?? 'IN'} ${qtype.key} ${q.name}`;
  let answerInfo = '';

  const ips: NSRecord[] = [];

  const noRecursionZones = config.dns.recursion.denyRecursion;

  if (
    qtype.key === 'A' &&
    config.dns.local.enabled &&
    config.dns.local.domains.findIndex((v) => name.endsWith(v)) !== -1
  ) {
    try {
      const addrs = (await lookup(name, { all: true, family: 4 })).map((l) => {
        const a: DnsAnswer = {
          class: Packet.CLASS.IN,
          name,
          ttl: 600,
          type: Packet.TYPE.A,
          address: l.address,
        };
        return a;
      });
      response.answers.push(...addrs);
      answerInfo = `LOCAL ANSWERS: ${addrs.length}`;
    } catch (e) {
      answerInfo = `NO DATA`;
    }
  } else {
    ips.push(...backend.resolve(name));
    answerInfo = `AUTH ANSWERS: ${ips.length}`;
    const disallowRecursion = noRecursionZones.findIndex((v) => v === q.name.split('.').slice(-1)[0]) !== -1;
    if (config.dns.recursion.enabled && !disallowRecursion) {
      if (ips.length === 0) {
        ips.push(...(await makeRecursionRequest(q, config.dns.recursion)));
        answerInfo = `RECURSION ANSWERS: ${ips.length}`;
      }
    }
    const res: DnsAnswer[] = ips.map((rec) => {
      return {
        name,
        type: qtype.value,
        ttl: rec.ttl,
        ...rec.data,
      };
    });
    response.answers.push(...res);
  }
  if (config.dns.requestLog) {
    console.log(`${clientInfo} => ${answerInfo}`);
  }
  return response;
}

async function makeRecursionRequest(req: DnsRequestExtended, config: RecursionConfig): Promise<NSRecord[]> {
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
            const _rr: NSRecord = { id: 'external', name: req.name, type: 'A', ttl: 60, data: data };
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
            const _rr: NSRecord = { id: 'external', name: req.name, type: 'A', ttl: 60, data: data };
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
            const _rr: NSRecord = { id: 'external', name: req.name, type: 'MX', ttl: 60, data: data };
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
            const _rr: NSRecord = { id: 'external', name: req.name, type: 'NS', ttl: 60, data: data };
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
            const _rr: NSRecord = { id: 'external', name: req.name, type: 'SRV', ttl: 60, data: data };
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
            const _rr: NSRecord = { id: 'external', name: req.name, type: 'TXT', ttl: 60, data: rdata };
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
