import { useState, useEffect, useRef } from 'react'
import type { Sale } from '../../../types'
import { fa } from '../i18n'
import { formatJalaliDateTime } from '../utils/jalali'
import { printA4Report, downloadExcel } from '../utils/a4Print'
import ShamsiDateInput from '../components/ShamsiDateInput'
import Pagination from '../components/Pagination'
import { useAuthStore } from '../store/authStore'
import { useSortable } from '../hooks/useSortable'
import PrintDialog from '../components/PrintDialog'

export default function SalesHistory() {
  const [sales, setSales] = useState<Sale[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [returnedIds, setReturnedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [returnItem, setReturnItem] = useState<{ sale: Sale; item: any } | null>(null)
  const [returnQty, setReturnQty] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const isDark = document.documentElement.classList.contains('dark')
  const user = useAuthStore((s) => s.user)

  const loadData = async () => {
    let s: string, e: string
    if (startDate && endDate) { s = startDate; e = endDate + 'T23:59:59' }
    else if (startDate) { s = startDate; e = '2099-12-31T23:59:59' }
    else if (endDate) { s = '2020-01-01'; e = endDate + 'T23:59:59' }
    else { s = '2020-01-01'; e = '2099-12-31T23:59:59' }
    const r = await window.api.sales.getByDateRange(s, e)
    if (r.success && r.data) setSales(r.data)
  }

  useEffect(() => { loadData(); loadReturns() }, [startDate, endDate])

  const loadReturns = async () => {
    const r = await window.api.returns.list()
    if (r.success && r.data) {
      const keys = new Set<string>()
      r.data.forEach((ret: any) => keys.add(`${ret.saleId}-${ret.productId}`))
      setReturnedIds(keys)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleReturnItem = async () => {
    if (!returnItem || !returnQty || !returnReason) return
    const qty = parseInt(returnQty)
    if (qty <= 0 || qty > returnItem.item.quantity) return
    const refundAmount = returnItem.item.unitPrice * qty
    const r = await window.api.returns.create({
      saleId: returnItem.sale.id,
      userId: user?.id || 1,
      productId: returnItem.item.productId,
      quantity: qty,
      reason: returnReason,
      refundAmount,
    })
    if (r.success) {
      setReturnItem(null)
      setReturnQty('')
      setReturnReason('')
      setSelectedSale(null)
      loadData()
      loadReturns()
    }
  }

  const handleReturnAllItems = async () => {
    if (!selectedSale || !selectedSale.items) return
    const unreturnedItems = selectedSale.items.filter((item: any) => !returnedIds.has(`${selectedSale.id}-${item.productId}`))
    if (unreturnedItems.length === 0) return
    for (const item of unreturnedItems) {
      await window.api.returns.create({
        saleId: selectedSale.id,
        userId: user?.id || 1,
        productId: item.productId,
        quantity: item.quantity,
        reason: 'بازگشت کل فاکتور',
        refundAmount: item.unitPrice * item.quantity,
      })
    }
    setSelectedSale(null)
    loadData()
    loadReturns()
  }

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnColor = isDark ? '#94a3b8' : '#ffffff'

  const filteredSales = sales.filter((s) => {
    if (filterMethod !== 'all' && s.paymentMethod !== filterMethod) return false
    const hasReturns = s.items?.some((item: any) => returnedIds.has(`${s.id}-${item.productId}`))
    if (filterStatus === 'returned' && !hasReturns) return false
    if (filterStatus === 'normal' && hasReturns) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return s.invoiceNumber.toLowerCase().includes(q) || s.userName?.toLowerCase().includes(q) || s.customerName?.toLowerCase().includes(q) || String(s.total_amount).includes(q)
    }
    return true
  })

  const totalRevenue = filteredSales.filter(s => !s.items?.every((item: any) => returnedIds.has(`${s.id}-${item.productId}`))).reduce((sum, s) => sum + s.total_amount, 0)
  const pagedSales = filteredSales.slice(page * pageSize, (page + 1) * pageSize)
  const { sorted: sortedSales, sortKey, sortDir, toggleSort } = useSortable(pagedSales)
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  const handlePrintSales = (range: { start: number; end: number } | 'all') => {
    let data = filteredSales
    if (range !== 'all') {
      data = filteredSales.slice(range.start - 1, range.end)
    }
    let html = '<h1>گزارش فروش</h1>'
    html += `<div class="header-info"><span>از: ${startDate || 'همه'} تا: ${endDate || 'همه'}</span><span>تعداد: ${data.length}</span></div>`
    html += '<table><thead><tr><th>فاکتور</th><th>تاریخ</th><th>صندوکدار</th><th>مشتری</th><th>تعداد اقلام</th><th>نوع پرداخت</th><th>مبلغ</th></tr></thead><tbody>'
    data.forEach(s => {
      html += `<tr><td>${s.invoiceNumber}</td><td>${formatJalaliDateTime(s.createdAt)}</td><td>${s.userName}</td><td>${s.customerName || '-'}</td><td>${s.items?.length || 0}</td><td>${s.paymentMethod === 'cash' ? 'نقدی' : s.paymentMethod === 'card' ? 'کارتی' : 'نسیه'}</td><td>${s.total_amount.toLocaleString('fa-IR')}</td></tr>`
    })
    html += '</tbody></table>'
    html += `<p>جمع کل: ${data.reduce((sum, s) => sum + s.total_amount, 0).toLocaleString('fa-IR')} تومان</p>`
    printA4Report(html, 'گزارش فروش')
  }

  const handleExcelSales = () => {
    const headers = ['فاکتور', 'تاریخ', 'صندوکدار', 'مشتری', 'تعداد اقلام', 'نوع پرداخت', 'مبلغ']
    const csvRows = filteredSales.map(s => [s.invoiceNumber, formatJalaliDateTime(s.createdAt), s.userName, s.customerName || '-', s.items?.length || 0, s.paymentMethod === 'cash' ? 'نقدی' : s.paymentMethod === 'card' ? 'کارتی' : 'نسیه', s.total_amount])
    downloadExcel('sales-history.csv', headers, csvRows)
  }

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
          <button onClick={() => setShowPrintDialog(true)} className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            چاپ گزارش فروش
          </button>
          <button onClick={handleExcelSales} className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            خروجی اکسل
          </button>
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
          <div className="text-xl font-bold" style={{ color: '#3b82f6' }}>{filteredSales.length}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : '#dcfce7', border: `1px solid ${cardBorder}` }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.dashboard.totalSales}</div>
          <div className="text-xl font-bold" style={{ color: '#22c55e' }}>{totalRevenue.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: isDark ? 'rgba(148,163,184,0.1)' : '#f1f5f9', border: `1px solid ${cardBorder}` }}>
          <div className="text-xs" style={{ color: textSecondary }}>فیلتر شده</div>
          <div className="text-xl font-bold" style={{ color: '#3b82f6' }}>{filteredSales.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? 'rgba(0,97,148,0.1)' : '#f0f4f8' }}>
              {([
                { key: 'id' as keyof Sale, label: '#' },
                { key: 'invoiceNumber' as keyof Sale, label: 'فاکتور' },
                { key: 'userName' as keyof Sale, label: fa.admin.cashier },
                { key: 'customerName' as keyof Sale, label: fa.admin.title },
                { key: 'total_amount' as keyof Sale, label: fa.pos.total },
                { key: 'createdAt' as keyof Sale, label: 'تاریخ' },
              ]).map(col => (
                <th key={String(col.key)}
                  className="px-4 py-3 cursor-pointer select-none transition-all hover:bg-blue-500/10 text-right"
                  style={{ color: sortKey === col.key ? '#3b82f6' : textSecondary }}
                  onClick={() => toggleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <span className="text-[10px] opacity-50">{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </span>
                </th>
              ))}
              <th className="text-center px-4 py-3" style={{ color: textSecondary }}>{fa.pos.items}</th>
              <th className="text-center px-4 py-3" style={{ color: textSecondary }}>{fa.payment.method}</th>
              <th className="text-center px-4 py-3" style={{ color: textSecondary }}>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {sortedSales.map((s, idx) => {
              const hasReturns = s.items?.some((item: any) => returnedIds.has(`${s.id}-${item.productId}`))
              const isFullyReturned = s.items?.every((item: any) => returnedIds.has(`${s.id}-${item.productId}`))
              return (
                <tr key={s.id} className="transition-all cursor-pointer" style={{ borderBottom: `1px solid ${cardBorder}`, backgroundColor: isFullyReturned ? 'rgba(239,68,68,0.08)' : hasReturns ? 'rgba(245,158,11,0.08)' : 'transparent' }}
                  onClick={() => setSelectedSale(s)}
                  onMouseEnter={(e) => { if (!hasReturns) e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)' }}
                  onMouseLeave={(e) => { if (!hasReturns) e.currentTarget.style.backgroundColor = 'transparent' }}>
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
                  <td className="px-4 py-2.5 font-bold text-right" style={{ color: isFullyReturned ? '#ef4444' : textPrimary, textDecoration: isFullyReturned ? 'line-through' : 'none' }}>{s.total_amount.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2.5 text-center">
                    {isFullyReturned ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>بازگشت کامل</span> : hasReturns ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>بازگشت جزئی</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>عادی</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: textSecondary }}>{formatJalaliDateTime(s.createdAt)}</td>
                </tr>
              )
            })}
            {pagedSales.length === 0 && <tr><td colSpan={9} className="text-center py-12" style={{ color: textSecondary }}>{fa.dashboard.noData}</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination total={filteredSales.length} pageSize={pageSize} page={page}
        onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(0) }} />

      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setSelectedSale(null)}>
          <div className="rounded-2xl p-6 max-w-lg w-full mx-4 border-2" style={{ backgroundColor: cardBg, borderColor: selectedSale.items?.some((item: any) => returnedIds.has(`${selectedSale.id}-${item.productId}`)) ? '#f59e0b' : '#006194' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg" style={{ color: textPrimary }}>{fa.receipt.invoice}</h3>
                <p className="text-sm font-mono" style={{ color: textSecondary }}>{selectedSale.invoiceNumber}</p>
                {selectedSale.items?.some((item: any) => returnedIds.has(`${selectedSale.id}-${item.productId}`)) && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>بازگشت شده</span>}
              </div>
              <button onClick={() => setSelectedSale(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }}>&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl p-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                <div className="text-xs mb-1" style={{ color: textSecondary }}>{fa.receipt.cashier}</div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>{selectedSale.userName}</div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                <div className="text-xs mb-1" style={{ color: textSecondary }}>{fa.payment.method}</div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>{selectedSale.paymentMethod === 'cash' ? fa.payment.cash : selectedSale.paymentMethod === 'card' ? fa.payment.card : fa.payment.ledger}</div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                <div className="text-xs mb-1" style={{ color: textSecondary }}>{fa.receipt.date}</div>
                <div className="text-sm font-bold" style={{ color: textPrimary }}>{formatJalaliDateTime(selectedSale.createdAt)}</div>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
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
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items?.map((item: any) => {
                    const isItemReturned = returnedIds.has(`${selectedSale.id}-${item.productId}`)
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                        <td className="px-3 py-2 font-medium" style={{ color: textPrimary }}>{item.productTitle}</td>
                        <td className="px-3 py-2 text-center" style={{ color: textPrimary }}>{item.quantity}</td>
                        <td className="px-3 py-2 text-right" style={{ color: textPrimary }}>{item.unitPrice.toLocaleString('fa-IR')}</td>
                        <td className="px-3 py-2 text-right font-bold" style={{ color: textPrimary }}>{item.subtotal.toLocaleString('fa-IR')}</td>
                        <td className="px-3 py-2 text-center">
                          {isItemReturned ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? '#451a03' : '#fef3c7', color: '#ef4444' }}>مرجوعی</span>
                          ) : (
                            <button onClick={() => { setReturnItem({ sale: selectedSale, item }); setReturnQty(String(item.quantity)); setReturnReason('') }}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? '#451a03' : '#fef3c7', color: '#92400e' }}>مرجوع</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 mb-4" style={{ borderTop: `2px solid ${cardBorder}` }}>
              <span className="font-bold" style={{ color: textPrimary }}>{fa.pos.total}</span>
              <span className="text-xl font-bold" style={{ color: '#22c55e' }}>{selectedSale.total_amount.toLocaleString('fa-IR')} {fa.common.toman}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => { window.print() }} className="py-2.5 px-3 rounded-xl text-sm font-bold flex-1" style={{ backgroundColor: isDark ? 'rgba(0,97,148,0.15)' : '#dbeafe', color: '#006194' }}>چاپ فاکتور</button>
              {!selectedSale.items?.every((item: any) => returnedIds.has(`${selectedSale.id}-${item.productId}`)) && (
                <button onClick={handleReturnAllItems} className="py-2.5 px-3 rounded-xl text-sm font-bold flex-1" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>بازگشت کل فاکتور</button>
              )}
              <button onClick={() => setSelectedSale(null)} className="py-2.5 px-3 rounded-xl text-sm font-bold flex-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{fa.common.close}</button>
            </div>
          </div>
        </div>
      )}

      {returnItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setReturnItem(null)}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#ef4444' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4" style={{ color: '#ef4444' }}>مرجوع کالا</h3>
            <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: isDark ? '#451a03' : '#fef3c7' }}>
              <div className="text-sm font-bold" style={{ color: textPrimary }}>{returnItem.item.productTitle}</div>
              <div className="text-xs mt-1" style={{ color: textSecondary }}>تعداد خریداری شده: {returnItem.item.quantity} — قیمت واحد: {returnItem.item.unitPrice.toLocaleString('fa-IR')}</div>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>تعداد مرجوع</label>
                <input type="number" min="1" max={returnItem.item.quantity} value={returnQty} onChange={(e) => setReturnQty(e.target.value)} className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>دلیل مرجوعی</label>
                <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="input-field text-sm" placeholder="مثال: کالای معیوب" />
              </div>
              {returnQty && parseInt(returnQty) > 0 && (
                <div className="rounded-xl p-3" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2' }}>
                  <div className="text-xs" style={{ color: textSecondary }}>مبلغ بازگشتی</div>
                  <div className="text-lg font-bold" style={{ color: '#ef4444' }}>{(returnItem.item.unitPrice * parseInt(returnQty)).toLocaleString('fa-IR')} تومان</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={handleReturnItem} disabled={!returnQty || !returnReason || parseInt(returnQty) <= 0 || parseInt(returnQty) > returnItem.item.quantity}
                className="btn btn-danger flex-1 py-2.5 disabled:opacity-40">تایید مرجوعی</button>
              <button onClick={() => setReturnItem(null)} className="btn btn-gray flex-1 py-2.5">{fa.common.close}</button>
            </div>
          </div>
        </div>
      )}
      <PrintDialog open={showPrintDialog} title="چاپ گزارش فروش" totalCount={filteredSales.length} onClose={() => setShowPrintDialog(false)} onPrint={(range) => { setShowPrintDialog(false); handlePrintSales(range) }} />
    </div>
  )
}
