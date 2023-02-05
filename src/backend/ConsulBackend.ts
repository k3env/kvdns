import { Config } from './../types/AppConfig';
import ConsulStatic, { Consul, Watch } from 'consul';
import { Backend } from './BackendGeneric';
import { NSRecordPayload, Schema } from '../types/Schema';
import { ConsulKV } from '../types/ConsulKV';

export class ConsulBackend extends Backend implements Backend {
  protected db: Schema;
  private client: Consul;
  private watcher: Watch;

  private _config: Config;

  constructor(config: Config) {
    super();
    this._config = config;
    this.client = new ConsulStatic({
      host: config.backend.consul?.endpoint,
      port: config.backend.consul?.port?.toString() ?? '8500',
    });
    this.db = {};
    try {
      this.client.kv.keys(`${config.backend.consul?.kvRoot}/zones`);
    } catch (error) {
      this.client.kv.set(`${config.backend.consul?.kvRoot}/zones/`, '');
    } finally {
      this.watcher = this.client.watch({
        method: this.client.kv.keys,
        options: { key: `${config.backend.consul?.kvRoot}/zones` },
      });
      this.watcher.on('change', (data) => this._update(data));
    }
  }

  public addZone(zone: string): boolean {
    throw new Error(`Zone and record management available only from Consul`);
  }
  public deleteZone(zone: string): boolean {
    throw new Error(`Zone and record management available only from Consul`);
  }
  public updateZone(oldzone: string, newzone: string): boolean {
    throw new Error(`Zone and record management available only from Consul`);
  }

  public addRecord(zone: string, record: NSRecordPayload): boolean {
    throw new Error(`Zone and record management available only from Consul`);
  }
  public deleteRecord(zone: string, id: string): boolean {
    throw new Error(`Zone and record management available only from Consul`);
  }
  public updateRecord(zone: string, id: string, payload: NSRecordPayload): boolean {
    throw new Error(`Zone and record management available only from Consul`);
  }

  public updateDb(): void {
    throw new Error('Direct update call not allowed');
  }

  private async _update(data: string[]): Promise<void> {
    data.forEach(async (d) => {
      const [domain] = d.split('/').slice(-1);
      try {
        this.db[domain] = JSON.parse(((await this.client.kv.get(d)) as { Value: string }).Value);
      } catch {
        console.log('key not found');
      }
    });
  }

  public stop(): void {
    this.watcher.end();
  }

  public get Db(): Schema {
    return this.db;
  }
}
