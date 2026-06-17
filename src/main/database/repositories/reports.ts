import { getDatabase } from '../connection'
import type { ProfitLossReport, BalanceSheetReport, ARAgingReport, ARAgingRow } from '../../../types'

function getAccountDetails(codePrefix: string, isDebitNormal: boolean, startDate?: string, endDate?: string): { accountCode: string; accountName: string; amount: number }[] {
  const db = getDatabase()
  let where = "WHERE a.code LIKE ? AND a.isActive = 1 AND a.parentId IS NOT NULL"
  const params: any[] = [codePrefix + '%']
  if (startDate) { where += ' AND je.entryDate >= ?'; params.push(startDate) }
  if (endDate) { where += ' AND je.entryDate <= ?'; params.push(endDate) }
  const rows = db.prepare(`
    SELECT a.code as accountCode, a.name as accountName,
           COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as rawBalance
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON jel.accountId = a.id
    LEFT JOIN journal_entries je ON je.id = jel.entryId
    ${where}
    GROUP BY a.id
    HAVING rawBalance != 0
    ORDER BY a.code
  `).all(...params) as { accountCode: string; accountName: string; rawBalance: number }[]
  return rows.map(r => ({
    accountCode: r.accountCode, accountName: r.accountName,
    amount: isDebitNormal ? Math.abs(r.rawBalance) : Math.abs(r.rawBalance)
  }))
}

export function generateProfitLoss(startDate?: string, endDate?: string): ProfitLossReport {
  const revenue = getAccountDetails('4', false, startDate, endDate)
  const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0)
  const cogs = getAccountDetails('5', true, startDate, endDate)
  const totalCogs = cogs.reduce((s, r) => s + r.amount, 0)
  const operatingExpenses = getAccountDetails('6', true, startDate, endDate)
  const totalOperatingExpenses = operatingExpenses.reduce((s, r) => s + r.amount, 0)
  return {
    revenue, totalRevenue,
    cogs, totalCogs, grossProfit: totalRevenue - totalCogs,
    operatingExpenses, totalOperatingExpenses,
    netProfit: totalRevenue - totalCogs - totalOperatingExpenses
  }
}

export function generateBalanceSheet(asOfDate?: string): BalanceSheetReport {
  const getDetails = (code: string) => {
    const db = getDatabase()
    let where = "WHERE a.code LIKE ? AND a.isActive = 1 AND a.parentId IS NOT NULL"
    const params: any[] = [code + '%']
    if (asOfDate) { where += ' AND je.entryDate <= ?'; params.push(asOfDate) }
    return db.prepare(`
      SELECT a.code as accountCode, a.name as accountName,
             COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as rawBalance
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON jel.accountId = a.id
      LEFT JOIN journal_entries je ON je.id = jel.entryId
      ${where}
      GROUP BY a.id
      HAVING rawBalance != 0
      ORDER BY a.code
    `).all(...params) as { accountCode: string; accountName: string; rawBalance: number }[]
  }

  const currentAssetRows = getDetails('1')
  const currentAssets = currentAssetRows.map(r => ({ accountCode: r.accountCode, accountName: r.accountName, amount: Math.abs(r.rawBalance) }))
  const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.amount, 0)

  const liabRows = getDetails('2')
  const currentLiabilities = liabRows.map(r => ({ accountCode: r.accountCode, accountName: r.accountName, amount: Math.abs(r.rawBalance) }))
  const totalCurrentLiabilities = currentLiabilities.reduce((s, a) => s + a.amount, 0)

  const equityRows = getDetails('3')
  const pl = generateProfitLoss(undefined, asOfDate)
  const equityItems = [...equityRows.map(r => ({ accountCode: r.accountCode, accountName: r.accountName, amount: Math.abs(r.rawBalance) }))]
  if (pl.netProfit !== 0) equityItems.push({ accountCode: '3200', accountName: 'سود انباشته', amount: Math.abs(pl.netProfit) })
  const totalEquity = equityItems.reduce((s, e) => s + e.amount, 0)

  return {
    currentAssets, totalCurrentAssets,
    longTermAssets: [], totalLongTermAssets: 0,
    totalAssets: totalCurrentAssets,
    currentLiabilities, totalCurrentLiabilities,
    longTermLiabilities: [], totalLongTermLiabilities: 0,
    totalLiabilities: totalCurrentLiabilities,
    equityItems, totalEquity,
    totalLiabilitiesAndEquity: totalCurrentLiabilities + totalEquity
  }
}

export function generateARAging(): ARAgingReport {
  const db = getDatabase()
  const customers = db.prepare('SELECT id, name, phone, balance FROM customers WHERE balance > 0 AND isActive = 1').all() as { id: number; name: string; phone: string; balance: number }[]
  const today = new Date()
  const rows: ARAgingRow[] = customers.map(c => {
    const entries = db.prepare(
      "SELECT createdAt FROM customer_ledger WHERE customerId = ? AND type = 'sale' ORDER BY createdAt"
    ).all(c.id) as { createdAt: string }[]
    let current = 0, d31 = 0, d61 = 0, over90 = 0
    if (entries.length === 0) {
      current = c.balance
    } else {
      let remaining = c.balance
      for (const e of entries) {
        const entryDate = new Date(e.createdAt)
        const days = Math.floor((today.getTime() - entryDate.getTime()) / 86400000)
        if (days <= 30) current += remaining / entries.length
        else if (days <= 60) d31 += remaining / entries.length
        else if (days <= 90) d61 += remaining / entries.length
        else over90 += remaining / entries.length
      }
      current = Math.round(current); d31 = Math.round(d31); d61 = Math.round(d61); over90 = Math.round(over90)
    }
    return { customerId: c.id, customerName: c.name, phone: c.phone, current, days31to60: d31, days61to90: d61, over90, total: c.balance }
  })
  const totals = rows.reduce((acc, r) => ({
    current: acc.current + r.current, days31to60: acc.days31to60 + r.days31to60,
    days61to90: acc.days61to90 + r.days61to90, over90: acc.over90 + r.over90, total: acc.total + r.total
  }), { current: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 })
  return { rows, totals }
}
