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
  surface: '#f8f9ff',
  inverseSurface: '#233144',
  inverseOnSurface: '#eaf1ff',
  onSurface: '#0d1c2e',
  onSurfaceVariant: '#3f4850',
  surfaceContainerLow: '#eff4ff',
  surfaceDim: '#ccdbf3',
  outline: '#707881',
  outlineVariant: '#bfc7d2',
  glassDark: 'rgba(35, 49, 68, 0.7)',
}

function LogoIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="12" fill={colors.primary} />
      <path d="M14 18l10-8 10 8v14a2 2 0 01-2 2H16a2 2 0 01-2-2V18z" stroke="white" strokeWidth="2" fill="none" />
      <polyline points="20 34 20 26 28 26 28 34" stroke="white" strokeWidth="2" fill="none" />
    </svg>
  )
}

function StoreIcon({ color, className }: { color: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function CallIcon({ color, className }: { color: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
}

function SmartphoneIcon({ color, className }: { color: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12" y2="18" />
    </svg>
  )
}

function HelpIcon({ color, className }: { color: string; className?: string }) {
  return (
    <svg className={className ?? 'w-5 h-5'} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </svg>
  )
}

function ArrowLeftRotateIcon({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5 rotate-180" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

type PinDigitProps = {
  value: string
  focused: boolean
  filled: boolean
  onChange: (val: string) => void
  onBackspace: () => void
  inputRef: React.Ref<HTMLInputElement>
  size?: 'lg' | 'sm'
  isDark: boolean
}

function PinDigitInput({ value, focused, filled, onChange, onBackspace, inputRef, size = 'sm', isDark }: PinDigitProps) {
  const isLarge = size === 'lg'
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => {
        const val = e.target.value.replace(/\D/g, '')
        if (val) onChange(val)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Backspace' && !value) onBackspace()
      }}
      className={`${isLarge ? 'w-16 h-20 text-[32px]' : 'w-14 h-16 text-2xl'} rounded-xl border-2 text-center font-bold outline-none transition-all duration-200`}
      style={{
        background: isDark ? 'rgba(204, 219, 243, 0.08)' : colors.surfaceContainerLow,
        borderColor: filled ? colors.primary : (isDark ? 'rgba(191, 199, 210, 0.2)' : colors.outlineVariant),
        color: colors.primary,
        boxShadow: focused ? '0 0 0 3px rgba(0, 97, 148, 0.2)' : 'none',
      }}
    />
  )
}

function PinInputRow({
  pin,
  setPin,
  pinRefs,
  size = 'sm',
  isDark,
}: {
  pin: string
  setPin: (v: string) => void
  pinRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  size?: 'lg' | 'sm'
  isDark: boolean
}) {
  const digits = pin.split('')
  return (
    <div className="flex flex-row-reverse gap-3 justify-center">
      {Array.from({ length: 4 }).map((_, i) => (
        <PinDigitInput
          key={i}
          inputRef={(el: HTMLInputElement | null) => { pinRefs.current[i] = el }}
          value={digits[i] || ''}
          focused={false}
          filled={!!digits[i]}
          isDark={isDark}
          size={size}
          onChange={(val) => {
            const arr = pin.split('')
            arr[i] = val
            const newPin = arr.join('').slice(0, 4)
            setPin(newPin)
            if (i < 3 && val) {
              setTimeout(() => pinRefs.current[i + 1]?.focus(), 0)
            }
          }}
          onBackspace={() => {
            if (i > 0) {
              const arr = pin.split('')
              arr[i - 1] = ''
              setPin(arr.join(''))
              setTimeout(() => pinRefs.current[i - 1]?.focus(), 0)
            }
          }}
        />
      ))}
    </div>
  )
}

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [lang, setLang] = useState<'fa' | 'en'>('fa')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopPhone2, setShopPhone2] = useState('')
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
      window.api.settings.set('storeAddress', ''),
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

  const bg = isDark ? colors.onSurface : colors.surface
  const headerBg = isDark ? colors.glassDark : '#ffffff'
  const headerBorder = isDark ? `1px solid rgba(191, 199, 210, 0.2)` : `1px solid ${colors.outlineVariant}`
  const headerText = isDark ? colors.inversePrimary : colors.primary

  const cardBg = isDark ? colors.glassDark : 'rgba(255, 255, 255, 0.9)'
  const cardBorder = isDark ? `1px solid rgba(191, 199, 210, 0.2)` : `1px solid ${colors.outlineVariant}`

  const titleText = isDark ? colors.inverseOnSurface : colors.onSurface
  const subtitleText = isDark ? colors.outline : colors.onSurfaceVariant
  const labelText = isDark ? colors.inverseOnSurface : colors.onSurface
  const outlineText = isDark ? colors.outline : colors.onSurfaceVariant

  const inputBg = isDark ? 'rgba(204, 219, 243, 0.06)' : colors.surfaceContainerLow
  const inputBorder = isDark ? `2px solid ${colors.outlineVariant}` : `2px solid ${colors.outlineVariant}`
  const inputColor = isDark ? colors.inverseOnSurface : colors.onSurface

  const toggleBorder = isDark ? `1px solid rgba(191, 199, 210, 0.2)` : `1px solid ${colors.outlineVariant}`
  const toggleActiveBg = colors.primary
  const toggleInactiveBg = 'transparent'
  const toggleActiveColor = colors.onPrimary
  const toggleInactiveColor = isDark ? colors.outline : colors.onSurfaceVariant

  const footerBg = isDark ? colors.inverseSurface : '#ffffff'
  const footerBorder = isDark ? 'none' : `1px solid ${colors.outlineVariant}`
  const footerText = isDark ? colors.outline : colors.onSurfaceVariant

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ background: bg, direction: 'rtl' }}>
      {/* Top Header Bar */}
      <header className="flex flex-row-reverse items-center justify-between px-32 py-4 flex-shrink-0" style={{ background: headerBg, borderBottom: headerBorder, backdropFilter: isDark ? 'blur(12px)' : undefined }}>
        <div className="flex items-center gap-3">
          <LogoIcon size={36} />
          <span className="text-xl font-bold" style={{ color: headerText }}>{ui.app.title}</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
          <HelpIcon color={headerText} className="w-5 h-5" />
          <span className="text-sm" style={{ color: headerText }}>{ui.nav.help}</span>
        </div>
      </header>

      {/* Mobile Brand Header */}
      <div className="md:hidden text-center py-4 flex-shrink-0">
        <div className="mx-auto mb-2">
          <LogoIcon size={48} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: headerText }}>
          {ui.app.title}
        </h1>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
        <div
          className="w-full max-w-[560px] rounded-xl p-12"
          style={{
            background: cardBg,
            backdropFilter: 'blur(12px)',
            border: cardBorder,
          }}
        >
          {/* Title */}
          <h1 className="text-center text-[32px] font-bold mb-3" style={{ color: titleText }}>
            {lang === 'fa' ? 'تنظیمات اولیه فروشگاه' : 'Initial Store Setup'}
          </h1>
          <p className="text-center text-sm mb-8" style={{ color: subtitleText }}>
            {lang === 'fa' ? 'لطفاً مشخصات اصلی کسب\u200Cوکار خود را برای شروع به کار در سیستم وارد کنید.' : 'Enter your business details to get started with the system.'}
          </p>

          {/* Language & Theme Toggles */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: outlineText }}>{ui.setup.selectLanguage}</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: toggleBorder }}>
                <button
                  onClick={() => switchLang('fa')}
                  className="flex-1 py-2 text-sm font-bold transition-all"
                  style={{
                    background: lang === 'fa' ? toggleActiveBg : toggleInactiveBg,
                    color: lang === 'fa' ? toggleActiveColor : toggleInactiveColor,
                  }}
                >
                  فارسی
                </button>
                <button
                  onClick={() => switchLang('en')}
                  className="flex-1 py-2 text-sm font-bold transition-all"
                  style={{
                    background: lang === 'en' ? toggleActiveBg : toggleInactiveBg,
                    color: lang === 'en' ? toggleActiveColor : toggleInactiveColor,
                  }}
                >
                  English
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: outlineText }}>{ui.setup.selectTheme}</label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: toggleBorder }}>
                <button
                  onClick={() => setTheme('dark')}
                  className="flex-1 py-2 text-sm font-bold transition-all"
                  style={{
                    background: isDark ? toggleActiveBg : toggleInactiveBg,
                    color: isDark ? toggleActiveColor : toggleInactiveColor,
                  }}
                >
                  {lang === 'fa' ? 'تاریک' : 'Dark'}
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className="flex-1 py-2 text-sm font-bold transition-all"
                  style={{
                    background: !isDark ? toggleActiveBg : toggleInactiveBg,
                    color: !isDark ? toggleActiveColor : toggleInactiveColor,
                  }}
                >
                  {lang === 'fa' ? 'روشن' : 'Light'}
                </button>
              </div>
            </div>
          </div>

          {/* Shop Name */}
          <div className="mb-5">
            <label className="text-sm font-semibold mb-2 block" style={{ color: labelText }}>
              {ui.setup.shopName}
            </label>
            <div className="relative">
              <StoreIcon color={colors.primary} className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full h-14 bg-transparent outline-none text-base font-medium pr-4 pl-10"
                style={{
                  color: inputColor,
                  borderBottom: inputBorder,
                  background: inputBg,
                  borderRadius: '0 0 8px 8px',
                }}
                placeholder={lang === 'fa' ? 'نام فروشگاه' : 'Store name'}
              />
            </div>
          </div>

          {/* Two Phone Fields Side by Side */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: labelText }}>
                {lang === 'fa' ? 'شماره تماس ثابت' : 'Landline'}
              </label>
              <div className="relative">
                <CallIcon color={colors.primary} className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full h-14 bg-transparent outline-none text-base font-medium pr-4 pl-10"
                  style={{
                    color: inputColor,
                    borderBottom: inputBorder,
                    background: inputBg,
                    borderRadius: '0 0 8px 8px',
                  }}
                  dir="ltr"
                  placeholder={lang === 'fa' ? 'شماره ثابت' : 'Landline'}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold mb-2 block" style={{ color: labelText }}>
                {lang === 'fa' ? 'شماره همراه' : 'Mobile'}
              </label>
              <div className="relative">
                <SmartphoneIcon color={colors.primary} className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={shopPhone2}
                  onChange={(e) => setShopPhone2(e.target.value.replace(/[^\d]/g, ''))}
                  className="w-full h-14 bg-transparent outline-none text-base font-medium pr-4 pl-10"
                  style={{
                    color: inputColor,
                    borderBottom: inputBorder,
                    background: inputBg,
                    borderRadius: '0 0 8px 8px',
                  }}
                  dir="ltr"
                  placeholder={lang === 'fa' ? 'شماره همراه' : 'Mobile'}
                />
              </div>
            </div>
          </div>

          {/* PIN */}
          <div className="mb-5 text-center">
            <label className="text-sm font-semibold mb-3 block" style={{ color: labelText }}>
              {lang === 'fa' ? 'تعیین رمز عبور سریع (۴ رقمی)' : 'Set Quick PIN (4 digits)'}
            </label>
            <PinInputRow pin={adminPin} setPin={handlePinChange} pinRefs={pinRefs} size="lg" isDark={isDark} />
            <p className="text-xs mt-2" style={{ color: outlineText }}>
              {lang === 'fa' ? 'این کد برای ورود سریع و تایید تراکنش\u200Cها استفاده خواهد شد.' : 'This code is used for quick login and transaction confirmation.'}
            </p>
          </div>

          {/* PIN Confirm */}
          <div className="mb-6 text-center">
            <label className="text-sm font-semibold mb-3 block" style={{ color: labelText }}>
              {lang === 'fa' ? 'تأیید رمز عبور' : 'Confirm PIN'}
            </label>
            <PinInputRow pin={adminPinConfirm} setPin={handlePinConfirmChange} pinRefs={pinConfirmRefs} size="lg" isDark={isDark} />
            {pinError && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>{pinError}</p>}
            {adminPin && adminPinConfirm && adminPin === adminPinConfirm && adminPin.length >= 4 && (
              <p className="text-xs mt-2" style={{ color: '#22c55e' }}>
                {lang === 'fa' ? 'رمزها مطابقت دارند' : 'PINs match'}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!shopName.trim() || adminPin.length < 4 || submitting}
            className="w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            style={{
              background: colors.primary,
              color: colors.onPrimary,
            }}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {lang === 'fa' ? 'ثبت و ورود به داشبورد' : 'Save & Enter Dashboard'}
                <ArrowLeftRotateIcon color={colors.onPrimary} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer Bar */}
      <footer
        className="flex flex-row-reverse items-center justify-between px-32 py-3 flex-shrink-0"
        style={{ background: footerBg, borderTop: footerBorder }}
      >
        <span className="text-xs" style={{ color: footerText }}>
          {lang === 'fa' ? '© ۲۰۲۵ حسابداری. تمامی حقوق محفوظ است.' : '© 2025 Accounting. All rights reserved.'}
        </span>
        <div className="flex items-center gap-4">
          <button className="text-xs hover:underline" style={{ color: isDark ? colors.inversePrimary : colors.primary }}>
            {lang === 'fa' ? 'قوانین و مقررات' : 'Terms'}
          </button>
          <button className="text-xs hover:underline" style={{ color: isDark ? colors.inversePrimary : colors.primary }}>
            {lang === 'fa' ? 'تماس با پشتیبانی' : 'Support'}
          </button>
        </div>
      </footer>
    </div>
  )
}
