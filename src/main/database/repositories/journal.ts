import { getDatabase } from '../connection'
import type { JournalEntry, JournalLine, JournalEntryWithLines, TrialBalanceRow, LedgerRow } from '../../../types'
import { getAccountByCode } from './accounts'

interface JournalLineInput {
  accountId: number; debit: number; credit: number; description?: string
}

export function createJournalEntry(data: {
  entryDate: string; description: string
  referenceType?: string; referenceId?: number
  lines: JournalLineInput[]; createdBy?: number
}): JournalEntry {
  const db = getDatabase()
  const totalDebit = data.lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = data.lines.reduce((s, l) => s + l.credit, 0)
  if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error(`Debit ${totalDebit} ≠ Credit ${totalCredit}`)

  const entry = db.transaction(() => {
    const r = db.prepare(
      'INSERT INTO journal_entries (entryDate, description, referenceType, referenceId, isPosted, createdBy) VALUES (?, ?, ?, ?, 1, ?)'
    ).run(data.entryDate, data.description, data.referenceType ?? null, data.referenceId ?? null, data.createdBy ?? null)
    const entryId = r.lastInsertRowid as number
    const insertLine = db.prepare(
      'INSERT INTO journal_entry_lines (entryId, accountId, debit, credit, description) VALUES (?, ?, ?, ?, ?)'
    )
    for (const line of data.lines) {
      insertLine.run(entryId, line.accountId, line.debit, line.credit, line.description ?? '')
    }
    return entryId
  })()

  return db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(entry) as JournalEntry
}

export function postSaleJournal(saleId: number, saleDate: string, data: {
  items: { purchasePrice: number; quantity: number }[]
  total_amount: number; paymentMethod: string
}): void {
  const cashAcct = getAccountByCode('1100')!
  const bankAcct = getAccountByCode('1200')!
  const arAcct = getAccountByCode('1400')!
  const salesAcct = getAccountByCode('4100')!
  const inventoryAcct = getAccountByCode('1300')!
  const cogsAcct = getAccountByCode('5100')!

  const cogs = data.items.reduce((s, i) => s + i.purchasePrice * i.quantity, 0)
  const receiveAccount = data.paymentMethod === 'cash' ? cashAcct : data.paymentMethod === 'card' ? bankAcct : arAcct

  createJournalEntry({
    entryDate: saleDate, description: `فروش فاکتور #${saleId}`,
    referenceType: 'sale', referenceId: saleId,
    lines: [
      { accountId: receiveAccount.id, debit: data.total_amount, credit: 0, description: 'دریافت وجه' },
      { accountId: salesAcct.id, debit: 0, credit: data.total_amount, description: 'درآمد فروش' },
      { accountId: cogsAcct.id, debit: cogs, credit: 0, description: 'بهای تمام شده' },
      { accountId: inventoryAcct.id, debit: 0, credit: cogs, description: 'کاهش موجودی' },
    ]
  })
}

export function postExpenseJournal(expenseId: number, expenseDate: string, amount: number, category: string): void {
  const cashAcct = getAccountByCode('1100')!
  const categoryMap: Record<string, string> = {
    'اجاره': '6100', 'قبوض': '6200', 'حقوق': '6300', 'لوازم': '6400',
    'تعمیرات': '6500', 'حمل\u200cونقل': '6600',
  }
  const code = categoryMap[category] || '6700'
  const expenseAcct = getAccountByCode(code) || getAccountByCode('6700')!

  createJournalEntry({
    entryDate: expenseDate, description: `هزینه: ${category}`,
    referenceType: 'expense', referenceId: expenseId,
    lines: [
      { accountId: expenseAcct.id, debit: amount, credit: 0, description: category },
      { accountId: cashAcct.id, debit: 0, credit: amount, description: 'پرداخت نقدی' },
    ]
  })
}

export function postReturnJournal(returnId: number, returnDate: string, refundAmount: number): void {
  const cashAcct = getAccountByCode('1100')!
  const salesAcct = getAccountByCode('4100')!
  const inventoryAcct = getAccountByCode('1300')!
  const cogsAcct = getAccountByCode('5100')!

  createJournalEntry({
    entryDate: returnDate, description: `مرجوعی فاکتور #${returnId}`,
    referenceType: 'return', referenceId: returnId,
    lines: [
      { accountId: salesAcct.id, debit: refundAmount, credit: 0, description: 'کاهش درآمد' },
      { accountId: cashAcct.id, debit: 0, credit: refundAmount, description: 'بازپرداخت وجه' },
      { accountId: inventoryAcct.id, debit: refundAmount, credit: 0, description: 'افزایش موجودی' },
      { accountId: cogsAcct.id, debit: 0, credit: refundAmount, description: 'کاهش بهای تمام شده' },
    ]
  })
}

export function getJournalEntries(filters: {
  startDate?: string; endDate?: string; referenceType?: string
  limit?: number; offset?: number
}): { entries: JournalEntry[]; total: number } {
  const db = getDatabase()
  let where = 'WHERE 1=1'
  const params: any[] = []
  if (filters.startDate) { where += ' AND entryDate >= ?'; params.push(filters.startDate) }
  if (filters.endDate) { where += ' AND entryDate <= ?'; params.push(filters.endDate) }
  if (filters.referenceType) { where += ' AND referenceType = ?'; params.push(filters.referenceType) }
  const total = (db.prepare(`SELECT COUNT(*) as c FROM journal_entries ${where}`).get(...params) as { c: number }).c
  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0
  const entries = db.prepare(`SELECT * FROM journal_entries ${where} ORDER BY entryDate DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset) as JournalEntry[]
  return { entries, total }
}

export function getJournalEntryById(id: number): JournalEntryWithLines | undefined {
  const db = getDatabase()
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id) as JournalEntry | undefined
  if (!entry) return undefined
  const lines = db.prepare('SELECT * FROM journal_entry_lines WHERE entryId = ? ORDER BY id').all(id) as JournalLine[]
  return { ...entry, lines }
}

export function getTrialBalance(startDate?: string, endDate?: string): TrialBalanceRow[] {
  const db = getDatabase()
  let joinClause = ''
  let whereClause = ''
  const params: any[] = []
  if (startDate || endDate) {
    joinClause = 'JOIN journal_entries je ON je.id = jel.entryId'
    if (startDate) { whereClause += ' AND je.entryDate >= ?'; params.push(startDate) }
    if (endDate) { whereClause += ' AND je.entryDate <= ?'; params.push(endDate) }
  }
  return db.prepare(`
    SELECT a.id as accountId, a.code as accountCode, a.name as accountName, a.type as accountType,
           COALESCE(SUM(jel.debit), 0) as totalDebit,
           COALESCE(SUM(jel.credit), 0) as totalCredit,
           COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.accountId = a.id
    ${joinClause}
    WHERE a.isActive = 1 ${whereClause}
    GROUP BY a.id
    ORDER BY a.code
  `).all(...params) as TrialBalanceRow[]
}

export function getGeneralLedger(accountId: number, startDate?: string, endDate?: string): LedgerRow[] {
  const db = getDatabase()
  let where = 'WHERE jel.accountId = ?'
  const params: any[] = [accountId]
  if (startDate) { where += ' AND je.entryDate >= ?'; params.push(startDate) }
  if (endDate) { where += ' AND je.entryDate <= ?'; params.push(endDate) }
  const rows = db.prepare(`
    SELECT je.entryDate, jel.description, je.referenceType,
           jel.debit, jel.credit
    FROM journal_entry_lines jel
    JOIN journal_entries je ON je.id = jel.entryId
    ${where}
    ORDER BY je.entryDate, je.id
  `).all(...params) as Omit<LedgerRow, 'balance'>[]
  let runningBalance = 0
  return rows.map(r => {
    runningBalance += r.debit - r.credit
    return { ...r, balance: runningBalance }
  })
}
