import { getDatabase } from '../connection'
import type { Customer, CustomerInput, CustomerLedgerEntry } from '../../../types'

export function getAllCustomers(): Customer[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM customers WHERE isActive = 1 ORDER BY name').all() as Customer[]
}

export function getCustomerById(id: number): Customer | undefined {
  const db = getDatabase()
  return db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined
}

export function searchCustomers(query: string): Customer[] {
  const db = getDatabase()
  const pattern = `%${query}%`
  return db.prepare('SELECT * FROM customers WHERE isActive = 1 AND (name LIKE ? OR phone LIKE ?) ORDER BY name LIMIT 20').all(pattern, pattern) as Customer[]
}

export function createCustomer(input: CustomerInput): Customer {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO customers (name, phone, address, notes, customerType, description, imageBase64) VALUES (?, ?, ?, ?, ?, ?, ?)').run(input.name, input.phone, input.address || '', input.notes || '', input.customerType || 'real', input.description || '', input.imageBase64 || '')
  return getCustomerById(result.lastInsertRowid as number)!
}

export function updateCustomer(id: number, input: Partial<CustomerInput>): Customer | undefined {
  const db = getDatabase()
  const existing = getCustomerById(id)
  if (!existing) return undefined
  const merged = { ...existing, ...input }
  db.prepare('UPDATE customers SET name = ?, phone = ?, address = ?, notes = ?, customerType = ?, description = ?, imageBase64 = ? WHERE id = ?').run(merged.name, merged.phone, merged.address || '', merged.notes || '', merged.customerType || 'real', merged.description || '', merged.imageBase64 || '', id)
  return getCustomerById(id)
}

export function deleteCustomer(id: number): boolean {
  const db = getDatabase()
  const result = db.prepare('UPDATE customers SET isActive = 0 WHERE id = ?').run(id)
  return result.changes > 0
}

export function updateCustomerBalance(customerId: number, amountChange: number): boolean {
  const db = getDatabase()
  const result = db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').run(amountChange, customerId)
  return result.changes > 0
}

export function addLedgerEntry(customerId: number, saleId: number | null, type: 'charge' | 'payment' | 'sale' | 'debt', amount: number, description: string, images?: string[]): CustomerLedgerEntry {
  const db = getDatabase()
  const imagesJson = JSON.stringify(images || [])
  const result = db.prepare(
    'INSERT INTO customer_ledger (customerId, saleId, type, amount, description, images) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(customerId, saleId, type, amount, description, imagesJson)
  return {
    id: result.lastInsertRowid as number,
    customerId,
    saleId: saleId ?? undefined,
    type,
    amount,
    description,
    images: images || [],
    createdAt: new Date().toISOString(),
  }
}

export function getLedgerEntries(customerId: number): CustomerLedgerEntry[] {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM customer_ledger WHERE customerId = ? ORDER BY createdAt DESC').all(customerId) as Record<string, unknown>[]).map(r => {
    let images: string[] = []
    try { images = JSON.parse(r.images as string || '[]') } catch {}
    return {
      id: r.id as number,
      customerId: r.customerId as number,
      saleId: (r.saleId as number) ?? undefined,
      type: r.type as 'charge' | 'payment' | 'sale' | 'debt',
      amount: r.amount as number,
      description: r.description as string,
      images,
      createdAt: r.createdAt as string,
    }
  })
}

export function getCustomerStats(): { totalCustomers: number; totalDebtors: number; totalCreditors: number; totalDebtAmount: number; totalCreditAmount: number } {
  const db = getDatabase()
  const total = (db.prepare('SELECT COUNT(*) as c FROM customers WHERE isActive = 1').get() as { c: number }).c
  const debtors = (db.prepare('SELECT COUNT(*) as c FROM customers WHERE balance < 0 AND isActive = 1').get() as { c: number }).c
  const creditors = (db.prepare('SELECT COUNT(*) as c FROM customers WHERE balance > 0 AND isActive = 1').get() as { c: number }).c
  const totalDebt = (db.prepare('SELECT COALESCE(SUM(balance), 0) as t FROM customers WHERE balance < 0 AND isActive = 1').get() as { t: number }).t
  const totalCredit = (db.prepare('SELECT COALESCE(SUM(balance), 0) as t FROM customers WHERE balance > 0 AND isActive = 1').get() as { t: number }).t
  return { totalCustomers: total, totalDebtors: debtors, totalCreditors: creditors, totalDebtAmount: Math.abs(totalDebt), totalCreditAmount: totalCredit }
}

export function getCustomerWithStats(id: number) {
  const db = getDatabase()
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any
  if (!customer) return null
  const purchaseCount = (db.prepare('SELECT COUNT(*) as c FROM sales WHERE customerId = ?').get(id) as { c: number }).c
  const totalSpent = (db.prepare('SELECT COALESCE(SUM(total_amount), 0) as t FROM sales WHERE customerId = ?').get(id) as { t: number }).t
  const lastPurchase = db.prepare('SELECT createdAt FROM sales WHERE customerId = ? ORDER BY createdAt DESC LIMIT 1').get(id) as { createdAt: string } | undefined
  return { ...customer, purchaseCount, totalSpent, lastPurchaseDate: lastPurchase?.createdAt || null }
}

export function getCustomerPurchaseHistory(customerId: number) {
  const db = getDatabase()
  const sales = db.prepare('SELECT * FROM sales WHERE customerId = ? ORDER BY createdAt DESC').all(customerId) as any[]
  return sales.map(s => {
    const items = db.prepare('SELECT * FROM sale_items WHERE saleId = ?').all(s.id)
    return { ...s, items }
  })
}

export function deleteCustomerSoft(id: number): { success: boolean; error?: string } {
  const db = getDatabase()
  const customer = db.prepare('SELECT balance FROM customers WHERE id = ? AND isActive = 1').get(id) as { balance: number } | undefined
  if (!customer) return { success: false, error: 'مشتری یافت نشد' }
  if (customer.balance < 0) return { success: false, error: 'این مشتری بدهی دارد. ابتدا بدهی را تسویه کنید.' }
  db.prepare('UPDATE customers SET isActive = 0 WHERE id = ?').run(id)
  return { success: true }
}

export function deleteLedgerEntry(entryId: number): { success: boolean; error?: string } {
  const db = getDatabase()
  const entry = db.prepare('SELECT * FROM customer_ledger WHERE id = ?').get(entryId) as any
  if (!entry) return { success: false, error: 'رکورد یافت نشد' }

  db.transaction(() => {
    if (entry.type === 'charge' || entry.type === 'debt') {
      db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?').run(entry.amount, entry.customerId)
    } else if (entry.type === 'payment') {
      db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?').run(entry.amount, entry.customerId)
    }
    db.prepare('DELETE FROM customer_ledger WHERE id = ?').run(entryId)
  })()

  return { success: true }
}

export function getAllCustomersWithStats(): (Customer & { purchaseCount: number; lastPurchaseDate: string | null })[] {
  const db = getDatabase()
  const customers = db.prepare('SELECT * FROM customers WHERE isActive = 1 ORDER BY name').all() as Customer[]
  return customers.map(c => {
    const pc = (db.prepare('SELECT COUNT(*) as c FROM sales WHERE customerId = ?').get(c.id) as { c: number }).c
    const ts = (db.prepare('SELECT COALESCE(SUM(total_amount), 0) as t FROM sales WHERE customerId = ?').get(c.id) as { t: number }).t
    const lp = db.prepare('SELECT createdAt FROM sales WHERE customerId = ? ORDER BY createdAt DESC LIMIT 1').get(c.id) as { createdAt: string } | undefined
    return { ...c, purchaseCount: pc, totalSpent: ts, lastPurchaseDate: lp?.createdAt || null }
  })
}
