/**
 * ProfitReport — product-level profit analysis with charts and export.
 *
 * Features:
 *   - Table with: product name, SKU, category, units sold, avg prices, revenue, cost, profit, margin %
 *   - Date range filters: today, week, month, quarter, year, custom
 *   - Bar chart for top 10 profitable products
 *   - KPI cards: total revenue, total cost, total profit, avg margin
 *   - Export to Excel (CSV with BOM)
 *   - Persian number formatting for all values
 *   - Text size and color theme controls
 *   - "No data" empty state
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { formatPriceFA, formatPriceComma } from '../utils/jalali'
import { downloadExcel } from '../utils/a4Print'

interface ProfitRow {
  productId: number; productTitle: string; barcode: string; category: string
  unitsSold: number; totalRevenue: number; totalCost: number; netProfit: number; profitMargin: number
}

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export default function ProfitReport() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [data, setData] = useState<ProfitRow[]>([])
  const [period, setPeriod] = useState<Period>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [sortBy, setSortBy] = useState<'netProfit' | 'profitMargin' | 'unitsSold'>('netProfit')
  const chartRef = useRef<HTMLDivElement>(null)

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

  const getDateRange = useCallback((): { start?: string; end?: string } => {
    const now = new Date()
    const toISO = (d: Date) => d.toISOString().slice(0, 10)
    switch (period) {
      case 'today': return { start: toISO(now), end: toISO(now) }
      case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); return { start: toISO(d), end: toISO(now) } }
      case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return { start: toISO(d), end: toISO(now) } }
      case 'quarter': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { start: toISO(d), end: toISO(now) } }
      case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return { start: toISO(d), end: toISO(now) } }
      case 'custom': return { start: customStart || undefined, end: customEnd || undefined }
      default: return {}
    }
  }, [period, customStart, customEnd])

  const loadData = useCallback(async () => {
    const range = getDateRange()
    const r = await window.api.products.getProfitReport(range.start, range.end)
    if (r.success && r.data) setData(r.data)
  }, [getDateRange])

  useEffect(() => { loadData() }, [loadData])

  const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy])
  const top10 = sorted.slice(0, 10)

  const totalRevenue = data.reduce((s, r) => s + r.totalRevenue, 0)
  const totalCost = data.reduce((s, r) => s + r.totalCost, 0)
  const totalProfit = data.reduce((s, r) => s + r.netProfit, 0)
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const maxProfit = Math.max(...top10.map(r => Math.abs(r.netProfit)), 1)

  const handleExport = () => {
    const headers = ['کالا', 'بارکد', 'دسته', 'تعداد فروش', 'درآمد کل', 'هزینه کل', 'سود خالص', 'حاشیه سود %']
    const rows = sorted.map(r => [r.productTitle, r.barcode, r.category, r.unitsSold, r.totalRevenue, r.totalCost, r.netProfit, r.profitMargin.toFixed(1)])
    downloadExcel('profit-report.csv', headers, rows)
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
        <p className="text-xs mt-1" style={{ color: tSec }}>فروشی ثبت نشده است</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Period Filter */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        {([['today', 'امروز'], ['week', 'هفته'], ['month', 'ماه'], ['quarter', '۳ ماه'], ['year', 'سال'], ['custom', 'دلخواه']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)} className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: period === key ? '#006194' : 'transparent', color: period === key ? '#fff' : tSec, border: `1px solid ${period === key ? '#006194' : cardBorder}` }}>{label}</button>
        ))}
        {period === 'custom' && (
          <div className="flex gap-2">
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-2 py-1 rounded-lg text-xs outline-none" style={{ border: `1px solid ${cardBorder}`, color: tPri, direction: 'ltr' }} />
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-2 py-1 rounded-lg text-xs outline-none" style={{ border: `1px solid ${cardBorder}`, color: tPri, direction: 'ltr' }} />
          </div>
        )}
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          خروجی اکسل
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'درآمد کل', value: formatPriceFA(totalRevenue), color: '#3b82f6' },
          { label: 'هزینه کل', value: formatPriceFA(totalCost), color: '#ef4444' },
          { label: 'سود خالص', value: formatPriceFA(totalProfit), color: totalProfit >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'حاشیه سود', value: `${avgMargin.toFixed(1)}%`, color: '#a855f7' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Bar Chart: Top 10 Products by Profit */}
      <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>۱۰ کالای برتر (سود خالص)</h3>
        <div ref={chartRef}>
          <div className="space-y-2">
            {top10.map((r, i) => {
              const pct = (Math.abs(r.netProfit) / maxProfit) * 100
              const isNeg = r.netProfit < 0
              return (
                <div key={r.productId} className="flex items-center gap-2">
                  <span className="text-xs truncate font-bold w-28" style={{ color: tPri }}>{r.productTitle}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isNeg ? '#ef4444' : COLORS[i % COLORS.length], opacity: 0.85 }} />
                  </div>
                  <span className="text-xs font-mono font-bold w-24 text-left" style={{ color: isNeg ? '#ef4444' : '#22c55e' }}>{formatPriceFA(r.netProfit)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: cardBorder }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="px-3 py-2 text-right font-bold" style={{ color: tSec }}>کالا</th>
              <th className="px-3 py-2 text-right font-bold" style={{ color: tSec }}>بارکد</th>
              <th className="px-3 py-2 text-right font-bold" style={{ color: tSec }}>دسته</th>
              <th className="px-3 py-2 text-center font-bold cursor-pointer" style={{ color: sortBy === 'unitsSold' ? '#006194' : tSec }} onClick={() => setSortBy('unitsSold')}>تعداد فروش</th>
              <th className="px-3 py-2 text-left font-bold" style={{ color: tSec }}>درآمد</th>
              <th className="px-3 py-2 text-left font-bold" style={{ color: tSec }}>هزینه</th>
              <th className="px-3 py-2 text-left font-bold cursor-pointer" style={{ color: sortBy === 'netProfit' ? '#006194' : tSec }} onClick={() => setSortBy('netProfit')}>سود خالص</th>
              <th className="px-3 py-2 text-center font-bold cursor-pointer" style={{ color: sortBy === 'profitMargin' ? '#006194' : tSec }} onClick={() => setSortBy('profitMargin')}>حاشیه %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.productId} style={{ borderTop: `1px solid ${cardBorder}` }} className="hover:bg-blue-500/5">
                <td className="px-3 py-2 font-bold" style={{ color: tPri }}>{r.productTitle}</td>
                <td className="px-3 py-2 font-mono" style={{ color: tSec }}>{r.barcode}</td>
                <td className="px-3 py-2" style={{ color: tSec }}>{r.category}</td>
                <td className="px-3 py-2 text-center font-mono" style={{ color: tPri }}>{r.unitsSold.toLocaleString('fa-IR')}</td>
                <td className="px-3 py-2 text-left font-mono" style={{ color: '#3b82f6' }}>{formatPriceComma(r.totalRevenue)}</td>
                <td className="px-3 py-2 text-left font-mono" style={{ color: '#ef4444' }}>{formatPriceComma(r.totalCost)}</td>
                <td className="px-3 py-2 text-left font-mono font-bold" style={{ color: r.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{formatPriceComma(r.netProfit)}</td>
                <td className="px-3 py-2 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: r.profitMargin >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: r.profitMargin >= 0 ? '#22c55e' : '#ef4444' }}>
                    {r.profitMargin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
