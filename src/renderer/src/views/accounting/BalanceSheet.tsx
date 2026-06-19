import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/ShamsiDateInput'
import { printA4Report, downloadExcel } from '../../utils/a4Print'

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

  const maxSide = Math.max(data.totalAssets, data.totalLiabilitiesAndEquity, 1)
  const assetPct = (data.totalAssets / maxSide) * 100
  const levPct = (data.totalLiabilitiesAndEquity / maxSide) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{fa.accounting.balanceSheet.title}</h3>
        <div className="flex gap-2">
          <button onClick={() => {
            const headers = [fa.accounting.balanceSheet.title]
            const rows = [
              [fa.accounting.balanceSheet.totalAssets, String(data.totalAssets)],
              [fa.accounting.balanceSheet.totalLiabilities, String(data.totalLiabilities)],
              [fa.accounting.balanceSheet.totalEquity, String(data.totalEquity)],
              [fa.accounting.balanceSheet.totalLiabilitiesAndEquity, String(data.totalLiabilitiesAndEquity)]
            ]
            downloadExcel('balance-sheet.csv', headers, rows)
          }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            &#1582;&#1585;&#1608;&#1580;&#1740; &#1575;&#1705;&#1587;&#1604;
          </button>
          <button onClick={() => {
            let html = '<h1>&#1578;&#1585;&#1575;&#1586;&#1606;&#1575;&#1605;&#1607;</h1>'
            html += `<div class="header-info"><span>&#1578;&#1575;&#1585;&#1740;&#1582;: ${new Date().toLocaleDateString('fa-IR')}</span></div>`
            html += '<table><thead><tr><th>&#1576;&#1582;&#1588;</th><th>&#1605;&#1576;&#1604;&#1594;</th></tr></thead><tbody>'
            html += `<tr><td>${fa.accounting.balanceSheet.totalAssets}</td><td>${data.totalAssets.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.balanceSheet.totalLiabilities}</td><td>${data.totalLiabilities.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.balanceSheet.totalEquity}</td><td>${data.totalEquity.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.balanceSheet.totalLiabilitiesAndEquity}</td><td>${data.totalLiabilitiesAndEquity.toLocaleString('fa-IR')}</td></tr>`
            html += '</tbody></table>'
            printA4Report(html, fa.accounting.balanceSheet.title)
          }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            &#1670;&#1575;&#1583; A4
          </button>
        </div>
      </div>
      <div className="flex gap-3 mb-4">
        <ShamsiDateInput value={asOfDate} onChange={setAsOfDate} label="تا تاریخ" />
      </div>

      <div className="rounded-2xl border p-4 mb-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>{fa.accounting.balanceSheet.totalAssets}: {data.totalAssets.toLocaleString('fa-IR')}</span>
          <span className="text-xs font-bold" style={{ color: '#a855f7' }}>{fa.accounting.balanceSheet.totalLiabilitiesAndEquity}: {data.totalLiabilitiesAndEquity.toLocaleString('fa-IR')}</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
          <div className="h-full rounded-l-full" style={{ width: `${assetPct}%`, backgroundColor: '#3b82f6' }} />
          <div className="h-full rounded-r-full" style={{ width: `${levPct}%`, backgroundColor: '#a855f7' }} />
        </div>
        <div className="flex justify-center mt-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isBalanced ? fa.accounting.trialBalance.isBalanced : fa.accounting.trialBalance.isNotBalanced}
          </span>
        </div>
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
