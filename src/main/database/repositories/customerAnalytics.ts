/**
 * Customer Analytics repository — customer behavior analysis and category profit reporting.
 *
 * Provides three report types:
 *   1. Best Customers: top customers by volume/revenue with CLV and tier system
 *   2. Category Profit Margin: per-category revenue, cost, profit, margin %
 *   3. Customer Purchase Patterns: frequency, retention, churn analysis
 *
 * Customer tier system: VIP (>10M), Gold (5-10M), Silver (2-5M), Bronze (<2M) based on total spent.
 */

import { getDatabase } from '../connection'

// ─── Best Customers ──────────────────────────────────────

export interface BestCustomer {
  rank: number
  customerId: number
  customerName: string
  phone: string
  totalPurchases: number
  totalSpent: number
  avgOrderValue: number
  lastPurchaseDate: string
  firstPurchaseDate: string
  tier: 'VIP' | 'Gold' | 'Silver' | 'Bronze'
  daysBetweenPurchases: number
}

function getTier(totalSpent: number): BestCustomer['tier'] {
  if (totalSpent >= 10_000_000) return 'VIP'
  if (totalSpent >= 5_000_000) return 'Gold'
  if (totalSpent >= 2_000_000) return 'Silver'
  return 'Bronze'
}

const TIER_COLORS = { VIP: '#a855f7', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#cd7f32' }
export { TIER_COLORS }

/**
 * Get best customers ranked by total spent, with CLV and tier classification.
 */
export function getBestCustomers(limit: number = 20): BestCustomer[] {
  const db = getDatabase()

  // Build results from sales side, then look up customer info — avoids JOIN issues
  const saleAgg = db.prepare(`
    SELECT
      customerId,
      COUNT(DISTINCT id) as totalPurchases,
      COALESCE(SUM(total_amount), 0) as totalSpent,
      MAX(saleDate) as lastPurchaseDate,
      MIN(saleDate) as firstPurchaseDate
    FROM sales
    WHERE customerId IS NOT NULL
    GROUP BY customerId
    ORDER BY totalSpent DESC
    LIMIT ?
  `).all(limit) as any[]

  const rows = saleAgg.map(s => {
    const cust = db.prepare('SELECT id, name, phone FROM customers WHERE id = ? AND isActive = 1').get(s.customerId) as any
    return cust ? { ...s, customerName: cust.name, phone: cust.phone, customerId: cust.id } : null
  }).filter(Boolean)

  return rows.map((r, i) => {
    const avgOrderValue = r.totalPurchases > 0 ? r.totalSpent / r.totalPurchases : 0
    const daysBetween = r.totalPurchases > 1 && r.firstPurchaseDate && r.lastPurchaseDate
      ? Math.max(1, Math.round((new Date(r.lastPurchaseDate).getTime() - new Date(r.firstPurchaseDate).getTime()) / 86400000) / (r.totalPurchases - 1))
      : 0
    return {
      rank: i + 1,
      customerId: r.customerId,
      customerName: r.customerName,
      phone: r.phone,
      totalPurchases: r.totalPurchases,
      totalSpent: r.totalSpent,
      avgOrderValue,
      lastPurchaseDate: r.lastPurchaseDate || '',
      firstPurchaseDate: r.firstPurchaseDate || '',
      tier: getTier(r.totalSpent),
      daysBetweenPurchases: Math.round(daysBetween),
    }
  })
}

// ─── Category Profit Margin ──────────────────────────────

export interface CategoryMargin {
  category: string
  totalRevenue: number
  totalCost: number
  netProfit: number
  profitMargin: number
  productCount: number
  unitsSold: number
  prevRevenue: number
  prevNetProfit: number
}

/**
 * Get profit margin breakdown by product category.
 * Optionally compare with a previous period.
 */
export function getCategoryProfitMargin(startDate?: string, endDate?: string): CategoryMargin[] {
  const db = getDatabase()
  const where: string[] = []
  const params: any[] = []
  if (startDate) { where.push('s.saleDate >= ?'); params.push(startDate) }
  if (endDate) { where.push('s.saleDate <= ?'); params.push(endDate) }
  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''

  // Previous period
  let prevWhere: string[] = []
  const prevParams: any[] = []
  if (startDate && endDate) {
    const s = new Date(startDate), e = new Date(endDate)
    const days = Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1
    const pe = new Date(s); pe.setDate(pe.getDate() - 1)
    const ps = new Date(pe); ps.setDate(ps.getDate() - days + 1)
    prevWhere.push('s.saleDate >= ? AND s.saleDate <= ?')
    prevParams.push(ps.toISOString().slice(0, 10), pe.toISOString().slice(0, 10))
  }
  const prevWhereClause = prevWhere.length > 0 ? 'WHERE ' + prevWhere.join(' AND ') : ''

  const rows = db.prepare(`
    SELECT p.category,
      COALESCE(SUM(si.subtotal), 0) as totalRevenue,
      COALESCE(SUM(si.purchasePrice * si.quantity), 0) as totalCost,
      COALESCE(SUM(si.netProfit), 0) as netProfit,
      COUNT(DISTINCT p.id) as productCount,
      COALESCE(SUM(si.quantity), 0) as unitsSold
    FROM sale_items si
    JOIN sales s ON si.saleId = s.id
    JOIN products p ON si.productId = p.id
    ${whereClause}
    GROUP BY p.category
    ORDER BY netProfit DESC
  `).all(...params) as any[]

  const prevRows = db.prepare(`
    SELECT p.category,
      COALESCE(SUM(si.subtotal), 0) as prevRevenue,
      COALESCE(SUM(si.netProfit), 0) as prevNetProfit
    FROM sale_items si
    JOIN sales s ON si.saleId = s.id
    JOIN products p ON si.productId = p.id
    ${prevWhereClause}
    GROUP BY p.category
  `).all(...prevParams) as { category: string; prevRevenue: number; prevNetProfit: number }[]

  const prevMap = new Map(prevRows.map(r => [r.category, r]))

  return rows.map(r => {
    const prev = prevMap.get(r.category)
    return {
      category: r.category || 'سایر',
      totalRevenue: r.totalRevenue,
      totalCost: r.totalCost,
      netProfit: r.netProfit,
      profitMargin: r.totalRevenue > 0 ? (r.netProfit / r.totalRevenue) * 100 : 0,
      productCount: r.productCount,
      unitsSold: r.unitsSold,
      prevRevenue: prev?.prevRevenue ?? 0,
      prevNetProfit: prev?.prevNetProfit ?? 0,
    }
  })
}

// ─── Customer Purchase Patterns ──────────────────────────

export interface CustomerPattern {
  customerId: number
  customerName: string
  totalPurchases: number
  totalSpent: number
  avgDaysBetween: number
  favoriteCategories: string
  lastPurchaseDaysAgo: number
  status: 'active' | 'at_risk' | 'churned'
}

export interface PatternSummary {
  totalCustomers: number
  activeCustomers: number
  atRiskCustomers: number
  churnedCustomers: number
  newCustomers: number
  returningCustomers: number
  retentionRate: number
  avgPurchaseFrequency: number
  topCategories: { category: string; count: number }[]
}

/**
 * Analyze customer purchase patterns including frequency, retention, and churn.
 */
export function getCustomerPatterns(): { customers: CustomerPattern[]; summary: PatternSummary } {
  const db = getDatabase()

  // Build from sales side, then look up customer info — avoids JOIN issues
  const saleAgg = db.prepare(`
    SELECT
      customerId,
      COUNT(DISTINCT id) as totalPurchases,
      COALESCE(SUM(total_amount), 0) as totalSpent,
      MAX(saleDate) as lastPurchaseDate,
      MIN(saleDate) as firstPurchaseDate
    FROM sales
    WHERE customerId IS NOT NULL
    GROUP BY customerId
    ORDER BY totalSpent DESC
  `).all() as any[]

  const now = new Date()

  const customers: CustomerPattern[] = saleAgg.map(s => {
    const cust = db.prepare('SELECT id, name FROM customers WHERE id = ? AND isActive = 1').get(s.customerId) as any
    if (!cust) return null

    const daysSinceLast = s.lastPurchaseDate
      ? Math.floor((now.getTime() - new Date(s.lastPurchaseDate).getTime()) / 86400000)
      : 999
    const daysBetween = s.totalPurchases > 1 && s.firstPurchaseDate && s.lastPurchaseDate
      ? Math.round(Math.max(1, (new Date(s.lastPurchaseDate).getTime() - new Date(s.firstPurchaseDate).getTime()) / 86400000) / (s.totalPurchases - 1))
      : 0

    let status: CustomerPattern['status'] = 'active'
    if (daysSinceLast > 90) status = 'churned'
    else if (daysSinceLast > 30) status = 'at_risk'

    const cats = db.prepare(`
      SELECT p.category, COUNT(*) as cnt
      FROM sale_items si
      JOIN sales s ON si.saleId = s.id
      JOIN products p ON si.productId = p.id
      WHERE s.customerId = ?
      GROUP BY p.category
      ORDER BY cnt DESC
      LIMIT 3
    `).all(s.customerId) as { category: string; cnt: number }[]

    return {
      customerId: cust.id,
      customerName: cust.name,
      totalPurchases: s.totalPurchases,
      totalSpent: s.totalSpent,
      avgDaysBetween: daysBetween,
      favoriteCategories: cats.map(c => c.category).join(', ') || '-',
      lastPurchaseDaysAgo: daysSinceLast,
      status,
    }
  }).filter(Boolean) as CustomerPattern[]

  // Summary
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const atRiskCustomers = customers.filter(c => c.status === 'at_risk').length
  const churnedCustomers = customers.filter(c => c.status === 'churned').length

  // New vs Returning (new = only 1 purchase)
  const firstPurchaseDates = saleAgg.map(s => s.firstPurchaseDate).filter(Boolean)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
  const newCustomers = firstPurchaseDates.filter(d => d >= thirtyDaysAgo).length
  const returningCustomers = customers.length - newCustomers

  // Top categories across all customers
  const catCounts = db.prepare(`
    SELECT p.category, COUNT(*) as cnt
    FROM sale_items si
    JOIN sales s ON si.saleId = s.id
    JOIN products p ON si.productId = p.id
    GROUP BY p.category
    ORDER BY cnt DESC
    LIMIT 10
  `).all() as { category: string; cnt: number }[]

  const summary: PatternSummary = {
    totalCustomers: customers.length,
    activeCustomers,
    atRiskCustomers,
    churnedCustomers,
    newCustomers,
    returningCustomers,
    retentionRate: customers.length > 0 ? (returningCustomers / customers.length) * 100 : 0,
    avgPurchaseFrequency: customers.length > 0 ? customers.reduce((s, c) => s + c.totalPurchases, 0) / customers.length : 0,
    topCategories: catCounts.map(c => ({ category: c.category || 'سایر', count: c.cnt })),
  }

  return { customers, summary }
}
