import { useState, useEffect } from 'react'
import { fa } from '../../i18n'

export default function ARAging() {
  const [data, setData] = useState<any>(null)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const load = async () => {
    const r = await window.api.reports.getARAging()
    if (r.success && r.data) setData(r.data)
  }

  useEffect(() => { load() }, [])

  if (!data) return null

  const totalAmt = data.totals?.total || 1
  const bucketPcts = [
    { label: fa.accounting.arAging.current, value: data.totals?.current || 0, color: '#22c55e' },
    { label: fa.accounting.arAging.days31to60, value: data.totals?.days31to60 || 0, color: '#f59e0b' },
    { label: fa.accounting.arAging.days61to90, value: data.totals?.days61to90 || 0, color: '#ea580c' },
    { label: fa.accounting.arAging.over90, value: data.totals?.over90 || 0, color: '#ef4444' },
  ]

  const cellColor = (amount: number, max: number) => {
    if (amount === 0) return textSecondary
    if (max < 1000000) return '#22c55e'
    if (max < 5000000) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div>
      <h3 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>{fa.accounting.arAging.title}</h3>

      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="flex items-center justify-between mb-2">
          {bucketPcts.map((b, i) => (
            <span key={i} className="text-[10px] font-bold" style={{ color: b.color }}>{b.label}: {b.value.toLocaleString('fa-IR')}</span>
          ))}
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
          {bucketPcts.map((b, i) => (
            <div key={i} className="h-full" style={{ width: `${(b.value / totalAmt) * 100}%`, backgroundColor: b.color, borderRadius: i === 0 ? '9999px 0 0 9999px' : i === bucketPcts.length - 1 ? '0 9999px 9999px 0' : 0 }} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.arAging.customer}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.accounting.arAging.phone}</th>
              <th className="text-center px-3 py-2" style={{ color: '#22c55e' }}>{fa.accounting.arAging.current}</th>
              <th className="text-center px-3 py-2" style={{ color: '#f59e0b' }}>{fa.accounting.arAging.days31to60}</th>
              <th className="text-center px-3 py-2" style={{ color: '#ea580c' }}>{fa.accounting.arAging.days61to90}</th>
              <th className="text-center px-3 py-2" style={{ color: '#ef4444' }}>{fa.accounting.arAging.over90}</th>
              <th className="text-center px-4 py-2" style={{ color: textPrimary }}>{fa.accounting.arAging.total}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any) => (
              <tr key={r.customerId} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{r.customerName}</td>
                <td className="px-4 py-2 text-xs" style={{ color: textSecondary }}>{r.phone || '-'}</td>
                <td className="px-3 py-2 text-center font-mono text-xs font-bold" style={{ color: cellColor(r.current, r.current) }}>{r.current > 0 ? r.current.toLocaleString('fa-IR') : '-'}</td>
                <td className="px-3 py-2 text-center font-mono text-xs font-bold" style={{ color: cellColor(r.days31to60, r.days31to60) }}>{r.days31to60 > 0 ? r.days31to60.toLocaleString('fa-IR') : '-'}</td>
                <td className="px-3 py-2 text-center font-mono text-xs font-bold" style={{ color: cellColor(r.days61to90, r.days61to90) }}>{r.days61to90 > 0 ? r.days61to90.toLocaleString('fa-IR') : '-'}</td>
                <td className="px-3 py-2 text-center font-mono text-xs font-bold" style={{ color: cellColor(r.over90, r.over90) }}>{r.over90 > 0 ? r.over90.toLocaleString('fa-IR') : '-'}</td>
                <td className="px-4 py-2 text-center font-mono font-bold" style={{ color: '#ef4444' }}>{r.total.toLocaleString('fa-IR')}</td>
              </tr>
            ))}
            {data.rows.length === 0 && <tr><td colSpan={7} className="text-center py-8" style={{ color: textSecondary }}>{fa.accounting.arAging.noData}</td></tr>}
            {data.rows.length > 0 && (
              <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderTop: `2px solid ${cardBorder}` }}>
                <td className="px-4 py-3 font-bold" colSpan={2} style={{ color: textPrimary }}>{fa.accounting.trialBalance.totals}</td>
                <td className="px-3 py-3 text-center font-mono font-bold text-xs" style={{ color: '#22c55e' }}>{data.totals.current.toLocaleString('fa-IR')}</td>
                <td className="px-3 py-3 text-center font-mono font-bold text-xs" style={{ color: '#f59e0b' }}>{data.totals.days31to60.toLocaleString('fa-IR')}</td>
                <td className="px-3 py-3 text-center font-mono font-bold text-xs" style={{ color: '#ea580c' }}>{data.totals.days61to90.toLocaleString('fa-IR')}</td>
                <td className="px-3 py-3 text-center font-mono font-bold text-xs" style={{ color: '#ef4444' }}>{data.totals.over90.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-3 text-center font-mono font-bold" style={{ color: '#ef4444' }}>{data.totals.total.toLocaleString('fa-IR')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
