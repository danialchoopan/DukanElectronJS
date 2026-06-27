/**
 * BackupSection — backup/restore/export/import UI for the settings tab.
 *
 * Features:
 *   - Auto-backup toggle with interval selection
 *   - Quick backup (SQLite to local backups/ folder)
 *   - Enhanced 3-step export dialog:
 *     Step 1: Storage location (local folder / custom path)
 *     Step 2: Format (SQLite .db / JSON .json)
 *     Step 3: Data scope (all / structure only / selective with table picker)
 *   - Import dialog: select file, preview version/tables, confirm restore
 *   - Backup list with select/delete
 *   - Integrity check
 *   - Database reset with 2-step confirmation + backup-before-delete
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import Dialog, { DialogButton } from '../../components/ui/Dialog'

const primary = '#006194'
const SUC = '#22c55e'

type ExportStep = 'location' | 'format' | 'scope'

export default function BackupSection() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [backups, setBackups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [integrityResult, setIntegrityResult] = useState<string | null>(null)
  const [selectedBackups, setSelectedBackups] = useState<Set<string>>(new Set())
  const [autoBackup, setAutoBackup] = useState('true')
  const [backupInterval, setBackupInterval] = useState('daily')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Database reset
  const [showResetStep1, setShowResetStep1] = useState(false)
  const [showResetStep2, setShowResetStep2] = useState(false)
  const [backupSaved, setBackupSaved] = useState(false)

  // Export dialog
  const [showExport, setShowExport] = useState(false)
  const [exportStep, setExportStep] = useState<ExportStep>('location')
  const [exportLocation, setExportLocation] = useState<'local' | 'custom'>('local')
  const [exportFormat, setExportFormat] = useState<'sqlite' | 'json'>('sqlite')
  const [exportScope, setExportScope] = useState<'all' | 'structure' | 'selective'>('all')
  const [selectableTables, setSelectableTables] = useState<{ name: string; rowCount: number }[]>([])
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  // Import dialog
  const [showImport, setShowImport] = useState(false)
  const [importPreview, setImportPreview] = useState<any>(null)
  const [importFile, setImportFile] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const cBorder = isDark ? '#334155' : '#e2e8f0'
  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#0f172a' : '#f8fafc'

  const loadData = useCallback(async () => {
    const listRes = await window.api.backup.list()
    if (listRes.success && listRes.data) setBackups(listRes.data)
  }, [])

  useEffect(() => {
    loadData()
    window.api.settings.get('autoBackupEnabled').then(r => { if (r.success && r.data) setAutoBackup(r.data) })
    window.api.settings.get('autoBackupInterval').then(r => { if (r.success && r.data) setBackupInterval(r.data) })
  }, [loadData])

  // ─── Quick backup ────────────────────────────────────
  const handleQuickBackup = async () => {
    setLoading(true)
    const r = await window.api.backup.create()
    setLoading(false)
    if (r.success) { alert('پشتیبان جدید ایجاد شد'); loadData() }
    else alert(`خطا: ${r.error}`)
  }

  // ─── Integrity check ─────────────────────────────────
  const handleIntegrity = async () => {
    setLoading(true)
    const r = await window.api.backup.integrity()
    setLoading(false)
    if (r.success && r.data) setIntegrityResult(`سلامت: ${r.data.integrityCheck === 'ok' ? '✓' : '✗'} | جداول: ${r.data.tableCount}`)
    else setIntegrityResult(`خطا: ${r.error}`)
  }

  // ─── Delete selected backups ─────────────────────────
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

  // ─── Export flow ─────────────────────────────────────
  const openExport = () => {
    setExportStep('location')
    setExportLocation('local')
    setExportFormat('sqlite')
    setExportScope('all')
    setSelectedTables(new Set())
    setShowExport(true)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      let filePath: string | undefined
      if (exportLocation === 'custom') {
        // For custom path, the handler will use dialog.showSaveDialog
        // but since we're in renderer, we pass undefined and let main process handle it
        filePath = undefined
      }
      const r = await window.api.backup.createWithOptions({
        format: exportFormat,
        scope: exportScope,
        tables: exportScope === 'selective' ? Array.from(selectedTables) : undefined,
        filePath,
      })
      if (r.success) {
        alert(`پشتیبان با موفقیت ذخیره شد:\n${r.data}`)
        setShowExport(false)
        loadData()
      } else {
        alert(`خطا: ${r.error}`)
      }
    } finally { setExporting(false) }
  }

  // ─── Import flow ─────────────────────────────────────
  const handleImportSelect = async () => {
    const r = await window.api.dialog.openBackup()
    if (r.success && r.data) {
      setImportFile(r.data)
      const preview = await window.api.backup.getDetails(r.data)
      setImportPreview(preview.success ? preview.data : null)
      setShowImport(true)
    }
  }

  const handleImportRestore = async () => {
    if (!importFile) return
    setImporting(true)
    try {
      const r = await window.api.backup.restore(importFile)
      setImportPreview(null)
      setImportFile(null)
      setShowImport(false)
      if (r.success) { alert('بازیابی موفق — برنامه مجدداً بارگذاری می‌شود'); window.location.reload() }
      else alert(`خطا: ${r.error}`)
    } finally { setImporting(false) }
  }

  const radioOption = (selected: boolean, label: string, desc: string, onClick: () => void) => (
    <button onClick={onClick} className="w-full text-right px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all"
      style={{ border: `1px solid ${selected ? primary : cBorder}`, backgroundColor: selected ? `${primary}10` : 'transparent' }}>
      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{ border: `2px solid ${selected ? primary : tSec}` }}>
        {selected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />}
      </div>
      <div>
        <div className="text-xs font-bold" style={{ color: tPri }}>{label}</div>
        <div className="text-[10px]" style={{ color: tSec }}>{desc}</div>
      </div>
    </button>
  )

  return (
    <div className="space-y-3">
      {/* ─── Auto-backup toggle ──────────────────── */}
      <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cBorder}` }}>
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

      {/* ─── Action buttons ──────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={openExport} className="px-3 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
          style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          خروجی (Export)
        </button>
        <button onClick={handleImportSelect} className="px-3 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5"
          style={{ background: `linear-gradient(135deg, #22c55e, #16a34a)` }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          واردات (Import)
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={handleQuickBackup} disabled={loading} className="flex-1 px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: cardBg, border: `1px solid ${cBorder}`, color: tSec }}>
          پشتیبان سریع (.db)
        </button>
        <button onClick={handleIntegrity} disabled={loading} className="flex-1 px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: cardBg, border: `1px solid ${cBorder}`, color: tSec }}>
          بررسی یکپارچگی
        </button>
      </div>
      {integrityResult && <div className="text-xs p-2 rounded-lg" style={{ backgroundColor: cardBg, border: `1px solid ${cBorder}`, color: tPri }}>{integrityResult}</div>}

      {/* ─── Backup list ─────────────────────────── */}
      {backups.length > 0 && (
        <div>
          <div className="max-h-40 overflow-y-auto rounded-xl border" style={{ borderColor: cBorder }}>
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

      {/* ─── Delete confirmation dialog ──────────── */}
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

      {/* ═══════════════════════════════════════════ */}
      {/* ─── EXPORT 3-STEP DIALOG ───────────────── */}
      {/* ═══════════════════════════════════════════ */}
      {showExport && (
        <Dialog open={true} onClose={() => setShowExport(false)}
          title={exportStep === 'location' ? 'خروجی — گام ۱ از ۳: مکان ذخیره' : exportStep === 'format' ? 'خروجی — گام ۲ از ۳: فرمت فایل' : 'خروجی — گام ۳ از ۳: داده‌های شامل شده'}
          subtitle={`گام ${exportStep === 'location' ? '۱' : exportStep === 'format' ? '۲' : '۳'} از ۳`}
          maxWidth="max-w-md"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>}
          footer={<>
            {exportStep !== 'location' && <DialogButton variant="ghost" onClick={() => setExportStep(exportStep === 'scope' ? 'format' : 'location')}>← قبلی</DialogButton>}
            <div className="flex-1" />
            <DialogButton variant="ghost" onClick={() => setShowExport(false)}>لغو</DialogButton>
            {exportStep === 'scope' ? (
              <DialogButton variant="primary" onClick={handleExport} disabled={exporting || (exportScope === 'selective' && selectedTables.size === 0)}>
                {exporting ? 'در حال خروجی...' : 'ذخیره ✓'}
              </DialogButton>
            ) : (
              <DialogButton variant="primary" onClick={() => {
                if (exportStep === 'location') setExportStep('format')
                else if (exportStep === 'format') {
                  if (exportFormat === 'json') setExportStep('scope')
                  else handleExport()
                }
              }}>ادامه →</DialogButton>
            )}
          </>}>
          {/* Step 1: Location */}
          {exportStep === 'location' && (
            <div className="space-y-2">
              {radioOption(exportLocation === 'local', 'پوشه پشتیبان‌ها', 'ذخیره خودکار در پوشه برنامه', () => setExportLocation('local'))}
              {radioOption(exportLocation === 'custom', 'مسیر دلخواه', 'انتخاب مکان ذخیره با دیالوگ سیستم', () => setExportLocation('custom'))}
            </div>
          )}
          {/* Step 2: Format */}
          {exportStep === 'format' && (
            <div className="space-y-2">
              {radioOption(exportFormat === 'sqlite', 'SQLite (.db)', 'فایل پایگاه داده — سریع و قابل اعتماد', () => setExportFormat('sqlite'))}
              {radioOption(exportFormat === 'json', 'JSON (.json)', 'ساختار متنی — قابل مطالعه و ویرایش', () => setExportFormat('json'))}
            </div>
          )}
          {/* Step 3: Scope (only for JSON) */}
          {exportStep === 'scope' && (
            <div className="space-y-2">
              {radioOption(exportScope === 'all', 'همه داده‌ها', 'تمام جداول با تمام ردیف‌ها', () => setExportScope('all'))}
              {radioOption(exportScope === 'structure', 'فقط ساختار', 'فقط دستورات CREATE TABLE — بدون داده', () => setExportScope('structure'))}
              {radioOption(exportScope === 'selective', `انتخابی (${selectedTables.size} جدول)`, 'انتخاب جداول مورد نظر', async () => {
                if (selectableTables.length === 0) {
                  const r = await window.api.backup.getSelectableTables()
                  if (r.success && r.data) setSelectableTables(r.data)
                }
                setExportScope('selective')
              })}
              {exportScope === 'selective' && selectableTables.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border p-2" style={{ borderColor: cBorder }}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <button onClick={() => { if (selectedTables.size === selectableTables.length) setSelectedTables(new Set()); else setSelectedTables(new Set(selectableTables.map(t => t.name))) }}
                      className="text-[10px] font-bold" style={{ color: primary }}>
                      {selectedTables.size === selectableTables.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
                    </button>
                  </div>
                  {selectableTables.map(t => (
                    <label key={t.name} className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs cursor-pointer hover:bg-blue-500/5">
                      <input type="checkbox" checked={selectedTables.has(t.name)}
                        onChange={() => { const next = new Set(selectedTables); if (next.has(t.name)) next.delete(t.name); else next.add(t.name); setSelectedTables(next) }} />
                      <span className="font-bold" style={{ color: tPri }}>{t.name}</span>
                      <span style={{ color: tSec }}>({t.rowCount.toLocaleString('fa-IR')})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </Dialog>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── IMPORT DIALOG ───────────────────────── */}
      {/* ═══════════════════════════════════════════ */}
      {showImport && importPreview && (
        <Dialog open={true} onClose={() => { setShowImport(false); setImportPreview(null); setImportFile(null) }}
          title="واردات پشتیبان"
          maxWidth="max-w-sm"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowImport(false); setImportPreview(null); setImportFile(null) }}>لغو</DialogButton>
            <DialogButton variant="primary" onClick={handleImportRestore} disabled={importing}>
              {importing ? 'در حال بازیابی...' : 'بازیابی'}
            </DialogButton>
          </>}>
          <div className="space-y-3">
            {importPreview.version && (
              <div className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cBorder}` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold" style={{ color: tSec }}>نسخه پشتیبان</span>
                  <span className="text-xs font-bold" style={{ color: tPri }}>{importPreview.version}</span>
                </div>
                {importPreview.timestamp && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold" style={{ color: tSec }}>تاریخ ایجاد</span>
                    <span className="text-xs" style={{ color: tPri }}>{importPreview.timestamp}</span>
                  </div>
                )}
              </div>
            )}
            {importPreview.tableCount !== undefined && (
              <div className="text-center">
                <span className="text-lg font-bold" style={{ color: primary }}>{importPreview.tableCount}</span>
                <span className="text-xs mr-1" style={{ color: tSec }}>جدول</span>
                {importPreview.totalRows !== undefined && <>
                  <span className="text-xs mr-2" style={{ color: tSec }}>—</span>
                  <span className="text-lg font-bold" style={{ color: primary }}>{importPreview.totalRows?.toLocaleString('fa-IR')}</span>
                  <span className="text-xs mr-1" style={{ color: tSec }}>ردیف</span>
                </>}
              </div>
            )}
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
              <p className="text-[10px] font-bold" style={{ color: '#3b82f6' }}>یک نسخه پشتیبان قبل از بازیابی ایجاد خواهد شد</p>
            </div>
          </div>
        </Dialog>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── DB RESET: Step 1 (backup before delete) */}
      {/* ═══════════════════════════════════════════ */}
      {showResetStep1 && (
        <Dialog open={true} onClose={() => { setShowResetStep1(false); setBackupSaved(false) }}
          title="پشتیبان‌گیری قبل از حذف" maxWidth="max-w-sm"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowResetStep1(false); setBackupSaved(false) }}>لغو</DialogButton>
            {backupSaved ? (
              <DialogButton variant="danger" onClick={() => { setShowResetStep1(false); setBackupSaved(false); setShowResetStep2(true) }}>ادامه حذف</DialogButton>
            ) : (
              <DialogButton variant="primary" onClick={async () => { const r = await window.api.backup.saveAs(); if (r.success) setBackupSaved(true) }}>ذخیره پشتیبان</DialogButton>
            )}
          </>}>
          {!backupSaved ? (
            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: tPri }}>قبل از حذف دیتابیس، یک نسخه پشتیبان ذخیره کنید.</p>
              <p className="text-xs" style={{ color: tSec }}>فایل پشتیبان در مکان دلخواه شما ذخیره خواهد شد.</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl mb-2">✓</div>
              <p className="text-sm font-bold" style={{ color: '#22c55e' }}>پشتیبان با موفقیت ذخیره شد</p>
              <p className="text-xs mt-1" style={{ color: tSec }}>اکنون می‌توانید حذف دیتابیس را ادامه دهید.</p>
            </div>
          )}
        </Dialog>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── DB RESET: Step 2 (final confirm) ────── */}
      {/* ═══════════════════════════════════════════ */}
      {showResetStep2 && (
        <Dialog open={true} onClose={() => setShowResetStep2(false)}
          title="⚠ حذف کامل دیتابیس" maxWidth="max-w-sm"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => setShowResetStep2(false)}>لغو</DialogButton>
            <DialogButton variant="danger" onClick={async () => {
              const r = await window.api.database.reset()
              if (r.success) window.location.reload()
              else { alert(`خطا: ${r.error}`); setShowResetStep2(false) }
            }}>بله، حذف شود</DialogButton>
          </>}>
          <div className="text-center">
            <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <p className="text-xs font-bold" style={{ color: '#ef4444' }}>تمام اطلاعات حذف خواهد شد:</p>
              <ul className="text-xs mt-1 space-y-0.5" style={{ color: tSec }}>
                <li>• تمام فاکتورها و فروش‌ها</li>
                <li>• تمام کالاها و موجودی</li>
                <li>• تمام مشتریان و تأمین‌کنندگان</li>
                <li>• تمام اسناد حسابداری</li>
                <li>• تمام تنظیمات</li>
              </ul>
            </div>
            <p className="text-xs" style={{ color: tSec }}>برنامه پس از حذف مجدداً راه‌اندازی می‌شود.</p>
          </div>
        </Dialog>
      )}

      {/* ─── Delete Database button ─────────────── */}
      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${cBorder}` }}>
        <button onClick={() => setShowResetStep1(true)}
          className="w-full px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          حذف کامل دیتابیس و شروع از صفر
        </button>
      </div>
    </div>
  )
}
