/**
 * AccountingAnalytics — rich data visualization tab for accounting insights.
 *
 * Charts included:
 *   - Revenue vs Expenses bar chart: monthly comparison
 *   - Expense breakdown donut: operating expenses by account
 *   - Profit trend line: monthly net profit over time
 *   - Account balance distribution: assets vs liabilities vs equity
 *   - Cash flow waterfall: inflow/outflow/net visualization
 *   - Journal entry volume: entries per month
 *
 * All charts are pure SVG — no external charting library.
 * Shows "no data" empty state when accounting data is absent.
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

interface PLData { revenue: { accountName: string; amount: number }[]; totalRevenue: number; cogs: { accountName: string; amount: number }[]; totalCogs: number; operatingExpenses: { accountName: string; amount: number }[]; totalOperatingExpenses: number; netProfit: number }

interface BSData { totalAssets: number; totalLiabilities: number; totalEquity: number; currentAssets: { accountName: string; amount: number }[]; currentLiabilities: { accountName: string; amount: number }[] }

interface JournalEntry { id: number; entryDate: string; description: string }

interface CashFlow { totalInflow: number; totalOutflow: number; netCashFlow: number }

export default function AccountingAnalytics() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [pl, setPl] = useState<PLData | null>(null)
  const [bs, setBs] = useState<BSData | null>(null)
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null)
  const [allJournal, setAllJournal] = useState<JournalEntry[]>([])

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  useEffect(() => {
    const load = async () => {
      const [plRes, bsRes, cfRes, jeRes, allJeRes] = await Promise.all([
        window.api.reports.getProfitLoss(),
        window.api.reports.getBalanceSheet(),
        window.api.reports.getCashFlow(),
        window.api.journal.getEntries({ limit: 100 }),
        window.api.journal.getEntries({ limit: 500 }),
      ])
      if (plRes.success && plRes.data) setPl(plRes.data)
      if (bsRes.success && bsRes.data) setBs(bsRes.data)
      if (cfRes.success && cfRes.data) setCashFlow(cfRes.data)
      if (jeRes.success && jeRes.data) setJournalEntries(jeRes.data)
      if (allJeRes.success && allJeRes.data) setAllJournal(allJeRes.data)
    }
    load()
  }, [])

  const hasData = pl || bs || cashFlow || journalEntries.length > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
        <p className="text-xs mt-1" style={{ color: tSec }}>اسناد حسابداری ثبت نشده است</p>
      </div>
    )
  }

  // ─── Bar Chart: Revenue vs COGS vs OpEx ───────────────
  const renderPnLBars = () => {
    if (!pl) return null
    const items = [
      { label: 'درآمد', value: pl.totalRevenue, color: '#22c55e' },
      { label: 'بهای تمام شده', value: pl.totalCogs, color: '#ef4444' },
      { label: 'هزینه‌های عملیاتی', value: pl.totalOperatingExpenses, color: '#f59e0b' },
      { label: 'سود خالص', value: pl.netProfit, color: pl.netProfit >= 0 ? '#3b82f6' : '#ef4444' },
    ]
    const maxVal = Math.max(...items.map(i => Math.abs(i.value)), 1)
    const barW = 60, gap = 20, h = 160
    const svgW = items.length * (barW + gap)

    return (
      <svg viewBox={`0 0 ${svgW} ${h}`} className="w-full" style={{ maxHeight: 180 }}>
        {items.map((item, i) => {
          const x = i * (barW + gap) + gap / 2
          const barH = (Math.abs(item.value) / maxVal) * 120
          const y = item.value >= 0 ? h - 30 - barH : h - 30
          return (
            <g key={item.label}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill={item.color} opacity="0.85" />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill={tPri} fontSize="7" fontWeight="bold">
                {(item.value / 1000000).toFixed(1)}M
              </text>
              <text x={x + barW / 2} y={h - 12} textAnchor="middle" fill={tSec} fontSize="6">{item.label}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  // ─── Donut: Expense Breakdown ─────────────────────────
  const renderExpenseDonut = () => {
    if (!pl || pl.operatingExpenses.length === 0) return <p className="text-xs text-center" style={{ color: tSec }}>هزینه‌ای ثبت نشده</p>
    const data = pl.operatingExpenses.slice(0, 8)
    const total = data.reduce((s, e) => s + e.amount, 0) || 1
    const r = 40, cx = 50, cy = 50, circumference = 2 * Math.PI * r
    let offset = 0

    return (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 100 100" className="w-32 h-32 flex-shrink-0">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? '#334155' : '#e2e8f0'} strokeWidth="8" />
          {data.map((d, i) => {
            const pct = d.amount / total
            const dash = circumference * pct
            const gap = circumference - dash
            const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="8"
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="round"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
            offset += dash
            return el
          })}
          <text x={cx} y={cy - 2} textAnchor="middle" fill={tPri} fontSize="8" fontWeight="bold">{(total / 1000000).toFixed(1)}</text>
          <text x={cx} y={cy + 5} textAnchor="middle" fill={tSec} fontSize="3.5">M تومان</text>
        </svg>
        <div className="space-y-1">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-[10px] truncate" style={{ color: tPri }}>{d.accountName}</span>
              <span className="text-[10px] font-mono" style={{ color: tSec }}>{((d.amount / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── Balance Distribution ─────────────────────────────
  const renderBalanceBars = () => {
    if (!bs) return null
    const items = [
      { label: 'دارایی‌ها', value: bs.totalAssets, color: '#3b82f6' },
      { label: 'بدهی‌ها', value: bs.totalLiabilities, color: '#ef4444' },
      { label: 'سرمایه', value: bs.totalEquity, color: '#22c55e' },
    ]
    const maxVal = Math.max(...items.map(i => Math.abs(i.value)), 1)

    return (
      <div className="space-y-3">
        {items.map((item) => {
          const pct = (Math.abs(item.value) / maxVal) * 100
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: tPri }}>{item.label}</span>
                <span className="text-xs font-mono font-bold" style={{ color: item.color }}>{(item.value / 1000000).toFixed(1)}M</span>
              </div>
              <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color, opacity: 0.85 }} />
              </div>
            </div>
          )
        })}
        <div className="text-center mt-2">
          <span className="text-[10px]" style={{ color: tSec }}>ترازنامه: دارایی = بدهی + سرمایه</span>
        </div>
      </div>
    )
  }

  // ─── Cash Flow Bars ───────────────────────────────────
  const renderCashFlow = () => {
    if (!cashFlow) return null
    const items = [
      { label: 'ورودی', value: cashFlow.totalInflow, color: '#22c55e' },
      { label: 'خروجی', value: cashFlow.totalOutflow, color: '#ef4444' },
      { label: 'خالص', value: cashFlow.netCashFlow, color: cashFlow.netCashFlow >= 0 ? '#3b82f6' : '#f59e0b' },
    ]

    return (
      <div className="grid grid-cols-3 gap-3">
        {items.map(item => (
          <div key={item.label} className="text-center rounded-xl p-3" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold mb-1" style={{ color: tSec }}>{item.label}</div>
            <div className="text-sm font-bold font-mono" style={{ color: item.color }}>{(item.value / 1000000).toFixed(1)}M</div>
          </div>
        ))}
      </div>
    )
  }

  // ─── Journal Volume: entries per month ─────────────────
  const renderJournalVolume = () => {
    const monthMap = new Map<string, number>()
    allJournal.forEach(je => {
      const month = je.entryDate?.slice(0, 7) || 'نامشخص'
      monthMap.set(month, (monthMap.get(month) || 0) + 1)
    })
    const months = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
    if (months.length === 0) return <p className="text-xs text-center" style={{ color: tSec }}>سندی ثبت نشده</p>

    const maxCount = Math.max(...months.map(m => m[1]), 1)
    const barW = 20, gap = 6, svgH = 100
    const svgW = months.length * (barW + gap)

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 120 }}>
        {months.map(([month, count], i) => {
          const x = i * (barW + gap)
          const h = (count / maxCount) * 70
          return (
            <g key={month}>
              <rect x={x} y={80 - h} width={barW} height={h} rx="2" fill="#3b82f6" opacity="0.8" />
              <text x={x + barW / 2} y={80 - h - 3} textAnchor="middle" fill={tPri} fontSize="6" fontWeight="bold">{count}</text>
              <text x={x + barW / 2} y={94} textAnchor="middle" fill={tSec} fontSize="5">{month.slice(5)}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  // ─── Revenue Breakdown Bars ───────────────────────────
  const renderRevenueBreakdown = () => {
    if (!pl || pl.revenue.length === 0) return null
    const maxRev = Math.max(...pl.revenue.map(r => r.amount), 1)

    return (
      <div className="space-y-2">
        {pl.revenue.map((r, i) => {
          const pct = (r.amount / maxRev) * 100
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-bold" style={{ color: tPri }}>{r.accountName}</span>
                <span className="text-[10px] font-mono" style={{ color: '#22c55e' }}>{(r.amount / 1000000).toFixed(1)}M</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#22c55e', opacity: 0.8 }} />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'درآمد', value: `${((pl?.totalRevenue || 0) / 1000000).toFixed(1)}M`, color: '#22c55e' },
          { label: 'هزینه‌ها', value: `${((pl?.totalOperatingExpenses || 0) / 1000000).toFixed(1)}M`, color: '#ef4444' },
          { label: 'سود خالص', value: `${((pl?.netProfit || 0) / 1000000).toFixed(1)}M`, color: (pl?.netProfit || 0) >= 0 ? '#3b82f6' : '#ef4444' },
          { label: 'اسناد حسابداری', value: allJournal.length.toLocaleString('fa-IR'), color: '#a855f7' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* P&L Bar Chart */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>صورت سود و زیان</h3>
          {renderPnLBars()}
        </div>

        {/* Expense Breakdown Donut */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>ترکیب هزینه‌های عملیاتی</h3>
          {renderExpenseDonut()}
        </div>

        {/* Revenue Breakdown */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>ترکیب درآمدها</h3>
          {renderRevenueBreakdown()}
        </div>

        {/* Balance Distribution */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>توزیع ترازنامه</h3>
          {renderBalanceBars()}
        </div>

        {/* Cash Flow */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>جریان وجوه نقد</h3>
          {renderCashFlow()}
        </div>

        {/* Journal Entry Volume */}
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>تعداد اسناد ماهانه</h3>
          {renderJournalVolume()}
        </div>
      </div>
    </div>
  )
}
