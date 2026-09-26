import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const objectId = Schema.Types.ObjectId;
const nonBlank = (value) => typeof value === 'string' && value.trim().length > 0;
const positive = (value) => Number.isFinite(value) && value > 0;

const timestamps = { timestamps: true, versionKey: false, minimize: false };

const userSchema = new Schema({
  loginId: { type: String, required: true, trim: true, minlength: 6, maxlength: 12, match: /^[A-Za-z0-9_-]+$/ },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true, select: false },
}, timestamps);
userSchema.index({ loginId: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

const warehouseSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120, validate: nonBlank },
  shortCode: { type: String, required: true, trim: true, uppercase: true, minlength: 2, maxlength: 12, match: /^[A-Z0-9_-]+$/ },
  address: { type: String, required: true, trim: true, maxlength: 500, validate: nonBlank },
}, timestamps);
warehouseSchema.index({ shortCode: 1 }, { unique: true });

const locationSchema = new Schema({
  warehouse: { type: objectId, ref: 'Warehouse', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120, validate: nonBlank },
  shortCode: { type: String, required: true, trim: true, uppercase: true, minlength: 1, maxlength: 20, match: /^[A-Z0-9_-]+$/ },
}, timestamps);
locationSchema.index({ warehouse: 1, shortCode: 1 }, { unique: true });

const productSchema = new Schema({
  sku: { type: String, required: true, trim: true, uppercase: true, minlength: 1, maxlength: 40, match: /^[A-Z0-9._-]+$/ },
  name: { type: String, required: true, trim: true, maxlength: 160, validate: nonBlank },
  category: { type: String, required: true, trim: true, maxlength: 100, validate: nonBlank },
  unitOfMeasure: { type: String, required: true, trim: true, maxlength: 32, validate: nonBlank },
  costPerUnit: { type: Number, min: 0, default: 0 },
  reorderPoint: { type: Number, min: 0, default: 0 },
  reorderQuantity: { type: Number, min: 0, default: 0 },
  active: { type: Boolean, default: true },
}, timestamps);
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ name: 'text', sku: 'text', category: 'text' });

// This is the current per-product/per-location balance. Move records remain the audit source.
const inventoryBalanceSchema = new Schema({
  product: { type: objectId, ref: 'Product', required: true },
  location: { type: objectId, ref: 'Location', required: true },
  onHand: { type: Number, required: true, min: 0, default: 0 },
  reserved: { type: Number, required: true, min: 0, default: 0, validate: { validator(v) { return v <= this.onHand; }, message: 'Reserved quantity cannot exceed on-hand quantity' } },
}, timestamps);
inventoryBalanceSchema.index({ product: 1, location: 1 }, { unique: true });
inventoryBalanceSchema.index({ location: 1, product: 1 });

const lineSchema = new Schema({
  product: { type: objectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, validate: { validator: positive, message: 'Quantity must be greater than zero' } },
}, { _id: false });

const operationStatuses = ['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'];
const operationFields = {
  reference: { type: String, required: true, immutable: true },
  warehouse: { type: objectId, ref: 'Warehouse', required: true },
  contact: { type: String, required: true, trim: true, maxlength: 160, validate: nonBlank },
  scheduleDate: { type: Date, required: true },
  responsible: { type: objectId, ref: 'User', required: true },
  lines: { type: [lineSchema], required: true, validate: { validator: (v) => v.length > 0, message: 'At least one product line is required' } },
  status: { type: String, enum: operationStatuses, default: 'Draft', required: true },
  completedAt: { type: Date, default: null },
};

const receiptSchema = new Schema({
  ...operationFields,
  destinationLocation: { type: objectId, ref: 'Location', required: true },
}, timestamps);
receiptSchema.index({ reference: 1 }, { unique: true });
receiptSchema.index({ warehouse: 1, status: 1, scheduleDate: 1 });
receiptSchema.index({ contact: 1 });

const deliverySchema = new Schema({
  ...operationFields,
  sourceLocation: { type: objectId, ref: 'Location', required: true },
  deliveryAddress: { type: String, required: true, trim: true, maxlength: 500, validate: nonBlank },
}, timestamps);
deliverySchema.index({ reference: 1 }, { unique: true });
deliverySchema.index({ warehouse: 1, status: 1, scheduleDate: 1 });
deliverySchema.index({ contact: 1 });

const transferSchema = new Schema({
  reference: { type: String, required: true, immutable: true, unique: true },
  sourceLocation: { type: objectId, ref: 'Location', required: true },
  destinationLocation: { type: objectId, ref: 'Location', required: true },
  lines: { type: [lineSchema], required: true, validate: { validator: (v) => v.length > 0, message: 'At least one product line is required' } },
  responsible: { type: objectId, ref: 'User', required: true },
  status: { type: String, enum: ['Draft', 'Done', 'Canceled'], default: 'Draft', required: true },
  completedAt: { type: Date, default: null },
}, timestamps);
transferSchema.index({ sourceLocation: 1, destinationLocation: 1, createdAt: -1 });
transferSchema.pre('validate', function validateLocations(next) {
  if (this.sourceLocation?.equals(this.destinationLocation)) this.invalidate('destinationLocation', 'Source and destination must differ');
  next();
});

const adjustmentSchema = new Schema({
  reference: { type: String, required: true, immutable: true, unique: true },
  product: { type: objectId, ref: 'Product', required: true },
  location: { type: objectId, ref: 'Location', required: true },
  recordedQuantity: { type: Number, required: true, min: 0 },
  countedQuantity: { type: Number, required: true, min: 0 },
  delta: { type: Number, required: true },
  responsible: { type: objectId, ref: 'User', required: true },
  status: { type: String, enum: ['Draft', 'Done', 'Canceled'], default: 'Draft', required: true },
  completedAt: { type: Date, default: null },
}, timestamps);
adjustmentSchema.index({ location: 1, status: 1, createdAt: -1 });

const counterSchema = new Schema({
  key: { type: String, required: true }, // e.g. WH:IN or WH:OUT
  sequence: { type: Number, required: true, min: 0, default: 0 },
}, { versionKey: false });
counterSchema.index({ key: 1 }, { unique: true });

const moveSchema = new Schema({
  reference: { type: String, required: true, index: true },
  sourceType: { type: String, enum: ['Receipt', 'Delivery', 'Transfer', 'Adjustment'], required: true },
  sourceId: { type: objectId, required: true },
  product: { type: objectId, ref: 'Product', required: true },
  fromLocation: { type: objectId, ref: 'Location', default: null },
  toLocation: { type: objectId, ref: 'Location', default: null },
  quantity: { type: Number, required: true, validate: { validator: positive, message: 'Move quantity must be greater than zero' } },
  // Direction describes the movement relative to company-owned stock.
  direction: { type: String, enum: ['in', 'out', 'internal', 'adjustment'], required: true },
  occurredAt: { type: Date, required: true, default: Date.now },
}, { ...timestamps, collection: 'stockmoves' });
moveSchema.index({ sourceType: 1, sourceId: 1 });
moveSchema.index({ occurredAt: -1, product: 1 });
moveSchema.index({ fromLocation: 1, toLocation: 1, occurredAt: -1 });

export const User = model('User', userSchema);
export const Warehouse = model('Warehouse', warehouseSchema);
export const Location = model('Location', locationSchema);
export const Product = model('Product', productSchema);
export const InventoryBalance = model('InventoryBalance', inventoryBalanceSchema);
export const Receipt = model('Receipt', receiptSchema);
export const Delivery = model('Delivery', deliverySchema);
export const Transfer = model('Transfer', transferSchema);
export const Adjustment = model('Adjustment', adjustmentSchema);
export const Counter = model('Counter', counterSchema);
export const StockMove = model('StockMove', moveSchema);

export const models = { User, Warehouse, Location, Product, InventoryBalance, Receipt, Delivery, Transfer, Adjustment, Counter, StockMove };
