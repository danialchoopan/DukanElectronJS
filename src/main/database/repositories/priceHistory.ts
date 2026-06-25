/**
 * Price History repository — tracks all product price changes over time.
 * Records old and new prices for both sale and purchase prices.
 * Used by the Price History tab in accounting for trend analysis.
 */

import { getDatabase } from '../connection'

/** Records a price change for a product. Called when product price is updated. */
export function logPriceChange(productId: number, priceType: 'sale' | 'purchase', oldPrice: number, newPrice: number, changedBy: string = 'system'): void {
  const db = getDatabase()
  db.prepare(
    'INSERT INTO price_history (productId, priceType, oldPrice, newPrice, changedBy, changedAt) VALUES (?, ?, ?, ?, ?, datetime("now","localtime"))'
  ).run(productId, priceType, oldPrice, newPrice, changedBy)
}

/** Returns price history for a product, optionally filtered by type and date range. */
export function getPriceHistory(productId?: number, priceType?: string, startDate?: string, endDate?: string): any[] {
  const db = getDatabase()
  let where = 'WHERE 1=1'
  const params: any[] = []
  if (productId) { where += ' AND ph.productId = ?'; params.push(productId) }
  if (priceType) { where += ' AND ph.priceType = ?'; params.push(priceType) }
  if (startDate) { where += ' AND ph.changedAt >= ?'; params.push(startDate) }
  if (endDate) { where += ' AND ph.changedAt <= ?'; params.push(endDate) }
  return db.prepare(`
    SELECT ph.*, p.title as productName, p.barcode
    FROM price_history ph
    LEFT JOIN products p ON p.id = ph.productId
    ${where}
    ORDER BY ph.changedAt DESC
  `).all(...params) as any[]
}

/** Returns price history grouped by product for the Price History tab. */
export function getPriceHistoryByProduct(productId: number): { saleHistory: any[]; purchaseHistory: any[] } {
  const db = getDatabase()
  const saleHistory = db.prepare(
    "SELECT * FROM price_history WHERE productId = ? AND priceType = 'sale' ORDER BY changedAt DESC"
  ).all(productId) as any[]
  const purchaseHistory = db.prepare(
    "SELECT * FROM price_history WHERE productId = ? AND priceType = 'purchase' ORDER BY changedAt DESC"
  ).all(productId) as any[]
  return { saleHistory, purchaseHistory }
}

/** Returns the most recent sale price and purchase price for each product. */
export function getLatestPrices(): any[] {
  const db = getDatabase()
  return db.prepare(`
    SELECT p.id, p.title, p.barcode, p.sale_price, p.purchase_price,
           (SELECT ph.newPrice FROM price_history ph WHERE ph.productId = p.id AND ph.priceType = 'sale' ORDER BY ph.changedAt DESC LIMIT 1) as lastSaleChange,
           (SELECT ph.newPrice FROM price_history ph WHERE ph.productId = p.id AND ph.priceType = 'purchase' ORDER BY ph.changedAt DESC LIMIT 1) as lastPurchaseChange
    FROM products p WHERE p.isActive = 1 ORDER BY p.title
  `).all() as any[]
}
