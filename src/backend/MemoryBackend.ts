import { Config } from '../types/AppConfig';
import { LowSync, MemorySync } from 'lowdb';

import { Backend } from './BackendGeneric';
import { NSRecord, NSRecordPayload, Schema } from '../types/Schema';
import { randomUUID } from 'crypto';

export class MemoryBackend extends Backend implements Backend {
  protected db: Schema;
  private client: LowSync<Schema>;
  private timer: NodeJS.Timeout;

  constructor(config: Config) {
    super();
    this.db = {};
    this.client = new LowSync(new MemorySync<Schema>());
    this.updateDb();
    this.timer = setInterval(() => {
      this.updateDb();
    }, 500);

    console.log('WARNING: USE THIS BACKEND ONLY FOR TEST PURPOSES');
    console.log('Backend initialized with config:', config);
  }
  public updateDb(): void {
    this.client.read();
    if (this.client.data) {
      this.db = this.client.data;
    }
  }
  public stop(): void {
    clearInterval(this.timer);
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
