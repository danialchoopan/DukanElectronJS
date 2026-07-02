import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/business/ShamsiDateInput'
import { downloadExcel, printA4Report } from '../../utils/a4Print'
import HelpPopup from '../../components/ui/HelpPopup'
import { useSortable } from '../../hooks/useSortable'
import { useTheme } from '../../hooks/useTheme'

export default function TrialBalance() {
  const [rows, setRows] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { isDark } = useTheme()
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const load = async () => {
    const r = await window.api.journal.getTrialBalance(startDate || undefined, endDate || undefined)
    if (r.success && r.data) setRows(r.data)
  }

  useEffect(() => { load() }, [startDate, endDate])

  const totalDebit = rows.reduce((s: number, r: any) => s + r.totalDebit, 0)
  const totalCredit = rows.reduce((s: number, r: any) => s + r.totalCredit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const typeColors: Record<string, string> = {
    asset: '#3b82f6', liability: '#ef4444', equity: '#a855f7', income: '#22c55e', expense: '#f59e0b',
  }
  
  const filteredRows = rows.filter((r: any) => r.totalDebit !== 0 || r.totalCredit !== 0)
  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filteredRows)

  // کارت خلاصه
  const SummaryCard = ({ title, value }: any) => (
    <div className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
      <div className="text-xs" style={{ color: textSecondary }}>{title}</div>
      <div className="text-lg font-bold mt-1" style={{ color: textPrimary }}>{value}</div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* هدر */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.accounting.trialBalance.title}</h3>
          <HelpPopup title="راهنمای تراز آزمایشی" sections={[
            { heading: 'تراز آزمایشی چیست؟', items: ['نمایش مانده تمام حساب‌ها در یک نگاه', 'جمع بدهکار باید با جمع بستانکار برابر باشد', 'اگر برابر نباشد، اشکالی در ثبت اسناد وجود دارد'] },
            { heading: 'نحوه استفاده', items: ['فیلتر تاریخی برای بررسی دوره خاص', 'رنگ‌بندی: سبز=مثبت، قرمز=منفی', 'نمودار نواری نسبت بدهکار به بستانکار'] }
          ]} />
        </div>
        <div className="flex gap-2">
          <button onClick={async () => {
            let html = '<table><thead><tr><th>حساب</th><th>نوع</th><th>بدهکار</th><th>بستانکار</th><th>مانده</th></tr></thead><tbody>'
            rows.filter((r: any) => r.totalDebit !== 0 || r.totalCredit !== 0).forEach((r: any) => {
              html += `<tr><td>${r.accountCode} - ${r.accountName}</td><td>${fa.accounting.accounts.types[r.accountType as keyof typeof fa.accounting.accounts.types]}</td><td>${r.totalDebit > 0 ? r.totalDebit.toLocaleString('fa-IR') : '-'}</td><td>${r.totalCredit > 0 ? r.totalCredit.toLocaleString('fa-IR') : '-'}</td><td>${Math.abs(r.balance).toLocaleString('fa-IR')}</td></tr>`
            })
            html += `<tr><td colspan="2"><strong>${fa.accounting.trialBalance.totals}</strong></td><td><strong>${totalDebit.toLocaleString('fa-IR')}</strong></td><td><strong>${totalCredit.toLocaleString('fa-IR')}</strong></td><td></td></tr>`
            html += '</tbody></table>'
            await printA4Report(html, 'تراز آزمایشی')
          }} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            چاپ
          </button>
          <button onClick={() => {
            const headers = [fa.accounting.trialBalance.account, fa.accounting.trialBalance.totalDebit, fa.accounting.trialBalance.totalCredit, fa.accounting.trialBalance.balance]
            const csvRows = rows.filter((r: any) => r.totalDebit !== 0 || r.totalCredit !== 0).map((r: any) => [`${r.accountCode} - ${r.accountName}`, String(r.totalDebit), String(r.totalCredit), String(r.balance)])
            csvRows.push([fa.accounting.trialBalance.totals, String(totalDebit), String(totalCredit), ''])
            downloadExcel('trial-balance.csv', headers, csvRows)
          }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            خروجی اکسل
          </button>
        </div>
      </div>

      {/* فیلتر تاریخ */}
      <div className="flex flex-wrap gap-3 mb-4">
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
      </div>

      {/* کارت‌های خلاصه */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <SummaryCard title="تعداد حساب‌ها" value={filteredRows.length} />
        <SummaryCard title="مجموع بدهکار" value={totalDebit.toLocaleString('fa-IR')} color="green" />
        <SummaryCard title="مجموع بستانکار" value={totalCredit.toLocaleString('fa-IR')} color="red" />
        <SummaryCard title="وضعیت" value={isBalanced ? '✅ متوازن' : '❌ نامتوازن'} />
      </div>

      {/* جدول بهینه‌شده */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[12%]" />
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                {([
                  { key: 'accountName' as any, label: fa.accounting.trialBalance.account },
                  { key: 'accountType' as any, label: 'نوع', align: 'center' as const },
                  { key: 'totalDebit' as any, label: fa.accounting.trialBalance.totalDebit, align: 'left' as const },
                  { key: 'totalCredit' as any, label: fa.accounting.trialBalance.totalCredit, align: 'left' as const },
                  { key: 'balance' as any, label: fa.accounting.trialBalance.balance, align: 'left' as const },
                ]).map(col => (
                  <th key={String(col.key)}
                    className={`px-3 py-2.5 cursor-pointer select-none transition-all hover:bg-blue-500/10 text-xs uppercase tracking-wider ${col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'}`}
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
              {sorted.map((r: any) => (
                <tr key={r.accountId} className="hover:bg-opacity-5 hover:bg-blue-500 transition-colors" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-mono font-bold mr-2" style={{ color: typeColors[r.accountType] || textSecondary }}>{r.accountCode}</span>
                    <span style={{ color: textPrimary }}>{r.accountName}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: typeColors[r.accountType] || textSecondary }}>
                      {fa.accounting.accounts.types[r.accountType as keyof typeof fa.accounting.accounts.types] || r.accountType}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-left font-mono" style={{ color: r.totalDebit > 0 ? '#22c55e' : textSecondary }}>
                    {r.totalDebit > 0 ? r.totalDebit.toLocaleString('fa-IR') : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-left font-mono" style={{ color: r.totalCredit > 0 ? '#ef4444' : textSecondary }}>
                    {r.totalCredit > 0 ? r.totalCredit.toLocaleString('fa-IR') : '-'}
                  </td>
                  <td className="px-3 py-2.5 text-left font-mono font-bold" style={{ color: r.balance >= 0 ? '#22c55e' : '#ef4444' }}>
                    {Math.abs(r.balance).toLocaleString('fa-IR')}
                  </td>
                </tr>
              ))}
              {/* رجوع جمع کل */}
              <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderTop: `2px solid ${cardBorder}` }}>
                <td className="px-3 py-3 font-bold" colSpan={2} style={{ color: textPrimary }}>{fa.accounting.trialBalance.totals}</td>
                <td className="px-3 py-3 text-left font-mono font-bold" style={{ color: '#22c55e' }}>{totalDebit.toLocaleString('fa-IR')}</td>
                <td className="px-3 py-3 text-left font-mono font-bold" style={{ color: '#ef4444' }}>{totalCredit.toLocaleString('fa-IR')}</td>
                <td className="px-3 py-3 text-left">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isBalanced ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {isBalanced ? fa.accounting.trialBalance.isBalanced : fa.accounting.trialBalance.isNotBalanced}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}