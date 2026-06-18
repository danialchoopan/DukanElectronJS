import { useState, useEffect } from 'react'
import type { User } from '../../../types'
import { fa } from '../i18n'
import UISettings from './UISettings'

export default function AdminPanel() {
  const [tab, setTab] = useState<'users' | 'settings' | 'ui'>('users')
  const isDark = document.documentElement.classList.contains('dark')
  
  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'users', label: fa.admin.users },
    { key: 'settings', label: fa.admin.settings },
    { key: 'ui', label: 'ظاهر برنامه' },
  ]

  const bgColor = isDark ? '#0f172a' : '#f1f5f9'

  return (
    <div className="h-full p-4 overflow-auto w-full" style={{ backgroundColor: bgColor }}>
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'shadow-lg' : ''}`}
            style={{
              background: tab === t.key 
                ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                : (isDark ? '#334155' : '#e2e8f0'),
              color: tab === t.key 
                ? '#ffffff' 
                : (isDark ? '#94a3b8' : '#475569'),
              boxShadow: tab === t.key ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="w-full">
        {tab === 'users' && <UsersTab />}
        {tab === 'settings' && <SettingsTab />}
        {tab === 'ui' && <UISettings />}
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
  const textSecondary = isDark ? '#94a3b8' : '#475569'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputBorder = isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg" style={{ color: textPrimary }}>{fa.admin.users}</h3>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary text-sm px-4 py-2"
        >
          + {fa.admin.addUser}
        </button>
      </div>
      
      {showForm && (
        <div className="rounded-2xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end border-2" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.name}</label>
            <input 
              value={form.name} 
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{ 
                background: inputBg, 
                border: `1px solid ${inputBorder}`,
                color: textPrimary
              }}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: textSecondary }}>{fa.admin.pin}</label>
              <button type="button" onClick={() => setShowPin(!showPin)} 
                className="text-[10px] px-2 py-0.5 rounded" 
                style={{ background: isDark ? '#334155' : '#e2e8f0', color: textSecondary }}>
                {showPin ? '●●●' : '👁'}
              </button>
            </div>
            <input 
              type={showPin ? 'text' : 'password'} 
              value={form.pinCode} 
              onChange={(e) => setForm((f) => ({ ...f, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} 
              className="w-full px-3 py-2 rounded-lg text-sm tracking-widest font-mono outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{ 
                background: inputBg, 
                border: `1px solid ${inputBorder}`,
                color: textPrimary
              }}
              maxLength={6} 
              inputMode="numeric" 
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.role}</label>
            <select 
              value={form.role} 
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))} 
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{ 
                background: inputBg, 
                border: `1px solid ${inputBorder}`,
                color: textPrimary
              }}>
              <option value="cashier">{fa.admin.cashier}</option>
              <option value="admin">{fa.admin.admin}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSubmit} 
              className="btn-success text-sm flex-1"
            >
              {fa.admin.create}
            </button>
            <button 
              onClick={() => setShowForm(false)} 
              className="flex-1 px-4 py-2 rounded-lg font-bold text-sm transition-all"
              style={{ 
                background: isDark ? '#334155' : '#e2e8f0', 
                color: textSecondary 
              }}>
              {fa.admin.cancel}
            </button>
          </div>
        </div>
      )}
      
      <div className="rounded-2xl border-2 overflow-hidden w-full" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ID</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.name}</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.role}</th>
                <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.expense.date}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <td className="px-4 py-2" style={{ color: textSecondary }}>{u.id}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{u.name}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                      backgroundColor: u.role === 'admin' ? '#fef3c7' : '#dbeafe',
                      color: u.role === 'admin' ? '#92400e' : '#1e40af',
                    }}>{u.role === 'admin' ? fa.admin.admin : fa.admin.cashier}</span>
                  </td>
                  <td className="px-4 py-2 text-xs" style={{ color: textSecondary }}>{u.createdAt}</td>
                  <td className="px-4 py-2">
                    {u.role !== 'admin' && (
                      <button onClick={async () => { await window.api.auth.deleteUser(u.id); load() }} 
                        className="text-xs font-bold px-2 py-1 rounded transition-all hover:bg-red-100 dark:hover:bg-red-900/20"
                        style={{ color: '#dc2626' }}>
                        {fa.admin.delete}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="text-center py-4" style={{ color: textSecondary }}>{fa.admin.noUsers}</td></tr>}
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
  const isDark = document.documentElement.classList.contains('dark')

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#475569'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'

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

  const handleRestore = async (path: string) => {
    if (!confirm('آیا از بازیابی اطمینان دارید؟ تمام اطلاعات فعلی جایگزین می‌شود.')) return
    setLoading(true)
    const r = await window.api.backup.restore(path)
    setLoading(false)
    if (r.success) { alert('بازیابی با موفقیت انجام شد!'); window.location.reload() }
    else alert(`خطا: ${r.error}`)
  }

  const handleCleanup = async () => {
    const r = await window.api.backup.cleanup(30)
    if (r.success && r.data) alert(`${r.data.deleted} پشتیبان قدیمی حذف شد`)
    loadData()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        <button onClick={handleCreateBackup} disabled={loading} className="btn-primary flex-1 py-2 text-sm">
          + پشتیبان جدید
        </button>
        <button onClick={handleExport} disabled={loading} className="flex-1 py-2 rounded-lg font-bold text-sm transition-all" style={{ background: isDark ? '#334155' : '#e2e8f0', color: textSecondary }}>
          ذخیره در فایل
        </button>
        <button onClick={handleIntegrity} disabled={loading} className="flex-1 py-2 rounded-lg font-bold text-sm transition-all" style={{ background: isDark ? '#334155' : '#e2e8f0', color: textSecondary }}>
          بررسی سلامت
        </button>
        <button onClick={handleCleanup} disabled={loading} className="py-2 px-3 rounded-lg font-bold text-sm transition-all" style={{ background: '#fef2f2', color: '#dc2626' }}>
          پاکسازی
        </button>
      </div>

      {stats && (
        <div className="flex gap-4 text-xs" style={{ color: textSecondary }}>
          <span>تعداد: {stats.totalBackups}</span>
          <span>حجم کل: {formatSize(stats.totalSize)}</span>
        </div>
      )}

      {integrityResult && (
        <div className="px-3 py-2 rounded-lg text-xs" style={{ background: inputBg, color: textSecondary }}>
          {integrityResult}
        </div>
      )}

      {backups.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-auto">
          {backups.map((b) => (
            <div key={b.name} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: inputBg, border: `1px solid ${cardBorder}` }}>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate" style={{ color: textPrimary }}>{b.name}</div>
                <div style={{ color: textSecondary }}>{new Date(b.timestamp).toLocaleString('fa-IR')} — {formatSize(b.size)}</div>
              </div>
              <button onClick={() => handleRestore(b.path)} disabled={loading}
                className="ml-2 px-2 py-1 rounded text-xs font-bold" style={{ background: '#dcfce7', color: '#166534' }}>
                بازیابی
              </button>
            </div>
          ))}
        </div>
      )}

      {backups.length === 0 && (
        <p className="text-xs text-center py-2" style={{ color: textSecondary }}>هنوز پشتیبانی وجود ندارد</p>
      )}
    </div>
  )
}

function SettingsTab() {
  const [rounding, setRounding] = useState(500)
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storePhone, setStorePhone] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')
  const [saved, setSaved] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')

  useEffect(() => {
    window.api.settings.getAll().then((r) => {
      if (r.success && r.data) {
        setRounding(parseInt(r.data.autoRounding ?? '500', 10))
        setStoreName(r.data.storeName ?? '')
        setStoreAddress(r.data.storeAddress ?? '')
        setStorePhone(r.data.storePhone ?? '')
        setReceiptFooter(r.data.receiptFooter ?? '')
      }
    })
  }, [])

  const saveAll = async () => {
    await Promise.all([
      window.api.settings.set('autoRounding', String(rounding)),
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
  const textSecondary = isDark ? '#94a3b8' : '#475569'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputBorder = isDark ? '#334155' : '#e2e8f0'

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="rounded-2xl p-4 border-2" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.storeName}</label>
            <input 
              value={storeName} 
              onChange={(e) => setStoreName(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{ 
                background: inputBg, 
                border: `1px solid ${inputBorder}`,
                color: textPrimary
              }}
            />
          </div>
          
          <div className="rounded-2xl p-4 border-2" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.storeAddress}</label>
            <input 
              value={storeAddress} 
              onChange={(e) => setStoreAddress(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{ 
                background: inputBg, 
                border: `1px solid ${inputBorder}`,
                color: textPrimary
              }}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="rounded-2xl p-4 border-2" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.storePhone}</label>
            <input 
              value={storePhone} 
              onChange={(e) => setStorePhone(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{ 
                background: inputBg, 
                border: `1px solid ${inputBorder}`,
                color: textPrimary
              }}
            />
          </div>
          
          <div className="rounded-2xl p-4 border-2" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.receiptFooter}</label>
            <input 
              value={receiptFooter} 
              onChange={(e) => setReceiptFooter(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500"
              style={{ 
                background: inputBg, 
                border: `1px solid ${inputBorder}`,
                color: textPrimary
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 border-2 mt-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <label className="text-xs font-medium block mb-2" style={{ color: textSecondary }}>{fa.admin.autoRoundingSetting}</label>
        <div className="flex gap-2">
          {[0, 500, 1000].map((v) => (
            <button key={v} onClick={() => setRounding(v)} 
              className="flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: rounding === v 
                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)' 
                  : (isDark ? '#334155' : '#e2e8f0'),
                color: rounding === v 
                  ? '#ffffff' 
                  : (isDark ? '#94a3b8' : '#475569'),
                boxShadow: rounding === v ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
              }}>
              {v === 0 ? fa.admin.roundingOff : v.toLocaleString('fa-IR')}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={saveAll} 
        className="btn-primary w-full py-3 text-lg mt-4"
      >
        {saved ? '✓ ' + fa.admin.saved : fa.admin.save}
      </button>

      <div className="rounded-2xl p-5 border-2 mt-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <h3 className="font-bold mb-3" style={{ color: textPrimary }}>پشتیبان‌گیری و بازیابی</h3>
        <p className="text-sm mb-4" style={{ color: textSecondary }}>
          تمام اطلاعات فروشگاه شامل کالاها، فاکتورها، مشتریان و تنظیمات
        </p>
        <BackupSection />
      </div>
    </div>
  )
}