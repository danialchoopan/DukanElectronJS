/**
 * Product CRUD + Inventory tests
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
})

describe('Products', () => {
  it('create and retrieve product', () => {
    db.prepare('INSERT INTO products (title, barcode, category, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?, ?)').run('Milk', '12345', 'Dairy', 300, 500, 50)
    const p = db.prepare('SELECT * FROM products WHERE title = ?').get('Milk')
    expect(p).toBeTruthy()
    expect(p.sale_price).toBe(500)
    expect(p.stock).toBe(50)
  })

  it('update product stock', () => {
    db.prepare('INSERT INTO products (title, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?)').run('Bread', 100, 200, 30)
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(5, 1)
    const p = db.prepare('SELECT stock FROM products WHERE id = 1').get()
    expect(p.stock).toBe(25)
  })

  it('barcode uniqueness', () => {
    db.prepare('INSERT INTO products (title, barcode, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?)').run('A', 'BC1', 100, 200, 10)
    expect(() => {
      db.prepare('INSERT INTO products (title, barcode, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?)').run('B', 'BC1', 200, 300, 5)
    }).toThrow()
  })

  it('category hierarchy', () => {
    db.prepare('INSERT INTO categories (name, level, parent_id) VALUES (?, ?, ?)').run('Dairy', 0, null)
    db.prepare('INSERT INTO categories (name, level, parent_id) VALUES (?, ?, ?)').run('Milk', 1, 1)
    const parent = db.prepare('SELECT * FROM categories WHERE id = 1').get()
    const child = db.prepare('SELECT * FROM categories WHERE parent_id = 1').get()
    expect(parent.name).toBe('Dairy')
    expect(child.name).toBe('Milk')
  })

  it('isSellable flag', () => {
    db.prepare('INSERT INTO products (title, isSellable, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?)').run('Hidden', 0, 100, 200, 10)
    db.prepare('INSERT INTO products (title, isSellable, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?)').run('Visible', 1, 100, 200, 10)
    const sellable = db.prepare('SELECT COUNT(*) as c FROM products WHERE isSellable = 1').get()
    expect(sellable.c).toBe(1)
  })

  it('expiry date products', () => {
    db.prepare('INSERT INTO products (title, has_expiry, expiry_date, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?, ?)').run('Yogurt', 1, '2026-12-31', 200, 350, 20)
    const p = db.prepare('SELECT * FROM products WHERE has_expiry = 1').get()
    expect(p).toBeTruthy()
    expect(p.expiry_date).toBe('2026-12-31')
  })

  it('delete product preserves sales', () => {
    db.prepare('INSERT INTO products (title, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?)').run('Temp', 100, 200, 5)
    db.prepare('INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)').run('Admin', '1234', 'admin')
    db.prepare('INSERT INTO sales (invoiceNumber, userId, subtotal, total_amount, paymentMethod, saleDate) VALUES (?, ?, ?, ?, ?, ?)').run('INV-001', 1, 200, 200, 'cash', '2026-07-01')
    db.prepare('DELETE FROM products WHERE id = 1').run()
    const sales = db.prepare('SELECT COUNT(*) as c FROM sales').get()
    expect(sales.c).toBe(1)
  })
})
