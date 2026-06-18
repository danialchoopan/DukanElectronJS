import { getDatabase } from '../connection'

export interface AuditLog {
  id: number
  userId: number | null
  action: string
  entityType: string
  entityId: number | null
  details: string
  entityName: string | null
  createdAt: string
}

export function createAuditEntry(userId: number | null, action: string, entityType: string, entityId: number | null, details?: string): void {
  const db = getDatabase()
  db.prepare('INSERT INTO audit_log (userId, action, entityType, entityId, details) VALUES (?, ?, ?, ?, ?)').run(userId, action, entityType, entityId, details || null)
}

export function getAuditLog(entityType?: string, limit: number = 50, startDate?: string, endDate?: string): AuditLog[] {
  const db = getDatabase()
  const conditions: string[] = []
  const params: any[] = []
  if (entityType) {
    conditions.push('a.entityType = ?')
    params.push(entityType)
  }
  if (startDate) {
    conditions.push('a.createdAt >= ?')
    params.push(startDate)
  }
  if (endDate) {
    conditions.push('a.createdAt <= ?')
    params.push(endDate)
  }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  params.push(limit)
  return db.prepare(`
    SELECT a.*, u.name as userName,
      CASE
        WHEN a.entityType = 'product' THEN (SELECT title FROM products WHERE id = a.entityId)
        WHEN a.entityType = 'sale' THEN (SELECT invoiceNumber FROM sales WHERE id = a.entityId)
        WHEN a.entityType = 'expense' THEN (SELECT description FROM expenses WHERE id = a.entityId)
        WHEN a.entityType = 'return' THEN (SELECT reason FROM returns WHERE id = a.entityId)
        ELSE NULL
      END as entityName
    FROM audit_log a
    LEFT JOIN users u ON a.userId = u.id
    ${where}
    ORDER BY a.createdAt DESC LIMIT ?
  `).all(...params) as AuditLog[]
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
