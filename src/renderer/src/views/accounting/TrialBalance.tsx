import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import ShamsiDateInput from '../../components/ShamsiDateInput'
import { downloadExcel } from '../../utils/a4Print'
import HelpPopup from '../../components/HelpPopup'

export default function TrialBalance() {
  const [rows, setRows] = useState<any[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const isDark = document.documentElement.classList.contains('dark')
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{fa.accounting.trialBalance.title}</h3>
          <HelpPopup title="راهنمای تراز آزمایشی" sections={[
            { heading: 'تراز آزمایشی چیست؟', items: ['نمایش مانده تمام حساب‌ها در یک نگاه', 'جمع بدهکار باید با جمع بستانکار برابر باشد', 'اگر برابر نباشد، اشکالی در ثبت اسناد وجود دارد'] },
            { heading: 'نحوه استفاده', items: ['فیلتر تاریخی برای بررسی دوره خاص', 'رنگ‌بندی: سبز=مثبت، قرمز=منفی', 'نمودار نواری نسبت بدهکار به بستانکار'] }
          ]} />
        </div>
        <button onClick={() => {
          const headers = [fa.accounting.trialBalance.account, fa.accounting.trialBalance.totalDebit, fa.accounting.trialBalance.totalCredit, fa.accounting.trialBalance.balance]
          const csvRows = rows.filter((r: any) => r.totalDebit !== 0 || r.totalCredit !== 0).map((r: any) => [`${r.accountCode} - ${r.accountName}`, String(r.totalDebit), String(r.totalCredit), String(r.balance)])
          csvRows.push([fa.accounting.trialBalance.totals, String(totalDebit), String(totalCredit), ''])
          downloadExcel('trial-balance.csv', headers, csvRows)
        }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
          خروجی اکسل
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.trialBalance.account}</th>
              <th className="text-center px-4 py-2" style={{ color: textSecondary }}>نوع</th>
              <th className="text-left px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.trialBalance.totalDebit}</th>
              <th className="text-left px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.trialBalance.totalCredit}</th>
              <th className="text-left px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.trialBalance.balance}</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter((r: any) => r.totalDebit !== 0 || r.totalCredit !== 0).map((r: any) => {
              const maxRow = Math.max(r.totalDebit, r.totalCredit, 1)
              const debitPct = (r.totalDebit / maxRow) * 100
              const creditPct = (r.totalCredit / maxRow) * 100
              return (
                <tr key={r.accountId} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <td className="px-4 py-2">
                    <span className="text-xs font-mono font-bold mr-2" style={{ color: typeColors[r.accountType] || textSecondary }}>{r.accountCode}</span>
                    <span style={{ color: textPrimary }}>{r.accountName}</span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: typeColors[r.accountType] || textSecondary }}>
                      {fa.accounting.accounts.types[r.accountType as keyof typeof fa.accounting.accounts.types] || r.accountType}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-left font-mono" style={{ color: r.totalDebit > 0 ? '#22c55e' : textSecondary }}>
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-20 text-left">{r.totalDebit > 0 ? r.totalDebit.toLocaleString('fa-IR') : '-'}</span>
                      {r.totalDebit > 0 && <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}><div className="h-full rounded-full" style={{ width: `${debitPct}%`, backgroundColor: '#22c55e' }} /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-left font-mono" style={{ color: r.totalCredit > 0 ? '#ef4444' : textSecondary }}>
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 w-20 text-left">{r.totalCredit > 0 ? r.totalCredit.toLocaleString('fa-IR') : '-'}</span>
                      {r.totalCredit > 0 && <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}><div className="h-full rounded-full" style={{ width: `${creditPct}%`, backgroundColor: '#ef4444' }} /></div>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-left font-mono font-bold" style={{ color: r.balance >= 0 ? '#22c55e' : '#ef4444' }}>{Math.abs(r.balance).toLocaleString('fa-IR')}</td>
                </tr>
              )
            })}
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderTop: `2px solid ${cardBorder}` }}>
              <td className="px-4 py-3 font-bold" colSpan={2} style={{ color: textPrimary }}>{fa.accounting.trialBalance.totals}</td>
              <td className="px-4 py-3 text-left font-mono font-bold" style={{ color: '#22c55e' }}>{totalDebit.toLocaleString('fa-IR')}</td>
              <td className="px-4 py-3 text-left font-mono font-bold" style={{ color: '#ef4444' }}>{totalCredit.toLocaleString('fa-IR')}</td>
              <td className="px-4 py-3 text-left">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isBalanced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isBalanced ? fa.accounting.trialBalance.isBalanced : fa.accounting.trialBalance.isNotBalanced}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
