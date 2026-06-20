import { useState, useEffect } from 'react'
import { fa } from '../i18n'
import { formatJalaliDateTime, gregorianToJalali } from '../utils/jalali'
import { generateReceiptHTML, printContent } from '../utils/receipt'
import { printA4Report, downloadExcel } from '../utils/a4Print'
import ShamsiDateInput from '../components/ShamsiDateInput'
import Pagination from '../components/Pagination'
import { useSortable } from '../hooks/useSortable'
import PrintDialog from '../components/PrintDialog'

export default function Dashboard() {
  const [sales, setSales] = useState<any[]>([])
  const [performance, setPerformance] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [returnStats, setReturnStats] = useState({ totalReturns: 0, totalRefund: 0, todayReturns: 0 })
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [salesPage, setSalesPage] = useState(0)
  const [salesPageSize, setSalesPageSize] = useState(10)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnColor = isDark ? '#94a3b8' : '#ffffff'

  const loadData = async () => {
    let s: string
    let e: string
    if (startDate && endDate) {
      s = startDate
      e = endDate + 'T23:59:59'
    } else if (startDate) {
      s = startDate
      e = '2099-12-31T23:59:59'
    } else if (endDate) {
      s = '2020-01-01'
      e = endDate + 'T23:59:59'
    } else {
      s = '2020-01-01'
      e = '2099-12-31T23:59:59'
    }

    const [sl, perf, tp, exp, ret] = await Promise.all([
      window.api.sales.getByDateRange(s, e),
      window.api.sales.getUserPerformance(startDate || undefined, endDate ? endDate + 'T23:59:59' : undefined),
      window.api.sales.getTopProducts(startDate || undefined, endDate ? endDate + 'T23:59:59' : undefined),
      window.api.expenses.getTotal(),
      window.api.returns.getStats(),
    ])

    if (sl.success && sl.data) {
      setSales(sl.data)
    }
    if (perf.success && perf.data) setPerformance(perf.data)
    if (tp.success && tp.data) setTopProducts(tp.data)
    if (exp.success && exp.data !== undefined) setTotalExpenses(exp.data)
    if (ret.success && ret.data) setReturnStats(ret.data)
  }

  useEffect(() => { loadData() }, [startDate, endDate])

  const totalSales = sales.reduce((a: number, s: any) => a + s.total_amount, 0)
  const cashTotal = sales.filter((s: any) => s.paymentMethod === 'cash').reduce((a: number, s: any) => a + s.total_amount, 0)
  const cardTotal = sales.filter((s: any) => s.paymentMethod === 'card').reduce((a: number, s: any) => a + s.total_amount, 0)
  const ledgerTotal = sales.filter((s: any) => s.paymentMethod === 'ledger').reduce((a: number, s: any) => a + s.total_amount, 0)
  const pagedSales = sales.slice(salesPage * salesPageSize, (salesPage + 1) * salesPageSize)
  const { sorted: sortedSales, sortKey, sortDir, toggleSort } = useSortable(pagedSales)
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  const getShamsiToday = () => {
    const d = new Date()
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
    const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    return `${jd} ${jMonths[jm - 1]} ${jy}`
  }

  const stats = [
    { label: fa.dashboard.invoices, value: sales.length, color: textPrimary, bg: cardBg },
    { label: fa.dashboard.totalSales, value: `${totalSales.toLocaleString('fa-IR')}`, color: '#22c55e', bg: isDark ? '#052e16' : '#dcfce7' },
    { label: fa.dashboard.cash, value: `${cashTotal.toLocaleString('fa-IR')}`, color: '#22c55e', bg: isDark ? '#052e16' : '#dcfce7' },
    { label: fa.dashboard.card, value: `${cardTotal.toLocaleString('fa-IR')}`, color: '#3b82f6', bg: isDark ? '#0c1e3a' : '#dbeafe' },
    { label: fa.dashboard.ledger, value: `${ledgerTotal.toLocaleString('fa-IR')}`, color: '#a855f7', bg: isDark ? '#2e1065' : '#f3e8ff' },
    { label: fa.dashboard.expenses, value: `${totalExpenses.toLocaleString('fa-IR')}`, color: '#ef4444', bg: isDark ? '#450a0a' : '#fee2e2' },
    { label: 'مرجوعی', value: `${returnStats.totalReturns}`, color: '#f59e0b', bg: isDark ? '#451a03' : '#fef3c7' },
  ]

  const handlePrintA4 = (range: { start: number; end: number } | 'all') => {
    const printSales = range === 'all' ? sales : sales.slice(range.start - 1, range.end)
    let html = '<h1>گزارش داشبورد فروشگاه</h1>'
    html += `<div class="header-info"><span>تاریخ: ${getShamsiToday()}</span><span>تعداد فاکتور: ${printSales.length}</span></div>`
    html += '<table><thead><tr><th>شاخص</th><th>مقدار</th></tr></thead><tbody>'
    stats.forEach(s => { html += `<tr><td>${s.label}</td><td>${s.value}</td></tr>` })
    html += '</tbody></table>'
    if (topProducts.length > 0) {
      html += '<h2>پرفروش\u200cترین کالاها</h2><table><thead><tr><th>کالا</th><th>تعداد فروش</th><th>درآمد</th></tr></thead><tbody>'
      topProducts.forEach((p: any) => { html += `<tr><td>${p.productTitle || p.title}</td><td>${p.totalQty}</td><td>${p.totalRevenue?.toLocaleString('fa-IR')}</td></tr>` })
      html += '</tbody></table>'
    }
    printA4Report(html, 'گزارش داشبورد فروشگاه')
  }

  const handleExcelExport = () => {
    const headers = ['فاکتور', 'تاریخ', 'صندوکدار', 'مشتری', 'مبلغ', 'نوع پرداخت']
    const csvRows = sales.map((s: any) => [s.invoiceNumber, formatJalaliDateTime(s.createdAt), s.userName, s.customerName || '-', s.total_amount, s.paymentMethod])
    downloadExcel('sales-report.csv', headers, csvRows)
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.dashboard.title}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPrintDialog(true)} className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            چاپ گزارش
          </button>
          <button onClick={handleExcelExport} className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            خروجی اکسل
          </button>
          <span className="text-sm font-medium px-3 py-1 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{getShamsiToday()}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
        <div className="flex items-end gap-2">
          <button onClick={loadData} className="btn-primary text-sm py-2">{fa.dashboard.refresh}</button>
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-sm px-4 py-2 rounded-xl font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }}>{fa.dashboard.all}</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl p-4 text-center border" style={{ backgroundColor: s.bg, borderColor: cardBorder }}>
            <div className="text-xs font-medium mb-1" style={{ color: textSecondary }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {performance.length > 0 && (
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <h3 className="font-bold mb-3" style={{ color: textPrimary }}>{fa.dashboard.cashierPerformance}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `2px solid ${cardBorder}` }}>
                  <th className="text-right px-2 py-1" style={{ color: textSecondary }}>{fa.admin.name}</th>
                  <th className="text-right px-2 py-1" style={{ color: textSecondary }}>{fa.dashboard.invoices}</th>
                  <th className="text-right px-2 py-1" style={{ color: textSecondary }}>{fa.dashboard.totalSales}</th>
                  <th className="text-right px-2 py-1" style={{ color: textSecondary }}>{fa.dashboard.profit}</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((p) => (
                  <tr key={p.userId} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <td className="px-2 py-1.5 font-medium" style={{ color: textPrimary }}>{p.userName}</td>
                    <td className="px-2 py-1.5" style={{ color: textPrimary }}>{p.invoiceCount}</td>
                    <td className="px-2 py-1.5 font-bold" style={{ color: textPrimary }}>{p.totalSales.toLocaleString('fa-IR')}</td>
                    <td className="px-2 py-1.5 font-bold text-green-500">{p.totalProfit.toLocaleString('fa-IR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {topProducts.length > 0 && (
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <h3 className="font-bold mb-3" style={{ color: textPrimary }}>{fa.dashboard.topProducts}</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `2px solid ${cardBorder}` }}>
                    <th className="text-right px-2 py-1" style={{ color: textSecondary }}>{fa.admin.title}</th>
                    <th className="text-right px-2 py-1" style={{ color: textSecondary }}>{fa.pos.qty}</th>
                    <th className="text-right px-2 py-1" style={{ color: textSecondary }}>{fa.dashboard.totalSales}</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 5).map((p, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <td className="px-2 py-1.5 font-medium" style={{ color: textPrimary }}>{p.productTitle}</td>
                      <td className="px-2 py-1.5" style={{ color: textPrimary }}>{p.totalQty}</td>
                      <td className="px-2 py-1.5 font-bold" style={{ color: textPrimary }}>{p.totalRevenue.toLocaleString('fa-IR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="px-4 py-3 font-bold" style={{ borderBottom: `2px solid ${cardBorder}`, color: textPrimary }}>{fa.dashboard.recentSales}</div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              {([
                { key: 'id' as any, label: '#' },
                { key: 'invoiceNumber' as any, label: 'فاکتور' },
                { key: 'userName' as any, label: fa.admin.cashier },
                { key: 'paymentMethod' as any, label: fa.payment.method, align: 'center' as const },
                { key: 'total_amount' as any, label: fa.pos.total },
                { key: 'createdAt' as any, label: 'تاریخ' },
              ]).map(col => (
                <th key={String(col.key)}
                  className={`px-4 py-2 cursor-pointer select-none transition-all hover:bg-blue-500/10 ${col.align === 'center' ? 'text-center' : 'text-right'}`}
                  style={{ color: sortKey === col.key ? '#3b82f6' : textSecondary }}
                  onClick={() => toggleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <span className="text-[10px] opacity-50">{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedSales.map((s) => (
              <tr key={s.id} className="cursor-pointer transition-all" style={{ borderBottom: `1px solid ${cardBorder}` }}
                onClick={() => setSelectedSale(s)}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className="px-4 py-2" style={{ color: textSecondary }}>{sales.indexOf(s) + 1}</td>
                <td className="px-4 py-2 font-mono text-xs font-bold" style={{ color: textPrimary }}>{s.invoiceNumber}</td>
                <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{s.userName}</td>
                <td className="px-4 py-2 text-center">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{
                    backgroundColor: s.paymentMethod === 'cash' ? '#dcfce7' : s.paymentMethod === 'card' ? '#dbeafe' : '#f3e8ff',
                    color: s.paymentMethod === 'cash' ? '#16a34a' : s.paymentMethod === 'card' ? '#2563eb' : '#9333ea',
                  }}>
                    {s.paymentMethod === 'cash' ? fa.payment.cash : s.paymentMethod === 'card' ? fa.payment.card : fa.payment.ledger}
                  </span>
                </td>
                <td className="px-4 py-2 font-bold" style={{ color: textPrimary }}>{s.total_amount.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-2 text-xs" style={{ color: textSecondary }}>{formatJalaliDateTime(s.createdAt)}</td>
              </tr>
            ))}
            {pagedSales.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8" style={{ color: textSecondary }}>{fa.dashboard.noData}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={sales.length} pageSize={salesPageSize} page={salesPage}
        onPageChange={setSalesPage} onPageSizeChange={(s) => { setSalesPageSize(s); setSalesPage(0) }} />

      {selectedSale && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setSelectedSale(null)}>
          <div className="rounded-2xl p-6 max-w-lg w-full mx-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#3b82f6' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg" style={{ color: textPrimary }}>{fa.receipt.invoice}</h3>
                <p className="text-sm font-mono" style={{ color: textSecondary }}>{selectedSale.invoiceNumber}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>&times;</button>
            </div>
            <div className="text-xs mb-3" style={{ color: textSecondary }}>
              {fa.receipt.cashier}: <b style={{ color: textPrimary }}>{selectedSale.userName}</b> · {formatJalaliDateTime(selectedSale.createdAt)}
            </div>
            <div className="rounded-xl overflow-hidden mb-4" style={{ border: `1px solid ${cardBorder}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                    <th className="text-right px-3 py-2" style={{ color: textSecondary }}>{fa.receipt.item}</th>
                    <th className="text-center px-3 py-2" style={{ color: textSecondary }}>{fa.receipt.qty}</th>
                    <th className="text-right px-3 py-2" style={{ color: textSecondary }}>{fa.receipt.price}</th>
                    <th className="text-right px-3 py-2" style={{ color: textSecondary }}>{fa.receipt.total}</th>
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
              <button onClick={() => {
                const html = generateReceiptHTML({
                  title: fa.receipt.invoice,
                  invoiceNumber: selectedSale.invoiceNumber,
                  date: formatJalaliDateTime(selectedSale.createdAt),
                  cashier: selectedSale.userName,
                  method: selectedSale.paymentMethod === 'cash' ? fa.payment.cash : selectedSale.paymentMethod === 'card' ? fa.payment.card : fa.payment.ledger,
                  items: (selectedSale.items || []).map((item: any) => ({ name: item.productTitle, qty: item.quantity, price: item.unitPrice, total: item.subtotal })),
                  subtotal: selectedSale.subtotal, total: selectedSale.total_amount,
                  footer: 'فروشگاه',
                  storeName: 'فروشگاه',
                })
                printContent(html)
              }} className="btn-primary flex-1 py-2">چاپ مجدد فاکتور</button>
              <button onClick={() => setSelectedSale(null)} className="text-sm px-4 py-2 rounded-xl font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>بستن</button>
            </div>
          </div>
        </div>
      )}
      <PrintDialog open={showPrintDialog} title="چاپ گزارش داشبورد" totalCount={sales.length} onClose={() => setShowPrintDialog(false)} onPrint={(range) => { setShowPrintDialog(false); handlePrintA4(range) }} />
    </div>
  )
}
