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
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  const productCount = (db.prepare('SELECT COUNT(*) as c FROM products WHERE isActive = 1').get() as { c: number }).c
  return userCount <= 1 && productCount === 0
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
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
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
}
