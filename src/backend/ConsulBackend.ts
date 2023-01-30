import { AppConfig } from './../types/AppConfig';
import ConsulStatic, { Consul, Watch } from 'consul';
import { ARecord, DNSKV } from '../types';
import { Backend } from './BackendGeneric';

export class ConsulBackend implements Backend {
  private db: ARecord[];
  private client: Consul;
  private watcher: Watch;

  constructor(config: AppConfig) {
    this.client = new ConsulStatic({
      host: config.CONSUL_ENDPOINT,
    });
    this.db = [];
    this.watcher = this.client.watch({
      method: this.client.kv.keys,
      options: { key: `${config.CONSUL_KV_ROOT}/records` },
    });
    this.watcher.on('change', (data) => this._update(data));
  }

  public update(): void {
    throw new Error('Direct update call not allowed');
  }

  private async _update(data: string[]): Promise<void> {
    data.forEach(async (d) => {
      const [domain] = d.split('/').slice(-1);
      this.db = this.db.filter((v) => v.source !== `consul/${domain}`);
      const records: DNSKV[] = JSON.parse(((await this.client.kv.get(d)) as { Value: string }).Value);
      records.forEach((r) => {
        const arecords = r.value.map((ip) => {
          const name = r.record === '@' ? domain : `${r.record}.${domain}`;
          const newA: ARecord = { source: `consul/${domain}`, record: name, addr: ip, ttl: 60 };
          return newA;
        });
        this.db.push(...arecords);
      });
    });
  }

  public destroy(): void {
    this.watcher.end();
  }

  public resolve(lookup: string): ARecord[] {
    let segs = lookup.split('.');
    const ips = this.db.filter((v) => v.record === lookup);
    while (ips.length === 0 && segs.length !== 0) {
      segs = segs.slice(1);
      const wildcardName = '*.' + segs.join('.');
      ips.push(...this.db.filter((v) => v.record === wildcardName));
    }
    return ips;
  }

  public get Db(): ARecord[] {
    return this.db;
  }
}
