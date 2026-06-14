import { getDatabase } from '../connection'
import type { Customer, CustomerInput, CustomerLedgerEntry } from '../../../types'

export function getAllCustomers(): Customer[] {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM customers WHERE isActive = 1 ORDER BY name')
    .all() as Record<string, unknown>[]).map(r => ({
    id: r.id as number,
    name: r.name as string,
    phone: r.phone as string,
    balance: r.balance as number,
    createdAt: r.createdAt as string,
  }))
}

export function getCustomerById(id: number): Customer | undefined {
  const db = getDatabase()
  const r = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!r) return undefined
  return { id: r.id as number, name: r.name as string, phone: r.phone as string, balance: r.balance as number, createdAt: r.createdAt as string }
}

export function searchCustomers(query: string): Customer[] {
  const db = getDatabase()
  const pattern = `%${query}%`
  return (db.prepare('SELECT * FROM customers WHERE isActive = 1 AND (name LIKE ? OR phone LIKE ?) ORDER BY name LIMIT 20')
    .all(pattern, pattern) as Record<string, unknown>[]).map(r => ({
    id: r.id as number, name: r.name as string, phone: r.phone as string, balance: r.balance as number, createdAt: r.createdAt as string,
  }))
}

export function createCustomer(input: CustomerInput): Customer {
  const db = getDatabase()
  const result = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run(input.name, input.phone)
  return getCustomerById(result.lastInsertRowid as number)!
}

export function updateCustomer(id: number, input: Partial<CustomerInput>): Customer | undefined {
  const db = getDatabase()
  const existing = getCustomerById(id)
  if (!existing) return undefined
  const merged = { ...existing, ...input }
  db.prepare('UPDATE customers SET name = ?, phone = ? WHERE id = ?').run(merged.name, merged.phone, id)
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

export function addLedgerEntry(customerId: number, saleId: number | null, type: 'charge' | 'payment' | 'sale', amount: number, description: string): CustomerLedgerEntry {
  const db = getDatabase()
  const result = db.prepare(
    'INSERT INTO customer_ledger (customerId, saleId, type, amount, description) VALUES (?, ?, ?, ?, ?)'
  ).run(customerId, saleId, type, amount, description)
  return {
    id: result.lastInsertRowid as number,
    customerId,
    saleId: saleId ?? undefined,
    type,
    amount,
    description,
    createdAt: new Date().toISOString(),
  }
}

export function getLedgerEntries(customerId: number): CustomerLedgerEntry[] {
  const db = getDatabase()
  return (db.prepare('SELECT * FROM customer_ledger WHERE customerId = ? ORDER BY createdAt DESC').all(customerId) as Record<string, unknown>[]).map(r => ({
    id: r.id as number,
    customerId: r.customerId as number,
    saleId: (r.saleId as number) ?? undefined,
    type: r.type as 'charge' | 'payment' | 'sale',
    amount: r.amount as number,
    description: r.description as string,
    createdAt: r.createdAt as string,
  }))
}
