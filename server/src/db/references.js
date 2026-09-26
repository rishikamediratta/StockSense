import { Counter } from './models/index.js';

/** Atomically allocate a warehouse-scoped sequential document reference. */
export async function nextOperationReference({ warehouseCode, operation }) {
  const code = String(warehouseCode || '').trim().toUpperCase();
  const kind = String(operation || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{2,12}$/.test(code)) throw new TypeError('Invalid warehouse short code');
  if (!['IN', 'OUT', 'INT', 'ADJ'].includes(kind)) throw new TypeError('Invalid operation code');
  const key = `${code}:${kind}`;
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { sequence: 1 }, $setOnInsert: { key } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return `${code}/${kind}/${String(counter.sequence).padStart(4, '0')}`;
}
