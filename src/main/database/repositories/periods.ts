import { getDatabase } from '../connection'
import type { FiscalPeriod } from '../../../types'

export function getAllPeriods(): FiscalPeriod[] {
  return getDatabase().prepare('SELECT * FROM fiscal_periods ORDER BY startDate DESC').all() as FiscalPeriod[]
}

export function getActivePeriod(): FiscalPeriod | undefined {
  return getDatabase().prepare('SELECT * FROM fiscal_periods WHERE isClosed = 0 ORDER BY startDate DESC LIMIT 1').get() as FiscalPeriod | undefined
}

export function closePeriod(id: number, userId: number): boolean {
  getDatabase().prepare('UPDATE fiscal_periods SET isClosed = 1, closedAt = datetime("now", "localtime"), closedBy = ? WHERE id = ? AND isClosed = 0').run(userId, id)
  return true
}

export function createPeriod(name: string, startDate: string, endDate: string): FiscalPeriod {
  const r = getDatabase().prepare('INSERT INTO fiscal_periods (name, startDate, endDate) VALUES (?, ?, ?)').run(name, startDate, endDate)
  return getDatabase().prepare('SELECT * FROM fiscal_periods WHERE id = ?').get(r.lastInsertRowid as number) as FiscalPeriod
}

export function reopenPeriod(id: number): boolean {
  getDatabase().prepare('UPDATE fiscal_periods SET isClosed = 0, closedAt = NULL, closedBy = NULL WHERE id = ?').run(id)
  return true
}
