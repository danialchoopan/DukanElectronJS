# HesabDari Danial — Technical Documentation

> **[فارسی](TECHNICAL.md) | English**

## System Architecture

### Layers
```
┌─────────────────────────────────┐
│  React UI (Renderer Process)    │
│  └── Views / Components         │
│  └── Zustand Stores             │
│  └── IPC API (preload bridge)   │
├─────────────────────────────────┤
│  Electron Main Process          │
│  └── IPC Handlers               │
│  └── Repositories               │
│  └── Database (SQLite)          │
├─────────────────────────────────┤
│  SQLite (better-sqlite3)        │
│  └── 22+ Tables                 │
│  └── WAL Mode                   │
│  └── Foreign Keys               │
└─────────────────────────────────┘
```

### Database Location

| OS | Path |
|----|------|
| Windows | `%APPDATA%/hesabdari-danial/pos.db` |
| macOS | `~/Library/Application Support/hesabdari-danial/pos.db` |
| Linux | `~/.config/hesabdari-danial/pos.db` |

### Tables

| Table | Description |
|-------|-------------|
| `users` | System users (admin/cashier/manager/accountant/salesperson/warehouse/viewer) |
| `products` | Products with barcode, prices, stock, category/subcategory, expiry, sellable flag |
| `customers` | Customers with ledger (real/legal), blocked status |
| `suppliers` | Suppliers with ledger |
| `sales` + `sale_items` | Sale invoices with custom date, sale type, inventory toggle |
| `purchases` + `purchase_items` | Purchase invoices |
| `customer_ledger` + `supplier_ledger` | Balance transaction logs |
| `categories` | Hierarchical categories (2 levels, self-referencing) |
| `accounts` | Chart of accounts (hierarchical, self-referencing) |
| `journal_entries` + `journal_entry_lines` | Double-entry accounting |
| `fiscal_periods` | Accounting periods |
| `expenses` | Expense records |
| `returns` | Product returns |
| `settings` | Key-value configuration |
| `audit_log` | Activity audit trail |
| `cash_register` | Daily cash register |
| `price_history` | Price change tracking |
| `inventory_adjustments` | Stock correction audit trail |
| `cross_sell_rules` + `cross_sell_rule_items` | Mandatory/optional product rules |
| `installments` + `installment_payments` | Payment plans |
| `proformas` + `proforma_items` | Pre-invoices |
| `service_tickets` + `service_parts` + `service_history` | Warranty & repair |
| `customer_credit` + `credit_history` | Credit management |
| `restore_points` | Point-in-time snapshots |

### Auto-Migration

Runs on every startup via `migrateSchema()` + `runMigrations()`:

1. `migrateSchema()` — adds missing columns via `ALTER TABLE ADD COLUMN`
2. `runMigrations()` — versioned migrations (v1.0→v1.5) with history table
3. Pre-migration backup created automatically
4. Post-migration validation (integrity + FK + table checks)

### Accounting Auto-Sync

| Event | Journal Entry |
|-------|-------------|
| Cash sale | Dr. Cash (1100), Cr. Sales (4100) |
| Credit sale | Dr. AR (1400), Cr. Sales (4100) |
| Purchase | Dr. Inventory (1300), Cr. AP (2110) |
| Payment | Dr. AP (2110), Cr. Cash/Bank (1100/1200) |
| Return | Reversal of original entry |
| Expense | Dr. Expense (6100-6700), Cr. Cash (1100) |

### Backup System

| Feature | Description |
|---------|-------------|
| SQLite export | Direct .db copy with WAL checkpoint |
| JSON export | All/Structure/Selective with version metadata |
| Restore | Pre-restore backup + connection close + file copy |
| Integrity | SHA-256 hash verification |
| Auto-cleanup | Configurable retention (toggle on/off) |
| Restore Points | Named snapshots with verification |

### Key Repositories

| File | Purpose |
|------|---------|
| `products.ts` | CRUD, stock ops, expiry, sellable |
| `sales.ts` | Atomic sale creation (items + stock + journal + ledger) |
| `purchases.ts` | Purchase creation with tax/discount |
| `customers.ts` | CRUD, ledger, balance, credit |
| `journal.ts` | Double-entry journal with validation |
| `reports.ts` | P&L, Balance Sheet, AR Aging, Cash Flow |
| `backup.ts` | Backup/restore/verify/export |
| `crossSellRules.ts` | Rule engine evaluation |
| `installments.ts` | Payment plan management |
| `proformas.ts` | Pre-invoice with conversion |
| `serviceTickets.ts` | Repair workflow (6 states) |
| `customerCredit.ts` | Credit limits, scoring, blocking |
| `schemaMigration.ts` | Versioned migration scripts |

### Coding Conventions

| Topic | Convention |
|-------|-----------|
| Documentation | JSDoc on all files and exported functions |
| Naming | PascalCase components, camelCase functions/variables |
| Types | TypeScript strict mode |
| Tests | 72 automated checks via verify.js |
| Dates | All Jalali via jalali.ts utilities |
| Currency | Comma-separated: `10,000,000` |
| Dialogs | No `confirm()` in renderer — use Dialog component |
| Migrations | `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE` via migrateSchema() |

## See Also

- [README](README-en.md) — Project overview
- [Setup Guide](SETUP-en.md) — Installation
- [Developer Guide](docs/developer-en.html) — How to extend
- [Database Schema](docs/doc-schema.html) — Full schema reference
- [API Reference](docs/doc-api.html) — IPC handlers
