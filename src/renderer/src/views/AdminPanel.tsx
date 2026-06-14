import { useState, useEffect } from 'react'
import type { User } from '../../../types'
import { fa } from '../i18n'
import UISettings from './UISettings'

export default function AdminPanel() {
  const [tab, setTab] = useState<'users' | 'settings' | 'ui'>('users')
  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'users', label: fa.admin.users },
    { key: 'settings', label: fa.admin.settings },
    { key: 'ui', label: 'ظاهر برنامه' },
  ]

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'users' && <UsersTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'ui' && <UISettings />}
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showPin, setShowPin] = useState(true)
  const [form, setForm] = useState({ name: '', pinCode: '', role: 'cashier' as 'admin' | 'cashier' })
  const load = async () => { const r = await window.api.auth.listUsers(); if (r.success && r.data) setUsers(r.data) }
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!form.name || form.pinCode.length < 4) return
    await window.api.auth.createUser(form)
    setShowForm(false); setForm({ name: '', pinCode: '', role: 'cashier' }); load()
  }

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h3 className="font-bold text-gray-300">{fa.admin.users}</h3>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">+ {fa.admin.addUser}</button>
      </div>
      {showForm && (
        <div className="card mb-4 grid grid-cols-4 gap-2 items-end">
          <div>
            <label className="text-xs text-gray-400">{fa.admin.name}</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">{fa.admin.pin}</label>
              <button type="button" onClick={() => setShowPin(!showPin)} className="text-[10px] px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                {showPin ? '●●●' : '👁'}
              </button>
            </div>
            <input type={showPin ? 'text' : 'password'} value={form.pinCode} onChange={(e) => setForm((f) => ({ ...f, pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} className="input-field text-sm tracking-widest font-mono" maxLength={6} inputMode="numeric" />
          </div>
          <div>
            <label className="text-xs text-gray-400">{fa.admin.role}</label>
            <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as any }))} className="input-field text-sm">
              <option value="cashier">{fa.admin.cashier}</option>
              <option value="admin">{fa.admin.admin}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} className="btn-success text-sm">{fa.admin.create}</button>
            <button onClick={() => setShowForm(false)} className="btn-danger text-sm">{fa.admin.cancel}</button>
          </div>
        </div>
      )}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-primary)' }}>
              <th className="text-right px-4 py-2" style={{ color: 'var(--text-secondary)' }}>ID</th>
              <th className="text-right px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{fa.admin.name}</th>
              <th className="text-right px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{fa.admin.role}</th>
              <th className="text-right px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{fa.expense.date}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td className="px-4 py-2" style={{ color: 'var(--text-secondary)' }}>{u.id}</td>
                <td className="px-4 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{u.name}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                    backgroundColor: u.role === 'admin' ? '#fef3c7' : '#dbeafe',
                    color: u.role === 'admin' ? '#92400e' : '#1e40af',
                  }}>{u.role === 'admin' ? fa.admin.admin : fa.admin.cashier}</span>
                </td>
                <td className="px-4 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{u.createdAt}</td>
                <td className="px-4 py-2">
                  {u.role !== 'admin' && (
                    <button onClick={async () => { await window.api.auth.deleteUser(u.id); load() }} className="text-xs font-bold" style={{ color: '#ef4444' }}>{fa.admin.delete}</button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="text-center py-4" style={{ color: 'var(--text-secondary)' }}>{fa.admin.noUsers}</td></tr>}
          </tbody>
        </table>
      </div>
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

  return (
    <div className="space-y-4 max-w-lg">
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{fa.admin.storeName}</label>
        <input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="input-field" />
      </div>
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{fa.admin.storeAddress}</label>
        <input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} className="input-field" />
      </div>
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{fa.admin.storePhone}</label>
        <input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} className="input-field" />
      </div>
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{fa.admin.receiptFooter}</label>
        <input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} className="input-field" />
      </div>
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-secondary)' }}>{fa.admin.autoRoundingSetting}</label>
        <div className="flex gap-2">
          {[0, 500, 1000].map((v) => (
            <button key={v} onClick={() => setRounding(v)} className="px-6 py-2 rounded-xl text-sm font-bold" style={{
              background: rounding === v ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-tertiary)',
              color: rounding === v ? '#ffffff' : 'var(--text-secondary)',
            }}>{v === 0 ? fa.admin.roundingOff : v.toLocaleString('fa-IR')}</button>
          ))}
        </div>
      </div>
      <button onClick={saveAll} className="btn-primary py-3 w-full text-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{saved ? fa.admin.saved : fa.admin.save}</button>

      <div className="rounded-2xl p-5 border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>پشتیبان‌گیری و بازیابی</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          تمام اطلاعات فروشگاه شامل کالاها، فاکتورها، مشتریان و تنظیمات
        </p>
        <div className="flex gap-3">
          <button onClick={async () => {
            const r = await window.api.backup.export()
            if (r.success) alert(`فایل پشتیبان ذخیره شد:\n${r.data}`)
            else if (r.error !== 'cancelled') alert(`خطا: ${r.error}`)
          }} className="flex-1 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            ذخیره پشتیبان
          </button>
          <button onClick={async () => {
            if (!confirm('آیا از بازیابی اطمینان دارید؟ تمام اطلاعات فعلی جایگزین می‌شود.')) return
            const r = await window.api.backup.import()
            if (r.success) { alert('بازیابی با موفقیت انجام شد!'); window.location.reload() }
            else if (r.error !== 'cancelled') alert(`خطا: ${r.error}`)
          }} className="flex-1 py-3 rounded-xl font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
            بازیابی پشتیبان
          </button>
        </div>
      </div>
    </div>
  )
}
