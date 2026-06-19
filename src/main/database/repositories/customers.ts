import { getDatabase } from '../connection'
import type { Customer, CustomerInput, CustomerLedgerEntry } from '../../../types'

export function getAllCustomers(): Customer[] {
  const db = getDatabase()
  return db.prepare('SELECT * FROM customers WHERE isActive = 1 ORDER BY name').all() as Customer[]
}

export function getCustomerById(id: number): Customer | undefined {
  const db = getDatabase()
  const r = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!r) return undefined
  return { id: r.id as number, name: r.name as string, phone: r.phone as string, balance: r.balance as number, address: (r.address as string) || '', notes: (r.notes as string) || '', isActive: r.isActive as boolean, createdAt: r.createdAt as string }
}

export function searchCustomers(query: string): Customer[] {
  const db = getDatabase()
  const pattern = `%${query}%`
  return db.prepare('SELECT * FROM customers WHERE isActive = 1 AND (name LIKE ? OR phone LIKE ?) ORDER BY name LIMIT 20').all(pattern, pattern) as Customer[]
}

export function createCustomer(input: CustomerInput): Customer {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO customers (name, phone, address, notes) VALUES (?, ?, ?, ?)').run(input.name, input.phone, input.address || '', input.notes || '')
  return getCustomerById(result.lastInsertRowid as number)!
}

export function updateCustomer(id: number, input: Partial<CustomerInput>): Customer | undefined {
  const db = getDatabase()
  const existing = getCustomerById(id)
  if (!existing) return undefined
  const merged = { ...existing, ...input }
  db.prepare('UPDATE customers SET name = ?, phone = ?, address = ?, notes = ? WHERE id = ?').run(merged.name, merged.phone, merged.address || '', merged.notes || '', id)
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

export function addLedgerEntry(customerId: number, saleId: number | null, type: 'charge' | 'payment' | 'sale', amount: number, description: string, images?: string[]): CustomerLedgerEntry {
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
      type: r.type as 'charge' | 'payment' | 'sale',
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
  return db.prepare('SELECT * FROM sales WHERE customerId = ? ORDER BY createdAt DESC').all(customerId)
}

export function deleteCustomerSoft(id: number): { success: boolean; error?: string } {
  const db = getDatabase()
  const customer = db.prepare('SELECT balance FROM customers WHERE id = ? AND isActive = 1').get(id) as { balance: number } | undefined
  if (!customer) return { success: false, error: 'مشتری یافت نشد' }
  if (customer.balance < 0) return { success: false, error: 'این مشتری بدهی دارد. ابتدا بدهی را تسویه کنید.' }
  db.prepare('UPDATE customers SET isActive = 0 WHERE id = ?').run(id)
  return { success: true }
}

export function getAllCustomersWithStats(): (Customer & { purchaseCount: number; lastPurchaseDate: string | null })[] {
  const db = getDatabase()
  const customers = db.prepare('SELECT * FROM customers WHERE isActive = 1 ORDER BY name').all() as Customer[]
  return customers.map(c => {
    const pc = (db.prepare('SELECT COUNT(*) as c FROM sales WHERE customerId = ?').get(c.id) as { c: number }).c
    const lp = db.prepare('SELECT createdAt FROM sales WHERE customerId = ? ORDER BY createdAt DESC LIMIT 1').get(c.id) as { createdAt: string } | undefined
    return { ...c, purchaseCount: pc, lastPurchaseDate: lp?.createdAt || null }
  })
}
