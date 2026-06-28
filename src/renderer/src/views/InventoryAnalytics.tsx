/**
 * InventoryAnalytics — rich data visualization tab for inventory insights.
 *
 * Charts included:
 *   - Stock distribution donut: products grouped by stock level (healthy/low/out)
 *   - Category value bar chart: inventory value per category
 *   - Top 10 products by value: horizontal bar chart
 *   - Stock level histogram: distribution of stock quantities across products
 *   - Price comparison: purchase vs sale price per category
 *
 * All charts are pure SVG — no external charting library needed.
 * Shows "no data" empty state when inventory is empty.
 */

import { useState, useEffect } from 'react'
import type { Product } from '../../../types'
import { useSettingsStore } from '../store/settingsStore'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

interface Props { refreshKey?: number }

export default function InventoryAnalytics({ refreshKey }: Props) {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [products, setProducts] = useState<Product[]>([])

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  useEffect(() => {
    window.api.products.getAll().then(r => { if (r.success && r.data) setProducts(r.data) })
  }, [refreshKey])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
        <p className="text-xs mt-1" style={{ color: tSec }}>کالایی برای نمودار وجود ندارد</p>
      </div>
    )
  }

  // ─── Computed data ────────────────────────────────────
  const healthy = products.filter(p => p.stock > p.minStock * 2).length
  const low = products.filter(p => p.stock > 0 && p.stock <= p.minStock * 2).length
  const out = products.filter(p => p.stock === 0).length
  const total = products.length

  // Category aggregation
  const catMap = new Map<string, { count: number; value: number; purchaseValue: number }>()
  products.forEach(p => {
    const cat = p.category || 'سایر'
    const existing = catMap.get(cat) || { count: 0, value: 0, purchaseValue: 0 }
    existing.count++
    existing.value += p.stock * p.sale_price
    existing.purchaseValue += p.stock * p.purchase_price
    catMap.set(cat, existing)
  })
  const categories = Array.from(catMap.entries()).map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.value - a.value)

  // Top 10 by inventory value
  const topProducts = [...products].sort((a, b) => (b.stock * b.sale_price) - (a.stock * a.sale_price)).slice(0, 10)

  // Stock level histogram
  const stockRanges = [
    { label: '0', min: 0, max: 0, count: 0 },
    { label: '1-10', min: 1, max: 10, count: 0 },
    { label: '11-30', min: 11, max: 30, count: 0 },
    { label: '31-50', min: 31, max: 50, count: 0 },
    { label: '51-100', min: 51, max: 100, count: 0 },
    { label: '100+', min: 101, max: Infinity, count: 0 },
  ]
  products.forEach(p => {
    const range = stockRanges.find(r => p.stock >= r.min && p.stock <= r.max)
    if (range) range.count++
  })
  const maxHistogramCount = Math.max(...stockRanges.map(r => r.count), 1)

  // ─── Donut: Stock Status ──────────────────────────────
  const donutData = [
    { label: 'سالم', value: healthy, color: '#22c55e' },
    { label: 'کم‌موجودی', value: low, color: '#f59e0b' },
    { label: 'تمام شده', value: out, color: '#ef4444' },
  ].filter(d => d.value > 0)

  const renderDonut = () => {
    const r = 40, cx = 50, cy = 50, circumference = 2 * Math.PI * r
    let offset = 0
    return (
      <svg viewBox="0 0 100 100" className="w-40 h-40 mx-auto">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="8" />
        {donutData.map((d, i) => {
          const pct = d.value / total
          const dash = circumference * pct
          const gap = circumference - dash
          const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth="8"
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 0.5s' }} />
          offset += dash
          return el
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fill={tPri} fontSize="10" fontWeight="bold">{total}</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fill={tSec} fontSize="4">کالا</text>
      </svg>
    )
  }

  // ─── Bar Chart: Category Value ────────────────────────
  const maxValue = Math.max(...categories.map(c => c.value), 1)
  const renderCategoryBars = () => {
    const barH = 20, gap = 4, h = categories.length * (barH + gap)
    return (
      <svg viewBox={`0 0 300 ${h}`} className="w-full" style={{ maxHeight: 300 }}>
        {categories.slice(0, 10).map((cat, i) => {
          const y = i * (barH + gap)
          const w = (cat.value / maxValue) * 200
          return (
            <g key={cat.name}>
              <text x="0" y={y + 14} fill={tSec} fontSize="7" textAnchor="start">{cat.name}</text>
              <rect x="70" y={y} width={w} height={barH} rx="3" fill={COLORS[i % COLORS.length]} opacity="0.85" />
              <text x={75 + w} y={y + 14} fill={tPri} fontSize="7" fontWeight="bold">{(cat.value / 1000000).toFixed(1)}M</text>
            </g>
          )
        })}
      </svg>
    )
  }

  // ─── Horizontal Bar: Top Products ─────────────────────
  const maxProdVal = Math.max(...topProducts.map(p => p.stock * p.sale_price), 1)
  const renderTopProducts = () => (
    <div className="space-y-1.5">
      {topProducts.map((p, i) => {
        const val = p.stock * p.sale_price
        const pct = (val / maxProdVal) * 100
        return (
          <div key={p.id} className="flex items-center gap-2">
            <span className="text-[10px] w-16 truncate font-bold" style={{ color: tPri }}>{p.title}</span>
            <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length], transition: 'width 0.5s' }} />
            </div>
            <span className="text-[10px] font-mono font-bold w-14 text-left" style={{ color: tPri }}>{(val / 1000).toFixed(0)}K</span>
          </div>
        )
      })}
    </div>
  )

  // ─── Histogram: Stock Distribution ────────────────────
  const renderHistogram = () => {
    const barW = 30, gap = 8, svgW = stockRanges.length * (barW + gap)
    return (
      <svg viewBox={`0 0 ${svgW} 120`} className="w-full" style={{ maxHeight: 120 }}>
        {stockRanges.map((r, i) => {
          const x = i * (barW + gap)
          const h = (r.count / maxHistogramCount) * 80
          return (
            <g key={r.label}>
              <rect x={x} y={100 - h} width={barW} height={h} rx="3" fill={COLORS[i % COLORS.length]} opacity="0.8" />
              <text x={x + barW / 2} y={100 - h - 4} textAnchor="middle" fill={tPri} fontSize="7" fontWeight="bold">{r.count}</text>
              <text x={x + barW / 2} y={114} textAnchor="middle" fill={tSec} fontSize="6">{r.label}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  // ─── Price Comparison: Purchase vs Sale ───────────────
  const renderPriceComparison = () => {
    const maxPrice = Math.max(...categories.map(c => Math.max(c.value, c.purchaseValue)), 1)
    const barH = 18, gap = 6, h = categories.length * (barH + gap + barH)
    return (
      <svg viewBox={`0 0 300 ${h}`} className="w-full" style={{ maxHeight: 400 }}>
        {categories.slice(0, 8).map((cat, i) => {
          const y = i * (barH + gap + barH + 10)
          const saleW = (cat.value / maxPrice) * 180
          const purchaseW = (cat.purchaseValue / maxPrice) * 180
          return (
            <g key={cat.name}>
              <text x="0" y={y + 6} fill={tSec} fontSize="6" textAnchor="start">{cat.name}</text>
              <rect x="50" y={y} width={saleW} height={barH} rx="2" fill="#22c55e" opacity="0.8" />
              <text x={55 + saleW} y={y + 13} fill={tPri} fontSize="6">فروش: {(cat.value / 1000000).toFixed(1)}M</text>
              <rect x="50" y={y + barH + 2} width={purchaseW} height={barH} rx="2" fill="#3b82f6" opacity="0.8" />
              <text x={55 + purchaseW} y={y + barH + 15} fill={tPri} fontSize="6">خرید: {(cat.purchaseValue / 1000000).toFixed(1)}M</text>
            </g>
          )
        })}
      </svg>
    )
  }

  // ─── KPI Cards ────────────────────────────────────────
  const totalValue = products.reduce((s, p) => s + p.stock * p.sale_price, 0)
  const totalCost = products.reduce((s, p) => s + p.stock * p.purchase_price, 0)
  const potentialProfit = totalValue - totalCost

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'کل کالاها', value: total, color: '#3b82f6' },
          { label: 'ارزش فروش', value: `${(totalValue / 1000000).toFixed(1)}M`, color: '#22c55e' },
          { label: 'ارزش خرید', value: `${(totalCost / 1000000).toFixed(1)}M`, color: '#f59e0b' },
          { label: 'سود بالقوه', value: `${(potentialProfit / 1000000).toFixed(1)}M`, color: '#a855f7' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stock Status Donut */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>وضعیت موجودی</h3>
          {renderDonut()}
          <div className="flex justify-center gap-4 mt-3">
            {donutData.map(d => (
              <div key={d.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px]" style={{ color: tSec }}>{d.label}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Distribution Histogram */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>توزيع موجودی</h3>
          {renderHistogram()}
          <div className="text-center mt-2">
            <span className="text-[10px]" style={{ color: tSec }}>تعداد کالا بر اساس بازه موجودی</span>
          </div>
        </div>

        {/* Category Value Bars */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>ارزش موجودی به تفکیک دسته</h3>
          {renderCategoryBars()}
        </div>

        {/* Top Products by Value */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>۱۰ کالای برتر (ارزش فروش)</h3>
          {renderTopProducts()}
        </div>

        {/* Price Comparison */}
        <div className="rounded-xl p-4 lg:col-span-2" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>مقایسه قیمت خرید و فروش</h3>
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#22c55e' }} /><span className="text-[10px]" style={{ color: tSec }}>قیمت فروش</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: '#3b82f6' }} /><span className="text-[10px]" style={{ color: tSec }}>قیمت خرید</span></div>
          </div>
          {renderPriceComparison()}
        </div>
      </div>
    </div>
  )
}
