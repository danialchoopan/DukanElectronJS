/**
 * Audit Log repository — comprehensive activity tracking with search and export.
 *
 * Tracks: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW actions.
 * Records: user, action, timestamp, affected record, before/after values.
 * Immutable: append-only — audit records are never modified or deleted.
 * Supports: search by date range, user, action type, module (entityType).
 */

import { getDatabase } from '../connection'

export interface AuditEntry {
  id: number
  userId: number | null
  userName: string
  action: string
  entityType: string
  entityId: number | null
  details: string
  beforeValue: string
  afterValue: string
  ip: string
  createdAt: string
}

function formatEntry(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as number,
    userId: row.userId as number | null,
    userName: (row.userName as string) ?? '',
    action: row.action as string,
    entityType: row.entityType as string,
    entityId: row.entityId as number | null,
    details: (row.details as string) ?? '',
    beforeValue: (row.beforeValue as string) ?? '',
    afterValue: (row.afterValue as string) ?? '',
    ip: (row.ip as string) ?? '',
    createdAt: row.createdAt as string,
  }
}

/** Create an audit entry (immutable append-only). */
export function createAuditEntry(
  userId: number | null, action: string, entityType: string, entityId: number | null,
  details?: string, beforeValue?: string, afterValue?: string, ip?: string
): void {
  const db = getDatabase()
  let userName = ''
  if (userId) {
    const user = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as { name: string } | undefined
    userName = user?.name || ''
  }
  db.prepare(`
    INSERT INTO audit_log (userId, userName, action, entityType, entityId, details, beforeValue, afterValue, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, userName, action, entityType, entityId, details || '', beforeValue || '', afterValue || '', ip || '')
}

/** Get audit log with filters. */
export function getAuditLog(filters?: {
  entityType?: string; action?: string; userId?: number;
  startDate?: string; endDate?: string; limit?: number; offset?: number
}): { entries: AuditEntry[]; total: number } {
  const db = getDatabase()
  const conditions: string[] = []
  const params: any[] = []

  if (filters?.entityType) { conditions.push('a.entityType = ?'); params.push(filters.entityType) }
  if (filters?.action) { conditions.push('a.action = ?'); params.push(filters.action) }
  if (filters?.userId) { conditions.push('a.userId = ?'); params.push(filters.userId) }
  if (filters?.startDate) { conditions.push("a.createdAt >= ?"); params.push(filters.startDate) }
  if (filters?.endDate) { conditions.push("a.createdAt <= ?"); params.push(filters.endDate) }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const total = (db.prepare(`SELECT COUNT(*) as c FROM audit_log a ${where}`).get(...params) as { c: number }).c

  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0
  const entries = db.prepare(`
    SELECT a.* FROM audit_log a ${where}
    ORDER BY a.createdAt DESC LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Record<string, unknown>[]

  return { entries: entries.map(formatEntry), total }
}

/** Get audit history for a specific entity. */
export function getAuditForEntity(entityType: string, entityId: number): AuditEntry[] {
  const db = getDatabase()
  const rows = db.prepare(
    'SELECT * FROM audit_log WHERE entityType = ? AND entityId = ? ORDER BY createdAt DESC'
  ).all(entityType, entityId) as Record<string, unknown>[]
  return rows.map(formatEntry)
}

/** Get audit statistics. */
export function getAuditStats(): { total: number; today: number; byAction: Record<string, number>; byEntity: Record<string, number> } {
  const db = getDatabase()
  const total = (db.prepare('SELECT COUNT(*) as c FROM audit_log').get() as { c: number }).c
  const todayStr = new Date().toISOString().slice(0, 10)
  const today = (db.prepare("SELECT COUNT(*) as c FROM audit_log WHERE date(createdAt) = ?").get(todayStr) as { c: number }).c

  const byActionRows = db.prepare('SELECT action, COUNT(*) as c FROM audit_log GROUP BY action ORDER BY c DESC').all() as { action: string; c: number }[]
  const byEntityRows = db.prepare('SELECT entityType, COUNT(*) as c FROM audit_log GROUP BY entityType ORDER BY c DESC').all() as { entityType: string; c: number }[]

  return {
    total, today,
    byAction: Object.fromEntries(byActionRows.map(r => [r.action, r.c])),
    byEntity: Object.fromEntries(byEntityRows.map(r => [r.entityType, r.c])),
  }
}

/** Auto-cleanup old audit logs (configurable retention in days). */
export function cleanupAuditLogs(retentionDays: number = 365): { deleted: number } {
  const db = getDatabase()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const result = db.prepare("DELETE FROM audit_log WHERE createdAt < ?").run(cutoffStr)
  return { deleted: result.changes }
}

/** Get recent activity feed for dashboard. */
export function getRecentActivity(limit: number = 20): AuditEntry[] {
  const db = getDatabase()
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY createdAt DESC LIMIT ?')
    .all(limit) as Record<string, unknown>[]
  return rows.map(formatEntry)
}
