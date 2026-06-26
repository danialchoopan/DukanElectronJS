import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/business/ShamsiDateInput'
import { printA4Report, downloadExcel } from '../../utils/a4Print'
import { formatDateNow } from '../../utils/jalali'
import HelpPopup from '../../components/ui/HelpPopup'
import { useSortable } from '../../hooks/useSortable'

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

  const { sorted: sortedRevenue, sortKey: revSortKey, sortDir: revSortDir, toggleSort: revToggleSort } = useSortable(data?.revenue || [])
  const { sorted: sortedCogs, sortKey: cogsSortKey, sortDir: cogsSortDir, toggleSort: cogsToggleSort } = useSortable(data?.cogs || [])
  const { sorted: sortedOpEx, sortKey: opexSortKey, sortDir: opexSortDir, toggleSort: opexToggleSort } = useSortable(data?.operatingExpenses || [])

  if (!data) return null

  const revenue = data.totalRevenue || 1

  const Section = ({ title, sortedItems, total, color, sortKey, sortDir, onSort }: { title: string; sortedItems: any[]; total: number; color: string; sortKey: any; sortDir: any; onSort: any }) => (
    <div className="mb-4">
      <div className="text-sm font-bold mb-2 flex items-center gap-2 cursor-pointer select-none px-4 py-1" style={{ color: textPrimary }} onClick={onSort}>
        {title}
        <span className="text-[10px] opacity-50">{sortKey ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </div>
      {sortedItems.map((item, i) => {
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
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.accounting.profitLoss.title}</h3>
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
          <button onClick={async () => {
            let html = '<h1>صورت سود و زیان</h1>'
            html += `<div class="header-info"><span>تاریخ: ${formatDateNow()}</span></div>`
            html += '<table><thead><tr><th>بخش</th><th>مبلغ</th></tr></thead><tbody>'
            html += `<tr><td>${fa.accounting.profitLoss.revenue}</td><td>${data.totalRevenue.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.profitLoss.cogs}</td><td>${data.totalCogs.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.profitLoss.grossProfit}</td><td>${data.grossProfit.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.profitLoss.operatingExpenses}</td><td>${data.totalOperatingExpenses.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${data.netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss}</td><td>${Math.abs(data.netProfit).toLocaleString('fa-IR')}</td></tr>`
            html += '</tbody></table>'
            await printA4Report(html, fa.accounting.profitLoss.title)
          }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            چاپ A4
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.accounting.profitLoss.revenue}</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#22c55e' }}>{data.totalRevenue.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.accounting.profitLoss.cogs}</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#ef4444' }}>{data.totalCogs.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.accounting.profitLoss.grossProfit}</div>
          <div className="text-lg font-bold mt-1" style={{ color: data.grossProfit >= 0 ? '#22c55e' : '#ef4444' }}>{data.grossProfit.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>{data.netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss}</div>
          <div className="text-lg font-bold mt-1" style={{ color: data.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{Math.abs(data.netProfit).toLocaleString('fa-IR')}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="p-4">
          <Section title={fa.accounting.profitLoss.revenue} sortedItems={sortedRevenue} total={data.totalRevenue} color="#22c55e" sortKey={revSortKey} sortDir={revSortDir} onSort={() => revToggleSort('amount' as any)} />
          
          <Section title={fa.accounting.profitLoss.cogs} sortedItems={sortedCogs} total={data.totalCogs} color="#ef4444" sortKey={cogsSortKey} sortDir={cogsSortDir} onSort={() => cogsToggleSort('amount' as any)} />

          <div className="flex justify-between px-4 py-3 rounded-xl mb-4" style={{ backgroundColor: isDark ? '#052e16' : '#dcfce7' }}>
            <span className="font-bold" style={{ color: '#22c55e' }}>{fa.accounting.profitLoss.grossProfit}</span>
            <span className="font-bold font-mono" style={{ color: '#22c55e' }}>{data.grossProfit.toLocaleString('fa-IR')}</span>
          </div>

          <Section title={fa.accounting.profitLoss.operatingExpenses} sortedItems={sortedOpEx} total={data.totalOperatingExpenses} color="#f59e0b" sortKey={opexSortKey} sortDir={opexSortDir} onSort={() => opexToggleSort('amount' as any)} />

          <div className="flex justify-between px-4 py-4 rounded-xl" style={{ backgroundColor: data.netProfit >= 0 ? (isDark ? '#052e16' : '#dcfce7') : (isDark ? '#450a0a' : '#fee2e2') }}>
            <span className="text-lg font-bold" style={{ color: data.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
              {data.netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss}
            </span>
            <span className="text-lg font-bold font-mono" style={{ color: data.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
              {Math.abs(data.netProfit).toLocaleString('fa-IR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}