import { useState, useEffect } from 'react'
import type { Expense, Sale } from '../../../types'
import { fa } from '../i18n'
import { formatJalaliShort, getTodayGregorian, gregorianToJalali } from '../utils/jalali'
import ShamsiDateInput from '../components/ShamsiDateInput'
import { generateReceiptHTML, printContent } from '../utils/receipt'
import Pagination from '../components/Pagination'

export default function Accounting() {
  const [tab, setTab] = useState<'expenses' | 'profit'>('expenses')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [form, setForm] = useState({ category: '', description: '', amount: 0, date: getTodayGregorian() })
  const [expensePage, setExpensePage] = useState(0)
  const [expensePageSize, setExpensePageSize] = useState(10)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnColor = isDark ? '#94a3b8' : '#ffffff'
  const headerBg = isDark ? '#0f172a' : '#f8fafc'

  const loadData = async () => {
    let s: string, e: string
    if (startDate && endDate) { s = startDate; e = endDate + 'T23:59:59' }
    else if (startDate) { s = startDate; e = '2099-12-31T23:59:59' }
    else if (endDate) { s = '2020-01-01'; e = endDate + 'T23:59:59' }
    else { s = '2020-01-01'; e = '2099-12-31T23:59:59' }

    const [expResult, salesResult] = await Promise.all([
      window.api.expenses.getByDateRange(s, e),
      window.api.sales.getByDateRange(s, e),
    ])

    if (expResult.success && expResult.data) setExpenses(expResult.data)
    if (salesResult.success && salesResult.data) setSales(salesResult.data)
  }

  useEffect(() => { loadData() }, [startDate, endDate])

  const handleCreateExpense = async () => {
    if (!form.category || !form.description || form.amount <= 0) return
    await window.api.expenses.create(form)
    setShowExpenseForm(false)
    setForm({ category: '', description: '', amount: 0, date: getTodayGregorian() })
    loadData()
  }

  const totalSales = sales.reduce((a, s) => a + s.total_amount, 0)
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0)
  const profit = totalSales - totalExpenses
  const cashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((a, s) => a + s.total_amount, 0)
  const cardSales = sales.filter(s => s.paymentMethod === 'card').reduce((a, s) => a + s.total_amount, 0)
  const ledgerSales = sales.filter(s => s.paymentMethod === 'ledger').reduce((a, s) => a + s.total_amount, 0)

  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const handlePrint = () => {
    const now = new Date()
    const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const dateStr = `${jd} ${jMonths[jm - 1]} ${jy}`

    const html = generateReceiptHTML({
      title: 'گزارش مالی',
      date: dateStr,
      items: [
        { name: 'فروش نقدی', qty: 1, price: cashSales, total: cashSales },
        { name: 'فروش کارتی', qty: 1, price: cardSales, total: cardSales },
        { name: 'فروش نسیه', qty: 1, price: ledgerSales, total: ledgerSales },
        ...Object.entries(expenseByCategory).map(([cat, amt]) => ({
          name: `هزینه: ${cat}`, qty: 1, price: amt, total: amt,
        })),
      ],
      subtotal: totalSales,
      total: totalSales,
      extra: [
        { label: 'جمع هزینه‌ها', value: `${totalExpenses.toLocaleString('fa-IR')} تومان`, color: '#ef4444' },
        { label: 'سود خالص', value: `${profit.toLocaleString('fa-IR')} تومان`, color: profit >= 0 ? '#16a34a' : '#ef4444' },
        { label: 'تعداد فاکتور', value: `${sales.length}` },
        { label: 'تعداد هزینه', value: `${expenses.length}` },
      ],
      footer: 'گزارش مالی فروشگاه',
      storeName: 'فروشگاه',
    })
    printContent(html)
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.nav.accounting}</h2>
        <button onClick={handlePrint} className="btn-primary text-sm">چاپ گزارش مالی</button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('expenses')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all`} style={{
          background: tab === 'expenses' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : (isDark ? '#334155' : '#f1f5f9'),
          color: tab === 'expenses' ? '#fff' : textSecondary,
        }}>{fa.expense.title}</button>
        <button onClick={() => setTab('profit')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all`} style={{
          background: tab === 'profit' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : (isDark ? '#334155' : '#f1f5f9'),
          color: tab === 'profit' ? '#fff' : textSecondary,
        }}>سود و زیان</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
        <div className="flex items-end gap-2">
          <button onClick={loadData} className="btn-primary text-sm py-2">{fa.dashboard.refresh}</button>
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-sm px-4 py-2 rounded-xl font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }}>{fa.dashboard.all}</button>
        </div>
      </div>

      {tab === 'profit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: isDark ? '#052e16' : '#dcfce7', border: `1px solid ${cardBorder}` }}>
              <div className="text-sm font-medium" style={{ color: textSecondary }}>{fa.dashboard.totalSales}</div>
              <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{totalSales.toLocaleString('fa-IR')}</div>
              <div className="text-xs mt-1" style={{ color: textSecondary }}>{sales.length} {fa.dashboard.invoices}</div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', border: `1px solid ${cardBorder}` }}>
              <div className="text-sm font-medium" style={{ color: textSecondary }}>{fa.expense.totalExpenses}</div>
              <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>{totalExpenses.toLocaleString('fa-IR')}</div>
              <div className="text-xs mt-1" style={{ color: textSecondary }}>{expenses.length} هزینه</div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: profit >= 0 ? (isDark ? '#052e16' : '#dcfce7') : (isDark ? '#450a0a' : '#fee2e2'), border: `1px solid ${cardBorder}` }}>
              <div className="text-sm font-medium" style={{ color: textSecondary }}>{fa.dashboard.profit}</div>
              <div className="text-2xl font-bold" style={{ color: profit >= 0 ? '#22c55e' : '#ef4444' }}>{profit.toLocaleString('fa-IR')}</div>
              <div className="text-xs mt-1" style={{ color: textSecondary }}>{profit >= 0 ? 'سود' : 'زیان'}</div>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', border: `1px solid ${cardBorder}` }}>
              <div className="text-sm font-medium" style={{ color: textSecondary }}>حاشیه سود</div>
              <div className="text-2xl font-bold" style={{ color: textPrimary }}>{totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : '0'}%</div>
              <div className="text-xs mt-1" style={{ color: textSecondary }}>Profit Margin</div>
            </div>
          </div>

          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <h3 className="font-bold mb-3" style={{ color: textPrimary }}>تفکیک فروش</h3>
            <table className="w-full text-sm">
              <thead><tr style={{ borderBottom: `2px solid ${cardBorder}` }}>
                <th className="text-right px-2 py-1" style={{ color: textSecondary }}>نوع</th>
                <th className="text-right px-2 py-1" style={{ color: textSecondary }}>تعداد</th>
                <th className="text-right px-2 py-1" style={{ color: textSecondary }}>مبلغ</th>
                <th className="text-right px-2 py-1" style={{ color: textSecondary }}>درصد</th>
              </tr></thead>
              <tbody>
                {[
                  { label: fa.payment.cash, count: sales.filter(s => s.paymentMethod === 'cash').length, amount: cashSales, color: '#22c55e' },
                  { label: fa.payment.card, count: sales.filter(s => s.paymentMethod === 'card').length, amount: cardSales, color: '#3b82f6' },
                  { label: fa.payment.ledger, count: sales.filter(s => s.paymentMethod === 'ledger').length, amount: ledgerSales, color: '#a855f7' },
                ].map((row) => (
                  <tr key={row.label} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <td className="px-2 py-2 font-bold" style={{ color: row.color }}>{row.label}</td>
                    <td className="px-2 py-2" style={{ color: textPrimary }}>{row.count}</td>
                    <td className="px-2 py-2 font-bold" style={{ color: textPrimary }}>{row.amount.toLocaleString('fa-IR')}</td>
                    <td className="px-2 py-2" style={{ color: textSecondary }}>{totalSales > 0 ? ((row.amount / totalSales) * 100).toFixed(1) : '0'}%</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${cardBorder}` }}>
                  <td className="px-2 py-2 font-bold" style={{ color: textPrimary }}>جمع</td>
                  <td className="px-2 py-2 font-bold" style={{ color: textPrimary }}>{sales.length}</td>
                  <td className="px-2 py-2 font-bold" style={{ color: '#22c55e' }}>{totalSales.toLocaleString('fa-IR')}</td>
                  <td className="px-2 py-2 font-bold" style={{ color: textPrimary }}>100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {Object.keys(expenseByCategory).length > 0 && (
            <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <h3 className="font-bold mb-3" style={{ color: textPrimary }}>تفکیک هزینه‌ها</h3>
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: `2px solid ${cardBorder}` }}>
                  <th className="text-right px-2 py-1" style={{ color: textSecondary }}>دسته</th>
                  <th className="text-right px-2 py-1" style={{ color: textSecondary }}>مبلغ</th>
                  <th className="text-right px-2 py-1" style={{ color: textSecondary }}>درصد</th>
                </tr></thead>
                <tbody>
                  {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                    <tr key={cat} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <td className="px-2 py-2 font-bold" style={{ color: textPrimary }}>{cat}</td>
                      <td className="px-2 py-2 font-bold" style={{ color: '#ef4444' }}>{amt.toLocaleString('fa-IR')}</td>
                      <td className="px-2 py-2" style={{ color: textSecondary }}>{totalExpenses > 0 ? ((amt / totalExpenses) * 100).toFixed(1) : '0'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm" style={{ color: textSecondary }}>{fa.expense.totalExpenses}: <b style={{ color: '#ef4444' }}>{totalExpenses.toLocaleString('fa-IR')} {fa.common.toman}</b></div>
            <button onClick={() => setShowExpenseForm(true)} className="btn-primary text-sm">+ {fa.expense.addExpense}</button>
          </div>

          {showExpenseForm && (
            <div className="rounded-2xl p-4 mb-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#3b82f6' }}>
              <h3 className="font-bold mb-3" style={{ color: textPrimary }}>{fa.expense.addExpense}</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.expense.category}</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field text-sm">
                    <option value="">...</option>
                    {Object.values(fa.expense.categories).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.expense.description}</label>
                  <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.expense.amount}</label>
                  <input type="number" value={form.amount || ''} onChange={(e) => setForm((f) => ({ ...f, amount: +e.target.value }))} className="input-field text-sm" />
                </div>
                <div className="flex items-end gap-2">
                  <button onClick={handleCreateExpense} className="btn-success text-sm">{fa.admin.create}</button>
                  <button onClick={() => setShowExpenseForm(false)} className="text-sm px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }}>{fa.admin.cancel}</button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: headerBg }}>
                  <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.expense.date}</th>
                  <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.expense.category}</th>
                  <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.expense.description}</th>
                  <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.expense.amount}</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(expensePage * expensePageSize, (expensePage + 1) * expensePageSize).map((e) => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${cardBorder}` }}
                    onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)')}
                    onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = 'transparent')}>
                    <td className="px-4 py-2 text-xs" style={{ color: textSecondary }}>{formatJalaliShort(e.date)}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>{e.category}</span>
                    </td>
                    <td className="px-4 py-2" style={{ color: textPrimary }}>{e.description}</td>
                    <td className="px-4 py-2 font-bold" style={{ color: '#ef4444' }}>{e.amount.toLocaleString('fa-IR')}</td>
                    <td className="px-4 py-2">
                      <button onClick={async () => { await window.api.expenses.delete(e.id); loadData() }} className="text-xs font-bold" style={{ color: '#ef4444' }}>{fa.admin.delete}</button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8" style={{ color: textSecondary }}>{fa.expense.noExpenses}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination total={expenses.length} pageSize={expensePageSize} page={expensePage}
            onPageChange={setExpensePage} onPageSizeChange={(s) => { setExpensePageSize(s); setExpensePage(0) }} />
        </>
      )}
    </div>
  )
}
