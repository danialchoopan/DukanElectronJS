# HesabDari Danial — حسابداری دانیال

**Comprehensive Accounting, Inventory & Sales Management for Modern Businesses**

**Smart Accounting, Professional Sales**

> **English | [فارسی](README.md)**

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/danialchoopan/DukanElectronJS)
[![License](https://img.shields.io/badge/license-MIT-green)](#)
[![Electron](https://img.shields.io/badge/Electron-33-purple)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-18-cyan)](https://reactjs.org)

---

## Quick Links

| [![](https://img.shields.io/badge/🚀_Setup_Guide-Get_Started-blue)](SETUP-en.md) | [![](https://img.shields.io/badge/📚_Technical_Docs-Deep_Dive-green)](TECHNICAL-en.md) | [![](https://img.shields.io/badge/📋_Implementation_Plan-Roadmap-orange)](IMPLEMENTATION_PLAN.md) |
|---|---|---|

---

## Why HesabDari Danial?

| Feature | Description |
|---------|-------------|
| **Full Integration** | Double-entry accounting, inventory, invoicing, customers — all in one app |
| **Auto Sync** | Every sale, purchase, or payment automatically posts to the general ledger |
| **High Security** | AES-256 encryption, digital signatures, automatic backups |
| **Modern UI** | Beautiful interface with dark/light mode support |
| **Shamsi Calendar** | All dates displayed in Jalali/Shamsi calendar |
| **Sale Types** | In-person (counter) and online sales with filtering and reports |
| **Price History** | Track purchase and sale price changes over time |
| **Version Migration** | Automatic data migration between app versions |
| **Multi-language** | Farsi and English with full RTL support |

---

## Complete Feature List

### Accounting
- Hierarchical Chart of Accounts
- Double-entry Journal Entries
- Trial Balance
- Income Statement (Profit & Loss)
- Balance Sheet
- Cash Flow Statement
- AR Aging Report (customer receivables)
- Fiscal Period Management
- Automatic posting of sales/purchases to general ledger
- Purchase and sale price history tracking
- Expense management with auto accounting entries
- Professional calculator with history and currency conversion (Ctrl+M)

### Inventory
- Product management with barcode and QR
- Camera scanner for barcode reading
- Barcode and QR label printing
- Inventory reports and warehouse value
- Slow-moving items tracking
- Inventory adjustments with auto audit trail
- Expiry date products with automatic alerts
- A4 printing and Excel export
- Audit log with full history

### Sales
- POS terminal with barcode scanner
- Electronic and printable invoices
- Sale types: In-person (counter) and online
- Cash, card, and credit (ledger) payments
- Backdated sales
- Product returns with loss/return distinction
- Zero-stock product sales (hidden from POS)
- Sales history with search and filter

### Customers & Suppliers
- Customer management with ledger (individual/corporate)
- Supplier management with ledger
- Debt and receivable tracking
- Payments with auto accounting posting
- Customer credit management and blocking
- Best customers and purchase pattern reports
- Category-level profit analysis

### Advanced Sales
- Cross-sell rules (mandatory / optional / suggested)
- Installment sales with payment tracking
- Proforma invoices with one-click conversion to invoice
- Warranty & repair service ticketing
- 6 advanced sales reports:
  - Best selling products
  - Hourly sales heatmap
  - Period comparison
  - Top customers
  - Category profit margins
  - Customer purchase patterns

### Security & Backup
- AES-256 encryption
- Digital file signatures
- Auto backup with cleanup
- USB backup with auto detection
- Restore points with integrity verification (SHA-256)
- Automatic database migration on version upgrade
- Comprehensive audit log with search and filter
- Role-Based Access Control (RBAC — 35 permissions)

### Customization & UI
- Navigation menu customization (reorder, show/hide, reset)
- Dark and light themes with 6 color options
- Adjustable text size (5 levels + manual)
- High contrast mode for accessibility
- Vazirmatn Persian font
- Camera scanner for barcodes and QR
- Floating calculator (Ctrl+M) and full-page mode

### Smart Export/Import
- Selective data export/import
- Automatic dependency detection
- Preview before import
- Integrity validation
- SQLite (.db) / JSON (.json) formats

### Documentation & Reports
- Income Statement with period comparison
- Balance Sheet and Cash Flow
- AR Aging Report
- Invoice, barcode label, and QR printing
- Excel export from all reports

---

## Ideal For

| Business Type | Key Capabilities |
|---------------|-----------------|
| Online store | Order management, shipping, e-tax |
| Supermarket | Barcode reader, inventory, POS |
| Clothing store | Size/color management, seasonal, accurate accounting |
| Electronics | Warranty, serial numbers, dynamic pricing |
| Bookstore | Publishers, editions, online + in-store sales |
| Cosmetics | Expiry dates, multiple product lines |
| Grocery | Expiry dates, waste management, weight/count |
| Industrial | Tools, parts, project-based |
| Services | Service invoicing, projects, time tracking |
| Wholesale | Bulk pricing, VIP customers, credit |
| Restaurant/Cafe | Menu, orders, ingredients |
| Jewelry | Live gold pricing, labor, special taxes |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript 5 + Tailwind CSS |
| **Backend** | Electron 33 + Node.js |
| **Database** | SQLite (better-sqlite3) |
| **State** | Zustand 5 |
| **Build** | Vite 6 |
| **Calendar** | jalaali-js (Shamsi/Jalali) |
| **Font** | Vazirmatn (local woff2) |

---

## Quick Install

```bash
git clone https://github.com/danialchoopan/DukanElectronJS.git
cd DukanElectronJS
npm install
npm run dev
```

> **Full setup guide:** [SETUP-en.md](SETUP-en.md) | [SETUP.md](SETUP.md)

---

## Documentation

| File | Language | Description |
|------|----------|-------------|
| **[README.md](README.md)** | فارسی | Project overview & features |
| **[README-en.md](README-en.md)** | English | Project overview & features |
| **[SETUP.md](SETUP.md)** | فارسی | Installation guide |
| **[SETUP-en.md](SETUP-en.md)** | English | Installation guide |
| **[TECHNICAL.md](TECHNICAL.md)** | فارسی | Technical documentation |
| **[TECHNICAL-en.md](TECHNICAL-en.md)** | English | Technical documentation |
| **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** | English | Feature implementation plan |
| [docs/index.html](docs/index.html) | فارسی | Full technical reference |
| [docs/developer-fa.html](docs/developer-fa.html) | فارسی | Developer guide |
| [docs/developer-en.html](docs/developer-en.html) | English | Developer guide |
| [docs/doc-features.html](docs/doc-features.html) | English | Features reference |
| [docs/doc-schema.html](docs/doc-schema.html) | English | Database schema |
| [docs/doc-api.html](docs/doc-api.html) | English | API reference |
| [docs/doc-accounting.html](docs/doc-accounting.html) | English | Accounting system |
| [docs/doc-backup.html](docs/doc-backup.html) | English | Backup & migration |
| [docs/doc-ui.html](docs/doc-ui.html) | English | UI components |

---

## License

MIT License — free for all uses.

---

<div align="center">

**Danial, Partner for Today's Businesses**

</div>
