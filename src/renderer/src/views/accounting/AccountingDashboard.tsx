import { useState, useEffect } from 'react'
import { fa } from '../../i18n'

export default function AccountingDashboard() {
  const [accountCount, setAccountCount] = useState(0)
  const [journalCount, setJournalCount] = useState(0)
  const [activePeriod, setActivePeriod] = useState<any>(null)
  const [migrating, setMigrating] = useState(false)
  const [migrationDone, setMigrationDone] = useState(false)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const load = async () => {
    const [ac, je, ap] = await Promise.all([
      window.api.accounts.getAll(),
      window.api.journal.getEntries({ limit: 1 }),
      window.api.periods.getActive(),
    ])
    if (ac.success && ac.data) setAccountCount(ac.data.length)
    if (je.success && je.data) setJournalCount(je.data.total)
    if (ap.success && ap.data) setActivePeriod(ap.data)
  }

  useEffect(() => { load() }, [])

  const handleMigrate = async () => {
    setMigrating(true)
    const r = await window.api.accounting.migrate()
    setMigrating(false)
    if (r.success) {
      setMigrationDone(true)
      load()
    }
  }

  const stats = [
    { label: fa.accounting.accounts.title, value: accountCount, color: '#3b82f6' },
    { label: fa.accounting.journal.title, value: journalCount, color: '#22c55e' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl p-4 text-center border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="text-xs font-medium" style={{ color: textSecondary }}>{s.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>{fa.accounting.periods.title}</div>
        {activePeriod ? (
          <div className="text-sm" style={{ color: textSecondary }}>
            {activePeriod.name} — {activePeriod.startDate} to {activePeriod.endDate}
          </div>
        ) : (
          <div className="text-sm" style={{ color: textSecondary }}>{fa.accounting.periods.activePeriod}: —</div>
        )}
      </div>

      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>{fa.accounting.migration.title}</div>
        <p className="text-xs mb-3" style={{ color: textSecondary }}>{fa.accounting.migration.description}</p>
        {migrationDone ? (
          <div className="text-sm font-bold" style={{ color: '#22c55e' }}>{fa.accounting.migration.success}</div>
        ) : (
          <button onClick={handleMigrate} disabled={migrating} className="btn-primary text-sm disabled:opacity-50">
            {migrating ? '...' : fa.accounting.migration.button}
          </button>
        )}
      </div>
    </div>
  )
}
