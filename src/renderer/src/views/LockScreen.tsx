import { useState, useEffect } from 'react'
import PinPad from '../components/PinPad'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { useSuspendStore } from '../store/suspendStore'
import { useSettingsStore } from '../store/settingsStore'
import { t, fa } from '../i18n'
import type { User } from '../../../types'

export default function LockScreen() {
  const setUser = useAuthStore((s) => s.setUser)
  const clearCart = useCartStore((s) => s.clearCart)
  const loadSuspendSlots = useSuspendStore((s) => s.loadSlots)
  const theme = useSettingsStore((s) => s.theme)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ui = t()
  const isDark = theme === 'dark'

  useEffect(() => { window.api.auth.listUsers().then((r) => { if (r.success && r.data) setUsers(r.data) }) }, [])

  const handleLogin = async (pin: string) => {
    if (!selectedUser) return
    setLoading(true); setError('')
    const result = await window.api.auth.login(pin)
    if (result.success && result.data) {
      clearCart(); setUser(result.data)
      const suspendsResult = await window.api.suspend.list(result.data.id)
      if (suspendsResult.success && suspendsResult.data) loadSuspendSlots(suspendsResult.data)
    } else { setError(result.error || ui.auth.invalidPin); setTimeout(() => setError(''), 2000) }
    setLoading(false)
  }

  const bg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
    : 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%)'

  if (selectedUser) {
    return (
      <div className="h-screen flex flex-col items-center justify-center" style={{ background: bg }}>
        <button onClick={() => { setSelectedUser(null); setError('') }}
          className="mb-6 flex items-center gap-2 text-sm font-bold rounded-xl px-4 py-2 transition-all text-white"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          {fa.common.back}
        </button>
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold text-white">{selectedUser.name.charAt(0)}</div>
        </div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: isDark ? '#f1f5f9' : '#1f2937' }}>{selectedUser.name}</h2>
        <p className="text-sm mb-6" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>{ui.auth.enterPin}</p>
        <div className="card p-10" style={{ backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.95)', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.4)' : '0 8px 40px rgba(0,0,0,0.12)' }}>
          <PinPad length={4} onSubmit={handleLogin} error={error} showToggle />
        </div>
        {loading && <div className="mt-6 flex items-center gap-2"><div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><p className="text-sm" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>{ui.auth.authenticating}</p></div>}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ background: bg }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}>
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: isDark ? '#f1f5f9' : '#1f2937' }}>{ui.app.title}</h1>
        <p className="text-lg" style={{ color: isDark ? '#94a3b8' : '#6b7280' }}>{fa.auth.selectUser}</p>
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-lg w-full px-4">
        {users.map((u) => (
          <button key={u.id} onClick={() => setSelectedUser(u)}
            className="btn text-white rounded-3xl p-6 flex flex-col items-center gap-3 transition-all duration-200 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold bg-white/20">{u.name.charAt(0)}</div>
            <span className="font-bold text-sm">{u.name}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white/20">{u.role === 'admin' ? fa.admin.admin : fa.admin.cashier}</span>
          </button>
        ))}
      </div>
      <div className="mt-10 px-4 py-2 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
        <p className="text-sm" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>{fa.auth.defaultPin}</p>
      </div>
    </div>
  )
}
