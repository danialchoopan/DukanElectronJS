import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/ShamsiDateInput'

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

  const Section = ({ title, items, total, color }: { title: string; items: any[]; total: number; color: string }) => (
    <div className="mb-4">
      <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between px-4 py-1.5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <span className="text-sm" style={{ color: textSecondary }}>{item.accountCode} - {item.accountName}</span>
          <span className="text-sm font-mono font-bold" style={{ color: textPrimary }}>{item.amount.toLocaleString('fa-IR')}</span>
        </div>
      ))}
      <div className="flex justify-between px-4 py-2 font-bold" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        <span className="text-sm" style={{ color }}>{title}</span>
        <span className="text-sm font-mono" style={{ color }}>{total.toLocaleString('fa-IR')}</span>
      </div>
    </div>
  )

  return (
    <div>
      <h3 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>{fa.accounting.profitLoss.title}</h3>
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
