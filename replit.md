# StockSense

StockSense is a React/Vite frontend for the inventory workflows described in `StockSense_Frontend_Spec.md`.

## Run locally or in Replit

```bash
npm install
npm run dev
```

The Vite server listens on port 5000 and allows proxied Replit hosts. The configured Replit workflow is `Start application`.

## Current frontend behavior

- All specified authentication, dashboard, product, stock, operations, history, warehouse, location, and profile routes are available.
- Demo data and frontend changes persist in browser `localStorage`.
- Receipt, delivery, transfer, and adjustment actions update the local stock model and Move History ledger.
- Demo sign-in: `manager01` / `Stocksense@2026`.

This is a frontend-only import; no backend API or database is present in the repository yet.