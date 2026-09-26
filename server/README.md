# StockSense database layer

MongoDB/Mongoose persistence only. This package defines validated collections and database utilities; it does not implement HTTP routes, authentication flows, or inventory workflow endpoints.

## Configure MongoDB Atlas

1. Create a MongoDB Atlas database user and allow the app's network address in Atlas Network Access.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to the Atlas connection string. Keep credentials out of Git.
3. Optionally set `MONGODB_DB_NAME`; otherwise Mongoose uses the database in the URI.
4. Install dependencies with `npm install`, then run `npm run db:check`.

For local development, set `MONGODB_URI=mongodb://127.0.0.1:27017/stocksense`. Inventory transactions require a replica set. Use Atlas or start local MongoDB as a single-node replica set; a standalone local `mongod` can connect but cannot commit multi-document inventory transactions.

## Collections

- `users`: unique login ID and normalized unique email; only password hashes are stored.
- `warehouses`, `locations`: warehouse codes and per-warehouse location codes are unique.
- `products`: unique SKU, category, unit, cost, and reorder thresholds.
- `inventorybalances`: unique product/location pair, nonnegative on-hand and reserved values. Free to use is derived as `onHand - reserved`.
- `receipts`, `deliveries`: required operational details, line validation, status enum, responsible user, and unique generated reference.
- `transfers`, `adjustments`: location-to-location movement and physical count reconciliation records.
- `stockmoves`: append-only movement history, one row per product line, with source document, reference, from/to locations, quantity, direction, and time.
- `counters`: atomic per-warehouse/operation reference sequence (`WH/IN/0001`, `WH/OUT/0001`).

## Inventory write contract

When workflow/API code is added, perform a receipt/delivery/transfer/adjustment in `inInventoryTransaction()` and pass its session to every read/write. In the same transaction: validate document status and locations, mutate the applicable `InventoryBalance` records, create the `StockMove` ledger rows, and mark the operation complete. For deliveries and transfers, use conditional balance updates that require `onHand >= requestedQuantity`; fail the transaction when a balance does not match. Never write balance changes from a UI-only stock field. Allocate references with `nextOperationReference()`; its atomic counter may leave gaps if the parent operation later fails, which preserves uniqueness without serializing all operations in a transaction.

MongoDB transactions are supported by Atlas clusters. Keep Mongoose automatic index creation enabled during development. In production, apply the declared indexes as a deployment step before serving traffic (`autoIndex` is disabled there).

## Notes on intended model semantics

- Receipt references use `IN`; delivery references use `OUT`. Transfer and adjustment use `INT` and `ADJ` counters.
- A transfer references two actual locations, so company-wide quantity stays the same. A receipt has no company-owned source location; a delivery has no company-owned destination location.
- Initial stock should be introduced through an opening adjustment/move record, not by writing a balance without history.
- Reference uniqueness is enforced across operation collections individually. The counter key ensures unique generation per warehouse and operation type.
- There are no credentials or demo business records checked into this package.
