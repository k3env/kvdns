export interface ConsulKV {
  LockIndex: number;
  Key: string;
  Flags: number;
  Value: string | null;
  CreateIndex: number;
  ModifyIndex: number;
}
