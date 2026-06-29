/**
 * SalesByHourReport — hourly sales distribution with heatmap and day-of-week analysis.
 *
 * Features:
 *   - 24-hour heatmap showing sales intensity
 *   - Peak hours identification
 *   - Day-of-week comparison chart
 *   - Metrics: orders count, revenue, avg order value per hour
 *   - Date range filter
 *   - Excel export
 *   - "No data" empty state
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { formatPriceFA, formatPriceComma } from '../../utils/jalali'
import { downloadExcel } from '../../utils/a4Print'

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year'

export default function SalesByHourReport() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [hourlyData, setHourlyData] = useState<any[]>([])
  const [dailyData, setDailyData] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('month')
  const [selectedHour, setSelectedHour] = useState<number | null>(null)

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

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
    const [hourRes, dayRes] = await Promise.all([
      window.api.reports.getSalesByHour(range.start, range.end),
      window.api.reports.getSalesByDayOfWeek(range.start, range.end),
    ])
    if (hourRes.success && hourRes.data) setHourlyData(hourRes.data)
    if (dayRes.success && dayRes.data) setDailyData(dayRes.data)
  }, [getDateRange])

  useEffect(() => { loadData() }, [loadData])

  // Filter to business hours (6-23)
  const businessHours = hourlyData.filter(h => h.hour >= 6 && h.hour <= 23)
  const maxOrders = Math.max(...businessHours.map(h => h.ordersCount), 1)
  const maxDailyRevenue = Math.max(...dailyData.map(d => d.totalRevenue), 1)

  // Find peak hours
  const peakHour = [...businessHours].sort((a, b) => b.totalRevenue - a.totalRevenue)[0]
  const totalOrders = businessHours.reduce((s, h) => s + h.ordersCount, 0)
  const totalRevenue = businessHours.reduce((s, h) => s + h.totalRevenue, 0)

  const handleExport = () => {
    const headers = ['ساعت', 'تعداد سفارش', 'درآمد کل', 'میانگین سفارش']
    const rows = hourlyData.map(h => [`${h.hour}:00-${h.hour + 1}:00`, h.ordersCount, h.totalRevenue, Math.round(h.avgOrderValue)])
    downloadExcel('sales-by-hour.csv', headers, rows)
  }

  if (hourlyData.length === 0 || hourlyData.every(h => h.ordersCount === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
        <p className="text-xs mt-1" style={{ color: tSec }}>فروشی در این بازه ثبت نشده</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'کل سفارشات', value: totalOrders.toLocaleString('fa-IR'), color: '#3b82f6' },
          { label: 'درآمد کل', value: formatPriceFA(totalRevenue), color: '#22c55e' },
          { label: 'پیک ساعتی', value: peakHour ? `${peakHour.hour}:00` : '-', color: '#f59e0b' },
          { label: 'میانگین سفارش', value: formatPriceFA(totalOrders > 0 ? totalRevenue / totalOrders : 0), color: '#a855f7' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Hourly Heatmap */}
      <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>فروش ساعتی</h3>
        <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-19 gap-1">
          {businessHours.map(h => {
            const intensity = h.ordersCount / maxOrders
            const bg = intensity === 0 ? (isDark ? '#1e293b' : '#f1f5f9')
              : intensity < 0.2 ? 'rgba(59,130,246,0.2)'
              : intensity < 0.4 ? 'rgba(59,130,246,0.4)'
              : intensity < 0.6 ? 'rgba(59,130,246,0.6)'
              : intensity < 0.8 ? 'rgba(59,130,246,0.8)'
              : 'rgba(59,130,246,1)'
            return (
              <button key={h.hour} onClick={() => setSelectedHour(selectedHour === h.hour ? null : h.hour)}
                className="rounded-lg p-1 text-center transition-all"
                style={{ backgroundColor: bg, border: selectedHour === h.hour ? '2px solid #006194' : '2px solid transparent' }}>
                <div className="text-[10px] font-bold" style={{ color: intensity > 0.5 ? '#fff' : tPri }}>{h.hour}</div>
                <div className="text-[8px]" style={{ color: intensity > 0.5 ? '#fff' : tSec }}>{h.ordersCount}</div>
              </button>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: tSec }}>
          <span>کم</span>
          <div className="flex gap-1">
            {[0.2, 0.4, 0.6, 0.8, 1].map(v => (
              <div key={v} className="w-4 h-3 rounded" style={{ backgroundColor: `rgba(59,130,246,${v})` }} />
            ))}
          </div>
          <span>زیاد</span>
        </div>
      </div>

      {/* Selected Hour Detail */}
      {selectedHour !== null && hourlyData[selectedHour] && (
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: tPri }}>ساعت {selectedHour}:00 — {selectedHour + 1}:00</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center"><div className="text-[10px]" style={{ color: tSec }}>سفارشات</div><div className="text-lg font-bold" style={{ color: '#3b82f6' }}>{hourlyData[selectedHour].ordersCount}</div></div>
            <div className="text-center"><div className="text-[10px]" style={{ color: tSec }}>درآمد</div><div className="text-lg font-bold" style={{ color: '#22c55e' }}>{formatPriceFA(hourlyData[selectedHour].totalRevenue)}</div></div>
            <div className="text-center"><div className="text-[10px]" style={{ color: tSec }}>میانگین</div><div className="text-lg font-bold" style={{ color: '#a855f7' }}>{formatPriceFA(hourlyData[selectedHour].avgOrderValue)}</div></div>
          </div>
        </div>
      )}

      {/* Day of Week Chart */}
      <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>فروش روزانه</h3>
        <div className="space-y-2">
          {dailyData.map((d) => {
            const pct = maxDailyRevenue > 0 ? (d.totalRevenue / maxDailyRevenue) * 100 : 0
            const isMax = d.totalRevenue === maxDailyRevenue
            return (
              <div key={d.dayOfWeek} className="flex items-center gap-2">
                <span className="text-xs font-bold w-16 text-right" style={{ color: isMax ? '#006194' : tPri }}>{d.dayName}</span>
                <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: isMax ? '#006194' : `rgba(59,130,246,0.5)` }} />
                </div>
                <span className="text-[10px] font-bold w-8 text-center" style={{ color: tSec }}>{d.ordersCount}</span>
                <span className="text-xs font-mono w-16 text-left" style={{ color: tPri }}>{formatPriceComma(d.totalRevenue)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
