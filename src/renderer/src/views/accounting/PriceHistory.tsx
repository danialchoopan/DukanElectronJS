/** PriceHistory — displays price change history for products.
 *  Shows selling price history, purchase price history, and discount history.
 *  Supports date range filtering and product search.
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import Pagination from '../../components/ui/Pagination'
import { formatJalaliDateTime } from '../../utils/jalali'
import ShamsiDateInput from '../../components/business/ShamsiDateInput'

export default function PriceHistory() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [history, setHistory] = useState<any[]>([])
  const [latestPrices, setLatestPrices] = useState<any[]>([])
  const [priceFilter, setPriceFilter] = useState<'all' | 'sale' | 'purchase'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [activeView, setActiveView] = useState<'history' | 'overview'>('overview')
  const pageSize = 15

  const cBg = isDark ? '#1e293b' : '#ffffff'
  const cBorder = isDark ? '#334155' : '#e2e8f0'
  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const primary = '#006194'

  const load = async () => {
    const r = await window.api.priceHistory.get({
      priceType: priceFilter === 'all' ? undefined : priceFilter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    if (r.success && r.data) setHistory(r.data)
    const lr = await window.api.priceHistory.latest()
    if (lr.success && lr.data) setLatestPrices(lr.data)
  }

  useEffect(() => { load() }, [priceFilter, startDate, endDate])

  const filteredHistory = search
    ? history.filter(h => h.productName?.toLowerCase().includes(search.toLowerCase()) || h.barcode?.includes(search))
    : history

  const pagedHistory = filteredHistory.slice(page * pageSize, (page + 1) * pageSize)

  const tabs = [
    { key: 'overview' as const, label: 'نمای کلی قیمت‌ها' },
    { key: 'history' as const, label: 'تاریخچه تغییرات' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveView(t.key)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: activeView === t.key ? `linear-gradient(135deg, ${primary}, #007bb9)` : cBg, color: activeView === t.key ? '#fff' : tSec, border: `1px solid ${activeView === t.key ? primary : cBorder}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeView === 'overview' && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cBg, borderColor: cBorder }}>
          <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${cBorder}` }}>
            <span className="text-sm font-bold" style={{ color: tPri }}>قیمت‌های فعلی محصولات</span>
            <span className="text-xs" style={{ color: tSec }}>{latestPrices.length} محصول</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>محصول</th>
              <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>بارکد</th>
              <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>قیمت فروش</th>
              <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>قیمت خرید</th>
              <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>حاشیه سود</th>
            </tr></thead>
            <tbody>
              {latestPrices.map(p => {
                const margin = p.purchase_price > 0 ? ((p.sale_price - p.purchase_price) / p.purchase_price * 100).toFixed(1) : '0'
                return (
                  <tr key={p.id} style={{ borderTop: `1px solid ${cBorder}` }}>
                    <td className="px-4 py-2.5 font-bold" style={{ color: tPri }}>{p.title}</td>
                    <td className="px-4 py-2.5 font-mono text-xs" style={{ color: tSec }}>{p.barcode || '-'}</td>
                    <td className="px-4 py-2.5 text-xs font-bold" style={{ color: primary }}>{p.sale_price.toLocaleString('fa-IR')} ت</td>
                    <td className="px-4 py-2.5 text-xs font-bold" style={{ color: tPri }}>{p.purchase_price.toLocaleString('fa-IR')} ت</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: parseFloat(margin) > 20 ? '#dcfce7' : parseFloat(margin) > 10 ? '#fef3c7' : '#fee2e2', color: parseFloat(margin) > 20 ? '#166534' : parseFloat(margin) > 10 ? '#92400e' : '#991b1b' }}>
                        %{margin}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* History Tab */}
      {activeView === 'history' && (
        <>
          <div className="flex gap-3 flex-wrap">
            <select value={priceFilter} onChange={e => { setPriceFilter(e.target.value as any); setPage(0) }}
              className="px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: cBg, border: `1px solid ${cBorder}`, color: tPri }}>
              <option value="all">همه</option>
              <option value="sale">قیمت فروش</option>
              <option value="purchase">قیمت خرید</option>
            </select>
            <ShamsiDateInput value={startDate} onChange={(v) => { setStartDate(v); setPage(0) }} />
            <span className="text-xs self-center" style={{ color: tSec }}>تا</span>
            <ShamsiDateInput value={endDate} onChange={(v) => { setEndDate(v); setPage(0) }} />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} placeholder="جستجوی محصول..."
              className="px-3 py-2 rounded-xl text-xs flex-1" style={{ backgroundColor: cBg, border: `1px solid ${cBorder}`, color: tPri }} />
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cBg, borderColor: cBorder }}>
            <table className="w-full text-sm">
              <thead><tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>تاریخ</th>
                <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>محصول</th>
                <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>نوع</th>
                <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>قیمت قبلی</th>
                <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>قیمت جدید</th>
                <th className="text-right px-4 py-2 text-xs font-bold" style={{ color: tSec }}>تغییر</th>
              </tr></thead>
              <tbody>
                {pagedHistory.map(h => {
                  const diff = h.newPrice - h.oldPrice
                  return (
                    <tr key={h.id} style={{ borderTop: `1px solid ${cBorder}` }}>
                      <td className="px-4 py-2.5 text-xs" style={{ color: tSec }}>{formatJalaliDateTime(h.changedAt)}</td>
                      <td className="px-4 py-2.5 font-bold text-xs" style={{ color: tPri }}>{h.productName || '-'}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: h.priceType === 'sale' ? '#dbeafe' : '#dcfce7', color: h.priceType === 'sale' ? '#2563eb' : '#16a34a' }}>
                          {h.priceType === 'sale' ? 'فروش' : 'خرید'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: tSec }}>{h.oldPrice.toLocaleString('fa-IR')} ت</td>
                      <td className="px-4 py-2.5 text-xs font-bold" style={{ color: tPri }}>{h.newPrice.toLocaleString('fa-IR')} ت</td>
                      <td className="px-4 py-2.5 text-xs font-bold" style={{ color: diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : tSec }}>
                        {diff > 0 ? '+' : ''}{diff.toLocaleString('fa-IR')}
                      </td>
                    </tr>
                  )
                })}
                {pagedHistory.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-sm" style={{ color: tSec }}>تاریخچه‌ای یافت نشد</td></tr>}
              </tbody>
            </table>
          </div>

          {filteredHistory.length > pageSize && (
            <Pagination total={filteredHistory.length} pageSize={pageSize} page={page} onPageChange={setPage} onPageSizeChange={() => {}} />
          )}
        </>
      )}
    </div>
  )
}
