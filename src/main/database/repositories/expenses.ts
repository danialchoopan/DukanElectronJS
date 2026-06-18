import { getDatabase } from '../connection'
import type { Expense, ExpenseInput } from '../../../types'
import { postExpenseJournal } from './journal'

export function getAllExpenses(): Expense[] {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM expenses ORDER BY date DESC, createdAt DESC')
    .all() as Record<string, unknown>[]).map(r => ({
    id: r.id as number, category: r.category as string, description: r.description as string,
    amount: r.amount as number, date: r.date as string,
    images: r.images ? JSON.parse(r.images as string) : [],
    imageBase64: (r.imageBase64 as string) || undefined,
    createdAt: r.createdAt as string,
  }))
}

export function getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC')
    .all(startDate, endDate) as Record<string, unknown>[]).map(r => ({
    id: r.id as number, category: r.category as string, description: r.description as string,
    amount: r.amount as number, date: r.date as string,
    images: r.images ? JSON.parse(r.images as string) : [],
    imageBase64: (r.imageBase64 as string) || undefined,
    createdAt: r.createdAt as string,
  }))
}

export function createExpense(input: ExpenseInput): Expense {
  const db = getDatabase()
  const imagesJson = JSON.stringify(input.images || [])
  const result = db.prepare('INSERT INTO expenses (category, description, amount, date, imageBase64, images) VALUES (?, ?, ?, ?, ?, ?)')
    .run(input.category, input.description, input.amount, input.date, input.imageBase64 || '', imagesJson)
  const expenseId = result.lastInsertRowid as number
  postExpenseJournal(expenseId, input.date, input.amount, input.category)
  return { id: expenseId, ...input, images: input.images || [], createdAt: new Date().toISOString() }
}

export function deleteExpense(id: number): boolean {
  const db = getDatabase()
  return db.prepare('DELETE FROM expenses WHERE id = ?').run(id).changes > 0
}

export function getExpenseCategories(): string[] {
  const db = getDatabase()
  return (db.prepare("SELECT DISTINCT category FROM expenses WHERE category != '' ORDER BY category").all() as { category: string }[]).map(r => r.category)
}

export function getTotalExpenses(startDate?: string, endDate?: string): number {
  const db = getDatabase()
  let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE 1=1'
  const params: string[] = []
  if (startDate) { query += ' AND date >= ?'; params.push(startDate) }
  if (endDate) { query += ' AND date <= ?'; params.push(endDate) }
  return (db.prepare(query).get(...params) as { total: number }).total
}
