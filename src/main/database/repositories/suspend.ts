import { getDatabase } from '../connection'
import type { SuspendedInvoice, CartItem } from '../../../types'

const MAX_SLOTS = 3

export function saveSuspended(userId: number, slotIndex: number, items: CartItem[]): SuspendedInvoice {
  const db = getDatabase()
  if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
    throw new Error(`Slot index must be between 0 and ${MAX_SLOTS - 1}`)
  }

  db.prepare('DELETE FROM suspended_invoices WHERE userId = ? AND slotIndex = ?').run(userId, slotIndex)

  const result = db.prepare(
    'INSERT INTO suspended_invoices (userId, slotIndex, items_json) VALUES (?, ?, ?)'
  ).run(userId, slotIndex, JSON.stringify(items))

  return {
    id: result.lastInsertRowid as number,
    userId,
    slotIndex,
    items,
    createdAt: new Date().toISOString(),
  }
}

export function listSuspended(userId?: number): SuspendedInvoice[] {
  const db = getDatabase()
  let query = 'SELECT * FROM suspended_invoices'
  const params: unknown[] = []
  if (userId !== undefined) {
    query += ' WHERE userId = ?'
    params.push(userId)
  }
  query += ' ORDER BY slotIndex ASC'

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[]
  return rows.map(row => ({
    id: row.id as number,
    userId: row.userId as number,
    slotIndex: row.slotIndex as number,
    items: JSON.parse(row.items_json as string) as CartItem[],
    createdAt: row.createdAt as string,
  }))
}

export function loadSuspended(id: number): SuspendedInvoice | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM suspended_invoices WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!row) return undefined

  db.prepare('DELETE FROM suspended_invoices WHERE id = ?').run(id)

  return {
    id: row.id as number,
    userId: row.userId as number,
    slotIndex: row.slotIndex as number,
    items: JSON.parse(row.items_json as string) as CartItem[],
    createdAt: row.createdAt as string,
  }
}

export function deleteSuspended(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM suspended_invoices WHERE id = ?').run(id)
  return result.changes > 0
}
