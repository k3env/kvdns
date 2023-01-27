import * as express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import consul from 'consul';
import dns2 from 'dns2';
const { Packet } = dns2;

type KV<T> = { [key: string]: T };

type ARecord = {
  record: string;
  addr: string;
  ttl?: number;
};
type SRVRecord = {
  name: string;
  port: number;
  ttl?: number;
};
type DNSKV = {
  record: string;
  value: string[];
};

dotenv.config();

export async function main(): Promise<void> {
  const dnsrecords: ARecord[] = [];
  const rootKey = 'app/coredns-v2';
  const cclient = new consul({ host: 'consul.service.consul' });

  const watch = cclient.watch({
    method: cclient.kv.keys,
    options: { key: `${rootKey}/records` },
  });

  watch.on('change', async (data, res) => {
    // console.log(data, res);
    const domains = ((await cclient.kv.keys(`${rootKey}/records`)) as string[]).map((v) => v.split('/').slice(-1)[0]);
    for (const id in domains) {
      const domain = domains[id];
      const records = JSON.parse(((await cclient.kv.get(`${rootKey}/records/${domain}`)) as { Value: string }).Value);
      for (const id in records) {
        if (Object.prototype.hasOwnProperty.call(records, id)) {
          const record = records[id] as DNSKV;
          const arecords = record.value.map((ip) => {
            const name = record.record === '@' ? domain : `${record.record}.${domain}`;
            const newA: ARecord = { record: name, addr: ip, ttl: 60 };
            return newA;
          });

          dnsrecords.push(...arecords);
        }
      }
    }
    console.log('key changed');
  });

  const dnssv = dns2.createServer({
    tcp: true,
    udp: true,
    handle: (req, send) => {
      const response = Packet.createResponseFromRequest(req);
      const [question] = req.questions;
      const { name } = question;
      let segs = name.split('.');
      const ips = dnsrecords.filter((v) => v.record === name);
      while (ips.length === 0 && segs.length !== 0) {
        segs = segs.slice(1);
        const wildcardName = '*.' + segs.join('.');
        ips.push(...dnsrecords.filter((v) => v.record === wildcardName));
      }
      for (const id in ips) {
        if (Object.prototype.hasOwnProperty.call(ips, id)) {
          const rec = ips[id];
          response.answers.push({
            name,
            type: Packet.TYPE.A,
            class: Packet.CLASS.IN,
            ttl: rec.ttl ?? 600,
            address: rec.addr,
          });
        }
      }
      send(response);
    },
  });

  const app = express.default();
  app.use(express.json());
  app.use(cors({ origin: '*' }));
  app.listen(3000, () => {
    console.log('it works (v0.3) on 0.0.0.0:3000');
  });
  dnssv.listen({
    tcp: 5333,
    udp: 5333,
  });

  const stop = () => {
    console.log();
    console.log('bye');
    dnssv.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    stop();
  }); // CTRL+C
  process.on('SIGQUIT', () => {
    stop();
  }); // Keyboard quit
  process.on('SIGTERM', () => {
    stop();
  }); // `kill` command
}

main();
