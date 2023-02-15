import * as express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import dns2, { DnsResponse } from 'dns2';
import * as fs from 'fs';
import { Config } from './types';
import { handleDnsRequest } from './dns';
import { V2 } from './api/v2';
import { Backend } from './backend/Backend';

dotenv.config();

function init(config: Config): string[] {
  const errors = [];
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

  console.log(`Loading backend:`);
  console.log(`-- Adapter: ${cfg.backend.adapter}`);
  console.log(`-- URI: ${cfg.backend.uri}`);
  const backend: Backend = new Backend(cfg.backend);

  const dnssv = dns2.createServer({
    tcp: cfg.dns.ports.tcp !== undefined,
    udp: cfg.dns.ports.udp !== undefined,
    handle: (req, send, info) => {
      handleDnsRequest(req, backend, cfg, info).then((v) => {
        send(v as DnsResponse);
      });
    },
  });

  const app = express.default();
  app.use(express.json());
  app.use(cors({ origin: '*' }));

  app.use('/api/v2/record', new V2.Records(backend).API);
  app.use('/api/v2/zone', new V2.Zones(backend).API);
  app.use('/api/v2/zone/:zoneId/record', new V2.Records(backend).API);

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
