/**
 * Products repository — manages product CRUD, stock operations, and image storage.
 *
 * Stock management:
 *   - incrementStock: increases stock by given quantity (used in purchases and returns)
 *   - decrementStock: decreases stock with safety guard (prevents negative stock)
 *   - Stock is stored as REAL to support weight-based products (kg)
 *
 * Images: stored as base64 data URIs in the imageBase64 column.
 * Products can be soft-deleted (isActive=0) to preserve accounting history.
 * Auto-barcode: PRD-XXXXXX format, auto-generated when barcode field is empty.
 */

import { getDatabase } from '../connection'
import type { Product, ProductInput } from '../../../types'
import { logPriceChange } from './priceHistory'

export function getAllProducts(): Product[] {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM products WHERE isActive = 1 ORDER BY title')
    .all() as Record<string, unknown>[]).map(formatProduct)
}

export function getProductById(id: number): Product | undefined {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return row ? formatProduct(row) : undefined
}

export function getProductByBarcode(barcode: string): Product | undefined {
  const db = getDatabase()
  const row = db.prepare(
    'SELECT * FROM products WHERE barcode = ? AND isActive = 1'
  ).get(barcode) as Record<string, unknown> | undefined
  return row ? formatProduct(row) : undefined
}

export function searchProducts(query: string): Product[] {
  const db = getDatabase()
  const pattern = `%${query}%`
  return (db.prepare(
    'SELECT * FROM products WHERE isActive = 1 AND (title LIKE ? OR barcode LIKE ? OR category LIKE ? OR subcategory LIKE ?) ORDER BY title LIMIT 50'
  ).all(pattern, pattern, pattern, pattern) as Record<string, unknown>[]).map(formatProduct)
}

export function getLooseProducts(): Product[] {
  const db = getDatabase()
  return (db.prepare(
    'SELECT * FROM products WHERE isActive = 1 AND isLoose = 1 ORDER BY title'
  ).all() as Record<string, unknown>[]).map(formatProduct)
}

export function getLowStockProducts(): Product[] {
  const db = getDatabase()
  return (db.prepare(
    'SELECT * FROM products WHERE isActive = 1 AND stock <= minStock AND stock > 0 ORDER BY stock ASC'
  ).all() as Record<string, unknown>[]).map(formatProduct)
}

export function getProductCategories(): string[] {
  const db = getDatabase()
  return (db.prepare(
    "SELECT DISTINCT category FROM products WHERE isActive = 1 AND category != '' ORDER BY category"
  ).all() as { category: string }[]).map(r => r.category)
}

export function getSellableProducts(): Product[] {
  const db = getDatabase()
  return (db.prepare(
    'SELECT * FROM products WHERE isActive = 1 AND isSellable = 1 ORDER BY title'
  ).all() as Record<string, unknown>[]).map(formatProduct)
}

/**
 * Get products approaching expiry within the given number of days.
 * Returns products where has_expiry=1, expiry_date is set, and expiry is within threshold.
 */
export function getExpiringProducts(withinDays: number = 30): Product[] {
  const db = getDatabase()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + withinDays)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return (db.prepare(
    "SELECT * FROM products WHERE isActive = 1 AND has_expiry = 1 AND expiry_date != '' AND expiry_date <= ? ORDER BY expiry_date ASC"
  ).all(cutoffStr) as Record<string, unknown>[]).map(formatProduct)
}

/**
 * Mark a product's alert as sent to prevent duplicate notifications.
 */
export function markAlerted(productId: number): void {
  const db = getDatabase()
  db.prepare('UPDATE products SET last_alerted = 1 WHERE id = ?').run(productId)
}

/**
 * Reset the alerted flag for all products (e.g., on daily refresh).
 */
export function resetAlerts(): void {
  const db = getDatabase()
  db.prepare('UPDATE products SET last_alerted = 0').run()
}

/**
 * Get product profit report data: units sold, revenue, cost, profit per product.
 * Joins sale_items with products to compute totals for a given date range.
 */
export function getProductProfitReport(startDate?: string, endDate?: string): {
  productId: number; productTitle: string; barcode: string; category: string;
  unitsSold: number; totalRevenue: number; totalCost: number; netProfit: number; profitMargin: number
}[] {
  const db = getDatabase()
  let where = 'WHERE p.isActive = 1'
  const params: any[] = []
  if (startDate) { where += ' AND s.saleDate >= ?'; params.push(startDate) }
  if (endDate) { where += ' AND s.saleDate <= ?'; params.push(endDate) }

  const rows = db.prepare(`
    SELECT
      p.id as productId, p.title as productTitle, p.barcode, p.category,
      COALESCE(SUM(si.quantity), 0) as unitsSold,
      COALESCE(SUM(si.subtotal), 0) as totalRevenue,
      COALESCE(SUM(si.purchasePrice * si.quantity), 0) as totalCost,
      COALESCE(SUM(si.netProfit), 0) as netProfit
    FROM products p
    LEFT JOIN sale_items si ON p.id = si.productId
    LEFT JOIN sales s ON si.saleId = s.id
    ${where}
    GROUP BY p.id
    ORDER BY netProfit DESC
  `).all(...params) as { productId: number; productTitle: string; barcode: string; category: string; unitsSold: number; totalRevenue: number; totalCost: number; netProfit: number }[]

  return rows.map(r => ({
    ...r,
    profitMargin: r.totalRevenue > 0 ? (r.netProfit / r.totalRevenue) * 100 : 0,
  }))
}

export function createProduct(input: ProductInput): Product {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO products (barcode, title, description, imageBase64, category, subcategory, unit, purchase_price, sale_price, stock, minStock, isLoose, isSellable, has_expiry, expiry_date, expiry_alert_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.barcode || null,
    input.title,
    input.description || '',
    input.imageBase64 || '',
    input.category || '',
    input.subcategory || '',
    input.unit || 'number',
    input.purchase_price,
    input.sale_price,
    input.stock,
    input.minStock || 0,
    input.isLoose ? 1 : 0,
    input.isSellable !== false ? 1 : 0,
    input.hasExpiry ? 1 : 0,
    input.expiryDate || '',
    input.expiryAlertDays ?? 30
  )
  return getProductById(result.lastInsertRowid as number)!
}

export function updateProduct(id: number, input: Partial<ProductInput>): Product | undefined {
  const db = getDatabase()
  const existing = getProductById(id)
  if (!existing) return undefined

  const merged = { ...existing, ...input }
  db.prepare(`
    UPDATE products
    SET barcode = ?, title = ?, description = ?, imageBase64 = ?, category = ?, subcategory = ?, unit = ?, purchase_price = ?, sale_price = ?,
        stock = ?, minStock = ?, isLoose = ?, isSellable = ?, has_expiry = ?, expiry_date = ?, expiry_alert_days = ?,
        updatedAt = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    merged.barcode || null,
    merged.title,
    merged.description || '',
    merged.imageBase64 || '',
    merged.category || '',
    merged.subcategory || '',
    merged.unit,
    merged.purchase_price,
    merged.sale_price,
    merged.stock,
    merged.minStock || 0,
    merged.isLoose ? 1 : 0,
    merged.isSellable !== false ? 1 : 0,
    merged.hasExpiry ? 1 : 0,
    merged.expiryDate || '',
    merged.expiryAlertDays ?? 30,
    id
  )

  // Log price changes for history tracking
  if (merged.sale_price !== existing.sale_price) {
    logPriceChange(id, 'sale', existing.sale_price, merged.sale_price, 'admin')
  }
  if (merged.purchase_price !== existing.purchase_price) {
    logPriceChange(id, 'purchase', existing.purchase_price, merged.purchase_price, 'admin')
  }

  return getProductById(id)
}

export function deleteProduct(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('UPDATE products SET isActive = 0 WHERE id = ?').run(id)
  return result.changes > 0
}

export function updateStock(productId: number, quantityChange: number): boolean {
  const db = getDatabase()
  // Prevent stock from going below zero
  if (quantityChange < 0) {
    const result = db.prepare(
      "UPDATE products SET stock = stock + ?, updatedAt = datetime('now', 'localtime') WHERE id = ? AND stock >= ?"
    ).run(quantityChange, productId, Math.abs(quantityChange))
    return result.changes > 0
  }
  const result = db.prepare(
    "UPDATE products SET stock = stock + ?, updatedAt = datetime('now', 'localtime') WHERE id = ?"
  ).run(quantityChange, productId)
  return result.changes > 0
}

export function decrementStock(productId: number, quantity: number): boolean {
  const db = getDatabase()
  const result = db.prepare(
    "UPDATE products SET stock = stock - ?, updatedAt = datetime('now', 'localtime') WHERE id = ? AND stock >= ?"
  ).run(quantity, productId, quantity)
  return result.changes > 0
}

function formatProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as number,
    barcode: (row.barcode as string) ?? '',
    title: row.title as string,
    description: (row.description as string) ?? '',
    imageBase64: (row.imageBase64 as string) ?? '',
    category: row.category as string,
    subcategory: (row.subcategory as string) ?? '',
    unit: row.unit as 'number' | 'weight',
    purchase_price: row.purchase_price as number,
    sale_price: row.sale_price as number,
    stock: row.stock as number,
    minStock: row.minStock as number,
    isLoose: Boolean(row.isLoose),
    isActive: Boolean(row.isActive),
    isSellable: (row.isSellable ?? 1) === 1,
    hasExpiry: (row.has_expiry ?? 0) === 1,
    expiryDate: (row.expiry_date as string) ?? '',
    expiryAlertDays: (row.expiry_alert_days as number) ?? 30,
    lastAlerted: (row.last_alerted ?? 0) === 1,
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }
}
