import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import { downloadExcel, printA4Report } from '../../utils/a4Print'
import ShamsiDateInput from '../../components/business/ShamsiDateInput'
import { useTheme } from '../../hooks/useTheme'
import { formatPriceFA, formatPriceFull } from '../../utils/jalali'
import { useSettingsStore } from '../../store/settingsStore'

export default function AccountingDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCogs, setTotalCogs] = useState(0)
  const [totalOpEx, setTotalOpEx] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [journalCount, setJournalCount] = useState(0)
  const [opExpenses, setOpExpenses] = useState<{ name: string; amount: number }[]>([])
  const [seeded, setSeeded] = useState(false)
  const [showJournalForm, setShowJournalForm] = useState(false)
  const [journalForm, setJournalForm] = useState({ entryDate: new Date().toISOString().slice(0, 10), description: '', lines: [{ accountId: 0, debit: 0, credit: 0, description: '' }, { accountId: 0, debit: 0, credit: 0, description: '' }] })
  const [allAccounts, setAllAccounts] = useState<any[]>([])
  const [journalError, setJournalError] = useState('')

  const { isDark } = useTheme()
  const abbreviatedPrices = useSettingsStore(s => s.abbreviatedPrices)
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const PRIMARY = '#006194'

  const load = async () => {
    const [plRes, jeRes, acRes] = await Promise.all([
      window.api.reports.getProfitLoss(),
      window.api.journal.getEntries({ limit: 10 }),
      window.api.accounts.getAll(),
    ])
    if (plRes.success && plRes.data) {
      const d = plRes.data
      setTotalRevenue(d.totalRevenue || 0)
      setTotalCogs(d.totalCogs || 0)
      setTotalOpEx(d.totalOperatingExpenses || 0)
      setNetProfit(d.netProfit || 0)
      if (d.operatingExpenses) {
        setOpExpenses(d.operatingExpenses.map((e: any) => ({ name: e.accountName, amount: e.amount })))
      }
    }
    if (jeRes.success && jeRes.data) {
      setJournalCount(jeRes.data.total || 0)
    }
    if (acRes.success && acRes.data) setAllAccounts(acRes.data)
  }

  useEffect(() => { load() }, [])

  const handleSeed = async () => {
    await window.api.accounting.seedDemo()
    setSeeded(true)
    load()
  }

  const handleJournalSubmit = async () => {
    setJournalError('')
    const validLines = journalForm.lines.filter(l => l.accountId > 0)
    if (validLines.length < 2) { setJournalError('حداقل دو ردیف حساب الزامی است'); return }
    const totalDebit = validLines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = validLines.reduce((s, l) => s + l.credit, 0)
    if (Math.abs(totalDebit - totalCredit) > 0.01) { setJournalError('جمع بدهکار و بستانکار باید برابر باشد'); return }
    if (totalDebit === 0) { setJournalError('مبلغ بدهکار نمی‌تواند صفر باشد'); return }
    if (!journalForm.description.trim()) { setJournalError('شرح سند الزامی است'); return }
    const res = await window.api.journal.create({
      entryDate: journalForm.entryDate,
      description: journalForm.description,
      lines: validLines.map(l => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, description: l.description })),
    })
    if (res.success) {
      setShowJournalForm(false)
      setJournalForm({ entryDate: new Date().toISOString().slice(0, 10), description: '', lines: [{ accountId: 0, debit: 0, credit: 0, description: '' }, { accountId: 0, debit: 0, credit: 0, description: '' }] })
      load()
    } else {
      setJournalError(res.error || 'خطا در ثبت سند')
    }
  }

  const addJournalLine = () => {
    setJournalForm(f => ({ ...f, lines: [...f.lines, { accountId: 0, debit: 0, credit: 0, description: '' }] }))
  }
  const removeJournalLine = (idx: number) => {
    if (journalForm.lines.length <= 2) return
    setJournalForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }))
  }
  const updateJournalLine = (idx: number, field: string, value: any) => {
    setJournalForm(f => ({
      ...f,
      lines: f.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l)
    }))
  }

  const profitPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'
  const totalExpenses = totalCogs + totalOpEx

  const kpis = [
    {
      label: fa.accounting.profitLoss.revenue,
      value: totalRevenue,
      color: '#22c55e',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      label: fa.accounting.profitLoss.cogs + ' + ' + fa.accounting.profitLoss.operatingExpenses,
      value: totalExpenses,
      color: '#ef4444',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
        </svg>
      ),
    },
    {
      label: netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss,
      value: Math.abs(netProfit),
      color: netProfit >= 0 ? '#22c55e' : '#ef4444',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke={netProfit >= 0 ? '#22c55e' : '#ef4444'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          {netProfit >= 0
            ? <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>
            : <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>
          }
        </svg>
      ),
      sub: `${profitPercent}%`,
    },
    {
      label: fa.accounting.journal.title,
      value: journalCount,
      color: '#3b82f6',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
  ]

  const donutColors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#ec4899']
  const donutTotal = opExpenses.reduce((s, e) => s + e.amount, 0)

  const barData = [
    { label: fa.accounting.profitLoss.revenue, value: totalRevenue, color: '#22c55e' },
    { label: fa.accounting.profitLoss.cogs, value: totalCogs, color: '#ef4444' },
    { label: fa.accounting.profitLoss.operatingExpenses, value: totalOpEx, color: '#f59e0b' },
  ]
  const barMax = Math.max(...barData.map(b => b.value), 1)

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button onClick={async () => {
          let html = '<table><thead><tr><th>شاخص</th><th>مبلغ</th></tr></thead><tbody>'
          html += `<tr><td>${fa.accounting.profitLoss.revenue}</td><td>${totalRevenue.toLocaleString('fa-IR')}</td></tr>`
          html += `<tr><td>${fa.accounting.profitLoss.cogs} + ${fa.accounting.profitLoss.operatingExpenses}</td><td>${totalExpenses.toLocaleString('fa-IR')}</td></tr>`
          html += `<tr><td>${netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss}</td><td>${Math.abs(netProfit).toLocaleString('fa-IR')}</td></tr>`
          html += `<tr><td>${fa.accounting.journal.title}</td><td>${journalCount}</td></tr>`
          html += '</tbody></table>'
          await printA4Report(html, 'داشبورد حسابداری')
        }} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
          چاپ
        </button>
        <button onClick={() => {
          const headers = ['انتخاب']
          const rows = [[fa.accounting.profitLoss.revenue], [totalRevenue.toLocaleString('fa-IR')], [fa.accounting.profitLoss.cogs], [totalCogs.toLocaleString('fa-IR')], [fa.accounting.profitLoss.operatingExpenses], [totalOpEx.toLocaleString('fa-IR')], [netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss], [Math.abs(netProfit).toLocaleString('fa-IR')]]
          downloadExcel('accounting-summary.csv', headers, rows)
        }} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
          خروجی اکسل
        </button>
      </div>

      {/* Quick Journal Entry */}
      <div className="flex justify-end gap-2">
        <button onClick={() => setShowJournalForm(!showJournalForm)} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: showJournalForm ? '#3b82f6' : (isDark ? '#334155' : '#f1f5f9'), color: showJournalForm ? '#ffffff' : textSecondary }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {fa.accounting.journal.createManual}
        </button>
      </div>

      {showJournalForm && (
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="text-sm font-bold mb-3" style={{ color: textPrimary }}>{fa.accounting.journal.createManual}</div>
          {journalError && <div className="text-xs mb-2 p-2 rounded-lg" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>{journalError}</div>}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.journal.date}</label>
              <ShamsiDateInput value={journalForm.entryDate} onChange={e => setJournalForm(f => ({ ...f, entryDate: e }))} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.journal.description}</label>
              <input value={journalForm.description} onChange={e => setJournalForm(f => ({ ...f, description: e.target.value }))} className="input-field w-full text-sm" placeholder="شرح سند..." />
            </div>
          </div>
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-bold" style={{ color: textSecondary }}>
              <div className="col-span-4">حساب</div>
              <div className="col-span-2">{fa.accounting.journal.debit}</div>
              <div className="col-span-2">{fa.accounting.journal.credit}</div>
              <div className="col-span-3">شرح ردیف</div>
              <div className="col-span-1"></div>
            </div>
            {journalForm.lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <select value={line.accountId} onChange={e => updateJournalLine(idx, 'accountId', Number(e.target.value))} className="input-field w-full text-xs">
                    <option value={0}>انتخاب حساب...</option>
                    {allAccounts.filter(a => a.isActive && a.parentId).map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" value={line.debit || ''} onChange={e => updateJournalLine(idx, 'debit', Number(e.target.value))} className="input-field w-full text-xs" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <input type="number" value={line.credit || ''} onChange={e => updateJournalLine(idx, 'credit', Number(e.target.value))} className="input-field w-full text-xs" placeholder="0" />
                </div>
                <div className="col-span-3">
                  <input value={line.description} onChange={e => updateJournalLine(idx, 'description', e.target.value)} className="input-field w-full text-xs" placeholder="اختیاری" />
                </div>
                <div className="col-span-1 text-center">
                  <button onClick={() => removeJournalLine(idx)} disabled={journalForm.lines.length <= 2} className="w-6 h-6 rounded flex items-center justify-center text-xs" style={{ color: journalForm.lines.length <= 2 ? textSecondary : '#dc2626', opacity: journalForm.lines.length <= 2 ? 0.3 : 1 }}>
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <button onClick={addJournalLine} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
              + افزودن ردیف
            </button>
            <div className="flex gap-2">
              <button onClick={() => { setShowJournalForm(false); setJournalError('') }} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                {fa.common.cancel}
              </button>
              <button onClick={handleJournalSubmit} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: PRIMARY, color: '#ffffff' }}>
                {fa.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <div key={i} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="flex items-center gap-2 mb-2">
              {kpi.icon}
              <span className="text-xs font-medium" style={{ color: textSecondary }}>{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: kpi.color }}>
              {abbreviatedPrices ? formatPriceFA(kpi.value) : kpi.value.toLocaleString('fa-IR')}
              {abbreviatedPrices && kpi.value > 999 && (
                <div className="text-[11px] font-bold opacity-60 mt-0.5" style={{ color: kpi.color }}>
                  {formatPriceFull(kpi.value)} تومان
                </div>
              )}
            </div>
            {kpi.sub && <div className="text-xs mt-1 font-bold" style={{ color: kpi.color }}>{kpi.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-sm font-bold mb-4" style={{ color: textPrimary }}>
            {fa.accounting.profitLoss.operatingExpenses}
          </div>
          {donutTotal > 0 ? (
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 42 42" className="w-32 h-32">
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke={cardBorder} strokeWidth="5" />
                {opExpenses.map((seg, i) => {
                  const percent = (seg.amount / donutTotal) * 100
                  const offset = opExpenses.slice(0, i).reduce((s, x) => s + (x.amount / donutTotal) * 100, 0)
                  return (
                    <circle key={i} cx="21" cy="21" r="15.9" fill="transparent"
                      stroke={donutColors[i % donutColors.length]} strokeWidth="5"
                      strokeDasharray={`${percent} ${100 - percent}`}
                      strokeDashoffset={`${25 - offset}`} />
                  )
                })}
              </svg>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
                {opExpenses.map((seg, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}>
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: donutColors[i % donutColors.length] }} />
                    {seg.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>{fa.dashboard.noData}</p>
          )}
        </div>

        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-sm font-bold mb-4" style={{ color: textPrimary }}>
            {fa.accounting.profitLoss.title}
          </div>
          {barMax > 0 ? (
            <svg viewBox="0 0 300 150" className="w-full h-40">
              {barData.map((bar, i) => {
                const barHeight = (bar.value / barMax) * 120
                const x = 30 + i * 95
                return (
                  <g key={i}>
                    <rect x={x} y={130 - barHeight} width={60} height={barHeight} rx={4} fill={bar.color} />
                    <text x={x + 30} y={145} textAnchor="middle" fill={textSecondary} fontSize="8">{bar.label}</text>
                    <text x={x + 30} y={125 - barHeight} textAnchor="middle" fill={textPrimary} fontSize="8" fontWeight="bold">
                      {bar.value >= 1000000 ? `${(bar.value / 1000000).toFixed(1)}M` : bar.value >= 1000 ? `${(bar.value / 1000).toFixed(0)}K` : bar.value}
                    </text>
                  </g>
                )
              })}
            </svg>
          ) : (
            <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>{fa.dashboard.noData}</p>
          )}
        </div>
      </div>


      {journalCount === 0 && (
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>{fa.accounting.migration.title}</div>
          <p className="text-xs mb-3" style={{ color: textSecondary }}>{fa.accounting.migration.description}</p>
          {seeded ? (
            <div className="text-sm font-bold" style={{ color: '#22c55e' }}>{fa.accounting.migration.success}</div>
          ) : (
            <button onClick={handleSeed} className="btn-primary text-sm">
              {fa.accounting.migration.button}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
