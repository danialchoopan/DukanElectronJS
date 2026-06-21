import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import { downloadExcel, printA4Report } from '../../utils/a4Print'
import ShamsiDateInput from '../../components/ShamsiDateInput'

export default function CashFlowStatement() {
  const [data, setData] = useState<{ operating: { label: string; amount: number }[]; totalInflow: number; totalOutflow: number; netChange: number } | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const PRIMARY = '#006194'

  const load = async () => {
    setLoading(true)
    const res = await window.api.reports.getCashFlow(startDate || undefined, endDate || undefined)
    if (res.success && res.data) setData(res.data)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const maxVal = data ? Math.max(data.totalInflow, data.totalOutflow, 1) : 1

  const handlePrint = async () => {
    if (!data) return
    let html = '<table><thead><tr><th>شرح</th><th>مبلغ</th></tr></thead><tbody>'
    for (const row of data.operating) {
      html += `<tr><td>${row.label}</td><td>${row.amount.toLocaleString('fa-IR')} ${fa.common.toman}</td></tr>`
    }
    html += `<tr class="total-row"><td>ورودی کل</td><td>${data.totalInflow.toLocaleString('fa-IR')} ${fa.common.toman}</td></tr>`
    html += `<tr class="total-row"><td>خروجی کل</td><td>${data.totalOutflow.toLocaleString('fa-IR')} ${fa.common.toman}</td></tr>`
    html += `<tr class="total-row"><td>تغییر خالص</td><td>${data.netChange.toLocaleString('fa-IR')} ${fa.common.toman}</td></tr>`
    html += '</tbody></table>'
    await printA4Report(html, fa.accounting.tabs.cashFlow)
  }

  const handleExcel = () => {
    if (!data) return
    const headers = ['شرح', 'مبلغ']
    const rows = data.operating.map(r => [r.label, r.amount.toLocaleString('fa-IR')])
    rows.push(['ورودی کل', data.totalInflow.toLocaleString('fa-IR')])
    rows.push(['خروجی کل', data.totalOutflow.toLocaleString('fa-IR')])
    rows.push(['تغییر خالص', data.netChange.toLocaleString('fa-IR')])
    downloadExcel('cash-flow.csv', headers, rows)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-bold" style={{ color: textPrimary }}>{fa.accounting.tabs.cashFlow}</div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            چاپ
          </button>
          <button onClick={handleExcel} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            خروجی اکسل
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-end">
        <ShamsiDateInput value={startDate} onChange={setStartDate} label={fa.dashboard.dateFrom} />
        <ShamsiDateInput value={endDate} onChange={setEndDate} label={fa.dashboard.dateTo} />
        <button onClick={load} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: PRIMARY, color: '#ffffff' }}>
          {loading ? '...' : fa.dashboard.refresh}
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="text-xs font-medium mb-1" style={{ color: textSecondary }}>ورودی نقدی</div>
              <div className="text-xl font-bold font-mono" style={{ color: '#16a34a' }}>{data.totalInflow.toLocaleString('fa-IR')}</div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="text-xs font-medium mb-1" style={{ color: textSecondary }}>خروجی نقدی</div>
              <div className="text-xl font-bold font-mono" style={{ color: '#dc2626' }}>{data.totalOutflow.toLocaleString('fa-IR')}</div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="text-xs font-medium mb-1" style={{ color: textSecondary }}>تغییر خالص</div>
              <div className="text-xl font-bold font-mono" style={{ color: data.netChange >= 0 ? '#16a34a' : '#dc2626' }}>{data.netChange.toLocaleString('fa-IR')}</div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm font-bold mb-4" style={{ color: textPrimary }}>مقایسه ورودی و خروجی</div>
            <svg viewBox="0 0 300 120" className="w-full h-28">
              <rect x={20} y={120 - (data.totalInflow / maxVal) * 100} width={80} height={(data.totalInflow / maxVal) * 100} rx={4} fill="#16a34a" />
              <text x={60} y={115} textAnchor="middle" fill={textSecondary} fontSize="9">ورودی</text>
              <text x={60} y={115 - (data.totalInflow / maxVal) * 100 - 5} textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold">
                {data.totalInflow >= 1000000 ? `${(data.totalInflow / 1000000).toFixed(1)}M` : data.totalInflow >= 1000 ? `${(data.totalInflow / 1000).toFixed(0)}K` : data.totalInflow}
              </text>
              <rect x={130} y={120 - (data.totalOutflow / maxVal) * 100} width={80} height={(data.totalOutflow / maxVal) * 100} rx={4} fill="#dc2626" />
              <text x={170} y={115} textAnchor="middle" fill={textSecondary} fontSize="9">خروجی</text>
              <text x={170} y={115 - (data.totalOutflow / maxVal) * 100 - 5} textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold">
                {data.totalOutflow >= 1000000 ? `${(data.totalOutflow / 1000000).toFixed(1)}M` : data.totalOutflow >= 1000 ? `${(data.totalOutflow / 1000).toFixed(0)}K` : data.totalOutflow}
              </text>
              <rect x={240} y={120 - (Math.abs(data.netChange) / maxVal) * 100} width={40} height={(Math.abs(data.netChange) / maxVal) * 100} rx={4} fill={data.netChange >= 0 ? '#3b82f6' : '#f59e0b'} />
              <text x={260} y={115} textAnchor="middle" fill={textSecondary} fontSize="9">خالص</text>
              <text x={260} y={115 - (Math.abs(data.netChange) / maxVal) * 100 - 5} textAnchor="middle" fill={textPrimary} fontSize="9" fontWeight="bold">
                {Math.abs(data.netChange) >= 1000000 ? `${(Math.abs(data.netChange) / 1000000).toFixed(1)}M` : Math.abs(data.netChange) >= 1000 ? `${(Math.abs(data.netChange) / 1000).toFixed(0)}K` : Math.abs(data.netChange)}
              </text>
            </svg>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                  <th className="text-right px-4 py-2" style={{ color: textSecondary }}>شرح</th>
                  <th className="text-right px-4 py-2" style={{ color: textSecondary }}>مبلغ ({fa.common.toman})</th>
                </tr>
              </thead>
              <tbody>
                {data.operating.map((row, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${cardBorder}` }}>
                    <td className="px-4 py-2" style={{ color: textPrimary }}>{row.label}</td>
                    <td className="px-4 py-2 font-bold" style={{ color: row.amount >= 0 ? '#16a34a' : '#dc2626' }}>{row.amount.toLocaleString('fa-IR')}</td>
                  </tr>
                ))}
                <tr className="total-row" style={{ borderTop: `2px solid ${cardBorder}` }}>
                  <td className="px-4 py-2 font-bold" style={{ color: textPrimary }}>تغییر خالص نقد</td>
                  <td className="px-4 py-2 font-bold" style={{ color: data.netChange >= 0 ? '#16a34a' : '#dc2626' }}>{data.netChange.toLocaleString('fa-IR')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
