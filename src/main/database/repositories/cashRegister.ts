import { getDatabase } from '../connection'
import type { DailyCashRegister } from '../../../types'

export function getTodayRegister(): DailyCashRegister {
  const db = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  const row = db.prepare('SELECT * FROM cash_register WHERE date = ?').get(today) as Record<string, unknown> | undefined

  if (!row) {
    db.prepare('INSERT OR IGNORE INTO cash_register (date, openingBalance, isClosed) VALUES (?, 0, 0)').run(today)
    return { date: today, openingBalance: 0, totalCashIn: 0, totalCashOut: 0, closingBalance: 0, expectedBalance: 0, difference: 0, isClosed: false }
  }

  const cashSales = (db.prepare("SELECT COALESCE(SUM(customerPaid), 0) as total FROM sales WHERE paymentMethod = 'cash' AND date(createdAt) = ?").get(today) as { total: number }).total
  const cashRefunds = 0

  return {
    date: row.date as string,
    openingBalance: row.openingBalance as number,
    totalCashIn: cashSales,
    totalCashOut: cashRefunds,
    closingBalance: row.closingBalance as number,
    expectedBalance: (row.openingBalance as number) + cashSales - cashRefunds,
    difference: (row.closingBalance as number) - ((row.openingBalance as number) + cashSales - cashRefunds),
    isClosed: Boolean(row.isClosed),
  }
}

export function setOpeningBalance(amount: number): void {
  const db = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  const existing = db.prepare('SELECT id FROM cash_register WHERE date = ?').get(today)
  if (existing) {
    db.prepare('UPDATE cash_register SET openingBalance = ? WHERE date = ?').run(amount, today)
  } else {
    db.prepare('INSERT INTO cash_register (date, openingBalance, isClosed) VALUES (?, ?, 0)').run(today, amount)
  }
}

export function closeRegister(userId: number, closingBalance: number): DailyCashRegister {
  const db = getDatabase()
  const today = new Date().toISOString().split('T')[0]
  db.prepare("UPDATE cash_register SET closingBalance = ?, isClosed = 1, closedAt = datetime('now', 'localtime'), closedBy = ? WHERE date = ?").run(closingBalance, userId, today)
  return getTodayRegister()
}

export function getRegisterHistory(startDate: string, endDate: string): DailyCashRegister[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM cash_register WHERE date BETWEEN ? AND ? ORDER BY date DESC').all(startDate, endDate) as Record<string, unknown>[]
  return rows.map(row => {
    const date = row.date as string
    const openingBalance = row.openingBalance as number
    const closingBalance = row.closingBalance as number
    const cashIn = (db.prepare("SELECT COALESCE(SUM(customerPaid), 0) as t FROM sales WHERE paymentMethod = 'cash' AND date(createdAt) = ?").get(date) as { t: number }).t
    const cashOut = 0
    return {
      date,
      openingBalance,
      totalCashIn: cashIn,
      totalCashOut: cashOut,
      closingBalance,
      expectedBalance: openingBalance + cashIn - cashOut,
      difference: closingBalance - (openingBalance + cashIn - cashOut),
      isClosed: Boolean(row.isClosed),
    }
  })
}
