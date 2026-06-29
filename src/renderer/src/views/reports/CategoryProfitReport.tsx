/**
 * CategoryProfitReport — profit margin analysis by product category.
 *
 * Features:
 *   - Donut chart for revenue distribution
 *   - Bar chart for margin comparison
 *   - Ranking table with revenue, cost, profit, margin %
 *   - Previous period comparison
 *   - Date range filters
 *   - Excel export
 *   - "No data" empty state
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { formatPriceComma } from '../../utils/jalali'
import { downloadExcel } from '../../utils/a4Print'

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year'

export default function CategoryProfitReport() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [data, setData] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('month')

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
    }
  }, [period])

  const loadData = useCallback(async () => {
    const range = getDateRange()
    const r = await window.api.reports.getCategoryProfitMargin(range.start, range.end)
    if (r.success && r.data) setData(r.data)
  }, [getDateRange])

  useEffect(() => { loadData() }, [loadData])

  const totalRevenue = data.reduce((s, c) => s + c.totalRevenue, 0)

  // Donut data
  const donutData = data.slice(0, 8).map((c, i) => ({ label: c.category, value: c.totalRevenue, color: COLORS[i % COLORS.length] }))
  const donutR = 40, donutCx = 50, donutCy = 50, donutCirc = 2 * Math.PI * donutR
  let donutOffset = 0

  const handleExport = () => {
    const headers = ['دسته', 'درآمد کل', 'هزینه کل', 'سود خالص', 'حاشیه سود %', 'تعداد کالا', 'تعداد فروش', 'درآمد قبل']
    const rows = data.map(r => [r.category, r.totalRevenue, r.totalCost, r.netProfit, r.profitMargin.toFixed(1), r.productCount, r.unitsSold, r.prevRevenue])
    downloadExcel('category-profit.csv', headers, rows)
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        {([['today', 'امروز'], ['week', 'هفته'], ['month', 'ماه'], ['quarter', '۳ ماه'], ['year', 'سال']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setPeriod(key)} className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: period === key ? '#006194' : 'transparent', color: period === key ? '#fff' : tSec, border: `1px solid ${period === key ? '#006194' : cardBorder}` }}>{label}</button>
        ))}
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>خروجی اکسل</button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>توزیع درآمد</h3>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" width={180} height={180} className="flex-shrink-0">
              <circle cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="8" />
              {donutData.map((d, i) => {
                const pct = d.value / (totalRevenue || 1)
                const dash = donutCirc * pct
                const gap = donutCirc - dash
                const el = <circle key={i} cx={donutCx} cy={donutCy} r={donutR} fill="none" stroke={d.color} strokeWidth="8" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-donutOffset} strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
                donutOffset += dash
                return el
              })}
            </svg>
            <div className="space-y-1">
              {donutData.map(d => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px]" style={{ color: tPri }}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Margin Bars */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>حاشیه سود هر دسته</h3>
          <div className="space-y-2">
            {data.map((c, i) => (
              <div key={c.category} className="flex items-center gap-2">
                <span className="text-xs truncate font-bold w-16" style={{ color: tPri }}>{c.category}</span>
                <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, c.profitMargin))}%`, backgroundColor: c.profitMargin >= 0 ? COLORS[i % COLORS.length] : '#ef4444', opacity: 0.85 }} />
                </div>
                <span className="text-xs font-bold w-12 text-left" style={{ color: c.profitMargin >= 0 ? '#22c55e' : '#ef4444' }}>{c.profitMargin.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: cardBorder }}>
        <table className="w-full text-xs">
          <thead><tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            <th className="px-3 py-2 text-right" style={{ color: tSec }}>دسته</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>تعداد کالا</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>فروش</th>
            <th className="px-3 py-2 text-left" style={{ color: tSec }}>درآمد</th>
            <th className="px-3 py-2 text-left" style={{ color: tSec }}>هزینه</th>
            <th className="px-3 py-2 text-left" style={{ color: tSec }}>سود خالص</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>حاشیه</th>
            <th className="px-3 py-2 text-left" style={{ color: tSec }}>قبل</th>
          </tr></thead>
          <tbody>
            {data.map((c, i) => {
              const revChange = c.prevRevenue > 0 ? ((c.totalRevenue - c.prevRevenue) / c.prevRevenue * 100) : 0
              return (
                <tr key={c.category} style={{ borderTop: `1px solid ${cardBorder}` }}>
                  <td className="px-3 py-2 font-bold" style={{ color: COLORS[i % COLORS.length] }}>{c.category}</td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: tPri }}>{c.productCount}</td>
                  <td className="px-3 py-2 text-center font-mono" style={{ color: tPri }}>{c.unitsSold.toLocaleString('fa-IR')}</td>
                  <td className="px-3 py-2 text-left font-mono" style={{ color: '#22c55e' }}>{formatPriceComma(c.totalRevenue)}</td>
                  <td className="px-3 py-2 text-left font-mono" style={{ color: '#ef4444' }}>{formatPriceComma(c.totalCost)}</td>
                  <td className="px-3 py-2 text-left font-mono font-bold" style={{ color: c.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{formatPriceComma(c.netProfit)}</td>
                  <td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: c.profitMargin >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: c.profitMargin >= 0 ? '#22c55e' : '#ef4444' }}>{c.profitMargin.toFixed(1)}%</span></td>
                  <td className="px-3 py-2 text-left"><span className="text-[10px] font-bold" style={{ color: revChange > 0 ? '#22c55e' : revChange < 0 ? '#ef4444' : tSec }}>{revChange > 0 ? '+' : ''}{revChange.toFixed(1)}%</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
