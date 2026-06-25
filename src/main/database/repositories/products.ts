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
    'SELECT * FROM products WHERE isActive = 1 AND (title LIKE ? OR barcode LIKE ? OR category LIKE ?) ORDER BY title LIMIT 50'
  ).all(pattern, pattern, pattern) as Record<string, unknown>[]).map(formatProduct)
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

export function createProduct(input: ProductInput): Product {
  const db = getDatabase()
  const result = db.prepare(`
    INSERT INTO products (barcode, title, description, imageBase64, category, unit, purchase_price, sale_price, stock, minStock, isLoose)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    input.barcode || null,
    input.title,
    input.description || '',
    input.imageBase64 || '',
    input.category || '',
    input.unit || 'number',
    input.purchase_price,
    input.sale_price,
    input.stock,
    input.minStock || 0,
    input.isLoose ? 1 : 0
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
    SET barcode = ?, title = ?, description = ?, imageBase64 = ?, category = ?, unit = ?, purchase_price = ?, sale_price = ?,
        stock = ?, minStock = ?, isLoose = ?, updatedAt = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    merged.barcode || null,
    merged.title,
    merged.description || '',
    merged.imageBase64 || '',
    merged.category || '',
    merged.unit,
    merged.purchase_price,
    merged.sale_price,
    merged.stock,
    merged.minStock || 0,
    merged.isLoose ? 1 : 0,
    id
  )
  return getProductById(id)
}

export function deleteProduct(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('UPDATE products SET isActive = 0 WHERE id = ?').run(id)
  return result.changes > 0
}

export function updateStock(productId: number, quantityChange: number): boolean {
  const db = getDatabase()
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
    unit: row.unit as 'number' | 'weight',
    purchase_price: row.purchase_price as number,
    sale_price: row.sale_price as number,
    stock: row.stock as number,
    minStock: row.minStock as number,
    isLoose: Boolean(row.isLoose),
    isActive: Boolean(row.isActive),
    createdAt: row.createdAt as string,
    updatedAt: row.updatedAt as string,
  }
}
