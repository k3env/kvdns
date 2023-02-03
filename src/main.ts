import * as express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import dns2 from 'dns2';
import * as fs from 'fs';
import { LocalBackend, Backend } from './backend';
import { NSRecordDataA } from './types/Schema';
import { Config } from './types/AppConfig';
import { RecordsApi } from './api/record';
import { ZoneApi } from './api/zone';
const { Packet } = dns2;

dotenv.config();

function init(config: Config): string[] {
  const errors = [];
  if (config.backend.driver === 'consul') {
    if (config.backend.consul === undefined) {
      errors.push("Consul config section isn't set");
    }
  }
  if (!config.dns.ports.tcp && !config.dns.ports.udp) {
    errors.push('You need specify atleast one of DNS ports, TCP or UDP');
  }
  return errors;
}

function loadConfig(file = 'config.json'): Config {
  return JSON.parse(fs.readFileSync(file).toString('utf8'));
}

export async function main(): Promise<void> {
  const cfg = loadConfig();
  const errs = init(cfg);
  if (errs.length > 0) {
    errs.forEach((e) => console.error(e));
    process.exit(-1);
  }

  console.log(`Loading backend: ${cfg.backend.driver}`);
  let backend: Backend;
  switch (cfg.backend.driver) {
    case 'local':
      backend = new LocalBackend(cfg);
      break;
    default:
      throw new Error(`Backend ${cfg.backend.driver} not yet implemented`);
  }

  const dnssv = dns2.createServer({
    tcp: cfg.dns.ports.tcp !== undefined,
    udp: cfg.dns.ports.udp !== undefined,
    handle: (req, send) => {
      send(handleDnsRequest(req, backend));
    },
  });

  const app = express.default();
  app.use(express.json());
  app.use(cors({ origin: '*' }));
  app.get('/db', (req, res) => {
    res.send(backend.Db);
  });
  app.get('/zones', (req, res) => {
    const k = [];
    for (const key in backend.Db) {
      k.push(key);
    }
    res.send(k);
  });

  app.use('/api/zone', new ZoneApi(backend).Router);
  app.use('/api/record', new RecordsApi(backend).Router);

  app.listen(cfg.http.port, () => {
    console.log(`HTTP server started on port ${cfg.http.port}`);
  });
  dnssv
    .listen({
      tcp: cfg.dns.ports.tcp,
      udp: cfg.dns.ports.udp,
    })
    .then(() => {
      console.log(`DNS server started on:`);
      if (cfg.dns.ports.tcp) {
        console.log(`-- TCP: ${cfg.dns.ports.tcp}`);
      }
      if (cfg.dns.ports.udp) {
        console.log(`-- UDP: ${cfg.dns.ports.udp}`);
      }
    });

  const stop = (): void => {
    console.log();
    console.log('bye');
    backend.stop();
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

function handleDnsRequest(req: dns2.DnsRequest, backend: Backend): dns2.DnsResponse {
  const response = Packet.createResponseFromRequest(req);
  const [question] = req.questions;
  const { name } = question;
  const q: { type: number; class: number; name: string } = JSON.parse(JSON.stringify(question));
  console.log(q.class, q.type, q.name);

  const ips = backend.resolve(name);
  const res = ips.map((rec) => {
    return {
      name,
      type: Packet.TYPE.A,
      class: Packet.CLASS.IN,
      ttl: rec.ttl ?? 600,
      address: (rec.data as NSRecordDataA).address,
    };
  });
  response.answers.push(...res);
  return response;
}

main();
