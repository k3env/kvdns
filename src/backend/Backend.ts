import { randomUUID } from 'crypto';
import Keyv from 'keyv';
import { BackendConfig } from '../types/AppConfig';
import { LookupInfo, NSRecord, NSRecordType, NSZone, RecordAssociation, UUID, ZoneAssociation } from '../types/Schema';

export class Backend {
  private db: { zones: Keyv<NSZone>; records: Keyv<NSRecord> };
  constructor(config: BackendConfig) {
    const adapterConfig = {
      adapter: config.adapter,
      uri: config.uri,
    };
    const _zdb = new Keyv<NSZone>({ ...adapterConfig, table: 'zones' });
    const _rdb = new Keyv<NSRecord>({ ...adapterConfig, table: 'records' });

    this.db = { zones: _zdb, records: _rdb };
  }

  private async zoneAccociations(): Promise<ZoneAssociation[]> {
    const _: ZoneAssociation[] = [];
    for await (const [id, zone] of this.db.zones.iterator()) {
      _.push({ id, zone });
    }
    return _;
  }
  private async recordAssoc(zoneId: string): Promise<RecordAssociation[]> {
    const _: RecordAssociation[] = [];
    for await (const [id, rec] of this.db.records.iterator()) {
      if (rec.zoneId === zoneId) {
        _.push({ id: id, record: rec });
      }
    }
    return _;
  }

  private async findRecords(record: LookupInfo, type: NSRecordType): Promise<NSRecord[]> {
    let segs = record.record.split('.');
    const rr = (await this.recordAssoc(record.zone.id)).filter((r) => r.record.type === type);
    const _: NSRecord[] = rr
      .filter((n) => n.record.name === (record.record === '' ? '@' : record.record))
      .map((r) => r.record);
    while (_.length === 0 && segs.length > 0) {
      segs = segs.slice(1);
      _.push(...rr.filter((v) => v.record.name === ['*', ...segs].join('.')).map((v) => v.record));
    }
    return _;
  }

  public async lookupSplit(lookup: string): Promise<LookupInfo | undefined> {
    let zone: ZoneAssociation | undefined;

    const recordWithoutZone: string[] = [];

    const recSegs = lookup.split('.');

    const _zones = await this.zoneAccociations();
    while (recSegs.length > 0 && zone === undefined) {
      zone = _zones.find((z) => z.zone.name === recSegs.join('.'));
      if (zone === undefined) {
        const zP = recSegs.reverse().pop();
        recSegs.reverse();
        if (zP) {
          recordWithoutZone.push(zP);
        }
      }
    }

    if (zone) {
      const record = recordWithoutZone.join('.');
      return { zone, record };
    } else {
      return undefined;
    }
  }

  public async resolve(lookup: string, type: NSRecordType): Promise<NSRecord[]> {
    const _: NSRecord[] = [];
    const _info = await this.lookupSplit(lookup);
    if (_info) {
      const _recs = (await this.findRecords(_info, type)).map((r) => {
        const _ = r;
        _.name = lookup;
        return _;
      });
      _.push(..._recs);
    }
    return _;
  }
  public async getZones(): Promise<ZoneAssociation[]> {
    return await this.zoneAccociations();
  }
  public async getZone(id: string): Promise<ZoneAssociation | undefined> {
    const __ = (await this.zoneAccociations()).find((v) => v.id === id);
    return __;
  }
  public async getRecords(zoneId: string): Promise<RecordAssociation[]> {
    return await this.recordAssoc(zoneId);
  }
  public async getRecord(zoneId: string, recordId: string): Promise<RecordAssociation> {
    const _ = (await this.recordAssoc(zoneId)).find((r) => r.id === recordId);
    if (_) {
      return _;
    } else {
      throw new Error(`Record with id ${recordId} not found in zone ${zoneId}`);
    }
  }

  public async addZone(zone: NSZone): Promise<ZoneAssociation> {
    const _zones = (await this.zoneAccociations()).filter((z) => z.zone.name === zone.name);
    if (_zones.length > 0) {
      throw new Error(`Zone ${zone.name} already exist`);
    } else {
      const _: ZoneAssociation = {
        id: randomUUID(),
        zone: zone,
      };
      this.db.zones.set(_.id, zone);
      return _;
    }
  }
  public async deleteZone(zoneId: UUID): Promise<void> {
    if (await this.db.zones.has(zoneId)) {
      this.db.zones.delete(zoneId);
    } else {
      throw new Error(`Zone with id ${zoneId} not found`);
    }
  }
  public async updateZone(id: UUID, zone: NSZone): Promise<ZoneAssociation> {
    if (await this.db.zones.has(id)) {
      const data = await this.db.zones.get(id);
      const newData = { ...data, ...zone };
      await this.db.zones.set(id, newData);
      return { id: id, zone: newData };
    } else {
      throw new Error(`Zone with id ${id} not found`);
    }
  }

  public async addRecord(record: NSRecord): Promise<RecordAssociation> {
    if (await this.db.zones.has(record.zoneId)) {
      const id = randomUUID();
      await this.db.records.set(id, record);
      return { id: id, record: record };
    } else {
      throw new Error(`Zone with ID ${record.zoneId} not found`);
    }
  }
  public async deleteRecord(id: UUID): Promise<void> {
    if (await this.db.records.has(id)) {
      await this.db.records.delete(id);
    } else {
      throw new Error(`Record with id ${id} not found`);
    }
  }
  public async updateRecord(id: UUID, record: NSRecord): Promise<RecordAssociation> {
    const data = await this.db.records.get(id);
    if (data) {
      const updated: NSRecord = { ...data, ...record };
      this.db.records.set(id, updated);
      return { id, record: updated };
    } else {
      throw new Error(`Record with id ${id} not found`);
    }
  }

  public async stop(): Promise<void> {
    await this.db.zones.disconnect();
    await this.db.records.disconnect();
  }
}
