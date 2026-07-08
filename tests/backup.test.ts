/**
 * Backup & Migration tests — validates schema integrity and data preservation.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
})

describe('Schema Integrity', () => {
  const requiredTables = [
    'users', 'products', 'customers', 'sales', 'sale_items',
    'customer_ledger', 'expenses', 'settings', 'audit_log',
    'accounts', 'journal_entries', 'journal_entry_lines',
    'returns', 'fiscal_periods', 'price_history', 'inventory_adjustments',
    'cross_sell_rules', 'installments', 'proformas', 'service_tickets',
    'customer_credit', 'migration_history',
  ]

  it.each(requiredTables)('table "%s" exists', (table) => {
    const r = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`).get()
    expect(r).toBeTruthy()
  })

  it('accounts table has all required codes', () => {
    const codes = ['1100', '1200', '1300', '1400', '2100', '3100', '3200', '4100', '5100', '6100', '6200', '6300', '6400', '6500', '6600', '6700']
    for (const code of codes) {
      const r = db.prepare('SELECT * FROM accounts WHERE code = ?').get(code)
      expect(r).toBeTruthy()
    }
  })

  it('schema version can be stored and retrieved', () => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('schemaVersion', '1.6.0')
    const v = db.prepare("SELECT value FROM settings WHERE key = 'schemaVersion'").get()
    expect(v.value).toBe('1.6.0')
  })

  it('migration history records are stored', () => {
    db.prepare('INSERT INTO migration_history (fromVersion, toVersion, description, status) VALUES (?, ?, ?, ?)').run('1.5.0', '1.6.0', 'test migration', 'applied')
    const r = db.prepare('SELECT * FROM migration_history WHERE toVersion = ?').get('1.6.0')
    expect(r).toBeTruthy()
    expect(r.status).toBe('applied')
  })
})

describe('Data Preservation', () => {
  it('data survives after adding a column', () => {
    db.prepare('INSERT INTO products (title, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?)').run('Test', 100, 200, 50)
    db.exec("ALTER TABLE products ADD COLUMN newField TEXT DEFAULT ''")
    const p = db.prepare('SELECT * FROM products WHERE id = 1').get()
    expect(p.title).toBe('Test')
    expect(p.stock).toBe(50)
  })

  it('foreign key relationships work', () => {
    db.prepare('INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)').run('Admin', '1234', 'admin')
    db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('Bob', '0935')
    db.prepare('INSERT INTO sales (invoiceNumber, userId, customerId, subtotal, total_amount, paymentMethod, saleDate) VALUES (?, ?, ?, ?, ?, ?, ?)').run('INV-001', 1, 1, 500, 500, 'cash', '2026-07-01')
    const s = db.prepare('SELECT s.*, c.name as custName FROM sales s LEFT JOIN customers c ON s.customerId = c.id WHERE s.id = 1').get()
    expect(s.custName).toBe('Bob')
  })
})
