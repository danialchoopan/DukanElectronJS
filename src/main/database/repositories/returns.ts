import { getDatabase } from '../connection'

export interface Return {
  id: number
  saleId: number | null
  userId: number | null
  productId: number | null
  quantity: number
  reason: string
  refundAmount: number
  status: string
  createdAt: string
  saleInvoiceNumber?: string
  productTitle?: string
  userName?: string
}

export function createReturn(saleId: number, userId: number, productId: number, quantity: number, reason: string, refundAmount: number): Return {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO returns (saleId, userId, productId, quantity, reason, refundAmount, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(saleId, userId, productId, quantity, reason, refundAmount, 'completed')
  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(quantity, productId)
  if (saleId) {
    db.prepare('UPDATE sales SET total_amount = total_amount - ?, totalNetProfit = totalNetProfit - ? WHERE id = ?').run(refundAmount, refundAmount, saleId)
  }
  return db.prepare('SELECT r.*, s.invoiceNumber as saleInvoiceNumber, p.title as productTitle, u.name as userName FROM returns r LEFT JOIN sales s ON r.saleId = s.id LEFT JOIN products p ON r.productId = p.id LEFT JOIN users u ON r.userId = u.id WHERE r.id = ?').get(result.lastInsertRowid) as Return
}

export function getReturns(limit: number = 100): Return[] {
  const db = getDatabase()
  return db.prepare('SELECT r.*, s.invoiceNumber as saleInvoiceNumber, p.title as productTitle, u.name as userName FROM returns r LEFT JOIN sales s ON r.saleId = s.id LEFT JOIN products p ON r.productId = p.id LEFT JOIN users u ON r.userId = u.id ORDER BY r.createdAt DESC LIMIT ?').all(limit) as Return[]
}

export function getReturnStats(): { totalReturns: number; totalRefund: number; todayReturns: number } {
  const db = getDatabase()
  const total = (db.prepare('SELECT COUNT(*) as c, COALESCE(SUM(refundAmount), 0) as refund FROM returns').get() as { c: number; refund: number })
  const today = (db.prepare("SELECT COUNT(*) as c FROM returns WHERE date(createdAt) = date('now', 'localtime')").get() as { c: number }).c
  return { totalReturns: total.c, totalRefund: total.refund, todayReturns: today }
}
