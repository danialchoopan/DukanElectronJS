/**
 * Customer + Ledger tests
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
})

describe('Customers', () => {
  it('create and retrieve customer', () => {
    db.prepare('INSERT INTO customers (name, phone, customerType) VALUES (?, ?, ?)').run('Ali', '0912', 'real')
    const c = db.prepare('SELECT * FROM customers WHERE name = ?').get('Ali')
    expect(c).toBeTruthy()
    expect(c.phone).toBe('0912')
    expect(c.balance).toBe(0)
  })

  it('ledger entry updates balance', () => {
    db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('Bob', '0935')
    db.prepare('INSERT INTO customer_ledger (customerId, type, amount, description) VALUES (?, ?, ?, ?)').run(1, 'charge', -500, 'sale')
    db.prepare('INSERT INTO customer_ledger (customerId, type, amount, description) VALUES (?, ?, ?, ?)').run(1, 'payment', 300, 'payment')
    const totalDebit = db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM customer_ledger WHERE customerId = 1 AND amount < 0").get()
    const totalCredit = db.prepare("SELECT COALESCE(SUM(amount), 0) as t FROM customer_ledger WHERE customerId = 1 AND amount > 0").get()
    expect(Math.abs(totalDebit.t)).toBe(500)
    expect(totalCredit.t).toBe(300)
  })

  it('customer search by name', () => {
    db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('Ahmad', '0912')
    db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('Ali', '0935')
    const results = db.prepare("SELECT * FROM customers WHERE name LIKE ? AND isActive = 1").all('%Ahmad%')
    expect(results.length).toBe(1)
    expect(results[0].name).toBe('Ahmad')
  })

  it('credit limit and blocking', () => {
    db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('RichGuy', '0911')
    db.prepare('INSERT INTO customer_credit (customerId, creditLimit, currentDebt, isBlocked) VALUES (?, ?, ?, ?)').run(1, 10000000, 5000000, 0)
    db.prepare('UPDATE customer_credit SET isBlocked = 1 WHERE customerId = 1').run()
    const credit = db.prepare('SELECT * FROM customer_credit WHERE customerId = 1').get()
    expect(credit.isBlocked).toBe(1)
  })
})
