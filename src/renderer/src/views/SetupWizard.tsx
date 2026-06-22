import { useState, useRef, useCallback } from 'react'
import { t, setLanguage } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'

interface BackupPreview {
  dbPath: string
  meta: any
  tables: Record<string, number>
  versionCheck: { compatible: boolean; backupVersion: string; currentVersion: string; message: string }
}

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
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [lang, setLang] = useState<'fa' | 'en'>('fa')
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [businessType, setBusinessType] = useState<string>('online-store')
  const [customBusinessName, setCustomBusinessName] = useState('')
  const [enableTax, setEnableTax] = useState(true)
  const [adminPin, setAdminPin] = useState('')
  const [adminPinConfirm, setAdminPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null)
  const [restoring, setRestoring] = useState(false)

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

  const handleNext = () => {
    if (!shopName.trim()) return
    setStep(2)
  }

  const applyBusinessDefaults = (type: string) => {
    const defaults: Record<string, { tax: boolean; currency: string }> = {
      'online-store': { tax: true, currency: 'تومان' },
      'supermarket': { tax: true, currency: 'تومان' },
      'clothing': { tax: true, currency: 'تومان' },
      'electronics': { tax: true, currency: 'تومان' },
      'bookstore': { tax: true, currency: 'تومان' },
      'beauty': { tax: true, currency: 'تومان' },
      'grocery': { tax: true, currency: 'تومان' },
      'industrial': { tax: true, currency: 'تومان' },
      'services': { tax: false, currency: 'تومان' },
      'wholesale': { tax: true, currency: 'تومان' },
      'restaurant': { tax: true, currency: 'تومان' },
      'jewelry': { tax: true, currency: 'تومان' },
      'other': { tax: true, currency: 'تومان' },
    }
    const d = defaults[type] || defaults['other']
    setEnableTax(d.tax)
  }

  const handleSubmit = async () => {
    if (adminPin.length < 4) {
      setPinError(lang === 'fa' ? 'رمز باید حداقل ۴ رقم باشد' : 'PIN must be at least 4 digits')
      return
    }
    if (adminPin !== adminPinConfirm) {
      setPinError(lang === 'fa' ? 'رمزها مطابقت ندارند' : 'PINs do not match')
      return
    }
    setSubmitting(true)
    const finalBusinessType = businessType === 'other' ? (customBusinessName || 'سایر') : businessType
    await Promise.all([
      window.api.settings.set('storeName', shopName || (lang === 'fa' ? 'فروشگاه من' : 'My Store')),
      window.api.settings.set('storeAddress', shopAddress),
      window.api.settings.set('storePhone', shopPhone),
      window.api.settings.set('businessType', finalBusinessType),
      window.api.settings.set('autoRounding', '500'),
      window.api.settings.set('taxEnabled', String(enableTax)),
      window.api.settings.set('language', lang),
      window.api.settings.set('theme', theme),
      window.api.settings.set('isSetupComplete', 'true'),
    ])
    if (enableTax) {
      await window.api.settings.set('taxRate', '9')
    }
    if (adminPin.length >= 4) {
      await window.api.auth.createUser({ name: lang === 'fa' ? 'مدیر' : 'Admin', pinCode: adminPin, role: 'admin' })
    }
    useSettingsStore.getState().setLanguage(lang)
    useSettingsStore.getState().setTheme(theme)
    setSubmitting(false)
    onComplete()
  }

  const handleRestoreOld = async () => {
    const dialogRes = await window.api.dialog.openBackup()
    if (!dialogRes.success || !dialogRes.data) return
    const dbPath = dialogRes.data
    const [detailsRes, versionRes] = await Promise.all([
      window.api.backup.getDetails(dbPath),
      window.api.backup.checkVersion(dbPath),
    ])
    if (!detailsRes.success) { alert(`خطا در خواندن اطلاعات پشتیبان: ${detailsRes.error}`); return }
    if (!versionRes.success) { alert(`خطا در بررسی نسخه: ${versionRes.error}`); return }
    setBackupPreview({
      dbPath,
      meta: detailsRes.data?.meta,
      tables: detailsRes.data?.tables || {},
      versionCheck: versionRes.data,
    })
  }

  const handleConfirmRestore = async () => {
    if (!backupPreview) return
    const ok = confirm(lang === 'fa'
      ? 'آیا از بازیابی اطلاعات اطمینان دارید؟ تمام اطلاعات فعلی حذف و با اطلاعات پشتیبان جایگزین می‌شود.'
      : 'Are you sure you want to restore? All current data will be replaced.')
    if (!ok) return
    setRestoring(true)
    const r = await window.api.backup.restore(backupPreview.dbPath)
    setRestoring(false)
    if (r.success) {
      setBackupPreview(null)
      onComplete()
    } else {
      alert(`خطا در بازیابی: ${r.error}`)
    }
  }

  const handlePinKeyDown = (e: React.KeyboardEvent, index: number, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !(e.target as HTMLInputElement).value && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePinInput = (e: React.ChangeEvent<HTMLInputElement>, index: number, val: string, setVal: (v: string) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    const digit = e.target.value.replace(/\D/g, '')
    
    // Allow clearing the input
    if (e.target.value === '') {
      const arr = val.split('')
      arr[index] = ''
      const newVal = arr.join('')
      setVal(newVal)
      if (index > 0) refs.current[index - 1]?.focus()
      return
    }
    
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
    <div className="h-screen w-screen flex items-center justify-center p-4 overflow-y-auto" style={{ background: bg, direction: 'rtl' }}>
      <div className="w-full max-w-5xl rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row-reverse min-h-0" style={{ background: cardBg, border: cardBorder, backdropFilter: isDark ? 'blur(12px)' : undefined }}>

        {/* Brand Panel - Always visible */}
        <div className="md:w-1/2 flex flex-col items-center justify-center text-center relative overflow-hidden p-8" style={{ background: brandBg }}>
          <div className="z-10 flex flex-col items-center gap-6">
            <LogoIcon size={128} />
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: colors.primary, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {ui.app.title}
            </h1>
            <p className="text-lg max-w-sm" style={{ color: subtitleColor, fontFamily: "'Noto Sans', sans-serif" }}>
              {lang === 'fa' ? 'حسابداری دانیال — نرم‌افزار جامع مالی و حسابداری برای مدیریت هوشمند کسب‌وکارهای مدرن.' : 'HesabDari Danial — Comprehensive financial and accounting software for smart business management.'}
            </p>
            
            {/* Step Indicator - with labels */}
            <div className="flex flex-col items-center gap-3 mt-4 w-full">
              <div className="flex gap-3 w-full max-w-[200px]">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'opacity-100' : 'opacity-30'}`}
                    style={{ background: step === 1 ? colors.primary : colors.outline }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: step === 1 ? colors.primary : subtitleColor, opacity: step === 1 ? 1 : 0.5 }}>
                    {lang === 'fa' ? 'اطلاعات' : 'Info'}
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={`w-full h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'opacity-100' : 'opacity-30'}`}
                    style={{ background: step === 2 ? colors.primary : colors.outline }}
                  />
                  <span className="text-[10px] font-medium" style={{ color: step === 2 ? colors.primary : subtitleColor, opacity: step === 2 ? 1 : 0.5 }}>
                    {lang === 'fa' ? 'رمز عبور' : 'PIN'}
                  </span>
                </div>
              </div>
              <span className="text-xs" style={{ color: subtitleColor, opacity: 0.5 }}>
                {step === 1 
                  ? (lang === 'fa' ? 'مرحله ۱ از ۲' : 'Step 1 of 2')
                  : (lang === 'fa' ? 'مرحله ۲ از ۲' : 'Step 2 of 2')
                }
              </span>
            </div>
          </div>
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute -right-24 -top-24 w-64 h-64 rounded-full" style={{ background: '#007bb9' }} />
            <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full" style={{ background: '#86f2e4' }} />
          </div>
        </div>

        {/* Form Panel */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[85vh]">
          {step === 1 ? (
            // Step 1: Store Information
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-1" style={{ color: titleColor, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                  {lang === 'fa' ? 'اطلاعات فروشگاه' : 'Store Information'}
                </h2>
                <p className="text-sm" style={{ color: subtitleColor, opacity: 0.7 }}>
                  {lang === 'fa' ? 'اطلاعات فروشگاه خود را وارد کنید' : 'Enter your store information'}
                </p>
              </div>

              {/* Language & Theme Toggles */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: subtitleColor }}>{ui.setup.selectLanguage}</label>
                  <div className="flex rounded-lg overflow-hidden" style={{ border: inputBorder }}>
                    <button onClick={() => switchLang('fa')} className="flex-1 py-2 text-xs font-bold transition-all"
                      style={{ background: lang === 'fa' ? colors.primary : 'transparent', color: lang === 'fa' ? '#fff' : subtitleColor }}>
                      فارسی
                    </button>
                    <button onClick={() => switchLang('en')} className="flex-1 py-2 text-xs font-bold transition-all"
                      style={{ background: lang === 'en' ? colors.primary : 'transparent', color: lang === 'en' ? '#fff' : subtitleColor }}>
                      English
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: subtitleColor }}>{ui.setup.selectTheme}</label>
                  <div className="flex rounded-lg overflow-hidden" style={{ border: inputBorder }}>
                    <button onClick={() => setTheme('light')} className="flex-1 py-2 text-xs font-bold transition-all"
                      style={{ background: !isDark ? colors.primary : 'transparent', color: !isDark ? '#fff' : subtitleColor }}>
                      {lang === 'fa' ? 'روشن' : 'Light'}
                    </button>
                    <button onClick={() => setTheme('dark')} className="flex-1 py-2 text-xs font-bold transition-all"
                      style={{ background: isDark ? colors.primary : 'transparent', color: isDark ? '#fff' : subtitleColor }}>
                      {lang === 'fa' ? 'تاریک' : 'Dark'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {/* Shop Name */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: subtitleColor }}>
                    {lang === 'fa' ? 'نام فروشگاه یا واحد تجاری' : 'Store or business name'}
                  </label>
                  <div className="relative">
                    <input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full py-3 pr-10 rounded-lg text-sm outline-none transition-all focus:ring-2"
                      style={{ 
                        background: inputBg, 
                        border: inputBorder, 
                        color: inputColor, 
                        fontFamily: "'Noto Sans', sans-serif",
                        paddingRight: '2.5rem'
                      }}
                      placeholder={lang === 'fa' ? 'مثال: فروشگاه تراز' : 'e.g. My Store'}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <StoreIcon color={colors.outline} />
                    </div>
                  </div>
                </div>

                {/* Business Type */}
                <div className="mb-4">
                  <label className="text-xs font-medium mb-2 block" style={{ color: subtitleColor }}>نوع کسب‌وکار خود را انتخاب کنید</label>
                  <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {([
                      { key: 'online-store', label: 'فروشگاه اینترنتی' },
                      { key: 'supermarket', label: 'سوپرمارکت' },
                      { key: 'clothing', label: 'لباس‌فروشی' },
                      { key: 'electronics', label: 'لوازم الکترونیک' },
                      { key: 'bookstore', label: 'کتاب‌فروشی' },
                      { key: 'beauty', label: 'آرایشی و بهداشتی' },
                      { key: 'grocery', label: 'مواد غذایی' },
                      { key: 'industrial', label: 'فروشگاه صنعتی' },
                      { key: 'services', label: 'خدمات' },
                      { key: 'wholesale', label: 'عمده‌فروشی' },
                      { key: 'restaurant', label: 'رستوران و کافی‌شاپ' },
                      { key: 'jewelry', label: 'طلا و جواهر' },
                      { key: 'other', label: 'سایر (دستی)' },
                    ]).map(b => (
                      <button key={b.key} onClick={() => { setBusinessType(b.key); applyBusinessDefaults(b.key) }}
                        className="py-2.5 rounded-lg text-xs font-bold transition-all"
                        style={{ backgroundColor: businessType === b.key ? colors.primary : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'), color: businessType === b.key ? '#fff' : subtitleColor, border: businessType === b.key ? 'none' : `1px solid ${cardBorder}` }}>
                        {b.label}
                      </button>
                    ))}
                  </div>
                  {businessType === 'other' && (
                    <input value={customBusinessName} onChange={e => setCustomBusinessName(e.target.value)} placeholder="نام نوع کسب‌وکار خود را وارد کنید..."
                      className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm outline-none transition-all"
                      style={{ background: inputBg, border: inputBorder, color: inputColor }} autoFocus />
                  )}
                </div>

                {/* Tax Toggle */}
                <div className="mb-4">
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: titleColor }}>مالیات بر ارزش افزوده</div>
                      <div className="text-xs" style={{ color: subtitleColor }}>در صورت نیاز می‌توانید بعداً در تنظیمات تغییر دهید</div>
                    </div>
                    <button onClick={() => setEnableTax(!enableTax)} className="relative w-10 h-5 rounded-full transition-all" style={{ backgroundColor: enableTax ? colors.primary : (isDark ? '#475569' : '#d1d5db') }}>
                      <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: enableTax ? '20px' : '2px' }} />
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: subtitleColor }}>{ui.setup.shopPhone}</label>
                  <div className="relative">
                    <input
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value.replace(/[^\d]/g, ''))}
                      className="w-full py-3 px-10 rounded-lg text-sm outline-none transition-all focus:ring-2 text-center"
                      style={{ 
                        background: inputBg, 
                        border: inputBorder, 
                        color: inputColor, 
                        fontFamily: "'Noto Sans', sans-serif",
                      }}
                      dir="ltr"
                      placeholder="00 000 0000"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <CallIcon color={colors.outline} />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: subtitleColor }}>{ui.setup.shopAddress}</label>
                  <div className="relative">
                    <textarea
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full py-3 pr-10 rounded-lg text-sm outline-none transition-all resize-none focus:ring-2"
                      style={{ 
                        background: inputBg, 
                        border: inputBorder, 
                        color: inputColor, 
                        minHeight: 64, 
                        fontFamily: "'Noto Sans', sans-serif",
                        paddingRight: '2.5rem'
                      }}
                      placeholder={lang === 'fa' ? 'خیابان، کوچه، پلاک...' : 'Street, alley, number...'}
                      rows={2}
                    />
                    <div className="absolute right-3 top-3 pointer-events-none">
                      <LocationIcon color={colors.outline} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Restore Old Data Option */}
              <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
                <p className="text-sm font-bold mb-2" style={{ color: titleColor }}>
                  {lang === 'fa' ? 'آیا اطلاعات قبلی دارید؟' : 'Have previous data?'}
                </p>
                <p className="text-xs mb-3" style={{ color: subtitleColor }}>
                  {lang === 'fa' ? 'اگر قبلاً از این نرم‌افزار استفاده می‌کردید و پشتیبان دارید، می‌توانید فایل پشتیبان را بارگذاری کنید.' : 'If you used this app before and have a backup, you can load it here.'}
                </p>
                {!backupPreview ? (
                  <button onClick={handleRestoreOld} className="text-xs px-4 py-2 rounded-lg font-bold transition-all" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: titleColor }}>
                    {lang === 'fa' ? 'بارگذاری فایل پشتیبان' : 'Load Backup File'}
                  </button>
                ) : (
                  <div className="rounded-xl p-3 text-xs space-y-2" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                    <div className="font-bold" style={{ color: titleColor }}>
                      {lang === 'fa' ? 'اطلاعات پشتیبان:' : 'Backup Info:'}
                    </div>
                    {backupPreview.meta && (
                      <>
                        <div style={{ color: subtitleColor }}>
                          {lang === 'fa' ? 'نسخه:' : 'Version:'} {backupPreview.meta.appVersion || '?'}
                        </div>
                        <div style={{ color: subtitleColor }}>
                          {lang === 'fa' ? 'تاریخ:' : 'Date:'} {new Date(backupPreview.meta.timestamp).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US')}
                        </div>
                      </>
                    )}
                    <div style={{ color: subtitleColor }}>
                      {lang === 'fa' ? 'جداول:' : 'Tables:'} {Object.keys(backupPreview.tables).length}
                    </div>
                    {backupPreview.versionCheck && !backupPreview.versionCheck.compatible && (
                      <div className="text-xs" style={{ color: '#ef4444' }}>
                        {lang === 'fa' ? 'اخطار: نسخه پشتیبان نامشخص است' : 'Warning: Backup version unknown'}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleConfirmRestore} disabled={restoring} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: '#22c55e', color: '#fff' }}>
                        {restoring ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (lang === 'fa' ? 'بازیابی' : 'Restore')}
                      </button>
                      <button onClick={() => setBackupPreview(null)} disabled={restoring} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: subtitleColor }}>
                        {lang === 'fa' ? 'لغو' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Next Button */}
              <button
                onClick={handleNext}
                disabled={!shopName.trim()}
                className="w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] mt-6"
                style={{ 
                  background: colors.primary, 
                  color: colors.onPrimary, 
                  fontFamily: "'IBM Plex Sans', sans-serif", 
                  boxShadow: '0 4px 16px rgba(0,97,148,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {lang === 'fa' ? 'مرحله بعد' : 'Next'}
                <ArrowIcon color={colors.onPrimary} />
              </button>
            </>
          ) : (
            // Step 2: PIN Setup
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                  <button 
                    onClick={() => setStep(1)}
                    className="p-1 rounded-lg transition-all hover:bg-black/5"
                    style={{ color: subtitleColor }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-semibold" style={{ color: titleColor, fontFamily: "'IBM Plex Sans', sans-serif" }}>
                    {lang === 'fa' ? 'تنظیم رمز عبور' : 'Set Password'}
                  </h2>
                </div>
                <p className="text-sm mr-8" style={{ color: subtitleColor, opacity: 0.7 }}>
                  {lang === 'fa' ? 'یک رمز ۴ رقمی برای ورود سریع انتخاب کنید' : 'Choose a 4-digit PIN for quick login'}
                </p>
              </div>

              <div className="space-y-6">
                {/* PIN */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: subtitleColor }}>
                    {lang === 'fa' ? 'رمز عبور ۴ رقمی (PIN)' : '4-digit PIN'}
                  </label>
                  <div className="flex flex-row-reverse gap-3 justify-center">
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
                        className="w-14 h-16 text-center text-2xl font-bold rounded-xl outline-none transition-all focus:ring-2"
                        style={{
                          background: pinBg,
                          border: pinBorder,
                          color: colors.primary,
                        }}
                        onFocus={(e) => { 
                          e.currentTarget.style.borderColor = colors.primary; 
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,97,148,0.15)' 
                        }}
                        onBlur={(e) => { 
                          e.currentTarget.style.borderColor = isDark ? 'rgba(191,199,210,0.2)' : '#bfc7d2'; 
                          e.currentTarget.style.boxShadow = 'none' 
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-2 text-center" style={{ color: subtitleColor, opacity: 0.7 }}>
                    {lang === 'fa' ? 'این رمز برای ورود سریع به اپلیکیشن استفاده خواهد شد.' : 'This PIN is used for quick app login.'}
                  </p>
                </div>

                {/* PIN Confirm */}
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: subtitleColor }}>
                    {lang === 'fa' ? 'تأیید رمز عبور' : 'Confirm PIN'}
                  </label>
                  <div className="flex flex-row-reverse gap-3 justify-center">
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
                        className="w-14 h-16 text-center text-2xl font-bold rounded-xl outline-none transition-all focus:ring-2"
                        style={{
                          background: pinBg,
                          border: adminPinConfirm[i] ? `2px solid ${colors.primary}` : pinBorder,
                          color: colors.primary,
                        }}
                        onFocus={(e) => { 
                          e.currentTarget.style.borderColor = colors.primary; 
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,97,148,0.15)' 
                        }}
                        onBlur={(e) => { 
                          e.currentTarget.style.borderColor = adminPinConfirm[i] ? colors.primary : (isDark ? 'rgba(191,199,210,0.2)' : '#bfc7d2'); 
                          e.currentTarget.style.boxShadow = 'none' 
                        }}
                      />
                    ))}
                  </div>
                  {pinError && (
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ba1a1a' }} />
                      <p className="text-xs" style={{ color: '#ba1a1a' }}>{pinError}</p>
                    </div>
                  )}
                  {adminPin && adminPinConfirm && adminPin === adminPinConfirm && adminPin.length >= 4 && (
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
                      <p className="text-xs" style={{ color: '#22c55e' }}>
                        {lang === 'fa' ? '✓ رمزها مطابقت دارند' : '✓ PINs match'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Account Button */}
              <button
                onClick={handleSubmit}
                disabled={adminPin.length < 4 || adminPin !== adminPinConfirm || submitting}
                className="w-full py-3.5 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] mt-6"
                style={{ 
                  background: colors.primary, 
                  color: colors.onPrimary, 
                  fontFamily: "'IBM Plex Sans', sans-serif", 
                  boxShadow: '0 4px 16px rgba(0,97,148,0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {lang === 'fa' ? 'ایجاد حساب کاربری' : 'Create Account'}
                    <CheckIcon color={colors.onPrimary} />
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}