import { NSRecord, NSRecordPayload, Schema } from '../types/Schema';

export abstract class Backend {
  protected abstract db: Schema;

  protected schemaToTable(): NSRecord[] {
    const v = [];
    for (const zone in this.db) {
      const records = this.db[zone];
      v.push(
        ...records.map((ns) => {
          const lookup = ns.name === '@' ? zone : ns.name + '.' + zone;
          const rec: NSRecord = {
            id: ns.id,
            name: lookup,
            ttl: ns.ttl,
            type: ns.type,
            data: ns.data,
          };
          return rec;
        }),
      );
    }
    return v;
  }

  public resolve(lookup: string): NSRecord[] {
    let segs = lookup.split('.');
    const lookupTable = this.schemaToTable();
    const ips = lookupTable.filter((v) => v.name === lookup);

    while (ips.length === 0 && segs.length > 0) {
      segs = segs.slice(1);
      ips.push(...lookupTable.filter((v) => v.name === `*.${segs.join('.')}`));
    }

    return ips;
  }

  public abstract updateDb(): void;
  public abstract stop(): void;
  public get Db(): Schema {
    return this.db;
  }
  public get Table(): NSRecord[] {
    return this.schemaToTable();
  }

  // // Zone CRUD operations
  public abstract addZone(zone: string): boolean;
  public abstract deleteZone(zone: string): boolean;
  public abstract updateZone(oldzone: string, newzone: string): boolean;

  // // Record CRUD operations
  public abstract addRecord(zone: string, record: NSRecordPayload): boolean;
  public abstract deleteRecord(zone: string, id: string): boolean;
  public abstract updateRecord(zone: string, id: string, payload: NSRecordPayload): boolean;
}
