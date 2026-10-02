import mongoose, { Schema, type Model } from 'mongoose';

// Every stock writer touches this document inside its transaction. Concurrent
// changes to the same balance trigger MongoDB's transaction conflict handling.
type StockLockDocument = { _id: string; version: number };
const schema = new Schema<StockLockDocument>({
  _id: { type: String, required: true },
  version: { type: Number, required: true, default: 0 }
}, { versionKey: false });

export function getStockLockModel(): Model<StockLockDocument> {
  return mongoose.models.StockLock ?? mongoose.model<StockLockDocument>('StockLock', schema);
}
