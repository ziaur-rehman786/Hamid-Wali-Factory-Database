# Hamid Wali Shoe Factory — Inventory & Billing System

A complete professional desktop/web-based inventory and billing system for **Hamid Wali Shoe Factory**.

## Features

- **Billing / Invoice System** — Multi-item invoices, auto calculations, PDF download & print
- **Inventory / Stock** — Track by design, color, size; automatic stock deduction on sale
- **Khata System** — Customer credit, payments, remaining balance
- **Roznamcha** — Daily ledger (income, expense, balance)
- **Employee Salary** — Monthly payroll with advance recovery (paid extra) and balance owed (paid less), carried to future months
- **Profit & Loss** — Internal admin-only tracking
- **Reports** — Daily/monthly sales, stock, customer balances, best sellers
- **Master Data** — Dynamic designs, colors, sizes
- **Roles** — Admin (full access) & Staff (no profit/loss view)
- **Dark Mode**, backup/restore, Excel export, responsive UI

## Tech Stack

| Layer    | Technology        |
|----------|-------------------|
| Frontend | React + Tailwind  |
| Backend  | Node.js + Express |
| Database | PostgreSQL        |
| PDF      | jsPDF             |

## Database Credentials

When opening the database in pgAdmin or any SQL client:

| Field     | Value                  |
|-----------|------------------------|
| Host      | `localhost`            |
| Port      | `5432`                 |
| Database  | `hamid_wali_factory`   |
| Username  | `hw_factory_admin`     |
| Password  | `HWFactory@2026Secure` |

See [DATABASE_CREDENTIALS.md](./DATABASE_CREDENTIALS.md) for detailed connection steps.

## App Login (Software)

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | `admin`  | `admin123`|
| Staff | `staff`  | `staff123`|

## Prerequisites

1. **Node.js** 18+ — [nodejs.org](https://nodejs.org)
2. **PostgreSQL** 14+ — [postgresql.org](https://www.postgresql.org/download/)

During PostgreSQL installation, remember your `postgres` superuser password.

## Installation (Local)

### Step 1: Install dependencies

```bash
cd "Factory Database"
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Step 2: Configure environment

Copy `backend/.env.example` to `backend/.env` (already included with defaults).

If your PostgreSQL `postgres` password is not `postgres`, set in `backend/.env`:

```
POSTGRES_ADMIN_PASSWORD=your_postgres_password
```

### Step 3: Create database & tables

```bash
cd backend
npm run db:setup
```

### Step 4: Seed sample data (17,080 pairs stock, 18 designs, etc.)

```bash
npm run db:seed
```

### Step 5: Run the application

From project root:

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## Project Structure

```
Factory Database/
├── backend/
│   ├── database/schema.sql      # PostgreSQL tables
│   ├── src/
│   │   ├── config/              # Database connection
│   │   ├── controllers/         # Business logic
│   │   ├── middleware/          # Auth, roles
│   │   ├── routes/                # API routes
│   │   └── database/            # Setup & seed scripts
│   └── .env                       # Configuration
├── frontend/
│   └── src/
│       ├── pages/                 # All screens
│       ├── components/            # UI components
│       ├── context/               # Auth & theme
│       └── services/              # API calls
├── DATABASE_CREDENTIALS.md
└── README.md
```

## Business Logic

| Action              | Behavior                                      |
|---------------------|-----------------------------------------------|
| Create invoice      | Stock decreases automatically                 |
| Delete invoice      | Stock restores (admin only)                   |
| Unpaid amount       | Added to customer Khata balance               |
| Customer payment    | Reduces Khata balance                         |
| Customer invoice    | Hides cost price, profit, loss                |
| Staff role          | Cannot see profit/loss or cost prices         |

## Deploying to Hostinger

1. Create a PostgreSQL database on Hostinger
2. Update `backend/.env` with production DB credentials
3. Run `npm run db:setup` and `npm run db:seed` on the server
4. Build frontend: `cd frontend && npm run build`
5. Start backend: `cd backend && npm start`
6. Point your domain to the Node.js app (port 5000 or use PM2 + reverse proxy)

Change `JWT_SECRET` and database password before going live.

## Backup & Restore

Requires PostgreSQL tools (`pg_dump`, `psql`) in system PATH.

Use **Backup** page in admin panel, or manually:

```bash
pg_dump -h localhost -U hw_factory_admin -d hamid_wali_factory > backup.sql
```

## API Health Check

```
GET http://localhost:5000/api/health
```

## Support

Built for Hamid Wali Shoe Factory — Peshawar, Pakistan.
