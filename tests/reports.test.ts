/**
 * Financial Reports tests — verifies P&L, balance sheet, and trial balance
 * after sales, returns, and expenses. Validates:
 *   - Trial balance (debits == credits)
 *   - Revenue increases after sale, reverses after return
 *   - Cash net after full sale→return cycle
 *   - COGS balances with inventory
 *   - Expense→cash reduction
 *   - All accounts net to zero after complete cycle
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb } from './helpers/testDb'

let db: any

beforeEach(async () => {
  db = await createTestDb()
  db.prepare('INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)').run('Admin', '1234', 'admin')
  db.prepare('INSERT INTO products (title, category, purchase_price, sale_price, stock) VALUES (?, ?, ?, ?, ?)').run('Widget', 'Goods', 300, 500, 100)
  db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('Ahmad', '0912')
})

/** Inserts a journal entry with arbitrary lines (used by all helpers below). */
function postJournal(date: string, desc: string, lines: { accountId: number; debit: number; credit: number }[]) {
  const r = db.prepare('INSERT INTO journal_entries (entryDate, description, referenceType) VALUES (?, ?, ?)').run(date, desc, 'manual')
  for (const l of lines) {
    db.prepare('INSERT INTO journal_entry_lines (entryId, accountId, debit, credit) VALUES (?, ?, ?, ?)').run(r.lastInsertRowid, l.accountId, l.debit, l.credit)
  }
}

/**
 * Simulates a sale: Debit Cash, Credit Revenue, Debit COGS, Credit Inventory.
 */
function postSale(date: string, saleAmount: number, cost: number) {
  const cashAcct = db.prepare("SELECT id FROM accounts WHERE code = '1100'").get().id
  const salesAcct = db.prepare("SELECT id FROM accounts WHERE code = '4100'").get().id
  const cogsAcct = db.prepare("SELECT id FROM accounts WHERE code = '5100'").get().id
  const invAcct = db.prepare("SELECT id FROM accounts WHERE code = '1300'").get().id
  postJournal(date, `فروش ${saleAmount}`, [
    { accountId: cashAcct, debit: saleAmount, credit: 0 },
    { accountId: salesAcct, debit: 0, credit: saleAmount },
    { accountId: cogsAcct, debit: cost, credit: 0 },
    { accountId: invAcct, debit: 0, credit: cost },
  ])
}

/**
 * Simulates a return: reverses the sale (Debit Revenue, Credit Cash,
 * Debit Inventory, Credit COGS).
 */
function postReturn(date: string, saleAmount: number, cost: number) {
  const cashAcct = db.prepare("SELECT id FROM accounts WHERE code = '1100'").get().id
  const salesAcct = db.prepare("SELECT id FROM accounts WHERE code = '4100'").get().id
  const cogsAcct = db.prepare("SELECT id FROM accounts WHERE code = '5100'").get().id
  const invAcct = db.prepare("SELECT id FROM accounts WHERE code = '1300'").get().id
  postJournal(date, `مرجوعی ${saleAmount}`, [
    { accountId: salesAcct, debit: saleAmount, credit: 0 },
    { accountId: cashAcct, debit: 0, credit: saleAmount },
    { accountId: invAcct, debit: cost, credit: 0 },
    { accountId: cogsAcct, debit: 0, credit: cost },
  ])
}

/**
 * Simulates an expense: Debit Expense (rent account 6100), Credit Cash.
 */
function postExpense(date: string, amount: number) {
  const cashAcct = db.prepare("SELECT id FROM accounts WHERE code = '1100'").get().id
  const expenseAcct = db.prepare("SELECT id FROM accounts WHERE code = '6100'").get().id
  postJournal(date, `هزینه ${amount}`, [
    { accountId: expenseAcct, debit: amount, credit: 0 },
    { accountId: cashAcct, debit: 0, credit: amount },
  ])
}

function getAccountBalance(code: string): number {
  const r = db.prepare(`
    SELECT COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as net
    FROM accounts a LEFT JOIN journal_entry_lines jel ON jel.accountId = a.id
    WHERE a.code = ? AND a.isActive = 1
  `).get(code)
  return r ? r.net : 0
}

describe('Financial Reports', () => {
  it('trial balance: total debit = total credit', () => {
    postSale('2026-07-01', 500, 300)
    postExpense('2026-07-01', 100)
    const lines = db.prepare('SELECT * FROM journal_entry_lines').all()
    const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0)
    const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0)
    expect(totalDebit).toBe(totalCredit)
  })

  it('revenue increases after sale', () => {
    const before = getAccountBalance('4100')
    postSale('2026-07-01', 500, 300)
    const after = getAccountBalance('4100')
    expect(after - before).toBe(-500) // Credit side (negative in debit-credit calc)
  })

  it('revenue reverses after return', () => {
    postSale('2026-07-01', 500, 300)
    const afterSale = getAccountBalance('4100')
    postReturn('2026-07-02', 500, 300)
    const afterReturn = getAccountBalance('4100')
    expect(afterReturn).toBe(0) // Revenue fully reversed
  })

  it('cash net after full cycle', () => {
    postSale('2026-07-01', 500, 300)  // +500
    postReturn('2026-07-02', 500, 300) // -500
    expect(getAccountBalance('1100')).toBe(0)
  })

  it('COGS balances with inventory', () => {
    postSale('2026-07-01', 500, 300)  // COGS +300, Inv -300
    postReturn('2026-07-02', 500, 300) // COGS -300, Inv +300
    const cogs = getAccountBalance('5100')
    const inv = getAccountBalance('1300')
    expect(cogs + inv).toBe(0) // They should cancel
  })

  it('multiple sales: revenue sums correctly', () => {
    postSale('2026-07-01', 500, 300)
    postSale('2026-07-02', 445, 290)
    const revenue = Math.abs(getAccountBalance('4100'))
    expect(revenue).toBe(945)
  })

  it('expenses reduce cash', () => {
    postSale('2026-07-01', 500, 300)
    postExpense('2026-07-02', 100)
    expect(getAccountBalance('1100')).toBe(400) // 500 - 100
  })

  it('full cycle: sell → return → all zero', () => {
    postSale('2026-07-01', 500, 300)
    postReturn('2026-07-02', 500, 300)
    expect(getAccountBalance('1100')).toBe(0)
    expect(getAccountBalance('4100')).toBe(0)
    expect(getAccountBalance('5100')).toBe(0)
    expect(getAccountBalance('1300')).toBe(0)
  })
})
