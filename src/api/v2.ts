/* eslint-disable @typescript-eslint/no-namespace */
import { Router } from 'express';
import { Backend } from '../backend/Backend';

export namespace V2 {
  class BaseApi {
    protected backend: Backend;
    protected router: Router;
    constructor(backend: Backend) {
      this.backend = backend;
      this.router = Router({ mergeParams: true });
    }

    public get API(): Router {
      return this.router;
    }
  }
  export class Records extends BaseApi {
    constructor(backend: Backend) {
      super(backend);
      this.router.get('/', async (req, res) => {
        console.log('RecordAPI', 'GET', '/', req.body, req.query, req.params);
        try {
          const id = (req.params as { zoneId: string }).zoneId ?? req.query.zoneId ?? req.body.zoneId ?? '';
          res.send(await backend.getRecords(id));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
      this.router.get('/:id', async (req, res) => {
        console.log('RecordAPI', 'GET', '/:id', req.body, req.query, req.params);
        try {
          const zoneId =
            (req.params as { zoneId: string; id: string }).zoneId ?? req.query.zoneId ?? req.body.zoneId ?? '';
          res.send(await backend.getRecord(zoneId, req.params.id));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
      this.router.post('/', async (req, res) => {
        console.log('RecordAPI', 'ADD', '/', req.body, req.query, req.params);
        try {
          res.send(await backend.addRecord(req.body.record));
        } catch (error) {
          console.log(error);
          res.status(400).send(error as Error);
        }
      });
      this.router.patch('/', async (req, res) => {
        console.log('RecordAPI', 'UPD', '/', req.body, req.query, req.params);
        try {
          res.send(await backend.updateRecord(req.body.recordId, req.body.record));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
      this.router.delete('/', async (req, res) => {
        console.log('RecordAPI', 'DEL', '/', req.body, req.query, req.params);
        try {
          backend
            .deleteRecord(req.body.recordId)
            .catch((e) => {
              res.status(400).send(e as Error);
            })
            .then(() => res.send({ id: req.body.recordId, status: 'ok' }));
          // res.send(await backend.deleteZone(req.body.id));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
    }
  }
  export class Zones extends BaseApi {
    constructor(backend: Backend) {
      super(backend);
      this.router.get('/', async (req, res) => {
        try {
          res.send(await backend.getZones());
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
      this.router.get('/:id', async (req, res) => {
        try {
          res.send(await backend.getZone(req.params.id));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
      this.router.post('/', async (req, res) => {
        try {
          res.send(await backend.addZone(req.body.zone));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
      this.router.patch('/', async (req, res) => {
        try {
          res.send(await backend.updateZone(req.body.id, req.body.zone));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
      this.router.delete('/', async (req, res) => {
        try {
          backend
            .deleteZone(req.body.id)
            .catch((e) => {
              res.status(400).send(e as Error);
            })
            .then(() => res.send({ id: req.body.id, status: 'ok' }));
          // res.send(await backend.deleteZone(req.body.id));
        } catch (error) {
          res.status(400).send(error as Error);
        }
      });
    }
  }
}
