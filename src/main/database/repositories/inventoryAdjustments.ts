/**
 * Inventory Adjustments repository — tracks stock corrections with audit trail.
 *
 * Supports:
 *   - Manual adjustments (set absolute stock)
 *   - Reconciliation (physical count vs system)
 *   - Damage/shrinkage tracking
 *   - Past-dated adjustments for document reconciliation
 */

import { getDatabase } from '../connection'

export interface InventoryAdjustment {
  id: number
  productId: number
  productName?: string
  previousStock: number
  newStock: number
  adjustmentQty: number
  reason: string
  adjustmentType: string
  createdBy: string
  createdAt: string
}

export function createAdjustment(input: {
  productId: number
  newStock: number
  reason: string
  adjustmentType: string
  createdBy?: string
  createdAt?: string
}): InventoryAdjustment {
  const db = getDatabase()
  const product = db.prepare('SELECT stock, title FROM products WHERE id = ?').get(input.productId) as { stock: number; title: string } | undefined
  if (!product) throw new Error('کالا یافت نشد')

  const previousStock = product.stock
  const adjustmentQty = input.newStock - previousStock

  const insert = db.prepare(`
    INSERT INTO inventory_adjustments (productId, previousStock, newStock, adjustmentQty, reason, adjustmentType, createdBy, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now', 'localtime')))
  `)
  const result = insert.run(input.productId, previousStock, input.newStock, adjustmentQty, input.reason || '', input.adjustmentType || 'manual', input.createdBy || 'admin', input.createdAt || null)

  db.prepare("UPDATE products SET stock = ?, updatedAt = datetime('now', 'localtime') WHERE id = ?").run(input.newStock, input.productId)

  return {
    id: result.lastInsertRowid as number,
    productId: input.productId,
    productName: product.title,
    previousStock,
    newStock: input.newStock,
    adjustmentQty,
    reason: input.reason || '',
    adjustmentType: input.adjustmentType || 'manual',
    createdBy: input.createdBy || 'admin',
    createdAt: input.createdAt || new Date().toISOString().slice(0, 19).replace('T', ' '),
  }
}

export function getAdjustments(filters?: {
  productId?: number
  adjustmentType?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}): InventoryAdjustment[] {
  const db = getDatabase()
  let query = `
    SELECT ia.*, p.title as productName
    FROM inventory_adjustments ia
    LEFT JOIN products p ON ia.productId = p.id
    WHERE 1=1
  `
  const params: any[] = []
  if (filters?.productId) { query += ' AND ia.productId = ?'; params.push(filters.productId) }
  if (filters?.adjustmentType) { query += ' AND ia.adjustmentType = ?'; params.push(filters.adjustmentType) }
  if (filters?.dateFrom) { query += ' AND date(ia.createdAt) >= ?'; params.push(filters.dateFrom) }
  if (filters?.dateTo) { query += ' AND date(ia.createdAt) <= ?'; params.push(filters.dateTo) }
  query += ' ORDER BY ia.createdAt DESC'
  if (filters?.limit) { query += ' LIMIT ?'; params.push(filters.limit) }

  return db.prepare(query).all(...params) as InventoryAdjustment[]
}

export function getAdjustmentById(id: number): InventoryAdjustment | undefined {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT ia.*, p.title as productName
    FROM inventory_adjustments ia
    LEFT JOIN products p ON ia.productId = p.id
    WHERE ia.id = ?
  `).get(id) as InventoryAdjustment | undefined
  return row || undefined
}
