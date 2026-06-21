import { useState, useEffect } from 'react'
import { fa } from '../../i18n'

interface FiscalPeriod {
  id: number; name: string; startDate: string; endDate: string
  isClosed: boolean; closedAt: string | null; closedBy: number | null; createdAt: string
}

export default function FiscalPeriods() {
  const [periods, setPeriods] = useState<FiscalPeriod[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()))
  const [loading, setLoading] = useState(false)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const PRIMARY = '#006194'

  const load = async () => {
    const res = await window.api.periods.getAll()
    if (res.success && res.data) setPeriods(res.data)
  }
  useEffect(() => { load() }, [])

  const handleCreateYear = async () => {
    const year = parseInt(newYear)
    if (isNaN(year) || year < 1300 || year > 1500) return
    setLoading(true)
    for (let m = 1; m <= 12; m++) {
      const month = String(m).padStart(2, '0')
      const start = `${year}/${month}/01`
      const endM = m === 12 ? `${year + 1}/01/01` : `${year}/${String(m + 1).padStart(2, '0')}/01`
      await window.api.periods.getAll()
      await new Promise(r => setTimeout(r, 50))
      const db = (window as any).electron?.ipcRenderer
      if (db) {
        await db.invoke('periods:create', { name: `${year}/${month}`, startDate: start, endDate: endM })
      }
    }
    setLoading(false)
    setShowCreate(false)
    load()
  }

  const handleClose = async (id: number) => {
    if (!confirm('آیا از بستن این دوره اطمینان دارید؟')) return
    setLoading(true)
    await window.api.periods.close(id, 1)
    setLoading(false)
    load()
  }

  const handleReopen = async (id: number) => {
    if (!confirm('آیا از بازگشایی این دوره اطمینان دارید؟')) return
    setLoading(true)
    await window.api.periods.reopen(id)
    setLoading(false)
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-bold" style={{ color: textPrimary }}>{fa.accounting.periods.title}</div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: PRIMARY, color: '#ffffff' }}>
          ایجاد دوره‌های سالانه
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="text-xs font-bold mb-2" style={{ color: textSecondary }}>سال شمسی</div>
          <div className="flex gap-2 items-end">
            <input type="number" value={newYear} onChange={e => setNewYear(e.target.value)} className="input-field w-32 text-sm" />
            <button onClick={handleCreateYear} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: PRIMARY, color: '#ffffff' }}>
              {loading ? '...' : 'ایجاد ۱۲ دوره'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: textSecondary }}>۱۲ دوره ماهانه برای سال انتخابی ایجاد می‌شود</p>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>نام دوره</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>تاریخ شروع</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>تاریخ پایان</th>
              <th className="text-center px-4 py-2" style={{ color: textSecondary }}>وضعیت</th>
              <th className="text-center px-4 py-2" style={{ color: textSecondary }}>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} style={{ borderTop: `1px solid ${cardBorder}` }}>
                <td className="px-4 py-2 font-bold" style={{ color: textPrimary }}>{p.name}</td>
                <td className="px-4 py-2" style={{ color: textSecondary }}>{p.startDate}</td>
                <td className="px-4 py-2" style={{ color: textSecondary }}>{p.endDate}</td>
                <td className="px-4 py-2 text-center">
                  <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                    backgroundColor: p.isClosed ? '#fee2e2' : '#dcfce7',
                    color: p.isClosed ? '#dc2626' : '#16a34a',
                  }}>
                    {p.isClosed ? fa.accounting.periods.closed : fa.accounting.periods.open}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  {!p.isClosed ? (
                    <button onClick={() => handleClose(p.id)} disabled={loading} className="text-xs font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                      {fa.accounting.periods.closePeriod}
                    </button>
                  ) : (
                    <button onClick={() => handleReopen(p.id)} disabled={loading} className="text-xs font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: '#dbeafe', color: '#2563eb' }}>
                      بازگشایی
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8" style={{ color: textSecondary }}>هیچ دوره‌ای ثبت نشده</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
