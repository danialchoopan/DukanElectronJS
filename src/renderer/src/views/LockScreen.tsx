import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { useSuspendStore } from '../store/suspendStore'
import { useSettingsStore } from '../store/settingsStore'
import { t, fa } from '../i18n'
import type { User } from '../../../types'

const colors = {
  primary: '#006194',
  primaryContainer: '#007bb9',
  onPrimary: '#ffffff',
  inversePrimary: '#93ccff',
  secondary: '#006a61',
  secondaryFixed: '#89f5e7',
  outline: '#707881',
  outlineVariant: '#bfc7d2',
  onSurface: '#0d1c2e',
  onSurfaceVariant: '#3f4850',
  surface: '#f8f9ff',
  inverseSurface: '#233144',
  inverseOnSurface: '#eaf1ff',
  surfaceContainerLow: '#eff4ff',
}

function LogoIcon({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <rect width="96" height="96" rx="24" fill={colors.primary} />
      <path d="M28 36l20-16 20 16v28a3 3 0 01-3 3H31a3 3 0 01-3-3V36z" stroke="white" strokeWidth="2.5" fill="none" />
      <path d="M40 67V51h16v16" stroke="white" strokeWidth="2.5" fill="none" />
    </svg>
  )
}

function SmallLogoIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill={colors.primary} />
      <path d="M14 18l10-8 10 8v14a2 2 0 01-2 2H16a2 2 0 01-2-2V18z" stroke="white" strokeWidth="2" fill="none" />
      <path d="M20 34V26h8v8" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  )
}

function LockIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function EyeIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ArrowIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function ShieldIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ChartIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function FingerprintIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 018 4" />
      <path d="M5 19.5C5.5 18 6 15 6 12c0-2.2.9-4.2 2.3-5.7" />
      <path d="M12 12a2 2 0 100-4 2 2 0 000 4z" />
      <path d="M16.2 7.8C15.3 9.2 14 11 14 14c0 1.1-.4 2.1-1 2.8" />
      <path d="M18 12c0 2.7-1.1 5.2-3 7" />
      <path d="M20 15c-.5 1.3-1.2 2.5-2 3.5" />
      <path d="M7.5 18C6.5 16.5 5.7 14.8 5 12.5" />
      <path d="M17 21c-1.2-.8-2.2-2-2.8-3.5" />
      <path d="M8.5 16.5c1.5 1.5 2.5 3.5 2.5 5.5" />
    </svg>
  )
}

function FaceIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="10" r="1" fill={color} />
      <circle cx="15" cy="10" r="1" fill={color} />
      <path d="M9 15a3.5 3.5 0 006 0" />
      <rect x="3" y="3" width="18" height="18" rx="9" />
    </svg>
  )
}

function AdminIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15v3m-3-6h6m-3-3V6" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="11" r="2" />
      <path d="M8 21v-1a4 4 0 018 0v1" />
    </svg>
  )
}

function KeyIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

function PersonIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function LockScreen() {
  const setUser = useAuthStore((s) => s.setUser)
  const clearCart = useCartStore((s) => s.clearCart)
  const loadSuspendSlots = useSuspendStore((s) => s.loadSlots)
  const theme = useSettingsStore((s) => s.theme)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const ui = t()
  const isDark = theme === 'dark'
  const passwordRef = useRef<HTMLInputElement>(null)

  const selectedUser = users.find((u) => u.id === selectedUserId) || null

  useEffect(() => {
    window.api.auth.listUsers().then((r) => {
      if (r.success && r.data) setUsers(r.data)
    })
  }, [])

  const handleLogin = async (pw: string) => {
    if (!selectedUser || !pw) return
    setLoading(true); setError('')
    const result = await window.api.auth.login(pw)
    if (result.success && result.data) {
      clearCart(); setUser(result.data)
      const suspendsResult = await window.api.suspend.list(result.data.id)
      if (suspendsResult.success && suspendsResult.data) loadSuspendSlots(suspendsResult.data)
    } else {
      setError(result.error || ui.auth.invalidPin)
      setTimeout(() => setError(''), 2000)
    }
    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    handleLogin(password)
  }

  const handleSelectUser = (u: User) => {
    setSelectedUserId(u.id)
    setPassword('')
    setError('')
    setTimeout(() => passwordRef.current?.focus(), 100)
  }

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: isDark ? '#0d1c2e' : colors.surface,
        direction: 'rtl',
      }}
    >
      {isDark ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
            <div className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full" style={{ background: colors.primary, filter: 'blur(120px)' }} />
          </div>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 10% 20%, rgba(0, 97, 148, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0, 106, 97, 0.1) 0%, transparent 40%)' }} />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10" style={{ background: colors.inversePrimary, filter: 'blur(80px)' }} />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-10" style={{ background: colors.secondaryFixed, filter: 'blur(80px)' }} />
        </div>
      )}

      {isDark ? (
        <DarkLayout
          users={users}
          selectedUser={selectedUser}
          error={error}
          loading={loading}
          password={password}
          showPassword={showPassword}
          onSelectUser={handleSelectUser}
          onSubmit={handleSubmit}
          setPassword={setPassword}
          setShowPassword={setShowPassword}
          passwordRef={passwordRef}
        />
      ) : (
        <LightLayout
          users={users}
          selectedUser={selectedUser}
          error={error}
          loading={loading}
          password={password}
          showPassword={showPassword}
          onSelectUser={handleSelectUser}
          onSubmit={handleSubmit}
          setPassword={setPassword}
          setShowPassword={setShowPassword}
          passwordRef={passwordRef}
        />
      )}
    </div>
  )
}

interface LayoutProps {
  users: User[]
  selectedUser: User | null
  error: string
  loading: boolean
  password: string
  showPassword: boolean
  onSelectUser: (u: User) => void
  onSubmit: (e: React.FormEvent) => void
  setPassword: (v: string) => void
  setShowPassword: (v: boolean) => void
  passwordRef: React.RefObject<HTMLInputElement>
}

function AccountGrid({
  users,
  selectedUserId,
  onSelect,
  isDark,
}: {
  users: User[]
  selectedUserId: number | null
  onSelect: (u: User) => void
  isDark: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {users.map((u) => {
        const isActive = u.id === selectedUserId
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => onSelect(u)}
            className="relative text-right p-4 rounded-xl transition-all cursor-pointer flex flex-col gap-1"
            style={isDark ? {
              background: isActive ? 'rgba(0, 97, 148, 0.2)' : 'rgba(35, 49, 68, 0.6)',
              border: isActive ? '2px solid #93ccff' : '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
            } : {
              background: isActive ? colors.surfaceContainerLow : undefined,
              border: isActive ? `2px solid ${colors.primary}` : `1px solid ${colors.outlineVariant}`,
            }}
          >
            <div className="flex justify-between items-center w-full mb-1">
              {u.role === 'admin' ? (
                <AdminIcon className="w-6 h-6" color={isDark ? (isActive ? colors.inversePrimary : colors.outline) : colors.primary} />
              ) : (
                <PersonIcon className="w-6 h-6" color={isDark ? (isActive ? colors.inversePrimary : colors.outline) : colors.secondary} />
              )}
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: isDark
                    ? (isActive ? colors.secondaryFixed : colors.outline)
                    : (isActive ? colors.primary : colors.outlineVariant),
                  opacity: isDark ? (isActive ? 1 : 0.3) : 1,
                  boxShadow: isDark && isActive ? '0 0 8px #89f5e7' : 'none',
                }}
              />
            </div>
            <span
              className="text-[14px] leading-[20px] font-medium"
              style={{
                color: isDark ? '#fdfcff' : colors.onSurface,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {u.name}
            </span>
            <span className="text-[12px]" style={{ color: isDark ? '#d5e3fc' : colors.onSurfaceVariant }}>
              {u.role === 'admin' ? fa.admin.admin : fa.admin.cashier}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function DarkLayout({ users, selectedUser, error, loading, password, showPassword, onSelectUser, onSubmit, setPassword, setShowPassword, passwordRef }: LayoutProps) {
  const ui = t()

  return (
    <>
      <main className="relative z-10 w-full max-w-[1200px] px-8 grid grid-cols-12 gap-6 items-center">
        <section className="hidden lg:flex col-span-5 flex-col items-start text-right pr-12">
          <div className="mb-12">
            <LogoIcon size={96} />
            <h1 className="text-[32px] leading-[48px] font-bold mt-4 mb-2" style={{ color: colors.inversePrimary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {ui.app.title}
            </h1>
            <p className="text-[18px] leading-[28px]" style={{ color: '#d5e3fc' }}>
              نرم‌افزار جامع مدیریت فروشگاه و حسابداری
            </p>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(35, 49, 68, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 97, 148, 0.2)' }}>
                <ShieldIcon className="w-6 h-6" color={colors.inversePrimary} />
              </div>
              <div>
                <h3 className="text-[14px] leading-[20px] font-medium" style={{ color: '#fdfcff', fontFamily: "'IBM Plex Sans', sans-serif" }}>امنیت در سطح بانکی</h3>
                <p className="text-[12px]" style={{ color: '#d5e3fc' }}>داده‌های مالی شما با پیشرفته‌ترین پروتکل‌ها رمزنگاری می‌شوند.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'rgba(35, 49, 68, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div className="p-2 rounded-lg" style={{ background: 'rgba(0, 106, 97, 0.2)' }}>
                <ChartIcon className="w-6 h-6" color={colors.secondaryFixed} />
              </div>
              <div>
                <h3 className="text-[14px] leading-[20px] font-medium" style={{ color: '#fdfcff', fontFamily: "'IBM Plex Sans', sans-serif" }}>گزارش‌های بلادرنگ</h3>
                <p className="text-[12px]" style={{ color: '#d5e3fc' }}>دسترسی آنی به ترازنامه‌ها و تحلیل‌های سود و زیان.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[520px] rounded-xl p-8 shadow-2xl" style={{ background: 'rgba(35, 49, 68, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-[24px] leading-[36px] font-semibold" style={{ color: colors.inversePrimary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  خوش آمدید
                </h2>
                <p className="text-[16px] leading-[24px]" style={{ color: '#d5e3fc' }}>
                  جهت ورود به سیستم، حساب کاربری خود را انتخاب کنید.
                </p>
              </div>
              <div className="lg:hidden">
                <SmallLogoIcon size={48} />
              </div>
            </div>

            <div className="mb-6">
              <AccountGrid users={users} selectedUserId={selectedUser?.id ?? null} onSelect={onSelectUser} isDark />
            </div>

            {selectedUser && (
              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[14px] leading-[20px] font-medium block pr-1" style={{ color: '#d5e3fc', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    گذرواژه
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordRef}
                      className="w-full rounded-lg py-3 px-12 focus:ring-2 focus:ring-[#006194] focus:border-transparent transition-all placeholder:text-[#707881] text-left ltr"
                      style={{
                        background: 'rgba(35, 49, 68, 0.5)',
                        border: '1px solid rgba(112, 120, 129, 0.3)',
                        color: '#fdfcff',
                      }}
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <LockIcon className="w-5 h-5" color={colors.outline} />
                    </div>
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 flex items-center pl-3 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="w-5 h-5" color={colors.outline} />
                      ) : (
                        <EyeIcon className="w-5 h-5" color={colors.outline} />
                      )}
                    </button>
                  </div>
                  <div className="flex justify-between items-center px-1 mt-1">
                    <a className="text-[12px] hover:underline" style={{ color: colors.inversePrimary }} href="#" onClick={(e) => e.preventDefault()}>فراموشی رمز عبور؟</a>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-center" style={{ color: '#ff6b6b' }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-[24px] leading-[36px] font-semibold py-3 rounded-xl transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
                  style={{
                    background: loading ? colors.primaryContainer : colors.primary,
                    color: colors.onPrimary,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    boxShadow: '0 4px 16px rgba(0, 97, 148, 0.2)',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>ورود به سیستم</span>
                      <ArrowIcon className="w-5 h-5 rotate-180" color={colors.onPrimary} />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 my-4 opacity-30">
                  <div className="h-[1px] flex-1" style={{ background: colors.outline }} />
                  <span className="text-[14px] leading-[20px] font-medium" style={{ color: '#d5e3fc', fontFamily: "'IBM Plex Sans', sans-serif" }}>یا استفاده از</span>
                  <div className="h-[1px] flex-1" style={{ background: colors.outline }} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all hover:scale-[0.98]" style={{ background: 'rgba(35, 49, 68, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)' }}>
                    <FingerprintIcon className="w-5 h-5" color={colors.secondaryFixed} />
                    <span className="text-[14px] leading-[20px] font-medium" style={{ color: '#fdfcff', fontFamily: "'IBM Plex Sans', sans-serif" }}>اثر انگشت</span>
                  </button>
                  <button type="button" className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all hover:scale-[0.98]" style={{ background: 'rgba(35, 49, 68, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)' }}>
                    <FaceIcon className="w-5 h-5" color={colors.inversePrimary} />
                    <span className="text-[14px] leading-[20px] font-medium" style={{ color: '#fdfcff', fontFamily: "'IBM Plex Sans', sans-serif" }}>تشخیص چهره</span>
                  </button>
                </div>
              </form>
            )}

            {!selectedUser && (
              <p className="text-center text-[12px] mt-2" style={{ color: '#d5e3fc' }}>{fa.auth.defaultPin}</p>
            )}

            <p className="text-center mt-6 text-[12px]" style={{ color: '#d5e3fc' }}>
              کاربر جدید هستید؟{' '}
              <a className="hover:underline" style={{ color: colors.secondaryFixed }} href="#" onClick={(e) => e.preventDefault()}>درخواست دسترسی</a>
            </p>
          </div>
        </section>
      </main>

      <footer className="absolute bottom-0 w-full py-3 px-8 flex justify-between items-center" style={{ background: 'rgba(35, 49, 68, 0.6)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="text-[14px] leading-[20px] font-medium opacity-60" style={{ color: '#d5e3fc', fontFamily: "'IBM Plex Sans', sans-serif" }}>© تمامی حقوق برای {ui.app.title} محفوظ است</p>
        <div className="flex gap-6">
          <a className="text-[14px] leading-[20px] font-medium hover:underline transition-colors" style={{ color: '#d5e3fc' }} href="#" onClick={(e) => e.preventDefault()}>قوانین و مقررات</a>
          <a className="text-[14px] leading-[20px] font-medium hover:underline transition-colors" style={{ color: '#d5e3fc' }} href="#" onClick={(e) => e.preventDefault()}>تماس با پشتیبانی</a>
        </div>
      </footer>
    </>
  )
}

function LightLayout({ users, selectedUser, error, loading, password, showPassword, onSelectUser, onSubmit, setPassword, setShowPassword, passwordRef }: LayoutProps) {
  const ui = t()

  return (
    <main className="flex-grow flex items-center justify-center px-8 py-12 relative">
      <div className="w-full max-w-[480px] z-10">
        <div className="flex flex-col items-center mb-6">
          <LogoIcon size={96} />
          <h1 className="text-[32px] leading-[48px] font-bold tracking-tight mt-4" style={{ color: colors.primary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {ui.app.title}
          </h1>
          <p className="text-[16px] leading-[24px] mt-2" style={{ color: colors.onSurfaceVariant }}>
            نرم‌افزار جامع مدیریت فروشگاه و حسابداری
          </p>
        </div>

        <div className="rounded-xl p-8 shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)', border: `1px solid ${colors.outlineVariant}` }}>
          <div className="mb-6 text-right">
            <h2 className="text-[24px] leading-[36px] font-semibold" style={{ color: colors.onSurface, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              خوش آمدید
            </h2>
            <p className="text-[16px] leading-[24px]" style={{ color: colors.onSurfaceVariant }}>
              لطفاً حساب کاربری خود را انتخاب کنید
            </p>
          </div>

          <div className="mb-6">
            <AccountGrid users={users} selectedUserId={selectedUser?.id ?? null} onSelect={onSelectUser} isDark={false} />
          </div>

          {selectedUser && (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-[14px] leading-[20px] font-medium pr-1" style={{ color: colors.onSurfaceVariant, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  رمز عبور
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    className="w-full outline-none px-4 py-3 text-left transition-colors placeholder:text-[#707881]"
                    style={{
                      background: colors.surfaceContainerLow,
                      borderBottom: `2px solid ${colors.outlineVariant}`,
                      color: colors.onSurface,
                      borderRadius: '8px 8px 0 0',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderBottomColor = colors.primary }}
                    onBlur={(e) => { e.currentTarget.style.borderBottomColor = colors.outlineVariant }}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <LockIcon className="w-5 h-5" color={colors.onSurfaceVariant} />
                  </div>
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" color={colors.onSurfaceVariant} />
                    ) : (
                      <EyeIcon className="w-5 h-5" color={colors.onSurfaceVariant} />
                    )}
                  </button>
                </div>
                <div className="flex justify-between items-center px-1 mt-1">
                  <a className="text-[14px] leading-[20px] font-medium hover:underline" style={{ color: colors.primary, fontFamily: "'IBM Plex Sans', sans-serif" }} href="#" onClick={(e) => e.preventDefault()}>فراموشی رمز عبور؟</a>
                </div>
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: '#ba1a1a' }}>{error}</p>
              )}

              <div className="flex items-center justify-center gap-12 py-2">
                <button type="button" className="flex flex-col items-center gap-1 transition-colors hover:opacity-70" style={{ color: colors.onSurfaceVariant }}>
                  <FingerprintIcon className="w-7 h-7" color={colors.onSurfaceVariant} />
                  <span className="text-[14px] leading-[20px] font-medium" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>اثر انگشت</span>
                </button>
                <div className="w-[1px] h-8" style={{ background: colors.outlineVariant }} />
                <button type="button" className="flex flex-col items-center gap-1 transition-colors hover:opacity-70" style={{ color: colors.onSurfaceVariant }}>
                  <KeyIcon className="w-7 h-7" color={colors.onSurfaceVariant} />
                  <span className="text-[14px] leading-[20px] font-medium" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>کلید امنیتی</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-[24px] leading-[36px] font-semibold py-3 rounded-full flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm"
                style={{
                  background: loading ? colors.primaryContainer : colors.primary,
                  color: colors.onPrimary,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ورود به داشبورد</span>
                    <ArrowIcon className="w-5 h-5 rotate-180" color={colors.onPrimary} />
                  </>
                )}
              </button>
            </form>
          )}

          {!selectedUser && (
            <p className="text-center text-[12px] mt-2" style={{ color: colors.outline }}>{fa.auth.defaultPin}</p>
          )}

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex gap-6">
              <a className="text-[14px] leading-[20px] font-medium hover:underline" style={{ color: colors.onSurfaceVariant }} href="#" onClick={(e) => e.preventDefault()}>تماس با پشتیبانی</a>
              <span style={{ color: colors.outlineVariant }}>|</span>
              <a className="text-[14px] leading-[20px] font-medium hover:underline" style={{ color: colors.onSurfaceVariant }} href="#" onClick={(e) => e.preventDefault()}>قوانین و مقررات</a>
            </div>
            <p className="text-[14px] leading-[20px] font-medium" style={{ color: colors.outline }}>© تمامی حقوق برای {ui.app.title} محفوظ است</p>
          </div>
        </div>
      </div>
    </main>
  )
}
