import { useState, useRef, useCallback } from 'react'
import { t, setLanguage } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'

const colors = {
  primary: '#006194',
  primaryContainer: '#007bb9',
  onPrimary: '#ffffff',
  inversePrimary: '#93ccff',
  secondary: '#006a61',
  secondaryFixed: '#89f5e7',
  onSurface: '#0d1c2e',
  onSurfaceVariant: '#3f4850',
  outline: '#707881',
  outlineVariant: '#bfc7d2',
  surfaceContainerLow: '#eff4ff',
}

function LogoIcon({ size = 128 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none">
      <rect width="128" height="128" rx="24" fill={colors.primary} />
      <path d="M36 48l28-22 28 22v40a3 3 0 01-3 3H39a3 3 0 01-3-3V48z" stroke="white" strokeWidth="3" fill="none" />
      <path d="M56 91V71h16v20" stroke="white" strokeWidth="3" fill="none" />
    </svg>
  )
}

function StoreIcon({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function CallIcon({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
}

function LocationIcon({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function ArrowIcon({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [lang, setLang] = useState<'fa' | 'en'>('fa')
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [adminPinConfirm, setAdminPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const pinConfirmRefs = useRef<(HTMLInputElement | null)[]>([])

  const ui = t()
  const isDark = theme === 'dark'

  const switchLang = useCallback((l: 'fa' | 'en') => {
    setLang(l)
    setLanguage(l)
  }, [])

  const handlePinChange = useCallback((val: string) => {
    setPinError('')
    setAdminPin(val)
  }, [])

  const handlePinConfirmChange = useCallback((val: string) => {
    setPinError('')
    setAdminPinConfirm(val)
  }, [])

  const handleSubmit = async () => {
    if (!shopName.trim()) return
    if (adminPin.length < 4) {
      setPinError(lang === 'fa' ? 'رمز باید حداقل ۴ رقم باشد' : 'PIN must be at least 4 digits')
      return
    }
    if (adminPin !== adminPinConfirm) {
      setPinError(lang === 'fa' ? 'رمزها مطابقت ندارند' : 'PINs do not match')
      return
    }
    setSubmitting(true)
    await Promise.all([
      window.api.settings.set('storeName', shopName || (lang === 'fa' ? 'فروشگاه من' : 'My Store')),
      window.api.settings.set('storeAddress', shopAddress),
      window.api.settings.set('storePhone', shopPhone),
      window.api.settings.set('businessType', 'supermarket'),
      window.api.settings.set('autoRounding', '500'),
      window.api.settings.set('language', lang),
      window.api.settings.set('theme', theme),
      window.api.settings.set('isSetupComplete', 'true'),
    ])
    if (adminPin.length >= 4) {
      await window.api.auth.createUser({ name: lang === 'fa' ? 'مدیر' : 'Admin', pinCode: adminPin, role: 'admin' })
    }
    useSettingsStore.getState().setLanguage(lang)
    useSettingsStore.getState().setTheme(theme)
    setSubmitting(false)
    onComplete()
  }

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>, index: number, val: string, setVal: (v: string) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    const digit = e.target.value.replace(/\D/g, '')
    if (digit) {
      const arr = val.split('')
      arr[index] = digit
      const newVal = arr.join('').slice(0, 4)
      setVal(newVal)
      if (index < 3) refs.current[index + 1]?.focus()
    }
  }

  const bg = isDark ? '#0d1c2e' : '#f8f9ff'
  const brandBg = isDark ? 'rgba(0, 97, 148, 0.08)' : colors.surfaceContainerLow
  const cardBg = isDark ? 'rgba(35, 49, 68, 0.6)' : '#ffffff'
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #bfc7d2'
  const titleColor = isDark ? '#fdfcff' : colors.onSurface
  const subtitleColor = isDark ? '#d5e3fc' : colors.onSurfaceVariant
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : '#ffffff'
  const inputBorder = isDark ? '1px solid rgba(191,199,210,0.2)' : '1px solid #bfc7d2'
  const inputColor = isDark ? '#fdfcff' : colors.onSurface
  const pinBg = isDark ? 'rgba(204,219,243,0.08)' : colors.surfaceContainerLow
  const pinBorder = isDark ? '2px solid rgba(191,199,210,0.2)' : '2px solid #bfc7d2'

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 overflow-hidden" style={{ background: bg, direction: 'rtl' }}>
      <div className="w-full max-w-5xl rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row-reverse" style={{ background: cardBg, border: cardBorder, backdropFilter: isDark ? 'blur(12px)' : undefined }}>

        {/* Brand Panel (Right in RTL) */}
        <div className="md:w-1/2 flex flex-col items-center justify-center text-center relative overflow-hidden p-8" style={{ background: brandBg }}>
          <div className="z-10 flex flex-col items-center gap-6">
            <LogoIcon size={128} />
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.primary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {ui.app.title}
            </h1>
            <p className="text-lg max-w-sm" style={{ color: subtitleColor, fontFamily: "'Noto Sans', sans-serif" }}>
              {lang === 'fa' ? 'نرم‌افزار جامع مالی و حسابداری برای مدیریت هوشمند کسب‌وکارهای مدرن.' : 'Comprehensive financial and accounting software for smart business management.'}
            </p>
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full" style={{ background: '#007bb9' }} />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full" style={{ background: '#86f2e4' }} />
          </div>
        </div>

        {/* Form Panel (Left in RTL) */}
        <div className="md:w-1/2 p-8 md:p-16 flex flex-col justify-center overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-1" style={{ color: titleColor, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {lang === 'fa' ? 'راه‌اندازی فروشگاه' : 'Store Setup'}
            </h2>
            <p className="text-sm" style={{ color: subtitleColor }}>
              {lang === 'fa' ? 'اطلاعات پایه کسب‌وکار خود را برای شروع ثبت کنید.' : 'Enter your basic business details to get started.'}
            </p>
          </div>

          {/* Language & Theme Toggles */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: subtitleColor }}>{ui.setup.selectLanguage}</label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: inputBorder }}>
                <button onClick={() => switchLang('fa')} className="flex-1 py-1.5 text-xs font-bold transition-all"
                  style={{ background: lang === 'fa' ? colors.primary : 'transparent', color: lang === 'fa' ? '#fff' : subtitleColor }}>
                  فارسی
                </button>
                <button onClick={() => switchLang('en')} className="flex-1 py-1.5 text-xs font-bold transition-all"
                  style={{ background: lang === 'en' ? colors.primary : 'transparent', color: lang === 'en' ? '#fff' : subtitleColor }}>
                  English
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: subtitleColor }}>{ui.setup.selectTheme}</label>
              <div className="flex rounded-lg overflow-hidden" style={{ border: inputBorder }}>
                <button onClick={() => setTheme('light')} className="flex-1 py-1.5 text-xs font-bold transition-all"
                  style={{ background: !isDark ? colors.primary : 'transparent', color: !isDark ? '#fff' : subtitleColor }}>
                  {lang === 'fa' ? 'روشن' : 'Light'}
                </button>
                <button onClick={() => setTheme('dark')} className="flex-1 py-1.5 text-xs font-bold transition-all"
                  style={{ background: isDark ? colors.primary : 'transparent', color: isDark ? '#fff' : subtitleColor }}>
                  {lang === 'fa' ? 'تاریک' : 'Dark'}
                </button>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
            {/* Shop Name */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: subtitleColor }}>
                {lang === 'fa' ? 'نام فروشگاه یا واحد تجاری' : 'Store or business name'}
              </label>
              <div className="relative">
                <StoreIcon color={colors.outline} />
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full py-2.5 pr-10 rounded-lg text-sm outline-none transition-colors"
                  style={{ background: inputBg, border: inputBorder, color: inputColor, fontFamily: "'Noto Sans', sans-serif" }}
                  placeholder={lang === 'fa' ? 'مثال: فروشگاه تراز' : 'e.g. My Store'}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><StoreIcon color={colors.outline} /></div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: subtitleColor }}>{ui.setup.shopPhone}</label>
              <div className="relative">
                <input
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full py-2.5 pr-10 pl-10 rounded-lg text-sm outline-none transition-colors text-left"
                  style={{ background: inputBg, border: inputBorder, color: inputColor, fontFamily: "'Noto Sans', sans-serif" }}
                  dir="ltr"
                  placeholder="0912 000 0000"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><CallIcon color={colors.outline} /></div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: subtitleColor }}>{ui.setup.shopAddress}</label>
              <div className="relative">
                <textarea
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full py-2.5 pr-10 rounded-lg text-sm outline-none transition-colors resize-none"
                  style={{ background: inputBg, border: inputBorder, color: inputColor, minHeight: 56, fontFamily: "'Noto Sans', sans-serif" }}
                  placeholder={lang === 'fa' ? 'خیابان، کوچه، پلاک...' : 'Street, alley, number...'}
                  rows={2}
                />
                <div className="absolute right-3 top-3 pointer-events-none"><LocationIcon color={colors.outline} /></div>
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: subtitleColor }}>
                {lang === 'fa' ? 'رمز عبور ۴ رقمی (PIN)' : '4-digit PIN'}
              </label>
              <div className="flex flex-row-reverse gap-3 justify-start">
                {Array.from({ length: 4 }).map((_, i) => (
                  <input
                    key={`pin-${i}`}
                    ref={(el) => { pinRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={adminPin[i] || ''}
                    onChange={(e) => handlePinInput(e, i, adminPin, handlePinChange, pinRefs)}
                    onKeyDown={(e) => handlePinKeyDown(e, i, pinRefs)}
                    className="w-14 h-16 text-center text-2xl font-bold rounded-xl outline-none transition-all"
                    style={{
                      background: pinBg,
                      border: pinBorder,
                      color: colors.primary,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,97,148,0.1)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(191,199,210,0.2)' : '#bfc7d2'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                ))}
              </div>
              <p className="text-xs mt-1.5" style={{ color: subtitleColor, opacity: 0.7 }}>
                {lang === 'fa' ? 'این رمز برای ورود سریع به اپلیکیشن استفاده خواهد شد.' : 'This PIN is used for quick app login.'}
              </p>
            </div>

            {/* PIN Confirm */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: subtitleColor }}>
                {lang === 'fa' ? 'تأیید رمز عبور' : 'Confirm PIN'}
              </label>
              <div className="flex flex-row-reverse gap-3 justify-start">
                {Array.from({ length: 4 }).map((_, i) => (
                  <input
                    key={`pinconf-${i}`}
                    ref={(el) => { pinConfirmRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={adminPinConfirm[i] || ''}
                    onChange={(e) => handlePinInput(e, i, adminPinConfirm, handlePinConfirmChange, pinConfirmRefs)}
                    onKeyDown={(e) => handlePinKeyDown(e, i, pinConfirmRefs)}
                    className="w-14 h-16 text-center text-2xl font-bold rounded-xl outline-none transition-all"
                    style={{
                      background: pinBg,
                      border: adminPinConfirm[i] ? `2px solid ${colors.primary}` : pinBorder,
                      color: colors.primary,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,97,148,0.1)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = adminPinConfirm[i] ? colors.primary : (isDark ? 'rgba(191,199,210,0.2)' : '#bfc7d2'); e.currentTarget.style.boxShadow = 'none' }}
                  />
                ))}
              </div>
              {pinError && <p className="text-xs mt-1.5" style={{ color: '#ba1a1a' }}>{pinError}</p>}
              {adminPin && adminPinConfirm && adminPin === adminPinConfirm && adminPin.length >= 4 && (
                <p className="text-xs mt-1.5" style={{ color: '#22c55e' }}>
                  {lang === 'fa' ? 'رمزها مطابقت دارند' : 'PINs match'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!shopName.trim() || adminPin.length < 4 || submitting}
              className="w-full py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 mt-4"
              style={{ background: colors.primary, color: colors.onPrimary, fontFamily: "'IBM Plex Sans', sans-serif", boxShadow: '0 4px 16px rgba(0,97,148,0.3)' }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {lang === 'fa' ? 'ایجاد حساب کاربری' : 'Create Account'}
                  <ArrowIcon color={colors.onPrimary} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 text-center" style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#bfc7d2'}` }}>
            <p className="text-xs" style={{ color: subtitleColor }}>
              {lang === 'fa' ? 'قبلاً ثبت‌نام کرده‌اید؟ ' : 'Already registered? '}
              <button onClick={onComplete} className="font-bold hover:underline" style={{ color: colors.primary }}>
                {lang === 'fa' ? 'وارد شوید' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
