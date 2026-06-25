import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { createHash } from 'crypto'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = join(app.getPath('userData'), 'pos.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('busy_timeout = 5000')
    initializeDatabase(db)
  }
  return db
}

export function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

export function isFirstRun(): boolean {
  const db = getDatabase()
  const row = db.prepare("SELECT value FROM settings WHERE key = 'isSetupComplete'").get() as { value: string } | undefined
  return !row || row.value !== 'true'
}

function initializeDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin_code TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cashier' CHECK(role IN ('admin', 'cashier')),
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      imageBase64 TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      unit TEXT NOT NULL DEFAULT 'number' CHECK(unit IN ('number', 'weight')),
      purchase_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      minStock REAL NOT NULL DEFAULT 0,
      isLoose INTEGER NOT NULL DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
    CREATE INDEX IF NOT EXISTS idx_products_isLoose ON products(isLoose);

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      balance REAL NOT NULL DEFAULT 0,
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      customerType TEXT DEFAULT 'real',
      description TEXT DEFAULT '',
      imageBase64 TEXT DEFAULT '',
      totalSpent REAL DEFAULT 0,
      totalPurchases INTEGER DEFAULT 0,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT DEFAULT '',
      level INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      parent_id INTEGER DEFAULT NULL,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNumber TEXT UNIQUE NOT NULL,
      userId INTEGER NOT NULL,
      customerId INTEGER,
      subtotal REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      totalNetProfit REAL NOT NULL DEFAULT 0,
      paymentMethod TEXT NOT NULL DEFAULT 'cash' CHECK(paymentMethod IN ('cash', 'card', 'ledger')),
      customerPaid REAL NOT NULL DEFAULT 0,
      changeAmount REAL NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      invoiceDescription TEXT DEFAULT '',
      manualCustomerName TEXT DEFAULT '',
      saleType TEXT DEFAULT 'in-person',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (customerId) REFERENCES customers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sales_createdAt ON sales(createdAt);
    CREATE INDEX IF NOT EXISTS idx_sales_userId ON sales(userId);
    CREATE INDEX IF NOT EXISTS idx_sales_customerId ON sales(customerId);

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      productTitle TEXT NOT NULL,
      quantity REAL NOT NULL,
      unitPrice REAL NOT NULL,
      purchasePrice REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL,
      netProfit REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (saleId) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sale_items_saleId ON sale_items(saleId);

    CREATE TABLE IF NOT EXISTS customer_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      saleId INTEGER,
      type TEXT NOT NULL CHECK(type IN ('charge', 'payment', 'sale')),
      amount REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      images TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (customerId) REFERENCES customers(id),
      FOREIGN KEY (saleId) REFERENCES sales(id)
    );

    CREATE INDEX IF NOT EXISTS idx_ledger_customerId ON customer_ledger(customerId);

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      imageBase64 TEXT DEFAULT '',
      images TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

    CREATE TABLE IF NOT EXISTS suspended_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      slotIndex INTEGER NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_suspended_user_slot ON suspended_invoices(userId, slotIndex);

    CREATE TABLE IF NOT EXISTS cash_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      openingBalance REAL NOT NULL DEFAULT 0,
      totalCashIn REAL NOT NULL DEFAULT 0,
      totalCashOut REAL NOT NULL DEFAULT 0,
      closingBalance REAL DEFAULT 0,
      isClosed INTEGER NOT NULL DEFAULT 0,
      closedAt TEXT,
      closedBy INTEGER,
      FOREIGN KEY (closedBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      details TEXT,
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entityType, entityId);
    CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_log(createdAt);

    CREATE TABLE IF NOT EXISTS returns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      saleId INTEGER,
      userId INTEGER,
      productId INTEGER,
      quantity INTEGER,
      reason TEXT,
      refundAmount REAL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (saleId) REFERENCES sales(id),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (productId) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_returns_sale ON returns(saleId);
    CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

    CREATE TABLE IF NOT EXISTS fiscal_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      isClosed INTEGER NOT NULL DEFAULT 0,
      closedAt TEXT,
      closedBy INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (closedBy) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('asset', 'liability', 'equity', 'income', 'expense')),
      parentId INTEGER DEFAULT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      description TEXT DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (parentId) REFERENCES accounts(id)
    );
    CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
    CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryDate TEXT NOT NULL,
      description TEXT NOT NULL,
      referenceType TEXT,
      referenceId INTEGER,
      fiscalPeriodId INTEGER,
      isPosted INTEGER NOT NULL DEFAULT 1,
      createdBy INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (fiscalPeriodId) REFERENCES fiscal_periods(id),
      FOREIGN KEY (createdBy) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(entryDate);
    CREATE INDEX IF NOT EXISTS idx_journal_ref ON journal_entries(referenceType, referenceId);

    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entryId INTEGER NOT NULL,
      accountId INTEGER NOT NULL,
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      FOREIGN KEY (entryId) REFERENCES journal_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (accountId) REFERENCES accounts(id)
    );
    CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_entry_lines(entryId);
    CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_entry_lines(accountId);

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER NOT NULL,
      priceType TEXT NOT NULL CHECK(priceType IN ('sale', 'purchase')),
      oldPrice REAL NOT NULL DEFAULT 0,
      newPrice REAL NOT NULL,
      changedBy TEXT DEFAULT 'system',
      changedAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (productId) REFERENCES products(id)
    );
    CREATE INDEX IF NOT EXISTS idx_price_history_productId ON price_history(productId);

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      company TEXT DEFAULT '',
      taxId TEXT DEFAULT '',
      balance REAL NOT NULL DEFAULT 0,
      description TEXT DEFAULT '',
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
    CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers(phone);

    CREATE TABLE IF NOT EXISTS supplier_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplierId INTEGER NOT NULL,
      purchaseId INTEGER,
      type TEXT NOT NULL CHECK(type IN ('purchase', 'payment', 'return', 'debt', 'adjustment')),
      amount REAL NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (supplierId) REFERENCES suppliers(id)
    );
    CREATE INDEX IF NOT EXISTS idx_supplier_ledger_supplierId ON supplier_ledger(supplierId);

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceNumber TEXT UNIQUE NOT NULL,
      supplierId INTEGER NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      taxAmount REAL NOT NULL DEFAULT 0,
      discountAmount REAL NOT NULL DEFAULT 0,
      totalAmount REAL NOT NULL DEFAULT 0,
      paidAmount REAL NOT NULL DEFAULT 0,
      paymentMethod TEXT NOT NULL DEFAULT 'credit' CHECK(paymentMethod IN ('cash', 'credit', 'partial')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'received', 'invoiced', 'paid')),
      notes TEXT DEFAULT '',
      purchaseDate TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (supplierId) REFERENCES suppliers(id)
    );
    CREATE INDEX IF NOT EXISTS idx_purchases_supplierId ON purchases(supplierId);
    CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchaseDate);

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchaseId INTEGER NOT NULL,
      productId INTEGER NOT NULL,
      productTitle TEXT NOT NULL,
      quantity REAL NOT NULL,
      unitCost REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (purchaseId) REFERENCES purchases(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id)
    );
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchaseId ON purchase_items(purchaseId);
  `)

  const defaults: Record<string, string> = {
    storeName: 'فروشگاه من',
    storeAddress: '',
    storePhone: '',
    receiptFooter: 'با تشکر از خرید شما',
    currency: 'تومان',
    autoRounding: '500',
    isSetupComplete: 'false',
  }
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  for (const [k, v] of Object.entries(defaults)) {
    insert.run(k, v)
  }

  // Seed chart of accounts if empty
  const accountCount = (db.prepare('SELECT COUNT(*) as count FROM accounts').get() as { count: number }).count
  if (accountCount === 0) {
    const insertAccount = db.prepare('INSERT INTO accounts (code, name, type, parentId) VALUES (?, ?, ?, ?)')
    const accounts: [string, string, string, number | null][] = [
      ['1000', 'دارایی\u200cهای جاری', 'asset', null],
      ['1100', 'صندوق نقدی', 'asset', null],
      ['1200', 'بانک', 'asset', null],
      ['1300', 'موجودی کالا', 'asset', null],
      ['1400', 'حساب\u200cهای دریافتنی', 'asset', null],
      ['2000', 'بدهی\u200cهای جاری', 'liability', null],
      ['2100', 'حساب\u200cهای پرداختنی', 'liability', null],
      ['3000', 'سرمایه', 'equity', null],
      ['3100', 'سرمایه صاحب کسب\u200cوکار', 'equity', null],
      ['3200', 'سود انباشته', 'equity', null],
      ['4000', 'درآمدها', 'income', null],
      ['4100', 'فروش کالا', 'income', null],
      ['5000', 'بهای تمام شده کالا', 'expense', null],
      ['5100', 'بهای تمام شده فروش', 'expense', null],
      ['6000', 'هزینه\u200cهای عملیاتی', 'expense', null],
      ['6100', 'اجاره', 'expense', null],
      ['6200', 'قبوض', 'expense', null],
      ['6300', 'حقوق و دستمزد', 'expense', null],
      ['6400', 'لوازم و ملزومات', 'expense', null],
      ['6500', 'تعمیرات', 'expense', null],
      ['6600', 'حمل\u200cونقل', 'expense', null],
      ['6700', 'سایر هزینه\u200cها', 'expense', null],
    ]
    const seedAccounts = db.transaction(() => {
      const ids: Record<string, number> = {}
      for (const [code, name, type, _parent] of accounts) {
        const r = insertAccount.run(code, name, type, null)
        ids[code] = r.lastInsertRowid as number
      }
      const updateParent = db.prepare('UPDATE accounts SET parentId = ? WHERE id = ?')
      updateParent.run(ids['1000'], ids['1100'])
      updateParent.run(ids['1000'], ids['1200'])
      updateParent.run(ids['1000'], ids['1300'])
      updateParent.run(ids['1000'], ids['1400'])
      updateParent.run(ids['2000'], ids['2100'])
      updateParent.run(ids['3000'], ids['3100'])
      updateParent.run(ids['3000'], ids['3200'])
      updateParent.run(ids['4000'], ids['4100'])
      updateParent.run(ids['5000'], ids['5100'])
      updateParent.run(ids['6000'], ids['6100'])
      updateParent.run(ids['6000'], ids['6200'])
      updateParent.run(ids['6000'], ids['6300'])
      updateParent.run(ids['6000'], ids['6400'])
      updateParent.run(ids['6000'], ids['6500'])
      updateParent.run(ids['6000'], ids['6600'])
      updateParent.run(ids['6000'], ids['6700'])
    })
    seedAccounts()

    // Seed supplier accounts if missing
    const supplierAccountExists = db.prepare("SELECT COUNT(*) as c FROM accounts WHERE code = '2110'").get() as { c: number }
    if (supplierAccountExists.c === 0) {
      const insertAccount = db.prepare('INSERT INTO accounts (code, name, type, parentId) VALUES (?, ?, ?, ?)')
      const supplierAccounts: [string, string, string, number | null][] = [
        ['2110', 'حساب\u200cهای پرداختنی تأمین\u200cکنندگان', 'liability', null],
        ['5200', 'هزینه خرید کالا', 'expense', null],
        ['5300', 'تخفیف دریافتی خرید', 'income', null],
        ['1310', 'پیش\u200cپرداخت تأمین\u200cکنندگان', 'asset', null],
      ]
      for (const [code, name, type, pid] of supplierAccounts) {
        insertAccount.run(code, name, type, pid)
      }
    }
  }
}
