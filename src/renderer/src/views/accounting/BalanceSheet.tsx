import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/ShamsiDateInput'
import { printA4Report, downloadExcel } from '../../utils/a4Print'
import HelpPopup from '../../components/HelpPopup'
import { useSortable } from '../../hooks/useSortable'

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

  const { sorted: sortedCA, sortKey: caSortKey, sortDir: caSortDir, toggleSort: caToggleSort } = useSortable(data?.currentAssets || [])
  const { sorted: sortedLTA, sortKey: ltaSortKey, sortDir: ltaSortDir, toggleSort: ltaToggleSort } = useSortable(data?.longTermAssets || [])
  const { sorted: sortedCL, sortKey: clSortKey, sortDir: clSortDir, toggleSort: clToggleSort } = useSortable(data?.currentLiabilities || [])
  const { sorted: sortedLTL, sortKey: ltlSortKey, sortDir: ltlSortDir, toggleSort: ltlToggleSort } = useSortable(data?.longTermLiabilities || [])
  const { sorted: sortedEq, sortKey: eqSortKey, sortDir: eqSortDir, toggleSort: eqToggleSort } = useSortable(data?.equityItems || [])

  if (!data) return null

  const Section = ({ title, sortedItems, total, color, sortKey, sortDir, onSort }: { title: string; sortedItems: any[]; total: number; color: string; sortKey: any; sortDir: any; onSort: any }) => (
    <div className="mb-3">
      <div className="text-sm font-bold mb-2 flex items-center gap-2 cursor-pointer select-none" style={{ color }} onClick={onSort}>
        {title}
        <span className="text-[10px] opacity-50">{sortKey ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
      </div>
      {sortedItems.map((item, i) => (
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
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.accounting.balanceSheet.title}</h3>
          <HelpPopup title="راهنمای ترازنامه" sections={[
            { heading: 'ترازنامه چیست؟', items: ['دارایی‌ها = بدهی‌ها + سرمایه', 'دارایی‌های جاری (حساب‌های ۱xxx)', 'بدهی‌های جاری (حساب‌های ۲xxx)', 'سرمایه (حساب‌های ۳xxx)', 'سود انباشته از صورت سود و زیان اضافه می‌شود'] }
          ]} />
        </div>
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
            خروجی اکسل
          </button>
          <button onClick={async () => {
            let html = '<h1>ترازنامه</h1>'
            html += `<div class="header-info"><span>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</span></div>`
            html += '<table><thead><tr><th>بخش</th><th>مبلغ</th></tr></thead><tbody>'
            html += `<tr><td>${fa.accounting.balanceSheet.totalAssets}</td><td>${data.totalAssets.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.balanceSheet.totalLiabilities}</td><td>${data.totalLiabilities.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.balanceSheet.totalEquity}</td><td>${data.totalEquity.toLocaleString('fa-IR')}</td></tr>`
            html += `<tr><td>${fa.accounting.balanceSheet.totalLiabilitiesAndEquity}</td><td>${data.totalLiabilitiesAndEquity.toLocaleString('fa-IR')}</td></tr>`
            html += '</tbody></table>'
            await printA4Report(html, fa.accounting.balanceSheet.title)
          }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            چاپ A4
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.accounting.balanceSheet.totalAssets}</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#3b82f6' }}>{data.totalAssets.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.accounting.balanceSheet.totalLiabilities}</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#ef4444' }}>{data.totalLiabilities.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>{fa.accounting.balanceSheet.totalEquity}</div>
          <div className="text-lg font-bold mt-1" style={{ color: '#a855f7' }}>{data.totalEquity.toLocaleString('fa-IR')}</div>
        </div>
        <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-xs" style={{ color: textSecondary }}>وضعیت</div>
          <div className="text-lg font-bold mt-1" style={{ color: isBalanced ? '#22c55e' : '#ef4444' }}>
            {isBalanced ? 'متوازن' : 'نامتوازن'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
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
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isBalanced ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {isBalanced ? fa.accounting.trialBalance.isBalanced : fa.accounting.trialBalance.isNotBalanced}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="p-4" style={{ borderBottom: `2px solid ${cardBorder}` }}>
          <Section title={fa.accounting.balanceSheet.currentAssets} sortedItems={sortedCA} total={data.totalCurrentAssets} color="#3b82f6" sortKey={caSortKey} sortDir={caSortDir} onSort={() => caToggleSort('amount' as any)} />
          {data.longTermAssets?.length > 0 && <Section title={fa.accounting.balanceSheet.longTermAssets} sortedItems={sortedLTA} total={data.totalLongTermAssets} color="#3b82f6" sortKey={ltaSortKey} sortDir={ltaSortDir} onSort={() => ltaToggleSort('amount' as any)} />}
          <div className="flex justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: isDark ? '#0c1e3a' : '#dbeafe' }}>
            <span className="font-bold" style={{ color: '#3b82f6' }}>{fa.accounting.balanceSheet.totalAssets}</span>
            <span className="font-bold font-mono" style={{ color: '#3b82f6' }}>{data.totalAssets.toLocaleString('fa-IR')}</span>
          </div>
        </div>

        <div className="p-4" style={{ borderBottom: `2px solid ${cardBorder}` }}>
          <Section title={fa.accounting.balanceSheet.currentLiabilities} sortedItems={sortedCL} total={data.totalCurrentLiabilities} color="#ef4444" sortKey={clSortKey} sortDir={clSortDir} onSort={() => clToggleSort('amount' as any)} />
          {data.longTermLiabilities?.length > 0 && <Section title={fa.accounting.balanceSheet.longTermLiabilities} sortedItems={sortedLTL} total={data.totalLongTermLiabilities} color="#ef4444" sortKey={ltlSortKey} sortDir={ltlSortDir} onSort={() => ltlToggleSort('amount' as any)} />}
          <div className="flex justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2' }}>
            <span className="font-bold" style={{ color: '#ef4444' }}>{fa.accounting.balanceSheet.totalLiabilities}</span>
            <span className="font-bold font-mono" style={{ color: '#ef4444' }}>{data.totalLiabilities.toLocaleString('fa-IR')}</span>
          </div>
        </div>

        <div className="p-4" style={{ borderBottom: `2px solid ${cardBorder}` }}>
          <Section title={fa.accounting.balanceSheet.equity} sortedItems={sortedEq} total={data.totalEquity} color="#a855f7" sortKey={eqSortKey} sortDir={eqSortDir} onSort={() => eqToggleSort('amount' as any)} />
          <div className="flex justify-between px-4 py-3 rounded-xl" style={{ backgroundColor: isDark ? '#2e1065' : '#f3e8ff' }}>
            <span className="font-bold" style={{ color: '#a855f7' }}>{fa.accounting.balanceSheet.totalEquity}</span>
            <span className="font-bold font-mono" style={{ color: '#a855f7' }}>{data.totalEquity.toLocaleString('fa-IR')}</span>
          </div>
        </div>

        <div className="p-4 flex justify-between" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
          <span className="text-lg font-bold" style={{ color: textPrimary }}>{fa.accounting.balanceSheet.totalLiabilitiesAndEquity}</span>
          <span className="text-lg font-bold font-mono" style={{ color: isBalanced ? '#22c55e' : '#ef4444' }}>{data.totalLiabilitiesAndEquity.toLocaleString('fa-IR')}</span>
        </div>
      </div>
    </div>
  )
}