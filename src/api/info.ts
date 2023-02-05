import { Router } from 'express';
import { Backend } from '../backend';

export class InfoApi {
  private _router: Router;
  constructor(backend: Backend) {
    this._router = Router({ mergeParams: true })
      .get('/db', (req, res) => {
        res.send(backend.Db);
      })
      .get('/zones', (req, res) => {
        const k = [];
        for (const key in backend.Db) {
          k.push(key);
        }
        res.send(k);
      });
  }
  public get Router(): Router {
    return this._router;
  }
}
