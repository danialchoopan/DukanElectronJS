import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import { downloadExcel, printA4Report } from '../../utils/a4Print'

export default function AccountingDashboard() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCogs, setTotalCogs] = useState(0)
  const [totalOpEx, setTotalOpEx] = useState(0)
  const [netProfit, setNetProfit] = useState(0)
  const [journalCount, setJournalCount] = useState(0)
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [opExpenses, setOpExpenses] = useState<{ name: string; amount: number }[]>([])
  const [seeded, setSeeded] = useState(false)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const load = async () => {
    const [plRes, jeRes] = await Promise.all([
      window.api.reports.getProfitLoss(),
      window.api.journal.getEntries({ limit: 5 }),
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
      setRecentEntries(jeRes.data.entries || [])
    }
  }

  useEffect(() => { load() }, [])

  const handleSeed = async () => {
    await window.api.accounting.seedDemo()
    setSeeded(true)
    load()
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
        <button onClick={() => {
          let html = '<table><thead><tr><th>شاخص</th><th>مبلغ</th></tr></thead><tbody>'
          html += `<tr><td>${fa.accounting.profitLoss.revenue}</td><td>${totalRevenue.toLocaleString('fa-IR')}</td></tr>`
          html += `<tr><td>${fa.accounting.profitLoss.cogs} + ${fa.accounting.profitLoss.operatingExpenses}</td><td>${totalExpenses.toLocaleString('fa-IR')}</td></tr>`
          html += `<tr><td>${netProfit >= 0 ? fa.accounting.profitLoss.netProfit : fa.accounting.profitLoss.netLoss}</td><td>${Math.abs(netProfit).toLocaleString('fa-IR')}</td></tr>`
          html += `<tr><td>${fa.accounting.journal.title}</td><td>${journalCount}</td></tr>`
          html += '</tbody></table>'
          printA4Report(html, 'داشبورد حسابداری')
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <div key={i} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="flex items-center gap-2 mb-2">
              {kpi.icon}
              <span className="text-xs font-medium" style={{ color: textSecondary }}>{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value.toLocaleString('fa-IR')}</div>
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

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <span className="text-sm font-bold" style={{ color: textPrimary }}>{fa.accounting.journal.title}</span>
          <span className="text-xs" style={{ color: textSecondary }}>{recentEntries.length} / {journalCount}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.journal.date}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.journal.description}</th>
              <th className="text-center px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.journal.reference}</th>
            </tr>
          </thead>
          <tbody>
            {recentEntries.map((e) => {
              const refBg = e.referenceType === 'sale' ? '#dcfce7' : e.referenceType === 'expense' ? '#fee2e2' : '#dbeafe'
              const refFg = e.referenceType === 'sale' ? '#16a34a' : e.referenceType === 'expense' ? '#dc2626' : '#2563eb'
              return (
                <tr key={e.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <td className="px-4 py-2 text-xs" style={{ color: textPrimary }}>{e.entryDate}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{e.description}</td>
                  <td className="px-4 py-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: refBg, color: refFg }}>
                      {fa.accounting.journal.types[e.referenceType as keyof typeof fa.accounting.journal.types] || e.referenceType}
                    </span>
                  </td>
                </tr>
              )
            })}
            {recentEntries.length === 0 && (
              <tr><td colSpan={3} className="text-center py-6 text-sm" style={{ color: textSecondary }}>{fa.accounting.journal.noEntries}</td></tr>
            )}
          </tbody>
        </table>
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
