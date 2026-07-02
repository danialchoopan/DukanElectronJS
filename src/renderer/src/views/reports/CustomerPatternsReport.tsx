/**
 * CustomerPatternsReport — customer behavior analysis with retention and churn.
 *
 * Features:
 *   - Summary KPIs: total, active, at-risk, churned customers
 *   - Retention rate display
 *   - Customer segments: active (≤30d), at-risk (31-90d), churned (>90d)
 *   - Top purchasing categories
 *   - Avg purchase frequency
 *   - Customer detail table with segment, favorite categories, days between purchases
 *   - Excel export
 *   - "No data" empty state
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { formatPriceFA } from '../../utils/jalali'
import { downloadExcel } from '../../utils/a4Print'

const STATUS_COLORS = { active: '#22c55e', at_risk: '#f59e0b', churned: '#ef4444' }
const STATUS_LABELS = { active: 'فعال', at_risk: 'در خطر', churned: 'غیرفعال' }

export default function CustomerPatternsReport() {
  const { isDark, colors } = useTheme()
  const [customers, setCustomers] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'at_risk' | 'churned'>('all')

  const tPri = colors.text.primary
  const tSec = colors.text.secondary
  const cardBg = colors.bg.card
  const cardBorder = colors.border.default

  useEffect(() => {
    window.api.reports.getCustomerPatterns().then(r => {
      if (r.success && r.data) {
        setCustomers(r.data.customers || [])
        setSummary(r.data.summary || null)
      }
    })
  }, [])

  const filtered = filter === 'all' ? customers : customers.filter(c => c.status === filter)

  const handleExport = () => {
    const headers = ['مشتری', 'تعداد خرید', 'مبلغ کل', 'فاصله خرید', 'دسته‌های مورد علاقه', 'آخرین خرید (روز)', 'وضعیت']
    const rows = filtered.map(c => [c.customerName, c.totalPurchases, c.totalSpent, c.avgDaysBetween, c.favoriteCategories, c.lastPurchaseDaysAgo, STATUS_LABELS[c.status as keyof typeof STATUS_LABELS]])
    downloadExcel('customer-patterns.csv', headers, rows)
  }

  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>داده‌ای موجود نیست</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>مشتریان فعال</div>
            <div className="text-lg font-bold mt-1" style={{ color: '#22c55e' }}>{summary.activeCustomers}</div>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>در خطر</div>
            <div className="text-lg font-bold mt-1" style={{ color: '#f59e0b' }}>{summary.atRiskCustomers}</div>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="text-[10px] font-bold" style={{ color: '#ef4444' }}>غیرفعال</div>
            <div className="text-lg font-bold mt-1" style={{ color: '#ef4444' }}>{summary.churnedCustomers}</div>
          </div>
          <div className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>نرخ بازگشت</div>
            <div className="text-lg font-bold mt-1" style={{ color: '#3b82f6' }}>{summary.retentionRate.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Top Categories */}
      {summary && summary.topCategories.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: tPri }}>پرفروش‌ترین دسته‌ها</h3>
          <div className="flex flex-wrap gap-2">
            {summary.topCategories.map((c: any, i: number) => (
              <span key={c.category} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: `rgba(59,130,246,${0.1 + i * 0.05})`, color: '#3b82f6' }}>
                {c.category} ({c.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {([['all', 'همه'], ['active', 'فعال'], ['at_risk', 'در خطر'], ['churned', 'غیرفعال']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: filter === key ? '#006194' : cardBg, color: filter === key ? '#fff' : tSec, border: `1px solid ${filter === key ? '#006194' : cardBorder}` }}>{label}</button>
        ))}
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>خروجی اکسل</button>
      </div>

      {/* Customer Table */}
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: cardBorder }}>
        <table className="w-full text-xs">
          <thead><tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            <th className="px-3 py-2 text-right" style={{ color: tSec }}>مشتری</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>خریدها</th>
            <th className="px-3 py-2 text-left" style={{ color: tSec }}>مبلغ کل</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>فاصله خرید</th>
            <th className="px-3 py-2 text-right" style={{ color: tSec }}>دسته‌های مورد علاقه</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>آخرین خرید</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>وضعیت</th>
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.customerId} style={{ borderTop: `1px solid ${cardBorder}` }}>
                <td className="px-3 py-2 font-bold" style={{ color: tPri }}>{c.customerName}</td>
                <td className="px-3 py-2 text-center font-mono" style={{ color: tPri }}>{c.totalPurchases}</td>
                <td className="px-3 py-2 text-left font-mono" style={{ color: '#22c55e' }}>{formatPriceFA(c.totalSpent)}</td>
                <td className="px-3 py-2 text-center" style={{ color: tSec }}>{c.avgDaysBetween > 0 ? `هر ${c.avgDaysBetween} روز` : '-'}</td>
                <td className="px-3 py-2 text-right" style={{ color: tSec }}>{c.favoriteCategories}</td>
                <td className="px-3 py-2 text-center" style={{ color: tSec }}>{c.lastPurchaseDaysAgo === 0 ? 'امروز' : c.lastPurchaseDaysAgo === 1 ? 'دیروز' : `${c.lastPurchaseDaysAgo} روز پیش`}</td>
                <td className="px-3 py-2 text-center">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLORS[c.status as keyof typeof STATUS_COLORS]}20`, color: STATUS_COLORS[c.status as keyof typeof STATUS_COLORS] }}>
                    {STATUS_LABELS[c.status as keyof typeof STATUS_LABELS]}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="text-center py-4" style={{ color: tSec }}>موردی یافت نشد</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
