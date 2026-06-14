# مستندات فنی — SuperMarket POS

---

## معماری سیستم

```
┌─────────────────────────────────────────────────────────┐
│                     Electron Main                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Database  │  │   IPC    │  │    Repositories       │  │
│  │ (SQLite)  │  │ Handlers │  │ (products, sales,     │  │
│  │  WAL mode │  │          │  │  auth, suspend,        │  │
│  │           │  │          │  │  customers, expenses)  │  │
│  └──────────┘  └────┬─────┘  └──────────────────────┘  │
│  ┌────┴────────────────────────────────────────────┐    │
│  │        contextBridge (Preload / Secure Bridge)   │    │
│  └────┬────────────────────────────────────────────┘    │
└───────┼─────────────────────────────────────────────────┘
┌───────┴─────────────────────────────────────────────────┐
│               Renderer (React + Vite + Zustand)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Views    │  │Components│  │     Zustand Stores    │  │
│  │ (12 views)│  │(10 comps)│  │  auth/cart/suspend/   │  │
│  │           │  │          │  │  settings             │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### لایه‌ها

| لایه | مسیر | تکنولوژی | وظیفه |
|-------|------|-----------|-------|
| Main | src/main/ | Node.js + TypeScript | SQLite، IPC، یکپارچگی OS |
| Preload | src/preload/ | contextBridge | سطح امن API |
| Renderer | src/renderer/ | React + Zustand + Tailwind | UI، state، تعامل |

### سیستم i18n
- src/renderer/src/i18n/fa.ts — ۱۵۰+ رشته فارسی
- src/renderer/src/i18n/en.ts — ترجمه کامل انگلیسی
- src/renderer/src/i18n/index.ts — Proxy ری‌اکتیو

### سیستم تم
- CSS Variables در index.css
- کلاس dark/light روی html
- ذخیره در settings.theme

### تقویم شمسی
- src/renderer/src/utils/jalali.ts — مبدل Gregorian ↔ Jalali
- ShamsiDateInput — ورودی تاریخ با تقویم بصری (سال/ماه/روز)
- تمام تاریخ‌ها به صورت شمسی نمایش داده می‌شوند

### پشتیبان‌گیری
- ذخیره: export تمام جداول دیتابیس به JSON
- بازیابی: import فایل JSON و جایگزینی تمام جداول
- Dialog انتخاب فایل از طریق Electron

---

## دیتابیس

```
users (id, name, pin_code[SHA-256], role, isActive, createdAt)
products (id, barcode, title, category, unit, purchase_price, sale_price, stock, minStock, isLoose, isActive)
customers (id, name, phone, balance, isActive, createdAt)
sales (id, invoiceNumber, userId, customerId, subtotal, total_amount, totalNetProfit, paymentMethod, customerPaid, changeAmount, createdAt)
sale_items (id, saleId, productId, productTitle, quantity, unitPrice, purchasePrice, subtotal, netProfit)
customer_ledger (id, customerId, saleId, type, amount, description, createdAt)
expenses (id, category, description, amount, date, createdAt)
suspended_invoices (id, userId, slotIndex, items_json, createdAt)
cash_register (id, date, openingBalance, totalCashIn, totalCashOut, closingBalance, isClosed, closedAt, closedBy)
settings (key, value)
```

---

## IPC Channels

### Auth
| Channel | Input | Output |
|---------|-------|--------|
| auth:login | { pinCode } | User \| undefined |
| auth:listUsers | — | User[] |
| auth:createUser | { name, pinCode, role } | User |

### Products
| Channel | Input | Output |
|---------|-------|--------|
| products:getAll | — | Product[] |
| products:getByBarcode | { barcode } | Product \| undefined |
| products:search | { query } | Product[] |
| products:loose | — | Product[] |
| products:lowStock | — | Product[] |

### Sales
| Channel | Input | Output |
|---------|-------|--------|
| sales:create | SaleInput | Sale |
| sales:getByDateRange | { startDate, endDate } | Sale[] |
| sales:userPerformance | { startDate?, endDate? } | UserPerformance[] |

### Customers
| Channel | Input | Output |
|---------|-------|--------|
| customers:getAll | — | Customer[] |
| customers:charge | { customerId, amount } | boolean |
| customers:pay | { customerId, amount } | boolean |
| customers:ledger | { customerId } | CustomerLedgerEntry[] |

### Backup
| Channel | Input | Output |
|---------|-------|--------|
| backup:export | — | file path |
| backup:import | — | boolean |

---

## فایل‌ها

```
src/
├── main/
│   ├── index.ts
│   ├── database/
│   │   ├── connection.ts
│   │   └── repositories/ (auth, products, sales, customers, expenses, suspend, cashRegister, settings)
│   ├── ipc/handlers.ts
│   └── utils/math.ts
├── preload/index.ts
└── renderer/src/
    ├── i18n/ (fa.ts, en.ts, index.ts)
    ├── utils/jalali.ts
    ├── store/ (authStore, cartStore, suspendStore, settingsStore)
    ├── components/ (PinPad, CartTable, PaymentPanel, BarcodeInput, WebcamScanner, ReceiptPrinter, ShamsiDateInput, SuspendedSlots, LooseItemsGrid, PopularItems, Notification, TitleBar, Icons)
    └── views/ (LockScreen, CashierPOS, Dashboard, SalesHistory, AddProduct, Inventory, Accounting, AdminPanel, CustomerManagement, ExpenseManagement, UISettings, SetupWizard, Help)
```

---

# Technical Documentation — SuperMarket POS

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Electron Main                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ Database  │  │   IPC    │  │    Repositories       │  │
│  │ (SQLite)  │  │ Handlers │  │ (products, sales,     │  │
│  │  WAL mode │  │          │  │  auth, suspend,        │  │
│  │           │  │          │  │  customers, expenses)  │  │
│  └──────────┘  └────┬─────┘  └──────────────────────┘  │
│  ┌────┴────────────────────────────────────────────┐    │
│  │        contextBridge (Preload / Secure Bridge)   │    │
│  └────┬────────────────────────────────────────────┘    │
└───────┼─────────────────────────────────────────────────┘
┌───────┴─────────────────────────────────────────────────┐
│               Renderer (React + Vite + Zustand)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │  Views    │  │Components│  │     Zustand Stores    │  │
│  │ (12 views)│  │(10 comps)│  │  auth/cart/suspend/   │  │
│  │           │  │          │  │  settings             │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Layers

| Layer | Path | Tech | Responsibility |
|-------|------|------|----------------|
| Main | src/main/ | Node.js + TypeScript | SQLite, IPC, OS integration |
| Preload | src/preload/ | contextBridge | Secure API surface |
| Renderer | src/renderer/ | React + Zustand + Tailwind | UI, state, interaction |

### i18n System
- src/renderer/src/i18n/fa.ts — 150+ Farsi strings
- src/renderer/src/i18n/en.ts — Full English translations
- src/renderer/src/i18n/index.ts — Reactive Proxy

### Theme System
- CSS Variables in index.css
- dark/light class on html
- Saved to settings.theme

### Shamsi Calendar
- src/renderer/src/utils/jalali.ts — Gregorian ↔ Jalali converter
- ShamsiDateInput — Visual calendar picker (year/month/day)
- All dates displayed in Iranian calendar

### Backup & Restore
- Export: dump all database tables to JSON
- Import: read JSON file and replace all tables
- File dialog via Electron dialog API

---

## Database

```sql
users (id, name, pin_code[SHA-256], role, isActive, createdAt)
products (id, barcode, title, category, unit, purchase_price, sale_price, stock, minStock, isLoose, isActive)
customers (id, name, phone, balance, isActive, createdAt)
sales (id, invoiceNumber, userId, customerId, subtotal, total_amount, totalNetProfit, paymentMethod, customerPaid, changeAmount, createdAt)
sale_items (id, saleId, productId, productTitle, quantity, unitPrice, purchasePrice, subtotal, netProfit)
customer_ledger (id, customerId, saleId, type, amount, description, createdAt)
expenses (id, category, description, amount, date, createdAt)
suspended_invoices (id, userId, slotIndex, items_json, createdAt)
cash_register (id, date, openingBalance, totalCashIn, totalCashOut, closingBalance, isClosed, closedAt, closedBy)
settings (key, value)
```

---

## IPC Channels

### Auth
| Channel | Input | Output |
|---------|-------|--------|
| auth:login | { pinCode } | User \| undefined |
| auth:listUsers | — | User[] |
| auth:createUser | { name, pinCode, role } | User |

### Products
| Channel | Input | Output |
|---------|-------|--------|
| products:getAll | — | Product[] |
| products:getByBarcode | { barcode } | Product \| undefined |
| products:search | { query } | Product[] |
| products:loose | — | Product[] |
| products:lowStock | — | Product[] |

### Sales
| Channel | Input | Output |
|---------|-------|--------|
| sales:create | SaleInput | Sale |
| sales:getByDateRange | { startDate, endDate } | Sale[] |
| sales:userPerformance | { startDate?, endDate? } | UserPerformance[] |

### Customers
| Channel | Input | Output |
|---------|-------|--------|
| customers:getAll | — | Customer[] |
| customers:charge | { customerId, amount } | boolean |
| customers:pay | { customerId, amount } | boolean |
| customers:ledger | { customerId } | CustomerLedgerEntry[] |

### Backup
| Channel | Input | Output |
|---------|-------|--------|
| backup:export | — | file path |
| backup:import | — | boolean |

---

## File Structure

```
src/
├── main/
│   ├── index.ts
│   ├── database/
│   │   ├── connection.ts
│   │   └── repositories/ (auth, products, sales, customers, expenses, suspend, cashRegister, settings)
│   ├── ipc/handlers.ts
│   └── utils/math.ts
├── preload/index.ts
└── renderer/src/
    ├── i18n/ (fa.ts, en.ts, index.ts)
    ├── utils/jalali.ts
    ├── store/ (authStore, cartStore, suspendStore, settingsStore)
    ├── components/ (PinPad, CartTable, PaymentPanel, BarcodeInput, WebcamScanner, ReceiptPrinter, ShamsiDateInput, SuspendedSlots, LooseItemsGrid, PopularItems, Notification, TitleBar, Icons)
    └── views/ (LockScreen, CashierPOS, Dashboard, SalesHistory, AddProduct, Inventory, Accounting, AdminPanel, CustomerManagement, ExpenseManagement, UISettings, SetupWizard, Help)
```
