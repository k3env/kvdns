import * as express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import dns2 from 'dns2';
import { AppConfig } from './types';
import { ConsulBackend, Backend } from './backend';
const { Packet } = dns2;

dotenv.config();

const appConfig: AppConfig = {
  HTTP_PORT: Number.parseInt(process.env.HTTP_PORT ?? '3000'), // Default
  DNS_PORT_TCP: Number.parseInt(process.env.DNS_PORT_TCP ?? '-1'), // Default
  DNS_PORT_UDP: Number.parseInt(process.env.DNS_PORT_UDP ?? '-1'), // Default
  CONSUL_KV_ROOT: process.env.CONSUL_KV_ROOT ?? 'app/kvdns',
  CONSUL_ENDPOINT: process.env.CONSUL_ENDPOINT ?? 'UNSET',
  DNS_TCP_ENABLED: Number.parseInt(process.env.DNS_PORT_TCP ?? '-1') !== -1,
  DNS_UDP_ENABLED: Number.parseInt(process.env.DNS_PORT_UDP ?? '-1') !== -1,
};

function init(): string[] {
  const errors = [];
  if (appConfig.CONSUL_ENDPOINT === 'UNSET') {
    errors.push("CONSUL_ENDPOINT isn't set, exit");
  }
  if (!appConfig.DNS_TCP_ENABLED && !appConfig.DNS_UDP_ENABLED) {
    errors.push('You need specify atleast one of DNS ports, TCP or UDP');
  }
  return errors;
}

export async function main(): Promise<void> {
  const errs = init();
  if (errs.length > 0) {
    errs.forEach((e) => console.error(e));
    process.exit(-1);
  }

  const backend = new ConsulBackend(appConfig);

  const dnssv = dns2.createServer({
    tcp: appConfig.DNS_TCP_ENABLED,
    udp: appConfig.DNS_UDP_ENABLED,
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
  app.listen(appConfig.HTTP_PORT, () => {
    console.log(`HTTP server started on port ${appConfig.HTTP_PORT}`);
  });
  dnssv
    .listen({
      tcp: appConfig.DNS_TCP_ENABLED ? appConfig.DNS_PORT_TCP : undefined,
      udp: appConfig.DNS_UDP_ENABLED ? appConfig.DNS_PORT_UDP : undefined,
    })
    .then(() => {
      console.log(`DNS server started on:`);
      if (appConfig.DNS_PORT_TCP !== -1) {
        console.log(`-- TCP: ${appConfig.DNS_PORT_TCP}`);
      }
      if (appConfig.DNS_PORT_UDP !== -1) {
        console.log(`-- UDP: ${appConfig.DNS_PORT_UDP}`);
      }
    });

  const stop = (): void => {
    console.log();
    console.log('bye');
    backend.destroy();
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
    console.log(rec.source, rec.record, rec.addr);
    return {
      name,
      type: Packet.TYPE.A,
      class: Packet.CLASS.IN,
      ttl: rec.ttl ?? 600,
      address: rec.addr,
    };
  });
  response.answers.push(...res);
  return response;
}

main();
