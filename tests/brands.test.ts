/**
 * Brand management + profit calc tests.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
})

describe('Brands table', () => {
  it('brands table exists', () => {
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").get()
    expect(r).toBeTruthy()
  })

  it('CRUD operations work', () => {
    const r = db.prepare('INSERT INTO brands (name, description) VALUES (?, ?)').run('دلفازیر', 'برند لبنیات')
    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(r.lastInsertRowid)
    expect(brand.name).toBe('دلفازیر')

    db.prepare('UPDATE brands SET name = ? WHERE id = ?').run('دلفازیر جدید', r.lastInsertRowid)
    const updated = db.prepare('SELECT * FROM brands WHERE id = ?').get(r.lastInsertRowid)
    expect(updated.name).toBe('دلفازیر جدید')

    db.prepare('UPDATE brands SET isActive = 0 WHERE id = ?').run(r.lastInsertRowid)
    const active = db.prepare('SELECT COUNT(*) as c FROM brands WHERE isActive = 1').get()
    expect(active.c).toBe(0)
  })

  it('brand_id on products works', () => {
    db.prepare('INSERT INTO brands (name) VALUES (?)').run('تست')
    const brand = db.prepare('SELECT id FROM brands WHERE name = ?').get('تست')
    db.prepare('INSERT INTO products (title, brand_id, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?)').run('محصول', brand.id, 100, 200, 10)
    const p = db.prepare('SELECT * FROM products WHERE brand_id = ?').all(brand.id)
    expect(p.length).toBe(1)
  })

  it('profit_percentage on products works', () => {
    db.prepare('INSERT INTO products (title, purchase_price, sale_price, profit_percentage, stock) VALUES (?, ?, ?, ?, ?)').run('تست', 100, 150, 50, 10)
    const p = db.prepare('SELECT * FROM products WHERE title = ?').get('تست')
    expect(p.profit_percentage).toBe(50)
  })
})

describe('Supplier ledger table', () => {
  it('supplier_ledger table exists', () => {
    const r = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='supplier_ledger'").get()
    expect(r).toBeTruthy()
  })

  it('can insert and read ledger entries', () => {
    db.prepare('INSERT INTO suppliers (name, phone) VALUES (?, ?)').run('تأمین تست', '0912')
    const supplier = db.prepare('SELECT id FROM suppliers WHERE name = ?').get('تأمین تست')
    db.prepare('INSERT INTO supplier_ledger (supplierId, type, amount, description) VALUES (?, ?, ?, ?)').run(supplier.id, 'debt', 500000, 'بدهی')
    db.prepare('INSERT INTO supplier_ledger (supplierId, type, amount, description) VALUES (?, ?, ?, ?)').run(supplier.id, 'payment', 200000, 'پرداخت')
    const entries = db.prepare('SELECT * FROM supplier_ledger WHERE supplierId = ?').all(supplier.id)
    expect(entries.length).toBe(2)
    expect(entries[0].type).toBe('debt')
    expect(entries[1].type).toBe('payment')
  })
})

describe('Schema migration v1.7.0', () => {
  it('auto-migration adds brand_id to old products table', () => {
    // Simulate old database: products table without brand_id
    db.exec('DROP TABLE IF EXISTS sale_items')
    db.exec('DROP TABLE IF EXISTS products')
    db.exec('CREATE TABLE products (id INTEGER PRIMARY KEY, title TEXT, purchase_price REAL, sale_price REAL, stock REAL)')
    const cols = db.prepare('PRAGMA table_info(products)').all().map((c: any) => c.name)
    if (!cols.includes('brand_id')) db.exec('ALTER TABLE products ADD COLUMN brand_id INTEGER DEFAULT NULL')
    if (!cols.includes('profit_percentage')) db.exec('ALTER TABLE products ADD COLUMN profit_percentage REAL DEFAULT 0')
    const updated = db.prepare('PRAGMA table_info(products)').all().map((c: any) => c.name)
    expect(updated).toContain('brand_id')
    expect(updated).toContain('profit_percentage')
  })
})
