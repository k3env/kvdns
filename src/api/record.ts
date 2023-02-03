import { Router } from 'express';
import { Backend } from '../backend';

export class RecordsApi {
  private _router: Router;
  constructor(backend: Backend) {
    this._router = Router({ mergeParams: true })
      .post('/', (req, res) => {
        try {
          const rd = backend.addRecord(req.body.zone, req.body.payload);
          res.send(rd);
        } catch (error) {
          res.status(500).send((error as Error).message);
        }
      })
      .patch('/', (req, res) => {
        try {
          const rd = backend.updateRecord(req.body.zone, req.body.id, req.body.payload);
          res.send(rd);
        } catch (error) {
          res.status(500).send((error as Error).message);
        }
      })
      .delete('/', (req, res) => {
        try {
          const rd = backend.deleteRecord(req.body.zone, req.body.id);
          res.send(rd);
        } catch (error) {
          res.status(500).send((error as Error).message);
        }
      });
  }
  public get Router(): Router {
    return this._router;
  }
}
