import mongoose from 'mongoose';

/** Run all document, balance, and ledger writes as one retryable MongoDB transaction. */
export async function inInventoryTransaction(work) {
  if (typeof work !== 'function') throw new TypeError('Transaction work callback is required');
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    }, {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
      readPreference: 'primary',
    });
    return result;
  } finally {
    await session.endSession();
  }
}
