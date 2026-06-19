import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/ShamsiDateInput'
import { printA4Report, downloadExcel } from '../../utils/a4Print'
import HelpPopup from '../../components/HelpPopup'

export default function IncomeStatement() {
  const [data, setData] = useState<any>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const load = async () => {
    const r = await window.api.reports.getProfitLoss(startDate || undefined, endDate || undefined)
    if (r.success && r.data) setData(r.data)
  }

  useEffect(() => { load() }, [startDate, endDate])

  if (!data) return null

  const revenue = data.totalRevenue || 1

  const Section = ({ title, items, total, color }: { title: string; items: any[]; total: number; color: string }) => (
    <div className="mb-4">
      <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>{title}</div>
      {items.map((item, i) => {
        const pct = (item.amount / revenue) * 100
        return (
          <div key={i} className="px-4 py-1.5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="flex justify-between mb-1">
              <span className="text-sm" style={{ color: textSecondary }}>{item.accountCode} - {item.accountName}</span>
              <span className="text-sm font-mono font-bold" style={{ color: textPrimary }}>{item.amount.toLocaleString('fa-IR')}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
            </div>
          </div>
        )
      })}
      <div className="flex justify-between px-4 py-2 font-bold" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        <span className="text-sm" style={{ color }}>{title}</span>
        <span className="text-sm font-mono" style={{ color }}>{total.toLocaleString('fa-IR')}</span>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{fa.accounting.profitLoss.title}</h3>
          <HelpPopup title="راهنمای صورت سود و زیان" sections={[
            { heading: 'صورت سود و زیان', items: ['درآمدها (حساب‌های ۴xxx) جمع می‌شوند', 'بهای تمام شده کالا (حساب‌های ۵xxx) کم می‌شود', 'هزینه‌های عملیاتی (حساب‌های ۶xxx) کم می‌شود', 'نتیجه: سود یا زیان خالص'] },
            { heading: 'خروجی', items: ['چاپ گزارش A4', 'خروجی اکسل'] }
          ]} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => {
            const headers = [fa.accounting.profitLoss.title]
            const csvRows = [
              [fa.accounting.profitLoss.revenue, String(data.totalRevenue)],
              [fa.accounting.profitLoss.cogs, String(data.totalCogs)],
              [fa.accounting.profitLoss.grossProfit, String(data.grossProfit)],
              [fa.accounting.profitLoss.operatingExpenses, String(data.totalOperatingExpenses)],
              [data.netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss, String(Math.abs(data.netProfit))]
            ]
            downloadExcel('income-statement.csv', headers, csvRows)
          }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            خروجی اکسل
          </button>
          <button onClick={() => {
            let html = '<h1>صورت سود و زیان</h1>'
            html += `<div class="header-info"><span>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</span></div>`
            html += '<table><thead><tr><th>بخش</th><th>مبلغ</th></tr></thead><tbody>'
            html += `<tr><td>${fa.accounting.profitLoss.revenue}</td><td>${data.totalRevenue.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.profitLoss.cogs}</td><td>${data.totalCogs.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.profitLoss.grossProfit}</td><td>${data.grossProfit.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.profitLoss.operatingExpenses}</td><td>${data.totalOperatingExpenses.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${data.netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss}</td><td>${Math.abs(data.netProfit).toLocaleString('fa-IR')}</td></tr>`
            html += '</tbody></table>'
            printA4Report(html, fa.accounting.profitLoss.title)
          }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            چاپ A4
          </button>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <Section title={fa.accounting.profitLoss.revenue} items={data.revenue} total={data.totalRevenue} color="#22c55e" />
        <Section title={fa.accounting.profitLoss.cogs} items={data.cogs} total={data.totalCogs} color="#ef4444" />

        <div className="flex justify-between px-4 py-3 mx-4 mb-4 rounded-xl" style={{ backgroundColor: isDark ? '#052e16' : '#dcfce7' }}>
          <span className="font-bold" style={{ color: '#22c55e' }}>{fa.accounting.profitLoss.grossProfit}</span>
          <span className="font-bold font-mono" style={{ color: '#22c55e' }}>{data.grossProfit.toLocaleString('fa-IR')}</span>
        </div>

        <Section title={fa.accounting.profitLoss.operatingExpenses} items={data.operatingExpenses} total={data.totalOperatingExpenses} color="#f59e0b" />

        <div className="flex justify-between px-4 py-4 mx-4 mb-4 rounded-xl" style={{ backgroundColor: data.netProfit >= 0 ? (isDark ? '#052e16' : '#dcfce7') : (isDark ? '#450a0a' : '#fee2e2') }}>
          <span className="text-lg font-bold" style={{ color: data.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {data.netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss}
          </span>
          <span className="text-lg font-bold font-mono" style={{ color: data.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            {Math.abs(data.netProfit).toLocaleString('fa-IR')}
          </span>
        </div>
      </div>
    </div>
  )
}
