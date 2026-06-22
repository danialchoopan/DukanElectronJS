import { getDatabase } from '../connection'

export interface Supplier {
  id: number; name: string; phone: string; email: string; address: string
  company: string; taxId: string; balance: number; description: string
  isActive: number; createdAt: string
}

export interface SupplierInput {
  name: string; phone?: string; email?: string; address?: string
  company?: string; taxId?: string; description?: string
}

export interface SupplierLedgerEntry {
  id: number; supplierId: number; purchaseId?: number; type: string
  amount: number; description: string; createdAt: string
}

export interface Purchase {
  id: number; invoiceNumber: string; supplierId: number
  subtotal: number; taxAmount: number; discountAmount: number
  totalAmount: number; paidAmount: number; paymentMethod: string
  status: string; notes: string; purchaseDate: string; createdAt: string
  supplierName?: string; items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: number; purchaseId: number; productId: number
  productTitle: string; quantity: number; unitCost: number; subtotal: number
}

export interface PurchaseInput {
  supplierId: number; items: { productId: number; productTitle: string; quantity: number; unitCost: number }[]
  taxAmount?: number; discountAmount?: number; paidAmount?: number
  paymentMethod?: string; notes?: string; purchaseDate?: string
}

export function getAllSuppliers(): Supplier[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM suppliers WHERE isActive = 1 ORDER BY name').all() as Supplier[]
}

export function getSupplierById(id: number): Supplier | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id) as Supplier | undefined
}

export function searchSuppliers(query: string): Supplier[] {
  const db = getDatabase()
  const pattern = `%${query}%`
  return db.prepare('SELECT * FROM suppliers WHERE isActive = 1 AND (name LIKE ? OR phone LIKE ? OR company LIKE ?) ORDER BY name LIMIT 20').all(pattern, pattern, pattern) as Supplier[]
}

export function createSupplier(input: SupplierInput): Supplier {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO suppliers (name, phone, email, address, company, taxId, description) VALUES (?, ?, ?, ?, ?, ?, ?)').run(input.name, input.phone || '', input.email || '', input.address || '', input.company || '', input.taxId || '', input.description || '')
  return getSupplierById(result.lastInsertRowid as number)!
}

export function updateSupplier(id: number, input: Partial<SupplierInput>): Supplier | undefined {
  const db = getDatabase()
  const existing = getSupplierById(id)
  if (!existing) return undefined
  const merged = { ...existing, ...input }
  db.prepare('UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ?, company = ?, taxId = ?, description = ? WHERE id = ?').run(merged.name, merged.phone, merged.email, merged.address, merged.company, merged.taxId, merged.description, id)
  return getSupplierById(id)
}

export function deleteSupplier(id: number): { success: boolean; error?: string } {
  const db = getDatabase()
  const supplier = db.prepare('SELECT balance FROM suppliers WHERE id = ? AND isActive = 1').get(id) as { balance: number } | undefined
  if (!supplier) return { success: false, error: 'تأمین\u200cکننده یافت نشد' }
  if (supplier.balance > 0) return { success: false, error: 'این تأمین\u200cکننده بدهی دارد. ابتدا بدهی را تسویه کنید.' }
  db.prepare('UPDATE suppliers SET isActive = 0 WHERE id = ?').run(id)
  return { success: true }
}

export function updateSupplierBalance(supplierId: number, amountChange: number): boolean {
  const db = getDatabase()
  const result = db.prepare('UPDATE suppliers SET balance = balance + ? WHERE id = ?').run(amountChange, supplierId)
  return result.changes > 0
}

export function addSupplierLedgerEntry(supplierId: number, purchaseId: number | null, type: SupplierLedgerEntry['type'], amount: number, description: string): SupplierLedgerEntry {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO supplier_ledger (supplierId, purchaseId, type, amount, description) VALUES (?, ?, ?, ?, ?)').run(supplierId, purchaseId, type, amount, description)
  return { id: result.lastInsertRowid as number, supplierId, purchaseId: purchaseId ?? undefined, type, amount, description, createdAt: new Date().toISOString() }
}

export function getSupplierLedgerEntries(supplierId: number): SupplierLedgerEntry[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM supplier_ledger WHERE supplierId = ? ORDER BY createdAt DESC').all(supplierId) as SupplierLedgerEntry[]
}

export function getSupplierStats(): { totalSuppliers: number; totalDebtors: number; totalDebtAmount: number } {
  const db = getDatabase()
  const total = (db.prepare('SELECT COUNT(*) as c FROM suppliers WHERE isActive = 1').get() as { c: number }).c
  const debtors = (db.prepare('SELECT COUNT(*) as c FROM suppliers WHERE balance > 0 AND isActive = 1').get() as { c: number }).c
  const totalDebt = (db.prepare('SELECT COALESCE(SUM(balance), 0) as t FROM suppliers WHERE balance > 0 AND isActive = 1').get() as { t: number }).t
  return { totalSuppliers: total, totalDebtors: debtors, totalDebtAmount: totalDebt }
}

export function deleteSupplierLedgerEntry(entryId: number): { success: boolean; error?: string } {
  const db = getDatabase()
  const entry = db.prepare('SELECT * FROM supplier_ledger WHERE id = ?').get(entryId) as any
  if (!entry) return { success: false, error: 'رکورد یافت نشد' }
  db.transaction(() => {
    if (entry.type === 'purchase' || entry.type === 'debt' || entry.type === 'adjustment') {
      db.prepare('UPDATE suppliers SET balance = balance - ? WHERE id = ?').run(entry.amount, entry.supplierId)
    } else if (entry.type === 'payment' || entry.type === 'return') {
      db.prepare('UPDATE suppliers SET balance = balance + ? WHERE id = ?').run(entry.amount, entry.supplierId)
    }
    db.prepare('DELETE FROM supplier_ledger WHERE id = ?').run(entryId)
  })()
  return { success: true }
}
