/**
 * Installments repository — installment payment plans and tracking.
 *
 * Supports:
 *   - Creating installment plans with down payment
 *   - Generating payment schedules with auto-calculated due dates (Shamsi)
 *   - Recording payments against installments
 *   - Tracking overdue payments with penalty calculation
 *   - Status management: active, completed, overdue, cancelled
 */

import { getDatabase } from '../connection'

export interface Installment {
  id: number
  installmentNumber: string
  saleId: number | null
  customerId: number | null
  customerName?: string
  totalAmount: number
  downPayment: number
  installmentCount: number
  monthlyAmount: number
  penaltyPercent: number
  status: string
  startDate: string
  notes: string
  createdBy: string
  createdAt: string
  payments?: InstallmentPayment[]
}

export interface InstallmentPayment {
  id: number
  installmentId: number
  installmentNumber: number
  amount: number
  dueDate: string
  paidDate: string | null
  penaltyAmount: number
  status: string
  notes: string
  createdAt: string
}

export function getAllInstallments(): Installment[] {
  const db = getDatabase()
  const rows = db.prepare(`
    SELECT i.*, c.name as customerName
    FROM installments i
    LEFT JOIN customers c ON i.customerId = c.id
    ORDER BY i.createdAt DESC
  `).all() as any[]
  return rows.map(r => ({ ...r, status: r.status, payments: undefined }))
}

export function getInstallmentById(id: number): Installment | undefined {
  const db = getDatabase()
  const row = db.prepare(`
    SELECT i.*, c.name as customerName
    FROM installments i
    LEFT JOIN customers c ON i.customerId = c.id
    WHERE i.id = ?
  `).get(id) as any
  if (!row) return undefined
  const payments = db.prepare(
    'SELECT * FROM installment_payments WHERE installmentId = ? ORDER BY installmentNumber'
  ).all(id) as InstallmentPayment[]
  return { ...row, payments }
}

export function createInstallment(data: {
  saleId?: number; customerId?: number; totalAmount: number; downPayment?: number;
  installmentCount: number; penaltyPercent?: number; startDate?: string; notes?: string; createdBy?: string
}): Installment {
  const db = getDatabase()
  const count = (db.prepare("SELECT COUNT(*) as c FROM installments").get() as { c: number }).c
  const installmentNumber = `INS-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(count + 1).padStart(4, '0')}`
  const downPayment = data.downPayment || 0
  const remainingAmount = data.totalAmount - downPayment
  const monthlyAmount = Math.ceil(remainingAmount / data.installmentCount)
  const startDate = data.startDate || new Date().toISOString().slice(0, 19).replace('T', ' ')

  const result = db.prepare(`
    INSERT INTO installments (installmentNumber, saleId, customerId, totalAmount, downPayment, installmentCount, monthlyAmount, penaltyPercent, startDate, notes, createdBy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(installmentNumber, data.saleId || null, data.customerId || null, data.totalAmount, downPayment, data.installmentCount, monthlyAmount, data.penaltyPercent || 0, startDate, data.notes || '', data.createdBy || 'admin')

  const installmentId = result.lastInsertRowid as number

  // Generate payment schedule
  const insertPayment = db.prepare(`
    INSERT INTO installment_payments (installmentId, installmentNumber, amount, dueDate, status)
    VALUES (?, ?, ?, ?, 'pending')
  `)
  const startD = new Date(startDate)
  for (let i = 0; i < data.installmentCount; i++) {
    const dueDate = new Date(startD)
    dueDate.setMonth(dueDate.getMonth() + i + 1)
    insertPayment.run(installmentId, i + 1, monthlyAmount, dueDate.toISOString().slice(0, 10))
  }

  return getInstallmentById(installmentId)!
}

export function recordPayment(installmentPaymentId: number, amount: number, notes: string = ''): boolean {
  const db = getDatabase()
  const payment = db.prepare('SELECT * FROM installment_payments WHERE id = ?').get(installmentPaymentId) as any
  if (!payment) return false

  const paidDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const alreadyPaid = payment.paidDate ? payment.amount : 0
  const totalPaid = alreadyPaid + amount
  const newStatus = totalPaid >= payment.amount ? 'paid' : 'partial'

  db.prepare("UPDATE installment_payments SET paidDate = ?, amount = ?, status = ?, notes = ? WHERE id = ?")
    .run(paidDate, totalPaid, newStatus, notes, installmentPaymentId)

  // Check if all payments are paid -> mark installment as completed
  const installment = db.prepare('SELECT * FROM installments WHERE id = ?').get(payment.installmentId) as any
  if (installment) {
    const pendingCount = (db.prepare(
      "SELECT COUNT(*) as c FROM installment_payments WHERE installmentId = ? AND status IN ('pending', 'overdue', 'partial')"
    ).get(payment.installmentId) as { c: number }).c
    if (pendingCount === 0) {
      db.prepare("UPDATE installments SET status = 'completed' WHERE id = ?").run(payment.installmentId)
    }
  }

  return true
}

export function updateOverdueInstallments(): number {
  const db = getDatabase()
  const today = new Date().toISOString().slice(0, 10)
  const result = db.prepare(
    "UPDATE installment_payments SET status = 'overdue' WHERE status = 'pending' AND dueDate < ?"
  ).run(today)
  return result.changes
}

export function getOverduePayments(): (InstallmentPayment & { customerName: string; installmentNumber: string })[] {
  const db = getDatabase()
  const today = new Date().toISOString().slice(0, 10)
  return db.prepare(`
    SELECT ip.*, i.installmentNumber, c.name as customerName
    FROM installment_payments ip
    JOIN installments i ON ip.installmentId = i.id
    LEFT JOIN customers c ON i.customerId = c.id
    WHERE ip.status IN ('pending', 'overdue') AND ip.dueDate < ?
    ORDER BY ip.dueDate ASC
  `).all(today) as any[]
}
