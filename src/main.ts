import * as express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import dns2 from 'dns2';
import * as fs from 'fs';
import { LocalBackend, Backend } from './backend';
import { Config } from './types';
import { RecordsApi } from './api/record';
import { ZoneApi } from './api/zone';
import { MemoryBackend } from './backend/MemoryBackend';
import { handleDnsRequest } from './dns';
import { InfoApi } from './api/info';

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
    case 'memory':
      backend = new MemoryBackend(cfg);
      break;
    default:
      throw new Error(`Backend ${cfg.backend.driver} not yet implemented`);
  }

  const dnssv = dns2.createServer({
    tcp: cfg.dns.ports.tcp !== undefined,
    udp: cfg.dns.ports.udp !== undefined,
    handle: (req, send) => {
      handleDnsRequest(req, backend, cfg).then((v) => {
        send(v);
      });
    },
  });

  const app = express.default();
  app.use(express.json());
  app.use(cors({ origin: '*' }));

  app.use('/', new InfoApi(backend).Router);
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

main();
