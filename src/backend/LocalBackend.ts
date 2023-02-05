import { BackendConfig, LocalBackendConfig } from './../types/AppConfig';
import { LowSync, JSONFileSync, MemorySync } from 'lowdb';
import { Backend } from './BackendGeneric';
import { NSRecord, NSRecordPayload, Schema } from '../types/Schema';
import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

export class LocalBackend extends Backend implements Backend {
  protected db: Schema;
  private client: LowSync<Schema>;
  private timer: NodeJS.Timeout;
  private _config: LocalBackendConfig;

  constructor(config: BackendConfig) {
    super();
    this.db = {};
    if (config.local) {
      this._config = config.local;
      if (this._config.containerWorkaround) {
        this.client = new LowSync(new MemorySync<Schema>());
        this.client.adapter.write(JSON.parse(readFileSync(this._config.dbLocation).toString('utf8')));
      } else {
        this.client = new LowSync(new JSONFileSync<Schema>(config.local.dbLocation));
      }
      this.updateDb();
      this.timer = setInterval(() => {
        this.updateDb();
      }, 500);

      console.log('Backend initialized with config:', config);
    } else {
      throw new Error("Config doesn't constains any info about current backend");
    }
  }
  public updateDb(): void {
    this.client.read();
    if (this.client.data) {
      this.db = this.client.data;
    }
  }
  public stop(): void {
    clearInterval(this.timer);
    if (this._config.containerWorkaround) {
      writeFileSync(this._config.dbLocation, JSON.stringify(this.db, undefined, 2));
    }
  }

  public addZone(zone: string): boolean {
    if (this.db[zone] !== undefined) {
      return false;
    } else {
      this.db[zone] = [];
      this.client.write();
      return true;
    }
  }
  public deleteZone(zone: string): boolean {
    if (this.db[zone] === undefined) {
      return false;
    } else {
      delete this.db[zone];
      this.client.write();
      return true;
    }
  }
  public updateZone(oldzone: string, newzone: string): boolean {
    if (this.db[newzone] !== undefined) {
      throw new Error(`Zone ${newzone} already exist`);
    } else {
      if (this.db[oldzone] === undefined) {
        throw new Error(`Zone ${oldzone} doesn't exist`);
      } else {
        this.db[newzone] = this.db[oldzone];
        delete this.db[oldzone];
        this.client.write();
        return true;
      }
    }
  }
  public addRecord(zone: string, record: NSRecordPayload): boolean {
    if (this.db[zone] !== undefined) {
      const newR: NSRecord = { id: randomUUID(), ...record };
      this.db[zone].push(newR);
      this.client.write();
      return true;
    } else {
      throw new Error(`Zone ${zone} doesn't exist`);
    }
  }
  public deleteRecord(zone: string, id: string): boolean {
    if (this.db[zone] !== undefined) {
      this.db[zone] = this.db[zone].filter((v) => v.id !== id);
      this.client.write();
      return true;
    } else {
      throw new Error(`Zone ${zone} doesn't exist`);
    }
  }
  public updateRecord(zone: string, id: string, payload: NSRecordPayload): boolean {
    if (this.db[zone] !== undefined) {
      const rID = this.db[zone].findIndex((v) => v.id === id);
      if (rID !== -1) {
        const data: NSRecordPayload = this.db[zone][rID];
        this.db[zone][rID] = { id: id, ...data, ...payload };
        this.client.write();
        return true;
      } else {
        throw new Error(`Record not found`);
      }
    } else {
      throw new Error(`Zone ${zone} doesn't exist`);
    }
  }

  public get Db(): Schema {
    return this.db;
  }
}
