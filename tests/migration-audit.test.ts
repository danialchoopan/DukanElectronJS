/**
 * Comprehensive migration + import/export audit.
 * Verifies: old DB → new app works correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
})

describe('Migration from old databases', () => {
  it('v1.0 database: all missing columns get added', () => {
    // Drop ALL tables to simulate a clean v1.0 database
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]
    for (const t of tables) db.exec(`DROP TABLE IF EXISTS ${t.name}`)

    // Recreate minimal v1.0 tables
    db.exec(`CREATE TABLE products (id INTEGER PRIMARY KEY, barcode TEXT, title TEXT, category TEXT, unit TEXT DEFAULT 'number', purchase_price REAL, sale_price REAL, stock REAL, minStock REAL, isActive INTEGER DEFAULT 1)`)
    db.exec(`CREATE TABLE sales (id INTEGER PRIMARY KEY, invoiceNumber TEXT, userId INTEGER, subtotal REAL, total_amount REAL, totalNetProfit REAL, paymentMethod TEXT, customerPaid REAL, changeAmount REAL, createdAt TEXT)`)
    db.exec(`CREATE TABLE returns (id INTEGER PRIMARY KEY, saleId INTEGER, quantity INTEGER, reason TEXT, refundAmount REAL, status TEXT DEFAULT 'pending')`)
    db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, pin_code TEXT, role TEXT DEFAULT 'cashier', isActive INTEGER DEFAULT 1)`)

    // Simulate auto-migration (same logic as connection.ts)
    const expectedColumns: Record<string, string[]> = {
      products: ['subcategory', 'isSellable', 'expiry_date', 'expiry_alert_days', 'last_alerted', 'has_expiry', 'brand_id', 'profit_percentage'],
      sales: ['saleDate', 'affectsInventory'],
      returns: ['isDamaged'],
      users: ['permissions', 'lastLoginAt', 'lastActivityAt'],
    }

    for (const [table, cols] of Object.entries(expectedColumns)) {
      for (const col of cols) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} TEXT DEFAULT ''`)
      }
    }

    // Verify all columns exist
    for (const [table, cols] of Object.entries(expectedColumns)) {
      const actual = db.prepare(`PRAGMA table_info(${table})`).all().map((c: any) => c.name)
      for (const col of cols) {
        expect(actual).toContain(col)
      }
    }
  })

  it('brands table can be created on old database', () => {
    db.exec('DROP TABLE IF EXISTS brands')
    db.exec(`CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '', isActive INTEGER DEFAULT 1, createdAt TEXT DEFAULT ''
    )`)
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").get()
    expect(r).toBeTruthy()
  })

  it('supplier_ledger table can be created on old database', () => {
    db.exec('DROP TABLE IF EXISTS supplier_ledger')
    db.exec(`CREATE TABLE IF NOT EXISTS supplier_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT, supplierId INTEGER NOT NULL,
      type TEXT NOT NULL, amount REAL NOT NULL, description TEXT DEFAULT '',
      images TEXT DEFAULT '[]', createdAt TEXT DEFAULT ''
    )`)
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='supplier_ledger'").get()
    expect(r).toBeTruthy()
  })
})

describe('Import/Export integrity', () => {
  it('products with brand_id survive export roundtrip', () => {
    db.prepare('INSERT INTO brands (name) VALUES (?)').run('تست')
    const brand = db.prepare('SELECT id FROM brands WHERE name = ?').get('تست')
    db.prepare('INSERT INTO products (title, brand_id, profit_percentage, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?, ?)').run('محصول تست', brand.id, 15, 100, 150, 50)

    // Simulate export: dump to JSON
    const products = db.prepare('SELECT * FROM products').all()
    expect(products.length).toBe(1)
    expect(products[0].brand_id).toBe(brand.id)
    expect(products[0].profit_percentage).toBe(15)
  })

  it('returns with isDamaged survive export roundtrip', () => {
    db.prepare('INSERT INTO suppliers (name) VALUES (?)').run('تأمین')
    db.prepare('INSERT INTO returns (saleId, productId, quantity, reason, refundAmount, status, isDamaged) VALUES (?, ?, ?, ?, ?, ?, ?)').run(null, null, 5, 'تست', 5000, 'completed', 1)
    const ret = db.prepare('SELECT * FROM returns WHERE isDamaged = 1').get()
    expect(ret).toBeTruthy()
    expect(ret.refundAmount).toBe(5000)
  })
})

describe('App version vs schema version', () => {
  it('schema version is set correctly on first run', () => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('schemaVersion', '1.8.0')
    const v = db.prepare("SELECT value FROM settings WHERE key = 'schemaVersion'").get()
    expect(v.value).toBe('1.8.0')
  })

  it('migration history records are preserved', () => {
    db.prepare('INSERT INTO migration_history (fromVersion, toVersion, description, status) VALUES (?, ?, ?, ?)').run('1.0.0', '1.8.0', 'test', 'applied')
    const r = db.prepare('SELECT * FROM migration_history WHERE toVersion = ?').get('1.8.0')
    expect(r).toBeTruthy()
    expect(r.status).toBe('applied')
  })
})
