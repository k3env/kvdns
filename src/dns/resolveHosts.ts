import { lookup } from 'dns/promises';
import { NSRecord } from '../types/Schema';

export async function resolveHosts(name: string): Promise<NSRecord[]> {
  try {
    const addrs = (await lookup(name, { all: true, family: 4 })).map((l) => {
      const a: NSRecord = {
        name,
        ttl: 600,
        type: 'A',
        zoneId: 'hosts',
        data: {
          address: l.address,
          class: 1,
        },
      };
      return a;
    });
    return addrs;
  } catch (e) {
    return [];
  }
}
