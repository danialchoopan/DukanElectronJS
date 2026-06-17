import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/ShamsiDateInput'

export default function BalanceSheet() {
  const [data, setData] = useState<any>(null)
  const [asOfDate, setAsOfDate] = useState('')

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const load = async () => {
    const r = await window.api.reports.getBalanceSheet(asOfDate || undefined)
    if (r.success && r.data) setData(r.data)
  }

  useEffect(() => { load() }, [asOfDate])

  if (!data) return null

  const Section = ({ title, items, total, color }: { title: string; items: any[]; total: number; color: string }) => (
    <div className="mb-3">
      <div className="text-sm font-bold mb-2" style={{ color }}>{title}</div>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between px-4 py-1.5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <span className="text-sm" style={{ color: textSecondary }}>{item.accountCode} - {item.accountName}</span>
          <span className="text-sm font-mono font-bold" style={{ color: textPrimary }}>{item.amount.toLocaleString('fa-IR')}</span>
        </div>
      ))}
      <div className="flex justify-between px-4 py-2 font-bold" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        <span className="text-xs" style={{ color }}>{title}</span>
        <span className="text-sm font-mono" style={{ color }}>{total.toLocaleString('fa-IR')}</span>
      </div>
    </div>
  )

  const isBalanced = Math.abs(data.totalAssets - data.totalLiabilitiesAndEquity) < 0.01

  return (
    <div>
      <h3 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>{fa.accounting.balanceSheet.title}</h3>
      <div className="flex gap-3 mb-4">
        <ShamsiDateInput value={asOfDate} onChange={setAsOfDate} label="تا تاریخ" />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="p-4" style={{ borderBottom: `2px solid ${cardBorder}` }}>
          <Section title={fa.accounting.balanceSheet.currentAssets} items={data.currentAssets} total={data.totalCurrentAssets} color="#3b82f6" />
          {data.longTermAssets?.length > 0 && <Section title={fa.accounting.balanceSheet.longTermAssets} items={data.longTermAssets} total={data.totalLongTermAssets} color="#3b82f6" />}
          <div className="flex justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: isDark ? '#0c1e3a' : '#dbeafe' }}>
            <span className="font-bold" style={{ color: '#3b82f6' }}>{fa.accounting.balanceSheet.totalAssets}</span>
            <span className="font-bold font-mono" style={{ color: '#3b82f6' }}>{data.totalAssets.toLocaleString('fa-IR')}</span>
          </div>
        </div>

        <div className="p-4" style={{ borderBottom: `2px solid ${cardBorder}` }}>
          <Section title={fa.accounting.balanceSheet.currentLiabilities} items={data.currentLiabilities} total={data.totalCurrentLiabilities} color="#ef4444" />
          {data.longTermLiabilities?.length > 0 && <Section title={fa.accounting.balanceSheet.longTermLiabilities} items={data.longTermLiabilities} total={data.totalLongTermLiabilities} color="#ef4444" />}
          <div className="flex justify-between px-4 py-2 rounded-xl mb-2" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2' }}>
            <span className="font-bold text-sm" style={{ color: '#ef4444' }}>{fa.accounting.balanceSheet.totalLiabilities}</span>
            <span className="font-bold font-mono text-sm" style={{ color: '#ef4444' }}>{data.totalLiabilities.toLocaleString('fa-IR')}</span>
          </div>
        </div>

        <div className="p-4" style={{ borderBottom: `2px solid ${cardBorder}` }}>
          <Section title={fa.accounting.balanceSheet.equity} items={data.equityItems} total={data.totalEquity} color="#a855f7" />
        </div>

        <div className="p-4 flex justify-between">
          <span className="text-lg font-bold" style={{ color: textPrimary }}>{fa.accounting.balanceSheet.totalLiabilitiesAndEquity}</span>
          <span className="text-lg font-bold font-mono" style={{ color: isBalanced ? '#22c55e' : '#ef4444' }}>{data.totalLiabilitiesAndEquity.toLocaleString('fa-IR')}</span>
        </div>
      </div>
    </div>
  )
}
