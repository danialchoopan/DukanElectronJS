import { useState, useEffect } from 'react'
import type { User } from '../../../types'
import { fa } from '../i18n'
import UISettings from './UISettings'
import ShortcutsSettings from './accounting/ShortcutsSettings'
import CustomizationSettings from './admin/CustomizationSettings'
import { useHighlight } from '../hooks/useHighlight'

const primary = '#006194'

interface Props {
  initialTab?: string
  highlightId?: string
  onHighlightDone?: () => void
}

export default function AdminPanel({ initialTab, highlightId, onHighlightDone }: Props) {
  const [tab, setTab] = useState<'users' | 'settings' | 'ui' | 'shortcuts' | 'customization'>((initialTab as any) || 'users')
  const isDark = document.documentElement.classList.contains('dark')

  useEffect(() => {
    if (initialTab && ['users', 'settings', 'ui', 'shortcuts', 'customization'].includes(initialTab)) {
      setTab(initialTab as any)
    }
  }, [initialTab])

  useHighlight(highlightId, onHighlightDone)

  const tabs: { key: typeof tab; label: string; icon: string }[] = [
    { key: 'users', label: fa.admin.users, icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
    { key: 'settings', label: fa.admin.settings, icon: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z' },
    { key: 'ui', label: 'ظاهر برنامه', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z' },
    { key: 'shortcuts', label: 'میانبرها', icon: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3' },
    { key: 'customization', label: 'شخصی‌سازی', icon: 'M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z' },
  ]

  const bgColor = isDark ? '#0f172a' : '#f8fafc'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnBg = isDark ? '#334155' : '#f1f5f9'

  return (
    <div className="h-full p-5 overflow-auto w-full" style={{ backgroundColor: bgColor }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, boxShadow: '0 2px 8px rgba(0,97,148,0.25)' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: textPrimary }}>تنظیمات و مدیریت</h2>
          <p className="text-xs font-medium" style={{ color: textSecondary }}>{fa.admin.settings}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            data-highlight-id={`tab-${t.key}`}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${highlightId === `tab-${t.key}` ? 'highlight-tab' : ''}`}
            style={{
              background: tab === t.key
                ? `linear-gradient(135deg, ${primary}, #007bb9)`
                : btnBg,
              color: tab === t.key ? '#ffffff' : textSecondary,
              boxShadow: tab === t.key ? '0 4px 12px rgba(0,97,148,0.3)' : 'none',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-full">
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'ui' && <UISettings />}
        {tab === 'shortcuts' && <ShortcutsSettings />}
        {tab === 'customization' && <CustomizationSettings />}
      </div>
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPin, setShowPin] = useState(true)
  const [form, setForm] = useState({ name: '', pinCode: '', role: 'cashier' as 'admin' | 'cashier' })
  const isDark = document.documentElement.classList.contains('dark')

  const load = async () => { const r = await window.api.auth.listUsers(); if (r.success && r.data) setUsers(r.data) }
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!form.name || form.pinCode.length < 4) return
    await window.api.auth.createUser(form)
    setShowForm(false); setForm({ name: '', pinCode: '', role: 'cashier' }); load()
  }

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const btnBg = isDark ? '#334155' : '#f1f5f9'

  const inputStyle = { background: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <h3 className="font-extrabold text-sm" style={{ color: textPrimary }}>{fa.admin.users}</h3>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary text-sm"
        >
          + {fa.admin.addUser}
        </button>
      </div>

      {showForm && (
        <div
          className="rounded-2xl p-5 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end border overflow-hidden"
          style={{
            backgroundColor: cardBg,
            borderColor: primary,
            borderRightWidth: '4px',
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,97,148,0.08)',
          }}
        >
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.name}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold" style={{ color: textSecondary }}>{fa.admin.pin}</label>
              <button type="button" onClick={() => setShowPin(!showPin)}
                className="text-[10px] px-2 py-0.5 rounded-lg font-bold"
                style={{ background: btnBg, color: textSecondary }}>
                {showPin ? '●●●' : '○○○'}
              </button>
            </div>
            <input
              type={showPin ? 'text' : 'password'}
              value={form.pinCode}
              onChange={(e) => setForm((f) => ({ ...f, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
              className="input-field text-sm tracking-widest font-mono"
              style={inputStyle}
              maxLength={6}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.role}</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))}
              className="input-field text-sm"
              style={inputStyle}>
              <option value="cashier">{fa.admin.cashier}</option>
              <option value="admin">{fa.admin.admin}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn btn-success text-sm flex-1">
              {fa.admin.create}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-200"
              style={{ backgroundColor: btnBg, color: textSecondary }}>
              {fa.admin.cancel}
            </button>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl border overflow-hidden w-full"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
                <th className="text-right px-4 py-2.5 text-xs font-bold" style={{ color: textSecondary, borderBottom: `2px solid ${cardBorder}` }}>ID</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold" style={{ color: textSecondary, borderBottom: `2px solid ${cardBorder}` }}>{fa.admin.name}</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold" style={{ color: textSecondary, borderBottom: `2px solid ${cardBorder}` }}>{fa.admin.role}</th>
                <th className="text-right px-4 py-2.5 text-xs font-bold" style={{ color: textSecondary, borderBottom: `2px solid ${cardBorder}` }}>{fa.expense.date}</th>
                <th className="px-4 py-2.5" style={{ borderBottom: `2px solid ${cardBorder}` }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="transition-all duration-150"
                  style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(0,97,148,0.06)' : 'rgba(0,97,148,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <td className="px-4 py-2.5" style={{ color: textSecondary }}>{u.id}</td>
                  <td className="px-4 py-2.5 font-bold" style={{ color: textPrimary }}>{u.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{
                      backgroundColor: u.role === 'admin' ? (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7') : (isDark ? 'rgba(0,97,148,0.15)' : '#e0f2fe'),
                      color: u.role === 'admin' ? '#f59e0b' : primary,
                    }}>{u.role === 'admin' ? fa.admin.admin : fa.admin.cashier}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: textSecondary }}>{u.createdAt}</td>
                  <td className="px-4 py-2.5">
                    {u.role !== 'admin' && (
                      <button onClick={async () => { await window.api.auth.deleteUser(u.id); load() }}
                        className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all duration-200"
                        style={{ color: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}
                      >
                        {fa.admin.delete}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="1" opacity="0.5">
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold" style={{ color: textSecondary }}>{fa.admin.noUsers}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BackupSection() {
  const [backups, setBackups] = useState<{ name: string; path: string; size: number; timestamp: string; hash: string }[]>([])
  const [stats, setStats] = useState<{ totalBackups: number; latestBackup: string | null; totalSize: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [integrityResult, setIntegrityResult] = useState<string | null>(null)
  const [backupDetails, setBackupDetails] = useState<Record<string, { meta: any; tables: Record<string, number> }>>({})
  const [restorePreview, setRestorePreview] = useState<{ path: string; details: any; version: any } | null>(null)
  const [testResults, setTestResults] = useState<{ name: string; passed: boolean; error?: string }[] | null>(null)
  const [runningTests, setRunningTests] = useState(false)
  const [selectedBackups, setSelectedBackups] = useState<Set<string>>(new Set())
  const isDark = document.documentElement.classList.contains('dark')

  const primary = '#006194'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const btnBg = isDark ? '#334155' : '#f1f5f9'

  const loadData = async () => {
    const [listRes, statsRes] = await Promise.all([
      window.api.backup.list(),
      window.api.backup.stats(),
    ])
    if (listRes.success && listRes.data) setBackups(listRes.data)
    if (statsRes.success && statsRes.data) setStats(statsRes.data)
  }

  useEffect(() => { loadData() }, [])

  const handleExport = async () => {
    setLoading(true)
    const r = await window.api.backup.export()
    setLoading(false)
    if (r.success) { alert(`فایل پشتیبان ذخیره شد:\n${r.data}`); loadData() }
    else if (r.error !== 'cancelled') alert(`خطا: ${r.error}`)
  }

  const handleCreateBackup = async () => {
    setLoading(true)
    const r = await window.api.backup.create()
    setLoading(false)
    if (r.success) alert('پشتیبان جدید ایجاد شد')
    else alert(`خطا: ${r.error}`)
    loadData()
  }

  const handleIntegrity = async () => {
    setLoading(true)
    const r = await window.api.backup.integrity()
    setLoading(false)
    if (r.success && r.data) {
      const d = r.data
      setIntegrityResult(`سلامت: ${d.integrityCheck === 'ok' ? '✓' : '✗'} | خارجی: ${d.foreignKeyCheck} | جداول: ${d.tableCount}`)
    } else {
      setIntegrityResult(`خطا: ${r.error}`)
    }
  }

  const handleRestorePreview = async (path: string) => {
    setLoading(true)
    const [detailsRes, versionRes] = await Promise.all([
      window.api.backup.getDetails(path),
      window.api.backup.checkVersion(path),
    ])
    setLoading(false)
    if (detailsRes.success && versionRes.success) {
      setRestorePreview({ path, details: detailsRes.data, version: versionRes.data })
    } else {
      alert(`خطا: ${detailsRes.error || versionRes.error}`)
    }
  }

  const handleConfirmRestore = async () => {
    if (!restorePreview) return
    const r = await window.api.backup.restore(restorePreview.path)
    setRestorePreview(null)
    if (r.success) { alert('بازیابی با موفقیت انجام شد!'); window.location.reload() }
    else alert(`خطا: ${r.error}`)
  }

  const handleCleanup = async () => {
    if (selectedBackups.size === 0) { alert('ابتدا پشتیبان‌های مورد نظر را انتخاب کنید'); return }
    const msg = `آیا از حذف ${selectedBackups.size} پشتیبان انتخاب شده اطمینان دارید؟`
    if (!window.confirm(msg)) return
    setLoading(true)
    let deleted = 0
    for (const name of selectedBackups) {
      const r = await window.api.backup.delete(name)
      if (r.success) deleted++
    }
    setSelectedBackups(new Set())
    setLoading(false)
    alert(`${deleted} پشتیبان حذف شد`)
    loadData()
  }

  const toggleSelectBackup = (name: string) => {
    const next = new Set(selectedBackups)
    if (next.has(name)) next.delete(name); else next.add(name)
    setSelectedBackups(next)
  }

  const handleRunTests = async () => {
    setRunningTests(true)
    setTestResults(null)
    const r = await window.api.backup.runTests()
    if (r.success && Array.isArray(r.data)) {
      setTestResults(r.data)
    } else {
      setTestResults([{ name: 'test_runner', passed: false, error: r.error || 'Unknown error' }])
    }
    setRunningTests(false)
  }

  const loadBackupDetails = async (name: string, path: string) => {
    if (backupDetails[name]) return
    const r = await window.api.backup.getDetails(path)
    if (r.success && r.data) {
      setBackupDetails(prev => ({ ...prev, [name]: { meta: r.data.meta, tables: r.data.tables } }))
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleCreateBackup} disabled={loading} className="btn btn-primary flex-1 py-2 text-sm">
          + پشتیبان جدید
        </button>
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-200"
          style={{ backgroundColor: btnBg, color: textSecondary }}
        >
          ذخیره در فایل
        </button>
        <button
          onClick={handleIntegrity}
          disabled={loading}
          className="flex-1 py-2 rounded-xl font-bold text-sm transition-all duration-200"
          style={{ backgroundColor: btnBg, color: textSecondary }}
        >
          بررسی سلامت
        </button>
        <button
          onClick={handleCleanup}
          disabled={loading || selectedBackups.size === 0}
          className="py-2 px-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-40"
          style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444' }}
        >
          حذف انتخاب شده{selectedBackups.size > 0 ? ` (${selectedBackups.size})` : ''}
        </button>
        <button
          onClick={handleRunTests}
          disabled={runningTests || loading}
          className="py-2 px-3 rounded-xl font-bold text-sm transition-all duration-200"
          style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : '#eef2ff', color: '#6366f1' }}
        >
          {runningTests ? 'در حال تست...' : 'تست پشتیبان'}
        </button>
      </div>

      {stats && (
        <div className="flex gap-4 text-xs" style={{ color: textSecondary }}>
          <span>تعداد: {stats.totalBackups}</span>
          <span>حجم کل: {formatSize(stats.totalSize)}</span>
        </div>
      )}

      {integrityResult && (
        <div className="px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textSecondary }}>
          {integrityResult}
        </div>
      )}

      {testResults && (
        <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}` }}>
          <div className="font-bold mb-2" style={{ color: textPrimary }}>نتایج تست ({testResults.filter(r => r.passed).length}/{testResults.length} passed)</div>
          <div className="space-y-1 max-h-32 overflow-auto">
            {testResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: r.passed ? '#22c55e' : '#ef4444' }}>{r.passed ? '✓' : '✗'}</span>
                <span style={{ color: textPrimary }}>{r.name}</span>
                {r.error && <span className="text-[10px]" style={{ color: '#ef4444' }}>{r.error}</span>}
              </div>
            ))}
          </div>
          <button onClick={() => setTestResults(null)} className="mt-2 text-[10px] font-bold" style={{ color: textSecondary }}>
            بستن
          </button>
        </div>
      )}

      {restorePreview && (
        <div className="rounded-xl p-3 text-xs space-y-2" style={{ backgroundColor: inputBg, border: `2px solid ${primary}` }}>
          <div className="font-bold" style={{ color: textPrimary }}>پیش‌نمایش بازیابی</div>
          {restorePreview.version?.meta && (
            <div style={{ color: textSecondary }}>
              نسخه: {restorePreview.version.meta.appVersion || '?'} | تاریخ: {new Date(restorePreview.version.meta.timestamp).toLocaleDateString('fa-IR')}
            </div>
          )}
          {restorePreview.details?.tables && (
            <div className="flex flex-wrap gap-x-3 gap-y-1" style={{ color: textSecondary }}>
              {Object.entries(restorePreview.details.tables as Record<string, number>).map(([table, count]) => (
                <span key={table}>{table}: {count}</span>
              ))}
            </div>
          )}
          {restorePreview.details?.integrity && (
            <div style={{ color: restorePreview.details.integrity.success ? '#22c55e' : '#ef4444' }}>
              سلامت: {restorePreview.details.integrity.integrityCheck === 'ok' ? '✓' : '✗'}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleConfirmRestore} disabled={loading} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
              تأیید بازیابی
            </button>
            <button onClick={() => setRestorePreview(null)} disabled={loading} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: btnBg, color: textSecondary }}>
              لغو
            </button>
          </div>
        </div>
      )}

      {backups.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-auto">
          {backups.map((b) => {
            const details = backupDetails[b.name]
            const isSelected = selectedBackups.has(b.name)
            return (
              <div
                key={b.name}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer"
                style={{ backgroundColor: isSelected ? (isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2') : inputBg, border: `1px solid ${isSelected ? '#ef4444' : cardBorder}` }}
                onClick={() => loadBackupDetails(b.name, b.path)}
              >
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelectBackup(b.name)}
                  className="accent-[#ef4444] cursor-pointer" onClick={(e) => e.stopPropagation()} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: textPrimary }}>{b.name}</div>
                  <div style={{ color: textSecondary }}>
                    {new Date(b.timestamp).toLocaleString('fa-IR')} — {formatSize(b.size)}
                    {details?.meta?.appVersion && ` — v${details.meta.appVersion}`}
                  </div>
                  {details?.tables && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 text-[10px]" style={{ color: textSecondary }}>
                      {Object.entries(details.tables).slice(0, 5).map(([t, c]) => (
                        <span key={t}>{t}: {c}</span>
                      ))}
                      {Object.keys(details.tables).length > 5 && <span>...</span>}
                    </div>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleRestorePreview(b.path) }} disabled={loading}
                  className="ml-2 px-2.5 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', color: '#22c55e' }}>
                  بازیابی
                </button>
              </div>
            )
          })}
        </div>
      )}

      {backups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="1.5" opacity="0.5">
              <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-xs text-center" style={{ color: textSecondary }}>هنوز پشتیبانی وجود ندارد</p>
        </div>
      )}
    </div>
  )
}

function SettingsTab() {
  const [taxRate, setTaxRate] = useState(0)
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')
  const [saved, setSaved] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')

  const primary = '#006194'

  useEffect(() => {
    window.api.settings.getAll().then((r) => {
      if (r.success && r.data) {
        setTaxRate(parseFloat(r.data.taxRate ?? '0'))
        setTaxEnabled(r.data.taxEnabled === 'true')
        setStoreName(r.data.storeName ?? '')
        setStoreAddress(r.data.storeAddress ?? '')
        setStorePhone(r.data.storePhone ?? '')
        setReceiptFooter(r.data.receiptFooter ?? '')
      }
    })
  }, [])

  const saveAll = async () => {
    await Promise.all([
      window.api.settings.set('taxRate', String(taxRate)),
      window.api.settings.set('taxEnabled', String(taxEnabled)),
      window.api.settings.set('storeName', storeName),
      window.api.settings.set('storeAddress', storeAddress),
      window.api.settings.set('storePhone', storePhone),
      window.api.settings.set('receiptFooter', receiptFooter),
    ])
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'

  const inputStyle = { background: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.storeName}</label>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="input-field text-sm"
              style={inputStyle}
            />
          </div>

          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.storeAddress}</label>
            <input
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="input-field text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.storePhone}</label>
            <input
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="input-field text-sm"
              style={inputStyle}
            />
          </div>

          <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.receiptFooter}</label>
            <input
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="input-field text-sm"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 border mt-4" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold" style={{ color: textSecondary }}>مالیات بر ارزش افزوده</label>
          <button onClick={() => setTaxEnabled(!taxEnabled)}
            className="relative w-10 h-5 rounded-full transition-all duration-200"
            style={{ backgroundColor: taxEnabled ? primary : (isDark ? '#475569' : '#d1d5db') }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: taxEnabled ? '20px' : '2px' }} />
          </button>
        </div>
        {taxEnabled && (
          <div>
            <label className="text-xs block mb-1" style={{ color: textSecondary }}>درصد مالیات (%)</label>
            <div className="flex gap-2 items-center">
              <input type="range" min="0" max="30" step="0.5" value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: primary }} />
              <span className="text-sm font-bold font-mono min-w-[60px] text-center" style={{ color: primary }}>{taxRate}%</span>
            </div>
            <div className="flex gap-1 mt-2">
              {[0, 5, 9, 10, 15].map((v) => (
                <button key={v} onClick={() => setTaxRate(v)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: taxRate === v ? `linear-gradient(135deg, ${primary}, #007bb9)` : (isDark ? '#334155' : '#f1f5f9'),
                    color: taxRate === v ? '#ffffff' : textSecondary,
                  }}>
                  {v}%
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ color: textSecondary }}>
              مالیات به صورت خودکار در چاپ فاکتور و صورتحساب‌ها اعمال می‌شود.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={saveAll}
        className="w-full py-3 text-lg mt-4 rounded-xl font-bold transition-all duration-200"
        style={{
          background: saved
            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
            : `linear-gradient(135deg, ${primary}, #007bb9)`,
          color: '#ffffff',
          boxShadow: saved ? '0 4px 12px rgba(34,197,94,0.3)' : '0 4px 12px rgba(0,97,148,0.3)',
        }}
      >
        {saved ? fa.admin.saved : fa.admin.save}
      </button>

      <div className="rounded-2xl p-5 border mt-5" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <h3 className="font-extrabold text-sm" style={{ color: textPrimary }}>پشتیبان‌گیری و بازیابی</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: textSecondary }}>
          تمام اطلاعات فروشگاه شامل کالاها، فاکتورها، مشتریان و تنظیمات
        </p>
        <BackupSection />
      </div>
    </div>
  )
}
