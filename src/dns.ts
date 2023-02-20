import { RemoteInfo } from 'dgram';
import dns2, { DnsAnswer, DnsRequest } from 'dns2';
import { RecordToArray } from './helpers/RecordToArray';
import { Config } from './types';
import { NSRecord, NSRecordType } from './types/Schema';
import { Backend } from './backend/Backend';
import { DnsRequestExtended, DnsResponseExtended } from './types/DnsExtended';
import { makeRecursionRequest } from './dns/resolveForward';
import { resolveHosts } from './dns/resolveHosts';

const { Packet } = dns2;

export async function handleDnsRequest(
  req: DnsRequest,
  backend: Backend,
  config: Config,
  info: RemoteInfo,
): Promise<DnsResponseExtended> {
  const response = Packet.createResponseFromRequest(req) as DnsResponseExtended;
  const [_] = req.questions;
  const q: DnsRequestExtended = JSON.parse(JSON.stringify(_));
  const { name } = q;

  const rrtype = RecordToArray<number>(Packet.TYPE);
  const rrclass = RecordToArray<number>(Packet.CLASS);

  const qtype = rrtype.find((r) => r.value === q.type) ?? { key: 'A', value: 1 };

  const clientInfo = `${info.address} ${rrclass.find((r) => r.value === q.class)?.key ?? 'IN'} ${qtype.key} ${q.name}`;
  let answerInfo = '';

  const answers: NSRecord[] = [];
  const additionals: NSRecord[] = [];

  const noRecursionZones = config.dns.recursion.denyRecursion;

  const useLocal =
    qtype.key === 'A' && config.dns.local.enabled && config.dns.local.domains.findIndex((v) => name.endsWith(v)) !== -1;

  if (useLocal) {
    try {
      const addrs = await resolveHosts(name);
      answers.push(...addrs);
      answerInfo = `LA:${answers.length}`;
    } catch (e) {
      answerInfo = `NO DATA`;
    }
  } else {
    const lookupInfo = await backend.lookupSplit(name);
    answers.push(...(await backend.resolve(name, qtype.key as NSRecordType)));
    answerInfo = `AA:${answers.length}`;
    const disallowRecursion = noRecursionZones.findIndex((v) => v === q.name.split('.').slice(-1)[0]) !== -1;
    if (config.dns.recursion.enabled && !disallowRecursion && answers.length === 0) {
      answers.push(...(await makeRecursionRequest(q, config.dns.recursion)));
      answerInfo = `RA:${answers.length}`;
    }
    const res: DnsAnswer[] = answers.map((rec) => {
      return {
        name: rec.name,
        type: rrtype.find((t) => t.key === rec.type)?.value ?? Packet.TYPE.ANY,
        ttl: rec.ttl,
        ...rec.data,
      };
    });
    if (res.length === 0) {
      const soa = lookupInfo?.zone.zone.authority ?? {
        primary: `ns.${name}`,
        admin: `noop.${name}`,
        serial: Date.now(),
        refresh: 600,
        retry: 600,
        expiration: 600,
        minimum: 600,
      };
      response.authorities.push({
        type: 6,
        class: 1,
        name: name,
        ttl: 600,
        ...soa,
      });
    } else {
      response.answers.push(...res);
      response.additionals.push(
        ...additionals.map((v) => ({
          type: rrtype.find((t) => t.key === v.type)?.value ?? Packet.TYPE.ANY,
          name: v.name,
          ttl: v.ttl,
          ...v.data,
        })),
      );
    }
  }
  if (config.dns.requestLog) {
    console.log(`${clientInfo} => ${answerInfo}`);
  }
  return response;
}
