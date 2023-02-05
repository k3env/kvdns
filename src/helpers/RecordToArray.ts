export function RecordToArray<T>(record: Record<string, T>): { key: string; value: T }[] {
  const _: { key: string; value: T }[] = [];
  for (const key in record) {
    _.push({ key: key, value: record[key] });
  }
  return _;
}
