import { useState, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface Props {
  open: boolean
  mode: 'export' | 'import'
  onClose: () => void
}

const CHECK_ICON = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const WARNING_ICON = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const LOCK_ICON = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const FILE_ICON = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>

export default function SmartExportDialog({ open, mode, onClose }: Props) {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const surfaceBg = isDark ? '#0f172a' : '#f8fafc'
  const primary = '#006194'

  const [step, setStep] = useState<'select' | 'preview' | 'password' | 'result'>('select')
  const [modules, setModules] = useState<{ key: string; label: string; description: string; tables: string[] }[]>([])
  const [presets, setPresets] = useState<{ key: string; label: string; description: string; modules: string[] }[]>([])
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set())
  const [selectedPreset, setSelectedPreset] = useState('all')
  const [includeImages, setIncludeImages] = useState(true)
  const [password, setPassword] = useState('')
  const [usePassword, setUsePassword] = useState(false)
  const [conflictResolution, setConflictResolution] = useState<'replace' | 'skip' | 'merge'>('skip')
  const [validate, setValidate] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [dependencies, setDependencies] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [importPreview, setImportPreview] = useState<any>(null)
  const [importFilePath, setImportFilePath] = useState('')
  const [compatibility, setCompatibility] = useState<any>(null)

  useEffect(() => {
    if (!open) return
    setStep('select')
    setResult(null)
    setSelectedModules(new Set())
    setSelectedPreset('all')
    setPassword('')
    setUsePassword(false)
    setImportPreview(null)

    if (mode === 'export') {
      window.api.smartExport.modules().then(r => { if (r.success && r.data) setModules(r.data) })
      window.api.smartExport.presets().then(r => { if (r.success && r.data) setPresets(r.data) })
    }
  }, [open, mode])

  useEffect(() => {
    if (selectedModules.size === 0) return
    const arr = Array.from(selectedModules)
    window.api.smartExport.dependencies(arr).then(r => {
      if (r.success && r.data) {
        setDependencies(r.data.dependencies || [])
        setWarnings(r.data.warnings || [])
      }
    })
  }, [selectedModules])

  const toggleModule = (key: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      setSelectedPreset('')
      return next
    })
  }

  const applyPreset = (preset: any) => {
    setSelectedPreset(preset.key)
    setSelectedModules(new Set(preset.modules))
  }

  const handleExport = async () => {
    setLoading(true)
    try {
      const opts = {
        modules: Array.from(selectedModules),
        includeImages,
        password: usePassword ? password : undefined,
      }
      const r = await window.api.smartExport.execute(opts, 'user')
      if (r.success && r.data) {
        if (r.data.filePath) {
          setResult({ success: true, message: 'فایل خروجی با موفقیت ذخیره شد', path: r.data.filePath, modules: r.data.modules?.length || 0 })
        } else {
          const saveR = await window.api.dialog.openSmartExport()
          if (saveR.success && saveR.data) {
            await window.api.smartExport.save(r.data, saveR.data)
            setResult({ success: true, message: 'فایل خروجی با موفقیت ذخیره شد', path: saveR.data, modules: r.data.modules?.length || 0 })
          } else {
            setResult({ success: true, message: 'داده‌ها آماده هستند', modules: r.data.modules?.length || 0 })
          }
        }
      } else {
        setResult({ success: false, message: r.error || 'خطا در خروجی گرفتن' })
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message })
    }
    setLoading(false)
    setStep('result')
  }

  const handleImportFile = async () => {
    setLoading(true)
    try {
      const r = await window.api.dialog.openSmartImport()
      if (!r.success || !r.data) { setLoading(false); return }
      setImportFilePath(r.data)

      const compat = await window.api.migration.check(r.data)
      if (compat.success && compat.data) {
        setCompatibility(compat.data)
      }

      const preview = await window.api.smartImport.validate(r.data)
      if (preview.success && preview.data) {
        setImportPreview(preview.data)
        if (preview.data.encrypted) {
          setStep('password')
        } else {
          setStep('preview')
          const mods = preview.data.data?.modules || preview.data.modules || []
          setSelectedModules(new Set(mods.map((m: any) => m.module)))
        }
      } else {
        setResult({ success: false, message: preview.data?.error || 'فایل نامعتبر است' })
        setStep('result')
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message })
      setStep('result')
    }
    setLoading(false)
  }

  const handleImport = async () => {
    setLoading(true)
    try {
      if (compatibility?.needsMigration) {
        const backupR = await window.api.migration.preBackup()
        if (!backupR.success) {
          setResult({ success: false, message: 'خطا در ایجاد پشتیبان قبل از مهاجرت: ' + (backupR.error || '') })
          setStep('result')
          setLoading(false)
          return
        }
      }

      const opts = {
        modules: Array.from(selectedModules),
        conflictResolution,
        validate,
        password: usePassword ? password : undefined,
      }

      const r = await window.api.migration.smartImport(importFilePath, opts, 'user')
      if (r.success && r.data) {
        const migrated = compatibility?.needsMigration
        setResult({
          success: r.data.success,
          message: r.data.success
            ? (migrated ? 'مهاجرت و واردات با موفقیت انجام شد' : 'واردات با موفقیت انجام شد')
            : 'واردات ناموفق',
          errors: r.data.errors,
          warnings: r.data.warnings,
          recordsImported: r.data.recordsImported,
          integrityPassed: r.data.integrityPassed,
        })
      } else {
        setResult({ success: false, message: r.error || 'خطا' })
      }
    } catch (e: any) {
      setResult({ success: false, message: e.message })
    }
    setLoading(false)
    setStep('result')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>
            {mode === 'export' ? <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              : <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{mode === 'export' ? 'خروجی هوشمند' : 'واردات هوشمند'}</h3>
            <p className="text-xs" style={{ color: textSecondary }}>{step === 'select' ? 'انتخاب بخش‌های مورد نظر' : step === 'preview' ? 'پیش‌نمایش داده‌ها' : step === 'password' ? 'رمز عبور' : 'نتیجه'}</p>
          </div>
          <button onClick={onClose} className="mr-auto p-2 rounded-lg" style={{ color: textSecondary }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* STEP: Select */}
          {step === 'select' && mode === 'export' && (
            <>
              {/* Presets */}
              <div className="mb-4">
                <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>قالب‌های آماده</div>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map(p => (
                    <button key={p.key} onClick={() => applyPreset(p)}
                      className={`p-3 rounded-xl text-right transition-all ${selectedPreset === p.key ? 'ring-2' : ''}`}
                      style={{ backgroundColor: surfaceBg, border: `1px solid ${selectedPreset === p.key ? primary : cardBorder}`, ...(selectedPreset === p.key ? { boxShadow: `0 0 0 2px ${primary}33` } : {}) }}>
                      <div className="text-sm font-bold" style={{ color: selectedPreset === p.key ? primary : textPrimary }}>{p.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: textSecondary }}>{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modules */}
              <div className="mb-4">
                <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>بخش‌های داده</div>
                <div className="space-y-1.5">
                  {modules.map(m => (
                    <label key={m.key} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all"
                      style={{ backgroundColor: selectedModules.has(m.key) ? `${primary}10` : 'transparent', border: `1px solid ${selectedModules.has(m.key) ? primary : 'transparent'}` }}>
                      <input type="checkbox" checked={selectedModules.has(m.key)} onChange={() => toggleModule(m.key)}
                        className="w-4 h-4 rounded" style={{ accentColor: primary }} />
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{ color: textPrimary }}>{m.label}</div>
                        <div className="text-xs" style={{ color: textSecondary }}>{m.description}</div>
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: surfaceBg, color: textSecondary }}>
                        {m.tables.length} جدول
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: '#f59e0b15', border: '1px solid #f59e0b40' }}>
                  <div className="flex items-center gap-2 mb-1" style={{ color: '#f59e0b' }}>{WARNING_ICON}<span className="text-sm font-bold">وابستگی‌ها</span></div>
                  {warnings.map((w, i) => <div key={i} className="text-xs mt-1" style={{ color: '#f59e0b' }}>{w}</div>)}
                </div>
              )}

              {dependencies.length > 0 && (
                <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: '#3b82f615', border: '1px solid #3b82f640' }}>
                  <div className="flex items-center gap-2 mb-1" style={{ color: '#3b82f6' }}>{CHECK_ICON}<span className="text-sm font-bold">بخش‌های وابسته اضافه شد</span></div>
                  <div className="text-xs mt-1" style={{ color: '#3b82f6' }}>{dependencies.join('، ')}</div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={includeImages} onChange={e => setIncludeImages(e.target.checked)} style={{ accentColor: primary }} />
                  <span className="text-sm" style={{ color: textPrimary }}>شامل تصاویر</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={usePassword} onChange={e => { setUsePassword(e.target.checked); if (e.target.checked) setPassword('') }} style={{ accentColor: primary }} />
                  <span className="text-sm flex items-center gap-1" style={{ color: textPrimary }}>{LOCK_ICON} رمزگذاری فایل خروجی</span>
                </label>
                {usePassword && (
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز عبور"
                    className="input-field text-sm" style={{ maxWidth: 300 }} />
                )}
              </div>
            </>
          )}

          {/* STEP: Select for Import */}
          {step === 'select' && mode === 'import' && (
            <div className="text-center py-12">
              <div className="mb-6" style={{ color: textSecondary }}>{FILE_ICON}</div>
              <button onClick={handleImportFile} disabled={loading}
                className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>
                {loading ? 'در حال بارگذاری...' : 'انتخاب فایل خروجی'}
              </button>
            </div>
          )}

          {/* STEP: Preview for Import */}
          {step === 'preview' && importPreview && (
            <>
              <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}` }}>
                <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>پیش‌نمایش فایل</div>
                <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: textSecondary }}>
                  <div>نسخه: {importPreview.data?.version || '-'}</div>
                  <div>تاریخ: {importPreview.data?.timestamp?.slice(0, 10) || '-'}</div>
                  <div>ساخته شده توسط: {importPreview.data?.createdBy || '-'}</div>
                </div>
                {importPreview.signature && (
                  <div className="mt-2 flex items-center gap-2">
                    {importPreview.signature.valid
                      ? <span className="flex items-center gap-1 text-xs" style={{ color: '#22c55e' }}>{CHECK_ICON} امضا معتبر</span>
                      : <span className="flex items-center gap-1 text-xs" style={{ color: '#ef4444' }}>{WARNING_ICON} {importPreview.signature.reason}</span>}
                  </div>
                )}
              </div>

              {compatibility && (
                <div className="p-3 rounded-xl mb-4" style={{
                  backgroundColor: compatibility.needsMigration ? '#f59e0b15' : compatibility.compatible ? '#22c55e15' : '#ef444415',
                  border: `1px solid ${compatibility.needsMigration ? '#f59e0b40' : compatibility.compatible ? '#22c55e40' : '#ef444440'}`,
                }}>
                  <div className="flex items-center gap-2 mb-1" style={{ color: compatibility.needsMigration ? '#f59e0b' : compatibility.compatible ? '#22c55e' : '#ef4444' }}>
                    {compatibility.needsMigration ? WARNING_ICON : compatibility.compatible ? CHECK_ICON : WARNING_ICON}
                    <span className="text-sm font-bold">
                      {compatibility.needsMigration
                        ? `نیاز به مهاجرت — از نسخه ${compatibility.fileVersion} به ${compatibility.currentVersion}`
                        : compatibility.compatible
                          ? `نسخه سازگار (${compatibility.fileVersion})`
                          : `نسخه ناسازگار (${compatibility.fileVersion})`}
                    </span>
                  </div>
                  {compatibility.warnings?.map((w: string, i: number) => (
                    <div key={i} className="text-xs mt-1" style={{ color: compatibility.needsMigration ? '#f59e0b' : '#ef4444' }}>{w}</div>
                  ))}
                  {compatibility.needsMigration && compatibility.migrationSteps?.length > 0 && (
                    <div className="mt-2 text-xs" style={{ color: textSecondary }}>
                      <div className="font-bold mb-1">مراحل مهاجرت:</div>
                      {compatibility.migrationSteps.map((s: any, i: number) => (
                        <div key={i} className="ml-2">• {s.description}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>بخش‌های موجود</div>
              <div className="space-y-1.5 mb-4">
                {(importPreview.data?.modules || []).map((m: any) => (
                  <label key={m.module} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer"
                    style={{ backgroundColor: selectedModules.has(m.module) ? `${primary}10` : 'transparent', border: `1px solid ${selectedModules.has(m.module) ? primary : 'transparent'}` }}>
                    <input type="checkbox" checked={selectedModules.has(m.module)} onChange={() => toggleModule(m.module)} style={{ accentColor: primary }} />
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{m.module}</span>
                    <span className="text-xs mr-auto" style={{ color: textSecondary }}>{m.recordCount} رکورد</span>
                  </label>
                ))}
              </div>

              <div className="space-y-3 mb-4">
                <div className="text-sm font-bold" style={{ color: textPrimary }}>روش حل تداخل</div>
                <div className="flex gap-2">
                  {([['skip', 'نادیده گرفتن تکراری‌ها'], ['replace', 'جایگزینی کامل'], ['merge', 'ادغام هوشمند']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setConflictResolution(key)}
                      className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{ backgroundColor: conflictResolution === key ? primary : surfaceBg, color: conflictResolution === key ? '#fff' : textSecondary, border: `1px solid ${conflictResolution === key ? primary : cardBorder}` }}>
                      {label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={validate} onChange={e => setValidate(e.target.checked)} style={{ accentColor: primary }} />
                  <span className="text-sm" style={{ color: textPrimary }}>اعتبارسنجی داده‌ها قبل از وارد کردن</span>
                </label>
              </div>

              {importPreview.encrypted && (
                <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: '#f59e0b15', border: '1px solid #f59e0b40' }}>
                  <div className="flex items-center gap-2" style={{ color: '#f59e0b' }}>{LOCK_ICON}<span className="text-sm font-bold">فایل رمزگذاری شده — لطفاً رمز عبور را وارد کنید</span></div>
                </div>
              )}
            </>
          )}

          {/* STEP: Password for encrypted import */}
          {step === 'password' && (
            <div className="text-center py-8">
              <div className="mb-4" style={{ color: textSecondary }}>{LOCK_ICON}</div>
              <div className="text-sm mb-4" style={{ color: textPrimary }}>فایل رمزگذاری شده است</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="رمز عبور را وارد کنید"
                className="input-field text-sm" style={{ maxWidth: 300, margin: '0 auto' }} />
              <button onClick={() => { setUsePassword(true); setStep('preview') }} disabled={!password}
                className="mt-4 px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, opacity: password ? 1 : 0.5 }}>
                تایید رمز
              </button>
            </div>
          )}

          {/* STEP: Result */}
          {step === 'result' && result && (
            <div className="text-center py-8">
              <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${result.success ? '' : ''}`}
                style={{ backgroundColor: result.success ? '#22c55e15' : '#ef444415' }}>
                {result.success
                  ? <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  : <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
              </div>
              <div className="text-lg font-bold mb-2" style={{ color: result.success ? '#22c55e' : '#ef4444' }}>{result.message}</div>

              {result.path && <div className="text-xs mb-2" style={{ color: textSecondary }}>مسیر: {result.path}</div>}
              {result.modules && <div className="text-sm" style={{ color: textSecondary }}>{result.modules} ماژول خروجی گرفته شد</div>}

              {result.recordsImported && Object.keys(result.recordsImported).length > 0 && (
                <div className="mt-4 p-3 rounded-xl text-left" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}` }}>
                  <div className="text-sm font-bold mb-2" style={{ color: textPrimary }}>رکوردهای وارد شده:</div>
                  {Object.entries(result.recordsImported).map(([table, count]) => (
                    <div key={table} className="text-xs flex justify-between" style={{ color: textSecondary }}>
                      <span>{table}</span><span>{count as number}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 p-3 rounded-xl text-left" style={{ backgroundColor: '#ef444415', border: '1px solid #ef444440' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#ef4444' }}>خطاها ({result.errors.length}):</div>
                  {result.errors.slice(0, 10).map((e: any, i: number) => (
                    <div key={i} className="text-xs mt-1" style={{ color: '#ef4444' }}>{e.table}: {e.error}</div>
                  ))}
                  {result.errors.length > 10 && <div className="text-xs mt-1" style={{ color: '#ef4444' }}>و {result.errors.length - 10} خطای دیگر...</div>}
                </div>
              )}

              {result.warnings && result.warnings.length > 0 && (
                <div className="mt-4 p-3 rounded-xl text-left" style={{ backgroundColor: '#f59e0b15', border: '1px solid #f59e0b40' }}>
                  <div className="text-sm font-bold mb-2" style={{ color: '#f59e0b' }}>هشدارها:</div>
                  {result.warnings.map((w: string, i: number) => (
                    <div key={i} className="text-xs mt-1" style={{ color: '#f59e0b' }}>{w}</div>
                  ))}
                </div>
              )}

              {result.integrityPassed !== undefined && (
                <div className="mt-3 text-xs flex items-center justify-center gap-1" style={{ color: result.integrityPassed ? '#22c55e' : '#f59e0b' }}>
                  {result.integrityPassed ? CHECK_ICON : WARNING_ICON}
                  {result.integrityPassed ? 'بررسی یکپارچگی موفق' : 'بررسی یکپارچگی با مشکل مواجه شد'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: surfaceBg, color: textSecondary }}>
            بستن
          </button>
          <div className="flex gap-2">
            {step === 'select' && mode === 'export' && selectedModules.size > 0 && (
              <button onClick={handleExport} disabled={loading || (usePassword && !password)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, opacity: loading || (usePassword && !password) ? 0.5 : 1 }}>
                {loading ? 'در حال پردازش...' : 'خروجی گرفتن'}
              </button>
            )}
            {step === 'preview' && mode === 'import' && selectedModules.size > 0 && (
              <button onClick={handleImport} disabled={loading}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, opacity: loading ? 0.5 : 1 }}>
                {loading ? 'در حال وارد کردن...' : 'وارد کردن'}
              </button>
            )}
            {step === 'result' && (
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>
                تایید
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
