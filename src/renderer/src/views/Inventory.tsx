import { useState, useEffect } from 'react'
import type { Product } from '../../../types'
import { fa } from '../i18n'
import { generateReceiptHTML, printContent } from '../utils/receipt'
import { gregorianToJalali } from '../utils/jalali'
import Pagination from '../components/Pagination'
import ShamsiDateInput from '../components/ShamsiDateInput'

type AuditFilter = 'all' | 'create' | 'update' | 'delete' | 'restock'

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [tab, setTab] = useState<'products' | 'report' | 'audit'>('products')
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [auditFilter, setAuditFilter] = useState<AuditFilter>('all')
  const [auditStartDate, setAuditStartDate] = useState('')
  const [auditEndDate, setAuditEndDate] = useState('')
  const [reportData, setReportData] = useState<{ byCategory: any[]; slowMoving: any[] }>({ byCategory: [], slowMoving: [] })
  const [returnStats, setReturnStats] = useState({ totalReturns: 0, totalRefund: 0, todayReturns: 0 })
  const [categories, setCategories] = useState<string[]>([])

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnColor = isDark ? '#94a3b8' : '#ffffff'

  const loadProducts = async () => {
    const r = search ? await window.api.products.search(search) : await window.api.products.getAll()
    if (r.success && r.data) {
      setProducts(r.data)
      const cats = [...new Set(r.data.map((p: Product) => p.category).filter(Boolean))]
      setCategories(cats)
    }
  }

  const loadLowStock = async () => {
    const r = await window.api.products.getLowStock()
    if (r.success && r.data) setLowStock(r.data)
  }

  const loadAudit = async (startDate?: string, endDate?: string) => {
    const r = await window.api.audit.getAll(undefined, undefined, startDate, endDate)
    if (r.success && r.data) setAuditLog(r.data)
  }

  const loadReturnStats = async () => {
    const r = await window.api.returns.getStats()
    if (r.success && r.data) setReturnStats(r.data)
  }

  const loadReport = async () => {
    const r = await window.api.products.getReportData()
    if (r.success && r.data) setReportData(r.data)
  }

  useEffect(() => { loadProducts(); loadLowStock(); loadReturnStats() }, [search])
  useEffect(() => {
    if (tab === 'audit') loadAudit(auditStartDate || undefined, auditEndDate || undefined)
    if (tab === 'report') loadReport()
  }, [tab, auditStartDate, auditEndDate])

  const handleRestock = async () => {
    if (!selectedProduct || !restockQty) return
    const qty = parseInt(restockQty)
    if (qty <= 0) return
    await window.api.products.updateStock(selectedProduct.id, qty)
    setSelectedProduct(null)
    setRestockQty('')
    loadProducts()
    loadLowStock()
  }

  const filteredProducts = products.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (filterStock === 'out' && p.stock > 0) return false
    if (filterStock === 'low' && (p.stock <= 0 || p.stock > p.minStock)) return false
    if (filterStock === 'in' && p.stock <= 0) return false
    return true
  })

  const outOfStock = products.filter(p => p.stock <= 0)

  const totalStockValue = filteredProducts.reduce((a, p) => a + (p.stock * p.purchase_price), 0)
  const totalRetailValue = filteredProducts.reduce((a, p) => a + (p.stock * p.sale_price), 0)
  const totalProfit = totalRetailValue - totalStockValue
  const lowStockCount = filteredProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const inStockCount = filteredProducts.filter(p => p.stock > p.minStock).length
  const outOfStockCount = filteredProducts.filter(p => p.stock <= 0).length
  const pagedProducts = filteredProducts.slice(page * pageSize, (page + 1) * pageSize)

  const donutColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6']
  const categoryGroups = filteredProducts.reduce<Record<string, { count: number; stockValue: number }>>((acc, p) => {
    const cat = p.category || 'بدون دسته'
    if (!acc[cat]) acc[cat] = { count: 0, stockValue: 0 }
    acc[cat].count++
    acc[cat].stockValue += p.stock * p.purchase_price
    return acc
  }, {})
  const categorySegments = Object.entries(categoryGroups).map(([category, data]) => ({
    category,
    value: data.stockValue,
    count: data.count,
  })).filter(s => s.value > 0)
  const donutTotal = categorySegments.reduce((s, seg) => s + seg.value, 0)

  const barData = [
    { label: 'موجود', value: inStockCount, color: '#22c55e' },
    { label: 'کم\u200cموجودی', value: lowStockCount, color: '#f59e0b' },
    { label: 'تمام شده', value: outOfStockCount, color: '#ef4444' },
  ]
  const barMax = Math.max(...barData.map(b => b.value), 1)

  const filteredAuditLog = auditFilter === 'all' ? auditLog : auditLog.filter((e) => e.action === auditFilter)
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayAuditCount = auditLog.filter(e => e.createdAt && e.createdAt.startsWith(todayStr)).length
  const auditActionCounts = auditLog.reduce<Record<string, number>>((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1
    return acc
  }, {})

  const handlePrintReport = () => {
    const now = new Date()
    const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const dateStr = `${jd} ${jMonths[jm - 1]} ${jy}`

    const html = generateReceiptHTML({
      title: 'گزارش موجودی انبار',
      date: dateStr,
      items: filteredProducts.map((p) => ({
        name: p.title,
        qty: p.stock,
        price: p.purchase_price,
        total: p.stock * p.purchase_price,
      })),
      subtotal: totalStockValue,
      total: totalStockValue,
      extra: [
        { label: 'تعداد کالاها', value: String(filteredProducts.length) },
        { label: 'ارزش فروش', value: `${totalRetailValue.toLocaleString('fa-IR')} تومان` },
        { label: 'سود بالقوه', value: `${totalProfit.toLocaleString('fa-IR')} تومان`, color: '#16a34a' },
        { label: 'کم\u200cموجودی', value: `${lowStock.length} کالا`, color: lowStock.length > 0 ? '#ef4444' : undefined },
      ],
      footer: 'گزارش موجودی انبار',
      storeName: 'فروشگاه',
    })
    printContent(html)
  }

  const kpis = [
    {
      label: fa.admin.products,
      value: filteredProducts.length,
      color: '#3b82f6',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      label: 'ارزش خرید موجودی',
      value: totalStockValue,
      color: '#22c55e',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: 'سود بالقوه',
      value: totalProfit,
      color: '#10b981',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      label: 'کم\u200cموجودی',
      value: lowStockCount,
      color: '#f59e0b',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ]

  const auditActionLabels: Record<string, string> = {
    create: 'ایجاد',
    update: 'ویرایش',
    delete: 'حذف',
    restock: 'تامین موجودی',
    return: 'مرجوعی',
    sale: 'فروش',
  }
  const auditEntityLabels: Record<string, string> = {
    product: 'کالا',
    sale: 'فاکتور',
    expense: 'هزینه',
    return: 'مرجوعی',
  }
  const auditActionColors: Record<string, { bg: string; fg: string }> = {
    create: { bg: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', fg: '#166534' },
    update: { bg: isDark ? 'rgba(59,130,246,0.15)' : '#dbeafe', fg: '#1e40af' },
    delete: { bg: isDark ? 'rgba(239,68,68,0.15)' : '#fecaca', fg: '#991b1b' },
    restock: { bg: isDark ? 'rgba(16,185,129,0.15)' : '#d1fae5', fg: '#065f46' },
    return: { bg: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7', fg: '#92400e' },
    sale: { bg: isDark ? 'rgba(168,85,247,0.15)' : '#f3e8ff', fg: '#7e22ce' },
  }
  const auditActionDotColors: Record<string, string> = {
    create: '#22c55e',
    update: '#3b82f6',
    delete: '#ef4444',
    restock: '#10b981',
    return: '#f59e0b',
    sale: '#a855f7',
  }

  function formatAuditDetail(entry: any): string {
    try {
      const details = entry.details ? JSON.parse(entry.details) : null
      if (!details) return ''
      if (entry.action === 'create' && entry.entityType === 'product') return details.title || details.barcode || ''
      if (entry.action === 'create' && entry.entityType === 'expense') return details.category ? `${details.category} — ${details.amount?.toLocaleString('fa-IR')} تومان` : ''
      if (entry.action === 'create' && entry.entityType === 'sale') return details.total ? `${details.total.toLocaleString('fa-IR')} تومان` : ''
      if (entry.action === 'restock') return details.quantityChange ? `${details.quantityChange > 0 ? '+' : ''}${details.quantityChange} عدد` : ''
      if (entry.action === 'return') return details.quantity ? `${details.quantity} عدد — ${details.refundAmount?.toLocaleString('fa-IR')} تومان` : ''
      if (entry.action === 'update' && details.fields) return `فیلدها: ${details.fields.join(', ')}`
      return ''
    } catch { return '' }
  }

  const tabs = [
    {
      key: 'products' as const,
      label: 'موجودی',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      key: 'report' as const,
      label: 'گزارش انبار',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      key: 'audit' as const,
      label: 'تاریخچه',
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ]

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.nav.inventory}</h2>
        </div>
        <button onClick={handlePrintReport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            color: textPrimary,
            border: `1px solid ${cardBorder}`,
          }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
          </svg>
          چاپ گزارش
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow-lg' : ''}`}
            style={tab !== t.key ? {
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              color: textSecondary,
              border: `1px solid ${cardBorder}`,
            } : undefined}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                {kpi.icon}
                <span className="text-xs font-medium" style={{ color: textSecondary }}>{kpi.label}</span>
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{typeof kpi.value === 'number' ? kpi.value.toLocaleString('fa-IR') : kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="text-sm font-bold mb-4" style={{ color: textPrimary }}>ترکیب ارزش موجودی بر اساس دسته</div>
            {donutTotal > 0 ? (
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 42 42" className="w-40 h-40">
                  <circle cx="21" cy="21" r="15.9" fill="transparent" stroke={cardBorder} strokeWidth="5" />
                  {categorySegments.map((seg, i) => {
                    const pct = (seg.value / donutTotal) * 100
                    const offset = categorySegments.slice(0, i).reduce((s, x) => s + (x.value / donutTotal) * 100, 0)
                    return (
                      <circle key={i} cx="21" cy="21" r="15.9" fill="transparent"
                        stroke={donutColors[i % donutColors.length]} strokeWidth="5"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeDashoffset={`${25 - offset}`} />
                    )
                  })}
                </svg>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
                  {categorySegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}>
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: donutColors[i % donutColors.length] }} />
                      {seg.category}
                      <span className="font-mono" style={{ color: textPrimary }}>{seg.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>{fa.dashboard.noData}</p>
            )}
          </div>

          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="text-sm font-bold mb-4" style={{ color: textPrimary }}>وضعیت موجودی</div>
            {barMax > 0 ? (
              <svg viewBox="0 0 300 150" className="w-full h-40">
                {barData.map((bar, i) => {
                  const barHeight = (bar.value / barMax) * 120
                  const x = 30 + i * 95
                  return (
                    <g key={i}>
                      <rect x={x} y={130 - barHeight} width={60} height={barHeight} rx={4} fill={bar.color} />
                      <text x={x + 30} y={145} textAnchor="middle" fill={textSecondary} fontSize="8">{bar.label}</text>
                      <text x={x + 30} y={125 - barHeight} textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold">
                        {bar.value}
                      </text>
                    </g>
                  )
                })}
              </svg>
            ) : (
              <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>{fa.dashboard.noData}</p>
            )}
          </div>
        </div>

        {(outOfStock.length > 0 || lowStock.length > 0) && (
          <div className="flex gap-4 mb-4">
            {outOfStock.length > 0 && (
              <div className="flex-1 rounded-2xl p-4 border-2" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', borderColor: '#ef4444' }}>
                <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#ef4444' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  موجودی تمام شده — {outOfStock.length} کالا
                </h3>
                <div className="flex flex-wrap gap-2">
                  {outOfStock.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedProduct(p); setRestockQty('') }}
                      className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#fecaca', color: '#991b1b' }}>
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {lowStock.length > 0 && (
              <div className="flex-1 rounded-2xl p-4 border-2" style={{ backgroundColor: isDark ? '#451a03' : '#fef3c7', borderColor: '#f59e0b' }}>
                <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#d97706' }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  موجودی کم — {lowStock.length} کالا
                </h3>
                <div className="flex flex-wrap gap-2">
                  {lowStock.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedProduct(p); setRestockQty('') }}
                      className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                      {p.title} ({p.stock})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedProduct && (
          <div className="rounded-2xl p-4 mb-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#3b82f6' }}>
            <h3 className="font-bold mb-3" style={{ color: textPrimary }}>تامین موجودی: {selectedProduct.title}</h3>
            <div className="flex gap-3 items-end">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>موجودی فعلی: {selectedProduct.stock}</label>
                <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="input-field text-sm" placeholder="تعداد" />
              </div>
              <button onClick={handleRestock} disabled={!restockQty || parseInt(restockQty) <= 0} className="btn-success disabled:opacity-40">+ افزودن</button>
              <button onClick={() => setSelectedProduct(null)} className="text-sm px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }}>{fa.admin.cancel}</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={fa.admin.search} className="input-field flex-1 min-w-[200px]" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field w-40 text-sm">
            <option value="all">همه دسته‌ها</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="input-field w-40 text-sm">
            <option value="all">همه موجودی</option>
            <option value="in">موجود</option>
            <option value="low">کم\u200cموجودی</option>
            <option value="out">تمام شده</option>
          </select>
        </div>

        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ID</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.barcode}</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.title}</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.category}</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.stock}</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.purchasePrice}</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ارزش</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>حاشیه سود</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {pagedProducts.map((p) => {
                const isZero = p.stock <= 0
                const isLow = p.stock > 0 && p.stock <= p.minStock
                const rowBg = isZero ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)') : isLow ? (isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)') : 'transparent'
                const stockRatio = p.minStock > 0 ? Math.min(p.stock / p.minStock, 2) / 2 : p.stock > 0 ? 1 : 0
                const stockBarColor = isZero ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e'
                const margin = p.purchase_price > 0 ? (((p.sale_price - p.purchase_price) / p.purchase_price) * 100).toFixed(1) : '0'
                return (
                <tr key={p.id} style={{ borderBottom: `1px solid ${cardBorder}`, backgroundColor: rowBg }}
                  onMouseEnter={(e) => { if (!isZero && !isLow) e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)' }}
                  onMouseLeave={(e) => { if (!isZero && !isLow) e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <td className="px-4 py-2" style={{ color: textSecondary }}>{p.id}</td>
                  <td className="px-4 py-2 font-mono text-xs" style={{ color: textPrimary }}>{p.barcode || '-'}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>
                    <div className="flex items-center gap-2">
                      {p.imageBase64 ? (
                        <img src={p.imageBase64} alt="" className="w-8 h-8 rounded-full object-cover border" style={{ borderColor: cardBorder }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                          {p.title.charAt(0)}
                        </div>
                      )}
                      {p.title}
                    </div>
                  </td>
                  <td className="px-4 py-2" style={{ color: textSecondary }}>{p.category || '-'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono" style={{ color: stockBarColor }}>{p.stock}</span>
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${stockRatio * 100}%`, backgroundColor: stockBarColor }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2" style={{ color: textPrimary }}>{p.purchase_price.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2" style={{ color: textPrimary }}>{(p.stock * p.purchase_price).toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                      backgroundColor: parseFloat(margin) > 20 ? '#dcfce7' : parseFloat(margin) > 10 ? '#fef3c7' : '#fee2e2',
                      color: parseFloat(margin) > 20 ? '#166534' : parseFloat(margin) > 10 ? '#92400e' : '#991b1b',
                    }}>%{margin}</span>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => { setSelectedProduct(p); setRestockQty('') }} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: '#22c55e' }}>+ تامین</button>
                  </td>
                </tr>
                )
              })}
              {pagedProducts.length === 0 && <tr><td colSpan={9} className="text-center py-8" style={{ color: textSecondary }}>{fa.admin.noProducts}</td></tr>}
            </tbody>
          </table>
        </div>

        <Pagination total={filteredProducts.length} pageSize={pageSize} page={page}
          onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(0) }} />
      </>)}

      {tab === 'report' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>ارزش خرید کل</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: '#3b82f6' }}>{totalStockValue.toLocaleString('fa-IR')}</div>
            </div>
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                </svg>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>ارزش فروش کل</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: '#22c55e' }}>{totalRetailValue.toLocaleString('fa-IR')}</div>
            </div>
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>سود بالقوه</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: '#10b981' }}>{totalProfit.toLocaleString('fa-IR')}</div>
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="px-4 py-3 font-bold flex items-center gap-2" style={{ borderBottom: `2px solid ${cardBorder}`, color: textPrimary }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              ارزش‌گذاری دسته‌بندی
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                    <th className="text-right px-4 py-2" style={{ color: textSecondary }}>دسته</th>
                    <th className="text-center px-4 py-2" style={{ color: textSecondary }}>تعداد</th>
                    <th className="text-center px-4 py-2" style={{ color: textSecondary }}>موجودی</th>
                    <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ارزش خرید</th>
                    <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ارزش فروش</th>
                    <th className="text-right px-4 py-2" style={{ color: textSecondary }}>سود بالقوه</th>
                    <th className="px-4 py-2" style={{ color: textSecondary }}>visual</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.byCategory.map((cat: any, i: number) => {
                    const catValue = cat.totalValue || 0
                    const catProfit = (cat.retailValue || 0) - catValue
                    const maxCatValue = Math.max(...reportData.byCategory.map((c: any) => c.totalValue || 0), 1)
                    return (
                    <tr key={i} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{cat.category || 'بدون دسته'}</td>
                      <td className="px-4 py-2 text-center" style={{ color: textPrimary }}>{cat.count}</td>
                      <td className="px-4 py-2 text-center" style={{ color: textPrimary }}>{cat.totalStock}</td>
                      <td className="px-4 py-2" style={{ color: textPrimary }}>{catValue.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-2" style={{ color: textPrimary }}>{(cat.retailValue || 0).toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-2 font-bold" style={{ color: '#22c55e' }}>{catProfit.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-2 w-32">
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0' }}>
                          <div className="h-full rounded-full" style={{ width: `${(catValue / maxCatValue) * 100}%`, backgroundColor: donutColors[i % donutColors.length] }} />
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                  {reportData.byCategory.length === 0 && <tr><td colSpan={7} className="text-center py-8" style={{ color: textSecondary }}>داده‌ای موجود نیست</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="px-4 py-3 font-bold flex items-center gap-2" style={{ borderBottom: `2px solid ${cardBorder}`, color: textPrimary }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              کالاهای کندفروش ({reportData.slowMoving.length})
            </div>
            <div className="max-h-96 overflow-y-auto">
              {reportData.slowMoving.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.lastSoldAt ? '#f59e0b' : '#ef4444' }} />
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{item.title}</span>
                    <span className="text-xs" style={{ color: textSecondary }}>{item.category || '-'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: textSecondary }}>
                    <span>موجودی: <b className="font-mono" style={{ color: textPrimary }}>{item.stock}</b></span>
                    {item.lastSoldAt ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                        آخرین فروش: {item.lastSoldAt}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fecaca', color: '#991b1b' }}>
                        هرگز فروخته نشده
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {reportData.slowMoving.length === 0 && <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>کالای کندفروشی وجود ندارد</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>کل تغییرات</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: '#3b82f6' }}>{auditLog.length.toLocaleString('fa-IR')}</div>
            </div>
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>تغییرات امروز</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: '#f59e0b' }}>{todayAuditCount.toLocaleString('fa-IR')}</div>
            </div>
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                </svg>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>مرجوعی</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: '#ef4444' }}>{returnStats.totalReturns.toLocaleString('fa-IR')}</div>
              <div className="text-xs mt-1" style={{ color: '#ef4444' }}>{returnStats.totalRefund.toLocaleString('fa-IR')} تومان</div>
            </div>
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" />
                </svg>
                <span className="text-xs font-medium" style={{ color: textSecondary }}>امروز</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: '#22c55e' }}>{returnStats.todayReturns.toLocaleString('fa-IR')}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <ShamsiDateInput value={auditStartDate} onChange={setAuditStartDate} label="از تاریخ" />
            <ShamsiDateInput value={auditEndDate} onChange={setAuditEndDate} label="تا تاریخ" />
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {(['all', 'create', 'update', 'delete', 'restock'] as AuditFilter[]).map(action => {
              const count = action === 'all' ? auditLog.length : (auditActionCounts[action] || 0)
              const colors = action === 'all'
                ? { bg: isDark ? '#1e293b' : '#f8fafc', fg: textPrimary, border: cardBorder }
                : auditActionColors[action]
                    ? { bg: auditActionColors[action].bg, fg: auditActionColors[action].fg, border: 'transparent' }
                    : { bg: isDark ? '#1e293b' : '#f8fafc', fg: textPrimary, border: cardBorder }
              const labels: Record<string, string> = {
                all: 'همه',
                create: 'ایجاد',
                update: 'ویرایش',
                delete: 'حذف',
                restock: 'تامین مجدد',
              }
              return (
                <button key={action} onClick={() => setAuditFilter(action)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    backgroundColor: auditFilter === action ? (auditActionColors[action]?.fg || '#3b82f6') : colors.bg,
                    color: auditFilter === action ? '#ffffff' : colors.fg,
                    border: auditFilter === action ? 'none' : `1px solid ${colors.border}`,
                  }}>
                  {labels[action]}
                  <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{
                    backgroundColor: auditFilter === action ? 'rgba(255,255,255,0.2)' : (isDark ? '#334155' : '#e2e8f0'),
                    color: auditFilter === action ? '#ffffff' : textSecondary,
                  }}>{count}</span>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="px-4 py-3 font-bold flex items-center gap-2" style={{ borderBottom: `2px solid ${cardBorder}`, color: textPrimary }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              تاریخچه تغییرات ({filteredAuditLog.length})
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {filteredAuditLog.map((entry: any) => {
                const actionStyle = auditActionColors[entry.action] || { bg: isDark ? '#1e293b' : '#f8fafc', fg: textPrimary }
                const detail = formatAuditDetail(entry)
                const entityLabel = auditEntityLabels[entry.entityType] || entry.entityType
                const actionLabel = auditActionLabels[entry.action] || entry.action
                const dotColor = auditActionDotColors[entry.action] || '#6b7280'
                return (
                <div key={entry.id} className="px-4 py-3 transition-all" style={{ borderBottom: `1px solid ${cardBorder}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: actionStyle.bg }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: actionStyle.bg, color: actionStyle.fg }}>
                          {actionLabel}
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                          {entityLabel}
                        </span>
                      </div>
                      <div className="text-sm font-medium" style={{ color: textPrimary }}>
                        {entry.entityName || `${entityLabel} #${entry.entityId}`}
                      </div>
                      {detail && (
                        <div className="text-xs mt-0.5" style={{ color: textSecondary }}>{detail}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                      <span className="text-xs font-medium" style={{ color: textSecondary }}>{entry.userName || 'سیستم'}</span>
                      <span className="text-[10px] font-mono" style={{ color: textSecondary }}>{entry.createdAt}</span>
                    </div>
                  </div>
                </div>
                )
              })}
              {filteredAuditLog.length === 0 && <p className="text-center py-12 text-sm" style={{ color: textSecondary }}>هیچ تغییری ثبت نشده</p>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
