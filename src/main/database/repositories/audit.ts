import { getDatabase } from '../connection'

export interface AuditLog {
  id: number
  userId: number | null
  action: string
  entityType: string
  entityId: number | null
  details: string
  createdAt: string
}

export function createAuditEntry(userId: number | null, action: string, entityType: string, entityId: number | null, details?: string): void {
  const db = getDatabase()
  db.prepare('INSERT INTO audit_log (userId, action, entityType, entityId, details) VALUES (?, ?, ?, ?, ?)').run(userId, action, entityType, entityId, details || null)
}

export function getAuditLog(entityType?: string, limit: number = 50): AuditLog[] {
  const db = getDatabase()
  if (entityType) {
    return db.prepare('SELECT a.*, u.name as userName FROM audit_log a LEFT JOIN users u ON a.userId = u.id WHERE a.entityType = ? ORDER BY a.createdAt DESC LIMIT ?').all(entityType, limit) as AuditLog[]
  }
  return db.prepare('SELECT a.*, u.name as userName FROM audit_log a LEFT JOIN users u ON a.userId = u.id ORDER BY a.createdAt DESC LIMIT ?').all(limit) as AuditLog[]
}

export function getAuditForEntity(entityType: string, entityId: number): AuditLog[] {
  const db = getDatabase()
  return db.prepare('SELECT a.*, u.name as userName FROM audit_log a LEFT JOIN users u ON a.userId = u.id WHERE a.entityType = ? AND a.entityId = ? ORDER BY a.createdAt DESC').all(entityType, entityId) as AuditLog[]
}

export function getAuditStats(): { totalActions: number; todayActions: number; byAction: Record<string, number> } {
  const db = getDatabase()
  const total = (db.prepare('SELECT COUNT(*) as c FROM audit_log').get() as { c: number }).c
  const today = (db.prepare("SELECT COUNT(*) as c FROM audit_log WHERE date(createdAt) = date('now', 'localtime')").get() as { c: number }).c
  const byAction = db.prepare('SELECT action, COUNT(*) as count FROM audit_log GROUP BY action').all() as { action: string; count: number }[]
  const actionMap: Record<string, number> = {}
  byAction.forEach((r) => { actionMap[r.action] = r.count })
  return { totalActions: total, todayActions: today, byAction: actionMap }
}
