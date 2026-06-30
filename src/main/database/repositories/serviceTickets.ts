/**
 * Service Tickets repository — warranty claims and repair service management.
 *
 * Workflow states:
 *   received → diagnosing → awaiting_parts → in_repair → completed → returned
 *   Any state can go to 'cancelled'
 *
 * Tracks: warranty eligibility (serial number + period), repair costs (parts/labor/shipping),
 * technician assignment, estimated completion, customer notifications, and full history.
 */

import { getDatabase } from '../connection'

export interface ServiceTicket {
  id: number
  ticketNumber: string
  customerId: number | null
  customerName?: string
  productId: number | null
  productTitle?: string
  serialNumber: string
  warrantyClaim: boolean
  warrantyStartDate: string
  warrantyEndDate: string
  status: string
  priority: string
  problemDescription: string
  diagnosis: string
  estimatedCompletion: string
  technician: string
  partsCost: number
  laborCost: number
  shippingCost: number
  totalCost: number
  customerNotified: boolean
  userId: number | null
  createdAt: string
  updatedAt: string
}

export interface ServicePart {
  id: number; ticketId: number; partName: string; partNumber: string; quantity: number; unitCost: number
}

export interface ServiceHistoryEntry {
  id: number; ticketId: number; fromStatus: string; toStatus: string; note: string; changedBy: string; createdAt: string
}

function formatTicket(row: Record<string, unknown>): ServiceTicket {
  return {
    id: row.id as number, ticketNumber: row.ticketNumber as string,
    customerId: row.customerId as number | null,
    customerName: (row.customerName as string) ?? undefined,
    productId: row.productId as number | null,
    productTitle: (row.productTitle as string) ?? undefined,
    serialNumber: (row.serialNumber as string) ?? '',
    warrantyClaim: (row.warrantyClaim as number) === 1,
    warrantyStartDate: (row.warrantyStartDate as string) ?? '',
    warrantyEndDate: (row.warrantyEndDate as string) ?? '',
    status: row.status as string,
    priority: row.priority as string,
    problemDescription: (row.problemDescription as string) ?? '',
    diagnosis: (row.diagnosis as string) ?? '',
    estimatedCompletion: (row.estimatedCompletion as string) ?? '',
    technician: (row.technician as string) ?? '',
    partsCost: (row.partsCost as number) ?? 0,
    laborCost: (row.laborCost as number) ?? 0,
    shippingCost: (row.shippingCost as number) ?? 0,
    totalCost: (row.totalCost as number) ?? 0,
    customerNotified: (row.customerNotified as number) === 1,
    userId: row.userId as number | null,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }
}

export function getAllTickets(status?: string): ServiceTicket[] {
  const db = getDatabase()
  let where = ''
  const params: any[] = []
  if (status) { where = 'WHERE st.status = ?'; params.push(status) }
  return (db.prepare(`
    SELECT st.*, c.name as customerName, p.title as productTitle
    FROM service_tickets st
    LEFT JOIN customers c ON st.customerId = c.id
    LEFT JOIN products p ON st.productId = p.id
    ${where}
    ORDER BY st.createdAt DESC
  `).all(...params) as Record<string, unknown>[]).map(formatTicket)
}

export function getTicketById(id: number): (ServiceTicket & { parts: ServicePart[]; history: ServiceHistoryEntry[] }) | undefined {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT st.*, c.name as customerName, p.title as productTitle
    FROM service_tickets st
    LEFT JOIN customers c ON st.customerId = c.id
    LEFT JOIN products p ON st.productId = p.id
    WHERE st.id = ?
  `).get(id) as Record<string, unknown> | undefined
  if (!row) return undefined
  const ticket = formatTicket(row)
  const parts = db.prepare('SELECT * FROM service_parts WHERE ticketId = ?').all(id) as ServicePart[]
  const history = db.prepare('SELECT * FROM service_history WHERE ticketId = ? ORDER BY createdAt ASC').all(id) as ServiceHistoryEntry[]
  return { ...ticket, parts, history }
}

export function createTicket(data: {
  customerId?: number; productId?: number; serialNumber?: string;
  warrantyClaim?: boolean; warrantyStartDate?: string; warrantyEndDate?: string;
  priority?: string; problemDescription?: string; estimatedCompletion?: string;
  technician?: string; userId?: number
}): ServiceTicket {
  const db = getDatabase()
  const count = (db.prepare("SELECT COUNT(*) as c FROM service_tickets").get() as { c: number }).c
  const ticketNumber = `SRV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count + 1).padStart(4, '0')}`
  const result = db.prepare(`
    INSERT INTO service_tickets (ticketNumber, customerId, productId, serialNumber, warrantyClaim, warrantyStartDate, warrantyEndDate, priority, problemDescription, estimatedCompletion, technician, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ticketNumber, data.customerId || null, data.productId || null, data.serialNumber || '', data.warrantyClaim ? 1 : 0, data.warrantyStartDate || '', data.warrantyEndDate || '', data.priority || 'normal', data.problemDescription || '', data.estimatedCompletion || '', data.technician || '', data.userId || null)
  const ticketId = result.lastInsertRowid as number
  db.prepare("INSERT INTO service_history (ticketId, toStatus, note, changedBy) VALUES (?, 'received', 'تیکت ایجاد شد', ?)")
    .run(ticketId, data.userId ? `user-${data.userId}` : 'admin')
  return getTicketById(ticketId)!
}

export function updateTicketStatus(id: number, newStatus: string, note: string = '', changedBy: string = 'admin'): boolean {
  const db = getDatabase()
  const ticket = db.prepare('SELECT status FROM service_tickets WHERE id = ?').get(id) as { status: string } | undefined
  if (!ticket) return false

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    received: ['diagnosing', 'cancelled'],
    diagnosing: ['awaiting_parts', 'in_repair', 'cancelled'],
    awaiting_parts: ['in_repair', 'cancelled'],
    in_repair: ['completed', 'cancelled'],
    completed: ['returned'],
    returned: [],
    cancelled: [],
  }
  const allowed = validTransitions[ticket.status] || []
  if (!allowed.includes(newStatus)) {
    console.warn(`[Service] Invalid transition: ${ticket.status} → ${newStatus}`)
    return false
  }

  db.prepare("UPDATE service_tickets SET status = ?, updatedAt = datetime('now', 'localtime') WHERE id = ?").run(newStatus, id)
  db.prepare("INSERT INTO service_history (ticketId, fromStatus, toStatus, note, changedBy) VALUES (?, ?, ?, ?, ?)").run(id, ticket.status, newStatus, note, changedBy)
  return true
}

export function updateTicket(id: number, data: Partial<ServiceTicket>): boolean {
  const db = getDatabase()
  const fields: string[] = []
  const vals: any[] = []
  if (data.diagnosis !== undefined) { fields.push('diagnosis = ?'); vals.push(data.diagnosis) }
  if (data.technician !== undefined) { fields.push('technician = ?'); vals.push(data.technician) }
  if (data.estimatedCompletion !== undefined) { fields.push('estimatedCompletion = ?'); vals.push(data.estimatedCompletion) }
  if (data.partsCost !== undefined) { fields.push('partsCost = ?'); vals.push(data.partsCost) }
  if (data.laborCost !== undefined) { fields.push('laborCost = ?'); vals.push(data.laborCost) }
  if (data.shippingCost !== undefined) { fields.push('shippingCost = ?'); vals.push(data.shippingCost) }
  if (data.totalCost !== undefined) { fields.push('totalCost = ?'); vals.push(data.totalCost) }
  if (data.priority !== undefined) { fields.push('priority = ?'); vals.push(data.priority) }
  if (data.problemDescription !== undefined) { fields.push('problemDescription = ?'); vals.push(data.problemDescription) }
  if (fields.length === 0) return false
  fields.push("updatedAt = datetime('now', 'localtime')")
  vals.push(id)
  return db.prepare(`UPDATE service_tickets SET ${fields.join(', ')} WHERE id = ?`).run(...vals).changes > 0
}

export function addPart(ticketId: number, partName: string, partNumber: string, quantity: number, unitCost: number): ServicePart {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO service_parts (ticketId, partName, partNumber, quantity, unitCost) VALUES (?, ?, ?, ?, ?)').run(ticketId, partName, partNumber, quantity, unitCost)
  // Update total parts cost
  const partsTotal = (db.prepare('SELECT COALESCE(SUM(quantity * unitCost), 0) as total FROM service_parts WHERE ticketId = ?').get(ticketId) as { total: number }).total
  const currentPartsCost = (db.prepare('SELECT partsCost FROM service_tickets WHERE id = ?').get(ticketId) as { partsCost: number }).partsCost
  db.prepare('UPDATE service_tickets SET partsCost = ?, totalCost = totalCost - ? + ? WHERE id = ?').run(partsTotal, currentPartsCost, partsTotal, ticketId)
  return db.prepare('SELECT * FROM service_parts WHERE id = ?').get(result.lastInsertRowid) as ServicePart
}

export function removePart(id: number): boolean {
  const db = getDatabase()
  return db.prepare('DELETE FROM service_parts WHERE id = ?').run(id).changes > 0
}

export function getWarrantyExpiring(withinDays: number = 30): ServiceTicket[] {
  const db = getDatabase()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + withinDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const rows = db.prepare(`
    SELECT st.*, c.name as customerName, p.title as productTitle
    FROM service_tickets st
    LEFT JOIN customers c ON st.customerId = c.id
    LEFT JOIN products p ON st.productId = p.id
    WHERE st.warrantyClaim = 1 AND st.warrantyEndDate != '' AND st.warrantyEndDate <= ? AND st.status = 'completed'
    ORDER BY st.warrantyEndDate ASC
  `).all(cutoffStr) as Record<string, unknown>[]
  return rows.map(r => formatTicket(r))
}

export function getServiceReport(): { total: number; open: number; completed: number; totalCost: number; avgDaysToComplete: number } {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN status NOT IN ('completed','returned','cancelled') THEN 1 ELSE 0 END) as open,
      SUM(CASE WHEN status IN ('completed','returned') THEN 1 ELSE 0 END) as completed,
      COALESCE(SUM(totalCost), 0) as totalCost
    FROM service_tickets
  `).get() as any
  return { total: row.total || 0, open: row.open || 0, completed: row.completed || 0, totalCost: row.totalCost || 0, avgDaysToComplete: 0 }
}
