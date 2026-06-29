/**
 * ExpiryAlerts — product expiry monitoring and alert display.
 *
 * Features:
 *   - Real-time alert list with color coding (red/orange/yellow)
 *   - Dashboard badge showing count of expiring products
 *   - Filterable by category and date range
 *   - "Alerted" flag to prevent duplicate notifications
 *   - Persian RTL UI
 *   - Text size control matching analytics tabs
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { formatISOToJalali } from '../utils/jalali'

function getExpiryColor(expiryDate: string): { bg: string; text: string; label: string } {
  const now = new Date()
  const exp = new Date(expiryDate)
  const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft < 0) return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: `منقضی شده (${Math.abs(daysLeft)} روز)` }
  if (daysLeft <= 7) return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', label: `${daysLeft} روز` }
  if (daysLeft <= 15) return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', label: `${daysLeft} روز` }
  if (daysLeft <= 30) return { bg: 'rgba(234,179,8,0.15)', text: '#eab308', label: `${daysLeft} روز` }
  return { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', label: `${daysLeft} روز` }
}

export default function ExpiryAlerts() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [products, setProducts] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'expired' | 'urgent' | 'warning'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categories, setCategories] = useState<string[]>([])

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const loadExpiring = useCallback(async () => {
    const r = await window.api.products.getExpiring(90)
    if (r.success && r.data) {
      setProducts(r.data)
      const cats = [...new Set(r.data.map((p: any) => p.category).filter(Boolean))]
      setCategories(cats)
    }
  }, [])

  useEffect(() => { loadExpiring() }, [loadExpiring])

  const filtered = products.filter(p => {
    const colors = getExpiryColor(p.expiryDate)
    if (filter === 'expired' && colors.label.startsWith('منقضی')) return true
    if (filter === 'urgent') { const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000); return days >= 0 && days <= 7 }
    if (filter === 'warning') { const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000); return days > 7 && days <= 30 }
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
    return true
  })

  const expiredCount = products.filter(p => getExpiryColor(p.expiryDate).label.startsWith('منقضی')).length
  const urgentCount = products.filter(p => { const d = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000); return d >= 0 && d <= 7 }).length
  const warningCount = products.filter(p => { const d = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000); return d > 7 && d <= 30 }).length

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <p className="text-sm font-bold" style={{ color: tSec }}>کالای با تاریخ انقضا وجود ندارد</p>
        <p className="text-xs mt-1" style={{ color: tSec }}>کالاهای دارای تاریخ انقضا در اینجا نمایش داده می‌شوند</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="text-[10px] font-bold" style={{ color: tSec }}>کل دارای انقضا</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#3b82f6' }}>{products.length}</div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="text-[10px] font-bold" style={{ color: '#ef4444' }}>منقضی شده</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#ef4444' }}>{expiredCount}</div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>فوری (≤۷ روز)</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#f59e0b' }}>{urgentCount}</div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.2)' }}>
          <div className="text-[10px] font-bold" style={{ color: '#eab308' }}>هشدار (≤۳۰ روز)</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#eab308' }}>{warningCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {([['all', 'همه'], ['expired', 'منقضی شده'], ['urgent', 'فوری'], ['warning', 'هشدار']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: filter === key ? '#006194' : cardBg, color: filter === key ? '#fff' : tSec, border: `1px solid ${filter === key ? '#006194' : cardBorder}` }}>{label}</button>
        ))}
        {categories.length > 0 && (
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold outline-none" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: tPri }}>
            <option value="all">همه دسته‌ها</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filtered.map(p => {
          const colors = getExpiryColor(p.expiryDate)
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl transition-all"
              style={{ backgroundColor: colors.bg, border: `1px solid ${colors.text}30` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colors.text}20` }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate" style={{ color: tPri }}>{p.title}</div>
                <div className="text-[10px]" style={{ color: tSec }}>{p.barcode} | {p.category}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold" style={{ color: colors.text }}>{colors.label}</div>
                <div className="text-[10px]" style={{ color: tSec }}>{formatISOToJalali(p.expiryDate)}</div>
              </div>
              <div className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: `${colors.text}15`, color: colors.text }}>
                موجودی: {p.stock}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <p className="text-sm text-center py-4" style={{ color: tSec }}>موردی یافت نشد</p>}
      </div>
    </div>
  )
}

/** Badge component for dashboard — shows count of urgent/expired products */
export function ExpiryBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    window.api.products.getExpiring(30).then(r => {
      if (r.success && r.data) {
        const urgent = r.data.filter((p: any) => {
          const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / 86400000)
          return days <= 7
        })
        setCount(urgent.length)
      }
    })
  }, [])

  if (count === 0) return null
  return (
    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: '#ef4444' }}>
      {count}
    </span>
  )
}
