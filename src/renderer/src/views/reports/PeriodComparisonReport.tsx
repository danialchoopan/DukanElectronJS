/**
 * PeriodComparisonReport — compare any two date ranges with visual indicators.
 *
 * Features:
 *   - Quick presets: Today vs Yesterday, Week vs Prev Week, Month vs Prev Month, Year vs Prev Year
 *   - Custom period comparison
 *   - Metrics: Total sales, Orders count, Avg order value, Cash/Card/Ledger split
 *   - Category-level comparison
 *   - Visual indicators: ↑ green, ↓ red, — gray
 *   - Percentage change display
 *   - Excel export
 *   - "No data" empty state
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { formatPriceFA, formatPriceComma, formatISOToJalali } from '../../utils/jalali'
import { downloadExcel } from '../../utils/a4Print'
import ShamsiDateInput from '../../components/business/ShamsiDateInput'

type Preset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

export default function PeriodComparisonReport() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [data, setData] = useState<any>(null)
  const [preset, setPreset] = useState<Preset>('month')
  const [customCurrent, setCustomCurrent] = useState({ start: '', end: '' })
  const [customPrevious, setCustomPrevious] = useState({ start: '', end: '' })

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const getDateRanges = useCallback((): { current: [string, string]; previous: [string, string] } => {
    const now = new Date()
    const toISO = (d: Date) => d.toISOString().slice(0, 10)
    const dayMs = 86400000
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * dayMs)
    const startOfPeriod = (d: Date, days: number) => { const s = new Date(d); s.setDate(s.getDate() - days + 1); return s }

    switch (preset) {
      case 'today': {
        const today = toISO(now); const yesterday = toISO(addDays(now, -1))
        return { current: [today, today], previous: [yesterday, yesterday] }
      }
      case 'week': {
        const currStart = toISO(startOfPeriod(now, 7)); const prevEnd = toISO(addDays(now, -7)); const prevStart = toISO(startOfPeriod(now, 14))
        return { current: [currStart, toISO(now)], previous: [prevStart, prevEnd] }
      }
      case 'month': {
        const currStart = toISO(startOfPeriod(now, 30)); const prevEnd = toISO(addDays(now, -30)); const prevStart = toISO(startOfPeriod(now, 60))
        return { current: [currStart, toISO(now)], previous: [prevStart, prevEnd] }
      }
      case 'quarter': {
        const currStart = toISO(startOfPeriod(now, 90)); const prevEnd = toISO(addDays(now, -90)); const prevStart = toISO(startOfPeriod(now, 180))
        return { current: [currStart, toISO(now)], previous: [prevStart, prevEnd] }
      }
      case 'year': {
        const currStart = toISO(startOfPeriod(now, 365)); const prevEnd = toISO(addDays(now, -365)); const prevStart = toISO(startOfPeriod(now, 730))
        return { current: [currStart, toISO(now)], previous: [prevStart, prevEnd] }
      }
      case 'custom': {
        return {
          current: [customCurrent.start || toISO(now), customCurrent.end || toISO(now)],
          previous: [customPrevious.start || toISO(now), customPrevious.end || toISO(now)],
        }
      }
    }
  }, [preset, customCurrent, customPrevious])

  const loadData = useCallback(async () => {
    const ranges = getDateRanges()
    const r = await window.api.reports.getPeriodComparison(
      ranges.current[0], ranges.current[1], ranges.previous[0], ranges.previous[1]
    )
    if (r.success && r.data) setData(r.data)
  }, [getDateRanges])

  useEffect(() => { loadData() }, [loadData])

  const ChangeIndicator = ({ value, percent }: { value: number; percent: number }) => (
    <span className="text-xs font-bold" style={{ color: value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : tSec }}>
      {value > 0 ? '↑' : value < 0 ? '↓' : '—'} {Math.abs(percent).toFixed(1)}%
    </span>
  )

  const MetricCard = ({ label, current, previous, change, changePercent }: { label: string; current: number; previous: number; change: number; changePercent: number }) => (
    <div className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="text-[10px] font-bold mb-1" style={{ color: tSec }}>{label}</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold" style={{ color: tPri }}>{formatPriceFA(current)}</div>
          <div className="text-[10px]" style={{ color: tSec }}>قبل: {formatPriceFA(previous)}</div>
        </div>
        <ChangeIndicator value={change} percent={changePercent} />
      </div>
    </div>
  )

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
      </div>
    )
  }

  const handleExport = () => {
    const headers = ['معیار', 'دوره فعلی', 'دوره قبل', 'تغییر', 'تغییر %']
    const rows = [
      ['درآمد کل', data.totalSales.current, data.totalSales.previous, data.totalSales.change, data.totalSales.changePercent.toFixed(1)],
      ['تعداد سفارش', data.ordersCount.current, data.ordersCount.previous, data.ordersCount.change, data.ordersCount.changePercent.toFixed(1)],
      ['میانگین سفارش', data.avgOrderValue.current, data.avgOrderValue.previous, data.avgOrderValue.change, data.avgOrderValue.changePercent.toFixed(1)],
    ]
    downloadExcel('period-comparison.csv', headers, rows)
  }

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        {([['today', 'امروز/دیروز'], ['week', 'هفته'], ['month', 'ماه'], ['quarter', '۳ ماه'], ['year', 'سال'], ['custom', 'دلخواه']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setPreset(key)} className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: preset === key ? '#006194' : 'transparent', color: preset === key ? '#fff' : tSec, border: `1px solid ${preset === key ? '#006194' : cardBorder}` }}>{label}</button>
        ))}
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>خروجی اکسل</button>
      </div>

      {/* Custom date inputs */}
      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <div>
            <label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>دوره فعلی</label>
            <div className="flex gap-2">
              <ShamsiDateInput value={customCurrent.start} onChange={(v) => setCustomCurrent({ ...customCurrent, start: v })} />
              <ShamsiDateInput value={customCurrent.end} onChange={(v) => setCustomCurrent({ ...customCurrent, end: v })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>دوره قبل</label>
            <div className="flex gap-2">
              <ShamsiDateInput value={customPrevious.start} onChange={(v) => setCustomPrevious({ ...customPrevious, start: v })} />
              <ShamsiDateInput value={customPrevious.end} onChange={(v) => setCustomPrevious({ ...customPrevious, end: v })} />
            </div>
          </div>
        </div>
      )}

      {/* Period labels */}
      <div className="flex items-center justify-between text-xs" style={{ color: tSec }}>
        <span>دوره فعلی: {formatISOToJalali(data.currentPeriod.startDate)} → {formatISOToJalali(data.currentPeriod.endDate)}</span>
        <span>دوره قبل: {formatISOToJalali(data.previousPeriod.startDate)} → {formatISOToJalali(data.previousPeriod.endDate)}</span>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MetricCard label="درآمد کل" {...data.totalSales} />
        <MetricCard label="تعداد سفارشات" {...data.ordersCount} />
        <MetricCard label="میانگین سفارش" {...data.avgOrderValue} />
      </div>

      {/* Payment Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <MetricCard label="فروش نقدی" {...data.cashSales} />
        <MetricCard label="فروش کارتی" {...data.cardSales} />
        <MetricCard label="فروش اعتباری" {...data.ledgerSales} />
      </div>

      {/* Category Comparison */}
      {data.categoryComparison.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>مقایسه به تفکیک دسته</h3>
          <div className="space-y-2">
            {data.categoryComparison.map((cat: any) => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="text-xs font-bold w-20 truncate" style={{ color: tPri }}>{cat.category}</span>
                <div className="flex-1">
                  <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                    <div className="h-full rounded-full flex" style={{ opacity: 0.8 }}>
                      <div style={{ width: `${Math.max((cat.current / Math.max(cat.current, cat.previous, 1)) * 100, 2)}%`, backgroundColor: '#22c55e' }} />
                      <div style={{ width: `${Math.max((cat.previous / Math.max(cat.current, cat.previous, 1)) * 100, 2)}%`, backgroundColor: '#3b82f6', opacity: 0.5 }} />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono w-16 text-left" style={{ color: tPri }}>{formatPriceComma(cat.current)}</span>
                <ChangeIndicator value={cat.change} percent={cat.changePercent} />
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[10px]" style={{ color: tSec }}>
            <span>🟢 فعلی</span>
            <span>🔵 قبل</span>
          </div>
        </div>
      )}
    </div>
  )
}
