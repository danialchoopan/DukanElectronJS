/**
 * BestCustomersReport — top customers by revenue with tier system and CLV.
 *
 * Features:
 *   - Top 10 customers bar chart with tier colors
 *   - Ranking table with purchases, revenue, avg order, last purchase, tier
 *   - Customer tier system: VIP/Purple, Gold/Yellow, Silver/Gray, Bronze/Brown
 *   - Days between purchases (frequency analysis)
 *   - Trend indicators (purchases vs last period)
 *   - Excel export
 *   - "No data" empty state
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { formatPriceFA, formatPriceComma, formatISOToJalali } from '../../utils/jalali'
import { downloadExcel } from '../../utils/a4Print'

const TIER_COLORS: Record<string, string> = { VIP: '#a855f7', Gold: '#f59e0b', Silver: '#94a3b8', Bronze: '#cd7f32' }

export default function BestCustomersReport() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [data, setData] = useState<any[]>([])

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

  useEffect(() => { window.api.reports.getBestCustomers(20).then(r => { console.log('[REPORT] bestCustomers response:', JSON.stringify(r).slice(0, 500)); if (r.success && r.data) setData(r.data) }) }, [])

  const top10 = data.slice(0, 10)
  const maxSpent = Math.max(...top10.map(r => r.totalSpent), 1)

  const handleExport = () => {
    const headers = ['رتبه', 'مشتری', 'تلفن', 'تعداد خرید', 'مبلغ کل', 'میانگین سفارش', 'تاریخ آخرین خرید', 'رتبه‌بندی', 'فاصله خرید (روز)']
    const rows = data.map(r => [r.rank, r.customerName, r.phone, r.totalPurchases, r.totalSpent, Math.round(r.avgOrderValue), r.lastPurchaseDate, r.tier, r.daysBetweenPurchases])
    downloadExcel('best-customers.csv', headers, rows)
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
        <p className="text-xs mt-1" style={{ color: tSec }}>مشتری خریداری ثبت نشده</p>
      </div>
    )
  }

  // Tier stats
  const tierStats = { VIP: data.filter(c => c.tier === 'VIP').length, Gold: data.filter(c => c.tier === 'Gold').length, Silver: data.filter(c => c.tier === 'Silver').length, Bronze: data.filter(c => c.tier === 'Bronze').length }

  return (
    <div className="space-y-4">
      {/* Tier Stats */}
      <div className="flex gap-2 mb-2">
        {Object.entries(tierStats).filter(([, v]) => v > 0).map(([tier, count]) => (
          <span key={tier} className="px-3 py-1 rounded-xl text-xs font-bold" style={{ backgroundColor: `${TIER_COLORS[tier as keyof typeof TIER_COLORS]}20`, color: TIER_COLORS[tier as keyof typeof TIER_COLORS] }}>
            {tier === 'VIP' ? 'ویژه' : tier === 'Gold' ? 'طلایی' : tier === 'Silver' ? 'نقره‌ای' : 'برنزی'}: {count}
          </span>
        ))}
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>خروجی اکسل</button>
      </div>

      {/* Bar Chart */}
      <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>۱۰ مشتری برتر</h3>
        <div className="space-y-2">
          {top10.map((r) => {
            const pct = (r.totalSpent / maxSpent) * 100
            return (
              <div key={r.customerId} className="flex items-center gap-2">
                <span className="text-xs font-bold w-6 text-center" style={{ color: r.rank <= 3 ? COLORS[r.rank - 1] : tSec }}>{r.rank}</span>
                <span className="text-xs truncate font-bold w-20" style={{ color: tPri }}>{r.customerName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${TIER_COLORS[r.tier]}20`, color: TIER_COLORS[r.tier] }}>{r.tier}</span>
                <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: TIER_COLORS[r.tier], opacity: 0.85 }} />
                </div>
                <span className="text-xs font-mono font-bold w-20 text-left" style={{ color: tPri }}>{formatPriceComma(r.totalSpent)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: cardBorder }}>
        <table className="w-full text-xs">
          <thead><tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>#</th>
            <th className="px-3 py-2 text-right" style={{ color: tSec }}>مشتری</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>رتبه</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>خریدها</th>
            <th className="px-3 py-2 text-left" style={{ color: tSec }}>مبلغ کل</th>
            <th className="px-3 py-2 text-left" style={{ color: tSec }}>میانگین</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>فاصله خرید</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>آخرین خرید</th>
          </tr></thead>
          <tbody>
            {data.map(r => (
              <tr key={r.customerId} style={{ borderTop: `1px solid ${cardBorder}` }}>
                <td className="px-3 py-2 text-center font-bold" style={{ color: r.rank <= 3 ? COLORS[r.rank - 1] : tSec }}>{r.rank}</td>
                <td className="px-3 py-2 font-bold" style={{ color: tPri }}>{r.customerName}</td>
                <td className="px-3 py-2 text-center"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${TIER_COLORS[r.tier]}20`, color: TIER_COLORS[r.tier] }}>{r.tier}</span></td>
                <td className="px-3 py-2 text-center font-mono" style={{ color: tPri }}>{r.totalPurchases}</td>
                <td className="px-3 py-2 text-left font-mono" style={{ color: '#22c55e' }}>{formatPriceComma(r.totalSpent)}</td>
                <td className="px-3 py-2 text-left font-mono" style={{ color: tSec }}>{formatPriceFA(r.avgOrderValue)}</td>
                <td className="px-3 py-2 text-center" style={{ color: tSec }}>{r.daysBetweenPurchases > 0 ? `هر ${r.daysBetweenPurchases} روز` : '-'}</td>
                <td className="px-3 py-2 text-center" style={{ color: tSec }}>{r.lastPurchaseDate ? formatISOToJalali(r.lastPurchaseDate) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
