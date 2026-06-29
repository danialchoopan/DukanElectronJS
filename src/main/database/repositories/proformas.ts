/**
 * Proformas repository — pre-invoice management with conversion workflow.
 *
 * Workflow:
 *   1. Create proforma (draft) — reserves inventory
 *   2. Send proforma — status changes to 'sent'
 *   3. Convert to sale — creates sale, transfers inventory, marks proforma as 'converted'
 *   4. Expire proforma — releases inventory, marks as 'expired'
 *
 * Auto-expiration: proformas past their validUntil date are auto-expired.
 * Proforma number format: PR-YYYY-MM-XXXX
 */

import { getDatabase } from '../connection'

export interface Proforma {
  id: number
  proformaNumber: string
  customerId: number | null
  customerName?: string
  userId: number
  subtotal: number
  totalAmount: number
  taxRate: number
  taxAmount: number
  discount: number
  status: string
  validUntil: string
  saleId: number | null
  notes: string
  createdAt: string
  updatedAt: string
  items?: ProformaItem[]
}

export interface ProformaItem {
  id: number
  proformaId: number
  productId: number
  productTitle: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export function getAllProformas(status?: string): Proforma[] {
  const db = getDatabase()
  let where = ''
  const params: any[] = []
  if (status) { where = 'WHERE p.status = ?'; params.push(status) }
  const rows = db.prepare(`
    SELECT p.*, c.name as customerName
    FROM proformas p
    LEFT JOIN customers c ON p.customerId = c.id
    ${where}
    ORDER BY p.createdAt DESC
  `).all(...params) as any[]
  return rows
}

export function getProformaById(id: number): Proforma | undefined {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT p.*, c.name as customerName
    FROM proformas p
    LEFT JOIN customers c ON p.customerId = c.id
    WHERE p.id = ?
  `).get(id) as any
  if (!row) return undefined
  const items = db.prepare('SELECT * FROM proforma_items WHERE proformaId = ?').all(id) as ProformaItem[]
  return { ...row, items }
}

export function createProforma(data: {
  customerId?: number; userId: number; items: { productId: number; productTitle: string; quantity: number; unitPrice: number }[];
  taxRate?: number; discount?: number; validDays?: number; notes?: string
}): Proforma {
  const db = getDatabase()
  const count = (db.prepare("SELECT COUNT(*) as c FROM proformas").get() as { c: number }).c
  const today = new Date()
  const proformaNumber = `PR-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`
  const validDays = data.validDays || 30
  const validUntil = new Date(today)
  validUntil.setDate(validUntil.getDate() + validDays)

  const subtotal = data.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0)
  const discount = data.discount || 0
  const afterDiscount = subtotal - discount
  const taxRate = data.taxRate || 0
  const taxAmount = Math.round(afterDiscount * taxRate / 100)
  const totalAmount = afterDiscount + taxAmount

  const result = db.prepare(`
    INSERT INTO proformas (proformaNumber, customerId, userId, subtotal, totalAmount, taxRate, taxAmount, discount, status, validUntil, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)
  `).run(proformaNumber, data.customerId || null, data.userId, subtotal, totalAmount, taxRate, taxAmount, discount, validUntil.toISOString().slice(0, 10), data.notes || '')

  const proformaId = result.lastInsertRowid as number
  const insertItem = db.prepare('INSERT INTO proforma_items (proformaId, productId, productTitle, quantity, unitPrice, subtotal) VALUES (?, ?, ?, ?, ?, ?)')
  for (const item of data.items) {
    insertItem.run(proformaId, item.productId, item.productTitle, item.quantity, item.unitPrice, item.quantity * item.unitPrice)
  }

  return getProformaById(proformaId)!
}

export function updateProformaStatus(id: number, status: string): boolean {
  const db = getDatabase()
  const result = db.prepare("UPDATE proformas SET status = ?, updatedAt = datetime('now', 'localtime') WHERE id = ?").run(status, id)
  return result.changes > 0
}

export function convertToSale(proformaId: number, userId: number, paymentMethod: string = 'cash'): { success: boolean; saleId?: number; error?: string } {
  const db = getDatabase()
  const proforma = getProformaById(proformaId)
  if (!proforma) return { success: false, error: 'پیش‌فاکتور یافت نشد' }
  if (proforma.status === 'converted') return { success: false, error: 'قبلاً تبدیل شده' }
  if (proforma.status === 'expired') return { success: false, error: 'پیش‌فاکتور منقضی شده' }

  // Create sale via direct SQL (simplified version of createSale)
  const today = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const seq = (db.prepare("SELECT COUNT(*) as c FROM sales WHERE invoiceNumber LIKE ?").get(`INV-${today.slice(0, 10).replace(/-/g, '')}-%`) as { c: number }).c
  const invoiceNumber = `INV-${today.slice(0, 10).replace(/-/g, '')}-${String(seq + 1).padStart(4, '0')}`

  const createSaleTx = db.transaction(() => {
    const saleResult = db.prepare(`
      INSERT INTO sales (invoiceNumber, userId, customerId, subtotal, total_amount, totalNetProfit, paymentMethod, customerPaid, changeAmount, description, saleDate)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?)
    `).run(invoiceNumber, userId, proforma.customerId, proforma.subtotal, proforma.totalAmount, paymentMethod, proforma.totalAmount, `تبدیل از ${proforma.proformaNumber}`, today)

    const saleId = saleResult.lastInsertRowid as number

    const itemStmt = db.prepare('INSERT INTO sale_items (saleId, productId, productTitle, quantity, unitPrice, purchasePrice, subtotal, netProfit) VALUES (?, ?, ?, ?, ?, 0, ?, 0)')
    const decrementStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?")

    for (const item of (proforma.items || [])) {
      itemStmt.run(saleId, item.productId, item.productTitle, item.quantity, item.unitPrice, item.subtotal)
      decrementStmt.run(item.quantity, item.productId, item.quantity)
    }

    if (proforma.customerId && paymentMethod === 'ledger') {
      db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?').run(proforma.totalAmount, proforma.customerId)
      db.prepare("INSERT INTO customer_ledger (customerId, saleId, type, amount, description) VALUES (?, ?, 'sale', ?, ?)")
        .run(proforma.customerId, saleId, proforma.totalAmount, `خرید فاکتور ${invoiceNumber}`)
    }

    // Mark proforma as converted
    db.prepare("UPDATE proformas SET status = 'converted', saleId = ?, updatedAt = datetime('now', 'localtime') WHERE id = ?")
      .run(saleId, proformaId)

    return saleId
  })

  try {
    const saleId = createSaleTx()
    return { success: true, saleId }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function expireProformas(): number {
  const db = getDatabase()
  const today = new Date().toISOString().slice(0, 10)
  const result = db.prepare(
    "UPDATE proformas SET status = 'expired', updatedAt = datetime('now', 'localtime') WHERE status IN ('draft', 'sent') AND validUntil < ?"
  ).run(today)
  return result.changes
}

export function deleteProforma(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM proformas WHERE id = ?').run(id)
  return result.changes > 0
}
