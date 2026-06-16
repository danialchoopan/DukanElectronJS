import { useState, useEffect, useRef } from 'react'
import type { Sale } from '../../../types'
import { fa } from '../i18n'
import { formatJalaliDateTime } from '../utils/jalali'
import ShamsiDateInput from '../components/ShamsiDateInput'

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [returnedIds, setReturnedIds] = useState<Set<number>>(new Set())
  const searchRef = useRef<HTMLInputElement>(null)
  const isDark = document.documentElement.classList.contains('dark')

  const loadData = async () => {
    let s: string, e: string
    if (startDate && endDate) { s = startDate; e = endDate + 'T23:59:59' }
    else if (startDate) { s = startDate; e = '2099-12-31T23:59:59' }
    else if (endDate) { s = '2020-01-01'; e = endDate + 'T23:59:59' }
    else { s = '2020-01-01'; e = '2099-12-31T23:59:59' }
    const r = await window.api.sales.getByDateRange(s, e)
    if (r.success && r.data) setSales(r.data)
  }

  useEffect(() => { loadData() }, [startDate, endDate])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleReturn = (sale: Sale) => { setReturnedIds((prev) => new Set(prev).add(sale.id)); setSelectedSale(null) }

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const headerBg = isDark ? '#0f172a' : '#f8fafc'
  const btnColor = isDark ? '#94a3b8' : '#ffffff'

  const filteredSales = sales.filter((s) => {
    if (filterMethod !== 'all' && s.paymentMethod !== filterMethod) return false
    if (filterStatus === 'returned' && !returnedIds.has(s.id)) return false
    if (filterStatus === 'normal' && returnedIds.has(s.id)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.invoiceNumber.toLowerCase().includes(q) || s.userName?.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q) || String(s.total_amount).includes(q)
    }
    return true
  })

  const totalRevenue = filteredSales.filter(s => !returnedIds.has(s.id)).reduce((sum, s) => sum + s.total_amount, 0)

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.dashboard.recentSales}</h2>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input ref={searchRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field" placeholder="جستجوی فاکتور، مشتری، صندوک‌دار... (F2)" />
        </div>
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
        <div className="flex items-end gap-2">
          <button onClick={loadData} className="btn btn-primary text-sm py-2">{fa.dashboard.refresh}</button>
          <button onClick={() => { setStartDate(''); setEndDate(''); setSearchQuery(''); setFilterMethod('all'); setFilterStatus('all') }} className="btn btn-gray text-sm py-2">{fa.dashboard.all}</button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {['all', 'cash', 'card', 'ledger'].map((m) => (
          <button key={m} onClick={() => setFilterMethod(m)} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: filterMethod === m ? '#3b82f6' : 'var(--bg-tertiary)', color: filterMethod === m ? '#fff' : 'var(--text-secondary)' }}>
            {m === 'all' ? fa.dashboard.all : m === 'cash' ? fa.payment.cash : m === 'card' ? fa.payment.card : fa.payment.ledger}
          </button>
        ))}
        <div className="w-px h-6 self-center mx-1" style={{ backgroundColor: cardBorder }} />
        {['all', 'normal', 'returned'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: filterStatus === s ? (s === 'returned' ? '#f59e0b' : '#3b82f6') : 'var(--bg-tertiary)', color: filterStatus === s ? '#fff' : 'var(--text-secondary)' }}>
            {s === 'all' ? 'همه' : s === 'normal' ? 'عادی' : 'بازگشتی'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.dashboard.invoices}</div>
          <div className="text-xl font-bold" style={{ color: textPrimary }}>{filteredSales.length}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: isDark ? '#052e16' : '#dcfce7', border: `1px solid ${cardBorder}` }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.dashboard.totalSales}</div>
          <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{totalRevenue.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', border: `1px solid ${cardBorder}` }}>
          <div className="text-xs" style={{ color: textSecondary }}>فیلتر شده</div>
          <div className="text-xl font-bold" style={{ color: textPrimary }}>{filteredSales.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: headerBg }}>
              <th className="text-right px-4 py-3" style={{ color: textSecondary }}>#</th>
              <th className="text-right px-4 py-3" style={{ color: textSecondary }}>فاکتور</th>
              <th className="text-right px-4 py-3" style={{ color: textSecondary }}>{fa.admin.cashier}</th>
              <th className="text-right px-4 py-3" style={{ color: textSecondary }}>{fa.admin.title}</th>
              <th className="text-center px-4 py-3" style={{ color: textSecondary }}>{fa.pos.items}</th>
              <th className="text-center px-4 py-3" style={{ color: textSecondary }}>{fa.payment.method}</th>
              <th className="text-right px-4 py-3" style={{ color: textSecondary }}>{fa.pos.total}</th>
              <th className="text-center px-4 py-3" style={{ color: textSecondary }}>وضعیت</th>
              <th className="text-right px-4 py-3" style={{ color: textSecondary }}>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((s, idx) => {
              const isReturned = returnedIds.has(s.id)
              return (
                <tr key={s.id} className="transition-all cursor-pointer" style={{ borderBottom: `1px solid ${cardBorder}`, backgroundColor: isReturned ? 'rgba(245,158,11,0.08)' : 'transparent' }}
                  onClick={() => setSelectedSale(s)}
                  onMouseEnter={(e) => { if (!isReturned) e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)' }}
                  onMouseLeave={(e) => { if (!isReturned) e.currentTarget.style.backgroundColor = 'transparent' }}>
                  <td className="px-4 py-2.5" style={{ color: textSecondary }}>{idx + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-bold" style={{ color: textPrimary }}>{s.invoiceNumber}</td>
                  <td className="px-4 py-2.5 font-medium" style={{ color: textPrimary }}>{s.userName}</td>
                  <td className="px-4 py-2.5" style={{ color: s.customerName ? textPrimary : textSecondary }}>{s.customerName || '-'}</td>
                  <td className="px-4 py-2.5 text-center" style={{ color: textPrimary }}>{s.items.length}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{
                      backgroundColor: s.paymentMethod === 'cash' ? '#dcfce7' : s.paymentMethod === 'card' ? '#dbeafe' : '#f3e8ff',
                      color: s.paymentMethod === 'cash' ? '#16a34a' : s.paymentMethod === 'card' ? '#2563eb' : '#9333ea',
                    }}>{s.paymentMethod === 'cash' ? fa.payment.cash : s.paymentMethod === 'card' ? fa.payment.card : fa.payment.ledger}</span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-right" style={{ color: isReturned ? '#f59e0b' : textPrimary, textDecoration: isReturned ? 'line-through' : 'none' }}>{s.total_amount.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2.5 text-center">
                    {isReturned ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>بازگشتی</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>عادی</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: textSecondary }}>{formatJalaliDateTime(s.createdAt)}</td>
                </tr>
              )
            })}
            {filteredSales.length === 0 && <tr><td colSpan={9} className="text-center py-12" style={{ color: textSecondary }}>{fa.dashboard.noData}</td></tr>}
          </tbody>
        </table>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setSelectedSale(null)}>
          <div className="rounded-2xl p-6 max-w-lg w-full mx-4 border-2" style={{ backgroundColor: cardBg, borderColor: returnedIds.has(selectedSale.id) ? '#f59e0b' : '#3b82f6' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg" style={{ color: textPrimary }}>{fa.receipt.invoice}</h3>
                <p className="text-sm font-mono" style={{ color: textSecondary }}>{selectedSale.invoiceNumber}</p>
                {returnedIds.has(selectedSale.id) && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>بازگشت شده</span>}
              </div>
              <button onClick={() => setSelectedSale(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }}>&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-xs mb-1" style={{ color: textSecondary }}>{fa.receipt.cashier}</div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>{selectedSale.userName}</div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-xs mb-1" style={{ color: textSecondary }}>{fa.payment.method}</div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>{selectedSale.paymentMethod === 'cash' ? fa.payment.cash : selectedSale.paymentMethod === 'card' ? fa.payment.card : fa.payment.ledger}</div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-xs mb-1" style={{ color: textSecondary }}>{fa.receipt.date}</div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>{formatJalaliDateTime(selectedSale.createdAt)}</div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="text-xs mb-1" style={{ color: textSecondary }}>{fa.admin.title}</div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>{selectedSale.customerName || '-'}</div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${cardBorder}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                    <th className="text-right px-3 py-2" style={{ color: textSecondary }}>کالا</th>
                    <th className="text-center px-3 py-2" style={{ color: textSecondary }}>تعداد</th>
                    <th className="text-right px-3 py-2" style={{ color: textSecondary }}>قیمت واحد</th>
                    <th className="text-right px-3 py-2" style={{ color: textSecondary }}>جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items?.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <td className="px-3 py-2 font-medium" style={{ color: textPrimary }}>{item.productTitle}</td>
                      <td className="px-3 py-2 text-center" style={{ color: textPrimary }}>{item.quantity}</td>
                      <td className="px-3 py-2 text-right" style={{ color: textPrimary }}>{item.unitPrice.toLocaleString('fa-IR')}</td>
                      <td className="px-3 py-2 text-right font-bold" style={{ color: textPrimary }}>{item.subtotal.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 mb-4" style={{ borderTop: `2px solid ${cardBorder}` }}>
              <span className="font-bold" style={{ color: textPrimary }}>{fa.pos.total}</span>
              <span className="text-xl font-bold" style={{ color: '#22c55e' }}>{selectedSale.total_amount.toLocaleString('fa-IR')} {fa.common.toman}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { window.print() }} className="btn btn-primary flex-1 py-2.5">چاپ فاکتور</button>
              {!returnedIds.has(selectedSale.id) && (
                <button onClick={() => handleReturn(selectedSale)} className="btn btn-danger flex-1 py-2.5">بازگشت</button>
              )}
              <button onClick={() => setSelectedSale(null)} className="btn btn-gray flex-1 py-2.5">{fa.common.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
