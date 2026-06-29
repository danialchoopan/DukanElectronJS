/**
 * Customer Credit repository — credit limit management, blocking, and scoring.
 *
 * Features:
 *   - Credit limit per customer (max allowed debt)
 *   - Block/unblock with reason tracking and audit trail
 *   - Credit score calculation based on payment history
 *   - Real-time credit check before sales
 *   - Credit limit adjustment log
 *   - Block types: credit, fraud, inactive, other
 *
 * Credit score algorithm:
 *   - Starts at 100
 *   - Decreases by 10 for each month with late payment
 *   - Increases by 2 for each on-time payment (max 100)
 *   - Blocked = 0
 */

import { getDatabase } from '../connection'

export interface CustomerCredit {
  id: number
  customerId: number
  customerName?: string
  creditLimit: number
  currentDebt: number
  creditScore: number
  isBlocked: boolean
  blockReason: string
  blockType: string
  blockedAt: string | null
  blockedBy: string | null
  unblockRequested: boolean
  unblockNote: string
  lastPaymentDate: string | null
  paymentDelayDays: number
  createdAt: string
  updatedAt: string
}

export interface CreditHistoryEntry {
  id: number; customerId: number; action: string; oldValue: string; newValue: string; reason: string; performedBy: string; createdAt: string
}

function formatCredit(row: Record<string, unknown>): CustomerCredit {
  return {
    id: row.id as number, customerId: row.customerId as number,
    customerName: (row.customerName as string) ?? undefined,
    creditLimit: (row.creditLimit as number) ?? 0,
    currentDebt: (row.currentDebt as number) ?? 0,
    creditScore: (row.creditScore as number) ?? 100,
    isBlocked: (row.isBlocked as number) === 1,
    blockReason: (row.blockReason as string) ?? '',
    blockType: (row.blockType as string) ?? '',
    blockedAt: row.blockedAt as string | null,
    blockedBy: row.blockedBy as string | null,
    unblockRequested: (row.unblockRequested as number) === 1,
    unblockNote: (row.unblockNote as string) ?? '',
    lastPaymentDate: row.lastPaymentDate as string | null,
    paymentDelayDays: (row.paymentDelayDays as number) ?? 0,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }
}

function queryAll(sql: string, ...params: any[]): CustomerCredit[] {
  const db = getDatabase()
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[]
  return rows.map(r => formatCredit(r))
}

export function ensureCreditRecord(customerId: number): CustomerCredit {
  const db = getDatabase()
  const existing = db.prepare('SELECT * FROM customer_credit WHERE customerId = ?').get(customerId)
  if (existing) return formatCredit(existing as Record<string, unknown>)
  db.prepare('INSERT INTO customer_credit (customerId) VALUES (?)').run(customerId)
  return formatCredit(db.prepare('SELECT * FROM customer_credit WHERE customerId = ?').get(customerId) as Record<string, unknown>)
}

export function getAllCredits(): CustomerCredit[] {
  return queryAll(`
    SELECT cc.*, c.name as customerName
    FROM customer_credit cc LEFT JOIN customers c ON cc.customerId = c.id
    ORDER BY cc.currentDebt DESC
  `)
}

export function getCreditByCustomerId(customerId: number): CustomerCredit | undefined {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT cc.*, c.name as customerName
    FROM customer_credit cc LEFT JOIN customers c ON cc.customerId = c.id
    WHERE cc.customerId = ?
  `).get(customerId) as Record<string, unknown> | undefined
  return row ? formatCredit(row) : undefined
}

export function setCreditLimit(customerId: number, limit: number, performedBy: string = 'admin'): boolean {
  const db = getDatabase()
  ensureCreditRecord(customerId)
  const current = db.prepare('SELECT creditLimit FROM customer_credit WHERE customerId = ?').get(customerId) as { creditLimit: number }
  db.prepare("UPDATE customer_credit SET creditLimit = ?, updatedAt = datetime('now', 'localtime') WHERE customerId = ?").run(limit, customerId)
  db.prepare("INSERT INTO credit_history (customerId, action, oldValue, newValue, reason, performedBy) VALUES (?, 'limit_change', ?, ?, 'تغییر اعتبار', ?)")
    .run(customerId, String(current.creditLimit), String(limit), performedBy)
  return true
}

export function blockCustomer(customerId: number, blockType: string, reason: string, performedBy: string = 'admin'): boolean {
  const db = getDatabase()
  ensureCreditRecord(customerId)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  db.prepare(`UPDATE customer_credit SET isBlocked = 1, blockReason = ?, blockType = ?, blockedAt = ?, blockedBy = ?, creditScore = 0, updatedAt = datetime('now', 'localtime') WHERE customerId = ?`)
    .run(reason, blockType, now, performedBy, customerId)
  db.prepare('UPDATE customers SET is_blocked = 1 WHERE id = ?').run(customerId)
  db.prepare("INSERT INTO credit_history (customerId, action, newValue, reason, performedBy) VALUES (?, 'block', ?, ?, ?)")
    .run(customerId, blockType, reason, performedBy)
  return true
}

export function unblockCustomer(customerId: number, reason: string = '', performedBy: string = 'admin'): boolean {
  const db = getDatabase()
  db.prepare(`UPDATE customer_credit SET isBlocked = 0, blockReason = '', blockType = '', blockedAt = NULL, blockedBy = NULL, unblockRequested = 0, unblockNote = '', creditScore = 50, updatedAt = datetime('now', 'localtime') WHERE customerId = ?`).run(customerId)
  db.prepare('UPDATE customers SET is_blocked = 0 WHERE id = ?').run(customerId)
  db.prepare("INSERT INTO credit_history (customerId, action, newValue, reason, performedBy) VALUES (?, 'unblock', 'unblocked', ?, ?)")
    .run(customerId, reason, performedBy)
  return true
}

export function requestUnblock(customerId: number, note: string): boolean {
  const db = getDatabase()
  db.prepare("UPDATE customer_credit SET unblockRequested = 1, unblockNote = ?, updatedAt = datetime('now', 'localtime') WHERE customerId = ?").run(note, customerId)
  return true
}

export function updateCurrentDebt(customerId: number, delta: number): void {
  const db = getDatabase()
  ensureCreditRecord(customerId)
  db.prepare("UPDATE customer_credit SET currentDebt = MAX(0, currentDebt + ?), updatedAt = datetime('now', 'localtime') WHERE customerId = ?").run(delta, customerId)
}

export function recordPayment(customerId: number, amount: number, paymentDate: string): void {
  const db = getDatabase()
  ensureCreditRecord(customerId)
  const now = paymentDate || new Date().toISOString().slice(0, 10)
  const credit = db.prepare('SELECT * FROM customer_credit WHERE customerId = ?').get(customerId) as any
  if (credit) {
    const newDebt = Math.max(0, credit.currentDebt - amount)
    const newScore = Math.min(100, credit.creditScore + 2)
    db.prepare("UPDATE customer_credit SET currentDebt = ?, creditScore = ?, lastPaymentDate = ?, updatedAt = datetime('now', 'localtime') WHERE customerId = ?").run(newDebt, newScore, now, customerId)
  }
}

export function checkCredit(customerId: number, amount: number): { allowed: boolean; reason: string } {
  const db = getDatabase()
  ensureCreditRecord(customerId)
  const credit = db.prepare('SELECT * FROM customer_credit WHERE customerId = ?').get(customerId) as any
  if (!credit) return { allowed: true, reason: '' }
  if (credit.isBlocked) return { allowed: false, reason: `حساب مسدود شده: ${credit.blockReason}` }
  if (credit.creditLimit > 0 && credit.currentDebt + amount > credit.creditLimit) {
    return { allowed: false, reason: `حد اعتبار رد شد. بدهی فعلی: ${(credit.currentDebt).toLocaleString('fa-IR')}` }
  }
  return { allowed: true, reason: '' }
}

export function recalculateScore(customerId: number): number {
  const db = getDatabase()
  const credit = db.prepare('SELECT * FROM customer_credit WHERE customerId = ?').get(customerId) as any
  if (!credit) return 100
  if (credit.isBlocked) return 0
  let score = 50
  if (credit.lastPaymentDate) {
    const daysSince = Math.floor((Date.now() - new Date(credit.lastPaymentDate).getTime()) / 86400000)
    if (daysSince <= 30) score += 20
    else if (daysSince <= 60) score += 10
    else if (daysSince > 90) score -= 20
  }
  if (credit.paymentDelayDays > 0) score -= Math.min(40, credit.paymentDelayDays)
  if (credit.creditLimit > 0) {
    const ratio = credit.currentDebt / credit.creditLimit
    if (ratio < 0.3) score += 20
    else if (ratio < 0.6) score += 10
    else if (ratio > 0.9) score -= 15
  }
  score = Math.max(0, Math.min(100, score))
  db.prepare("UPDATE customer_credit SET creditScore = ?, updatedAt = datetime('now', 'localtime') WHERE customerId = ?").run(score, customerId)
  return score
}

export function getCreditHistory(customerId: number): CreditHistoryEntry[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM credit_history WHERE customerId = ? ORDER BY createdAt DESC').all(customerId) as CreditHistoryEntry[]
}

export function getBlockedCustomers(): CustomerCredit[] {
  return queryAll(`
    SELECT cc.*, c.name as customerName
    FROM customer_credit cc LEFT JOIN customers c ON cc.customerId = c.id
    WHERE cc.isBlocked = 1 ORDER BY cc.blockedAt DESC
  `)
}

export function getUnblockRequests(): CustomerCredit[] {
  return queryAll(`
    SELECT cc.*, c.name as customerName
    FROM customer_credit cc LEFT JOIN customers c ON cc.customerId = c.id
    WHERE cc.unblockRequested = 1 ORDER BY cc.updatedAt DESC
  `)
}
