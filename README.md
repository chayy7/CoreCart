# CoreCart

CoreCart is an omni-retail POS and inventory platform for small and medium stores.
It unifies billing, stock management, and multi-channel inventory sync in one system.

## What Is Complete

### Backend
- JWT auth + role-based access (`admin`, `manager`, `cashier`)
- Product catalog APIs
- Inventory APIs (read, adjust, transfer)
- POS checkout API
- Refund API with stock restoration
- Dashboard analytics API
- Real-time inventory events with Socket.IO

### Database + Consistency
- MongoDB schema models with indexes
- Standalone-safe inventory and checkout flow (no Docker, no replica set required)
- Optional transaction mode for replica-set environments (`ENABLE_TRANSACTIONS=true`)

### Cache
- Redis cache when available
- Automatic in-memory cache fallback when Redis is not running

### Frontend
- Login
- POS billing UI (cart, discounts, payment)
- Product catalog page
- Inventory page with low-stock alerts + adjustments
- Orders page with refund action
- Dashboard page with KPIs + top sellers
- Offline order queue with auto-sync on reconnect

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- Cache: Redis (optional in local), memory fallback
- Real-time: Socket.IO

## Local Setup (No Docker)

1. Install and run MongoDB locally on `127.0.0.1:27017`.

2. Copy environment files:
```bash
copy apps\\api\\.env.example apps\\api\\.env
copy apps\\web\\.env.example apps\\web\\.env
```

3. Install dependencies:
```bash
npm install
```

4. Seed demo data:
```bash
npm run seed
```

5. Start frontend + backend:
```bash
npm run dev
```

6. Verify API health:
```bash
Invoke-RestMethod -Uri "http://localhost:4000/health"
```

## Demo Accounts
- Admin: `admin@corecart.dev` / `Admin@123`
- Manager: `manager@corecart.dev` / `Manager@123`
- Cashier: `cashier@corecart.dev` / `Cashier@123`

## Key API Endpoints
- `POST /api/auth/login`
- `GET /api/stores`
- `GET /api/products`
- `POST /api/products`
- `GET /api/inventory?storeId=...`
- `PATCH /api/inventory/adjust`
- `POST /api/inventory/transfer`
- `POST /api/orders/checkout`
- `GET /api/orders?storeId=...`
- `POST /api/orders/:id/refund`
- `GET /api/dashboard/overview?storeId=...`

## Scripts
```bash
npm run dev
npm run build
npm run test
npm run seed
```

## Notes
- For standalone local MongoDB, keep `ENABLE_TRANSACTIONS=false`.
- For replica-set MongoDB (cloud/prod), set `ENABLE_TRANSACTIONS=true`.
- Redis is optional in local development.
