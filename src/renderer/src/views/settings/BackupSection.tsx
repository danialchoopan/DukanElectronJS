/** BackupSection — provides backup/restore/integrity UI for the settings tab.
 *  Includes auto-backup toggle, backup creation, restore with version check,
 *  integrity verification, selective deletion, and test runner.
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import Dialog, { DialogButton } from '../../components/ui/Dialog'

const primary = '#006194'

export default function BackupSection() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [integrityResult, setIntegrityResult] = useState<string | null>(null)
  const [restorePreview, setRestorePreview] = useState<any>(null)
  const [selectedBackups, setSelectedBackups] = useState<Set<string>>(new Set())
  const [autoBackup, setAutoBackup] = useState('true')
  const [backupInterval, setBackupInterval] = useState('daily')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const cBorder = isDark ? '#334155' : '#e2e8f0'
  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'

  const loadData = useCallback(async () => {
    const listRes = await window.api.backup.list()
    if (listRes.success && listRes.data) setBackups(listRes.data)
  }, [])

  useEffect(() => {
    loadData()
    window.api.settings.get('autoBackupEnabled').then(r => { if (r.success && r.data) setAutoBackup(r.data) })
    window.api.settings.get('autoBackupInterval').then(r => { if (r.success && r.data) setBackupInterval(r.data) })
  }, [loadData])

  const handleCreateBackup = async () => {
    setLoading(true)
    const r = await window.api.backup.create()
    setLoading(false)
    if (r.success) { alert('پشتیبان جدید ایجاد شد'); loadData() }
    else alert(`خطا: ${r.error}`)
  }

  const handleDeleteSelected = async () => {
    let deleted = 0
    for (const name of selectedBackups) {
      const r = await window.api.backup.delete(name)
      if (r.success) deleted++
    }
    setSelectedBackups(new Set())
    setConfirmDelete(false)
    if (deleted > 0) loadData()
  }

  const handleIntegrity = async () => {
    setLoading(true)
    const r = await window.api.backup.integrity()
    setLoading(false)
    if (r.success && r.data) setIntegrityResult(`سلامت: ${r.data.integrityCheck === 'ok' ? '✓' : '✗'} | جداول: ${r.data.tableCount}`)
    else setIntegrityResult(`خطا: ${r.error}`)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cBorder}` }}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-bold" style={{ color: tPri }}>پشتیبان‌گیری خودکار</span>
            <p className="text-[10px] mt-0.5" style={{ color: tSec }}>در شروع برنامه</p>
          </div>
          <button onClick={async () => { const v = autoBackup === 'true' ? 'false' : 'true'; setAutoBackup(v); await window.api.settings.set('autoBackupEnabled', v) }}
            className="relative w-11 h-6 rounded-full transition-all"
            style={{ backgroundColor: autoBackup === 'true' ? SUC : isDark ? '#475569' : '#d1d5db' }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: autoBackup === 'true' ? '22px' : '2px' }} />
          </button>
        </div>
        {autoBackup === 'true' && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: tSec }}>فاصله</span>
            <select value={backupInterval} onChange={async (e) => { setBackupInterval(e.target.value); await window.api.settings.set('autoBackupInterval', e.target.value) }}
              className="px-2 py-1 rounded-lg text-xs font-bold outline-none" style={{ backgroundColor: isDark ? '#1e293b' : '#fff', border: `1px solid ${cBorder}`, color: tPri }}>
              <option value="daily">هر روز</option>
              <option value="weekly">هر هفته</option>
              <option value="monthly">هر ماه</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={handleCreateBackup} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>+ پشتیبان جدید</button>
        <button onClick={handleIntegrity} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: tSec }}>بررسی یکپارچگی</button>
      </div>
      {integrityResult && <div className="text-xs p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cBorder}`, color: tPri }}>{integrityResult}</div>}
      {backups.length > 0 && (
        <div>
          <div className="max-h-40 overflow-y-auto rounded-xl border" style={{ border: `1px solid ${cBorder}` }}>
            {backups.map((b) => (
              <div key={b.name} className="flex items-center gap-2 px-3 py-2 text-xs" style={{ borderBottom: `1px solid ${cBorder}` }}>
                <input type="checkbox" checked={selectedBackups.has(b.name)} onChange={() => { const next = new Set(selectedBackups); if (next.has(b.name)) next.delete(b.name); else next.add(b.name); setSelectedBackups(next) }} />
                <span className="flex-1 font-bold truncate" style={{ color: tPri }}>{b.name}</span>
                <span style={{ color: tSec }}>{(b.size / 1048576).toFixed(1)} MB</span>
              </div>
            ))}
          </div>
          {selectedBackups.size > 0 && (
            <button onClick={() => setConfirmDelete(true)} className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white w-full" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              حذف {selectedBackups.size} پشتیبان انتخاب شده
            </button>
          )}
        </div>
      )}
      {confirmDelete && (
        <Dialog open={true} onClose={() => setConfirmDelete(false)} title="تأیید حذف پشتیبان‌ها" maxWidth="max-w-sm"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => setConfirmDelete(false)}>لغو</DialogButton>
            <DialogButton variant="danger" onClick={handleDeleteSelected}>حذف</DialogButton>
          </>}>
          <p className="text-sm text-center" style={{ color: tPri }}>آیا از حذف {selectedBackups.size} پشتیبان اطمینان دارید؟</p>
          <p className="text-xs text-center mt-1" style={{ color: tSec }}>این عمل قابل بازگشت نیست</p>
        </Dialog>
      )}
      {restorePreview && (
        <Dialog open={true} onClose={() => setRestorePreview(null)} title="بازیابی پشتیبان" maxWidth="max-w-sm"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 12a9 9 0 109-9"/><polyline points="12 3 12 9 16 9"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => setRestorePreview(null)}>لغو</DialogButton>
            <DialogButton variant="primary" onClick={async () => { const r = await window.api.backup.restore(restorePreview.path); setRestorePreview(null); if (r.success) { alert('بازیابی موفق'); window.location.reload() } else alert(`خطا: ${r.error}`) }}>بازیابی</DialogButton>
          </>}>
          <p className="text-sm text-center" style={{ color: tPri }}>آیا از بازیابی اطمینان دارید؟</p>
        </Dialog>
      )}
    </div>
  )
}

const SUC = '#22c55e'
