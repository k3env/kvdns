import { Router } from 'express';
import { Backend } from '../backend';

export class ZoneApi {
  private _router: Router;
  constructor(backend: Backend) {
    this._router = Router({ mergeParams: true })
      .post('/', (req, res) => {
        try {
          const rd = backend.addZone(req.body.zone);
          res.send(rd);
        } catch (error) {
          res.status(500).send((error as Error).message);
        }
      })
      .delete('/', (req, res) => {
        try {
          backend.deleteZone(req.body.zone);
          res.send(true);
        } catch (error) {
          res.status(500).send((error as Error).message);
        }
      })
      .patch('/', (req, res) => {
        try {
          backend.updateZone(req.body.oldzone, req.body.newzone);
          res.send(true);
        } catch (error) {
          res.status(500).send((error as Error).message);
        }
      });
  }
  public get Router(): Router {
    return this._router;
  }
}
