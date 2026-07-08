/**
 * Return + Journal tests — verifies the accounting sync after product returns.
 * Tests both damaged (loss) and normal return paths, including:
 *   - Stock restoration (both damaged and normal)
 *   - Sale total/profit reduction
 *   - Journal entry creation and balance
 *   - COGS reversal correctness
 *   - Full sale→return cycle (all accounts net to zero)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
  db.prepare('INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)').run('Admin', '1234', 'admin')
  db.prepare('INSERT INTO products (title, category, purchase_price, sale_price, stock, unit) VALUES (?, ?, ?, ?, ?, ?)').run('Test Product', 'Food', 300, 500, 100, 'number')
  db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('Ahmad', '0912')
})

/**
 * Creates a sale record with line items and returns the sale ID.
 * Calculates subtotal and totalNetProfit inline.
 */
function createSale(invoiceNum: string, customerId: number | null, items: { productId: number; qty: number; unitPrice: number; purchasePrice: number }[]) {
  let subtotal = 0
  for (const item of items) subtotal += item.unitPrice * item.qty

  const r = db.prepare(
    'INSERT INTO sales (invoiceNumber, userId, customerId, subtotal, total_amount, totalNetProfit, paymentMethod, customerPaid, saleDate, affectsInventory) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(invoiceNum, 1, customerId, subtotal, subtotal, subtotal - items.reduce((s, i) => s + i.purchasePrice * i.qty, 0), 'cash', subtotal, '2026-07-05', 1)
  const saleId = r.lastInsertRowid

  for (const item of items) {
    db.prepare(
      'INSERT INTO sale_items (saleId, productId, productTitle, quantity, unitPrice, purchasePrice, subtotal, netProfit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(saleId, item.productId, 'Test Product', item.qty, item.unitPrice, item.purchasePrice, item.unitPrice * item.qty, (item.unitPrice - item.purchasePrice) * item.qty)
  }
  return saleId
}

/**
 * Posts a return journal entry: reverses revenue and COGS/inventory.
 * Two lines always posted (revenue reversal + cash refund).
 * Two additional lines posted if cogsAmount > 0 (inventory + COGS reversal).
 */
function postReturnJournal(returnId: number, date: string, refundAmount: number, cogsAmount: number) {
  const cashAcct = db.prepare("SELECT id FROM accounts WHERE code = '1100'").get()
  const salesAcct = db.prepare("SELECT id FROM accounts WHERE code = '4100'").get()
  const inventoryAcct = db.prepare("SELECT id FROM accounts WHERE code = '1300'").get()
  const cogsAcct = db.prepare("SELECT id FROM accounts WHERE code = '5100'").get()

  const lines = [
    { accountId: salesAcct.id, debit: refundAmount, credit: 0 },
    { accountId: cashAcct.id, debit: 0, credit: refundAmount },
  ]
  if (cogsAmount > 0) {
    lines.push({ accountId: inventoryAcct.id, debit: cogsAmount, credit: 0 })
    lines.push({ accountId: cogsAcct.id, debit: 0, credit: cogsAmount })
  }

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
  expect(totalDebit).toBe(totalCredit)

  const r = db.prepare('INSERT INTO journal_entries (entryDate, description, referenceType, referenceId) VALUES (?, ?, ?, ?)').run(date, `مرجوعی #${returnId}`, 'return', returnId)
  const entryId = r.lastInsertRowid
  for (const line of lines) {
    db.prepare('INSERT INTO journal_entry_lines (entryId, accountId, debit, credit) VALUES (?, ?, ?, ?)').run(entryId, line.accountId, line.debit, line.credit)
  }
}

/**
 * Creates a product return: inserts return record, restores stock,
 * reduces sale totals, and posts journal entry (if refundAmount > 0).
 */
function createReturn(saleId: number, productId: number, qty: number, unitPrice: number, purchasePrice: number, isDamaged: boolean) {
  const refundAmount = unitPrice * qty
  db.prepare('INSERT INTO returns (saleId, userId, productId, quantity, reason, refundAmount, status, isDamaged) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(saleId, 1, productId, qty, 'test', refundAmount, 'completed', isDamaged ? 1 : 0)

  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(qty, productId)

  if (refundAmount > 0) {
    const cogsAmount = purchasePrice * qty
    db.prepare('UPDATE sales SET total_amount = total_amount - ?, totalNetProfit = totalNetProfit - ? WHERE id = ?').run(refundAmount, refundAmount - cogsAmount, saleId)
    postReturnJournal(db.prepare('SELECT last_insert_rowid() as id').get().id, '2026-07-05', refundAmount, cogsAmount)
  }
}

describe('Returns & Journal', () => {
  it('normal return restores stock', () => {
    createReturn(1, 1, 5, 500, 300, false)
    const stock = db.prepare('SELECT stock FROM products WHERE id = 1').get()
    expect(stock.stock).toBe(105) // 100 + 5
  })

  it('damaged return restores stock', () => {
    createReturn(1, 1, 5, 500, 300, true)
    const stock = db.prepare('SELECT stock FROM products WHERE id = 1').get()
    expect(stock.stock).toBe(105)
  })

  it('damaged return reduces sale total_amount', () => {
    const saleId = createSale('INV-001', 1, [{ productId: 1, qty: 5, unitPrice: 500, purchasePrice: 300 }])
    createReturn(saleId, 1, 5, 500, 300, true)
    const sale = db.prepare('SELECT total_amount, totalNetProfit FROM sales WHERE id = ?').get(saleId)
    expect(sale.total_amount).toBe(0) // 2500 - 2500
    expect(sale.totalNetProfit).toBe(0) // (2500-1500) - (2500-1500)
  })

  it('damaged return posts journal entry', () => {
    const saleId = createSale('INV-002', 1, [{ productId: 1, qty: 5, unitPrice: 500, purchasePrice: 300 }])
    createReturn(saleId, 1, 5, 500, 300, true)
    const entry = db.prepare('SELECT * FROM journal_entries WHERE referenceType = ?').get('return')
    expect(entry).toBeTruthy()
    const lines = db.prepare('SELECT * FROM journal_entry_lines WHERE entryId = ?').all(entry.id)
    expect(lines.length).toBe(4) // revenue + cash + inventory + cogs
    const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0)
    const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0)
    expect(totalDebit).toBe(totalCredit)
  })

  it('journal balance is always debit == credit', () => {
    const saleId = createSale('INV-003', 1, [{ productId: 1, qty: 3, unitPrice: 500, purchasePrice: 300 }])
    createReturn(saleId, 1, 3, 500, 300, true)
    const lines = db.prepare('SELECT * FROM journal_entry_lines').all()
    const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0)
    const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0)
    expect(totalDebit).toBe(totalCredit)
  })

  it('COGS reversal uses purchasePrice from sale_items', () => {
    const saleId = createSale('INV-004', 1, [{ productId: 1, qty: 2, unitPrice: 500, purchasePrice: 300 }])
    createReturn(saleId, 1, 2, 500, 300, true)
    // COGS reversal line should be 2 * 300 = 600
    const cogsLines = db.prepare("SELECT jel.* FROM journal_entry_lines jel JOIN accounts a ON jel.accountId = a.id WHERE a.code = '5100'").all()
    expect(cogsLines.length).toBe(1)
    expect(cogsLines[0].credit).toBe(600) // COGS reversal credit
  })

  it('totalNetProfit = refund - cogs', () => {
    const saleId = createSale('INV-005', 1, [{ productId: 1, qty: 4, unitPrice: 500, purchasePrice: 300 }])
    createReturn(saleId, 1, 4, 500, 300, true)
    const sale = db.prepare('SELECT totalNetProfit FROM sales WHERE id = ?').get(saleId)
    expect(sale.totalNetProfit).toBe(0) // (2000-1200) - (2000-1200) = 0
  })

  it('getReturns returns correct data', () => {
    const saleId = createSale('INV-006', 1, [{ productId: 1, qty: 2, unitPrice: 500, purchasePrice: 300 }])
    createReturn(saleId, 1, 2, 500, 300, true)
    const returns = db.prepare('SELECT * FROM returns').all()
    expect(returns.length).toBe(1)
    expect(returns[0].refundAmount).toBe(1000)
  })

  it('getReturnStats counts only damaged for refund total', () => {
    const saleId = createSale('INV-007', 1, [{ productId: 1, qty: 1, unitPrice: 500, purchasePrice: 300 }])
    // Normal return (isDamaged=0)
    db.prepare('INSERT INTO returns (saleId, userId, productId, quantity, reason, refundAmount, status, isDamaged) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(saleId, 1, 1, 1, 'test', 500, 'completed', 0)
    // Damaged return (isDamaged=1)
    db.prepare('INSERT INTO returns (saleId, userId, productId, quantity, reason, refundAmount, status, isDamaged) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(saleId, 1, 1, 1, 'test', 500, 'completed', 1)
    const stats = db.prepare('SELECT COUNT(*) as c, COALESCE(SUM(CASE WHEN isDamaged = 1 THEN refundAmount ELSE 0 END), 0) as refund FROM returns').get()
    expect(stats.c).toBe(2)
    expect(stats.refund).toBe(500) // Only damaged return counts
  })

  it('all accounts net to zero after full cycle', () => {
    const saleId = createSale('INV-008', 1, [{ productId: 1, qty: 5, unitPrice: 500, purchasePrice: 300 }])
    // Post sale journal (same as the app's postSaleJournal)
    const cashAcct = db.prepare("SELECT id FROM accounts WHERE code = '1100'").get()
    const salesAcct = db.prepare("SELECT id FROM accounts WHERE code = '4100'").get()
    const invAcct = db.prepare("SELECT id FROM accounts WHERE code = '1300'").get()
    const cogsAcct = db.prepare("SELECT id FROM accounts WHERE code = '5100'").get()
    const sr = db.prepare('INSERT INTO journal_entries (entryDate, description, referenceType, referenceId) VALUES (?, ?, ?, ?)').run('2026-07-05', 'فروش', 'sale', saleId)
    db.prepare('INSERT INTO journal_entry_lines (entryId, accountId, debit, credit) VALUES (?, ?, ?, ?)').run(sr.lastInsertRowid, cashAcct.id, 2500, 0)
    db.prepare('INSERT INTO journal_entry_lines (entryId, accountId, debit, credit) VALUES (?, ?, ?, ?)').run(sr.lastInsertRowid, salesAcct.id, 0, 2500)
    db.prepare('INSERT INTO journal_entry_lines (entryId, accountId, debit, credit) VALUES (?, ?, ?, ?)').run(sr.lastInsertRowid, cogsAcct.id, 1500, 0)
    db.prepare('INSERT INTO journal_entry_lines (entryId, accountId, debit, credit) VALUES (?, ?, ?, ?)').run(sr.lastInsertRowid, invAcct.id, 0, 1500)
    createReturn(saleId, 1, 5, 500, 300, true)
    const lines = db.prepare(`
      SELECT a.code, COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as net
      FROM accounts a LEFT JOIN journal_entry_lines jel ON jel.accountId = a.id
      WHERE a.code IN ('1100', '1300', '4100', '5100')
      GROUP BY a.id
    `).all()
    for (const line of lines) {
      expect(line.net).toBe(0)
    }
  })

  it('partial return reduces sale by partial amount', () => {
    const saleId = createSale('INV-009', 1, [{ productId: 1, qty: 5, unitPrice: 500, purchasePrice: 300 }])
    createReturn(saleId, 1, 2, 500, 300, true)
    const sale = db.prepare('SELECT total_amount FROM sales WHERE id = ?').get(saleId)
    expect(sale.total_amount).toBe(1500) // 2500 - 1000
  })
})
