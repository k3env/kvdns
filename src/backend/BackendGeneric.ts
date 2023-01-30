import { ARecord } from '../types/ARecord';

export abstract class Backend {
  public abstract resolve(lookup: string): ARecord[];
  public abstract update(): void;
  public abstract destroy(): void;
}
