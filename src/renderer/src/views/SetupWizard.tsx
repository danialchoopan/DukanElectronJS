import { useState } from 'react'
import { t, setLanguage } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [lang, setLang] = useState<'fa' | 'en'>('fa')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [adminName, setAdminName] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [adminPinConfirm, setAdminPinConfirm] = useState('')
  const [autoRounding, setAutoRounding] = useState(500)
  const [pinError, setPinError] = useState('')
  const [showPin, setShowPin] = useState(true)

  const ui = t()

  const switchLang = (l: 'fa' | 'en') => {
    setLang(l)
    setLanguage(l)
  }

  const handleStep2Next = () => {
    if (!adminName || !adminPin) return
    if (adminPin.length < 4) { setPinError(lang === 'fa' ? 'رمز باید حداقل ۴ رقم باشد' : 'PIN must be at least 4 digits'); return }
    if (adminPin !== adminPinConfirm) { setPinError(lang === 'fa' ? 'رمزها مطابقت ندارند' : 'PINs do not match'); return }
    setPinError('')
    setStep(3)
  }

  const handleComplete = async () => {
    await Promise.all([
      window.api.settings.set('storeName', shopName || (lang === 'fa' ? 'فروشگاه من' : 'My Store')),
      window.api.settings.set('storeAddress', shopAddress),
      window.api.settings.set('storePhone', shopPhone),
      window.api.settings.set('autoRounding', String(autoRounding)),
      window.api.settings.set('language', lang),
      window.api.settings.set('theme', theme),
      window.api.settings.set('isSetupComplete', 'true'),
    ])
    if (adminName && adminPin.length >= 4) {
      await window.api.auth.createUser({ name: adminName, pinCode: adminPin, role: 'admin' })
    }
    useSettingsStore.getState().setLanguage(lang)
    useSettingsStore.getState().setTheme(theme)
    onComplete()
  }

  const isDark = theme === 'dark'

  const bg = isDark
    ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
    : 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 50%, #f0f9ff 100%)'

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const subColor = isDark ? '#94a3b8' : '#64748b'

  return (
    <div className="h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏪</div>
              <h1 className="text-2xl font-bold" style={{ color: textColor }}>{ui.setup.welcome}</h1>
              <p style={{ color: subColor }} className="mt-1">{ui.setup.step1}</p>
            </div>

            <div>
              <label className="text-sm block mb-1 font-medium" style={{ color: subColor }}>{ui.setup.selectLanguage}</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => switchLang('fa')} className="py-3 rounded-xl text-lg font-bold transition-all text-white"
                  style={{ background: lang === 'fa' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'var(--bg-tertiary)', boxShadow: lang === 'fa' ? '0 4px 12px rgba(59,130,246,0.4)' : 'none', color: lang === 'fa' ? '#fff' : subColor }}>فارسی</button>
                <button onClick={() => switchLang('en')} className="py-3 rounded-xl text-lg font-bold transition-all text-white"
                  style={{ background: lang === 'en' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'var(--bg-tertiary)', boxShadow: lang === 'en' ? '0 4px 12px rgba(59,130,246,0.4)' : 'none', color: lang === 'en' ? '#fff' : subColor }}>English</button>
              </div>
            </div>

            <div>
              <label className="text-sm block mb-1 font-medium" style={{ color: subColor }}>{ui.setup.selectTheme}</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTheme('dark')} className="py-3 rounded-xl text-lg font-bold transition-all text-white"
                  style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b, #334155)' : 'var(--bg-tertiary)', boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : 'none', color: theme === 'dark' ? '#fff' : subColor, border: theme === 'dark' ? '2px solid #2563eb' : '2px solid transparent' }}>
                  {ui.admin.darkMode}
                </button>
                <button onClick={() => setTheme('light')} className="py-3 rounded-xl text-lg font-bold transition-all text-white"
                  style={{ background: theme === 'light' ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'var(--bg-tertiary)', boxShadow: theme === 'light' ? '0 4px 12px rgba(59,130,246,0.4)' : 'none', color: theme === 'light' ? '#fff' : subColor, border: theme === 'light' ? '2px solid #2563eb' : '2px solid transparent' }}>
                  {ui.admin.lightMode}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm block mb-1 font-medium" style={{ color: subColor }}>{ui.setup.shopName} *</label>
              <input value={shopName} onChange={(e) => setShopName(e.target.value)} className="input-field text-lg" placeholder={lang === 'fa' ? 'مثلاً: فروشگاه زنجیره‌ای ...' : 'e.g. My Supermarket'} autoFocus />
            </div>
            <div>
              <label className="text-sm block mb-1 font-medium" style={{ color: subColor }}>{ui.setup.shopAddress}</label>
              <input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-sm block mb-1 font-medium" style={{ color: subColor }}>{ui.setup.shopPhone}</label>
              <input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} className="input-field" />
            </div>
            <button onClick={() => setStep(2)} disabled={!shopName}
              className="w-full text-lg py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
              {ui.setup.next}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">👤</div>
              <h1 className="text-2xl font-bold" style={{ color: textColor }}>{ui.setup.step2}</h1>
            </div>
            <div>
              <label className="text-sm block mb-1 font-medium" style={{ color: subColor }}>{ui.setup.adminName}</label>
              <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className="input-field text-lg" autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium" style={{ color: subColor }}>{ui.setup.adminPin}</label>
                <button type="button" onClick={() => setShowPin(!showPin)} className="text-xs px-2 py-0.5 rounded-lg font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                  {showPin ? '●●●' : '●●●'}
                </button>
              </div>
              <input type={showPin ? 'text' : 'password'} value={adminPin} onChange={(e) => { setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError('') }} className="input-field text-lg text-center tracking-[0.5em] font-mono" placeholder="----" maxLength={6} inputMode="numeric" />
            </div>
            <div>
              <label className="text-sm block mb-1 font-medium" style={{ color: subColor }}>{lang === 'fa' ? 'تأیید رمز مدیر' : 'Confirm Admin PIN'}</label>
              <input type={showPin ? 'text' : 'password'} value={adminPinConfirm} onChange={(e) => { setAdminPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError('') }} className="input-field text-lg text-center tracking-[0.5em] font-mono" placeholder="----" maxLength={6} inputMode="numeric" />
            </div>
            {pinError && <p className="text-red-400 text-sm text-center">{pinError}</p>}
            {adminPin && adminPinConfirm && adminPin === adminPinConfirm && adminPin.length >= 4 && (
              <p className="text-green-400 text-sm text-center">
                {lang === 'fa' ? 'رمزها مطابقت دارند' : 'PINs match'}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {ui.setup.previous}
              </button>
              <button onClick={handleStep2Next} disabled={!adminName || !adminPin || !adminPinConfirm} className="flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {ui.setup.next}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚙️</div>
              <h1 className="text-2xl font-bold" style={{ color: textColor }}>{ui.setup.step3}</h1>
              <p style={{ color: subColor }} className="mt-1">{ui.setup.autoRounding}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[0, 500, 1000].map((v) => (
                <button key={v} onClick={() => setAutoRounding(v)}
                  className="py-4 rounded-xl text-lg font-bold transition-all text-white"
                  style={{
                    background: autoRounding === v ? 'linear-gradient(135deg, #2563eb, #3b82f6)' : 'var(--bg-tertiary)',
                    boxShadow: autoRounding === v ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
                    color: autoRounding === v ? '#fff' : subColor,
                    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}>
                  {v === 0 ? ui.setup.roundingOff : `${v.toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US')}`}
                </button>
              ))}
            </div>
            <div className="rounded-lg p-3 text-sm text-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: subColor }}>
              {autoRounding > 0 ? `18,300 → ${Math.ceil(18300 / autoRounding) * autoRounding}` : ui.setup.roundingOff}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {ui.setup.previous}
              </button>
              <button onClick={handleComplete} className="flex-1 py-3 rounded-xl font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.4)', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                {ui.setup.complete}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="w-3 h-3 rounded-full transition-colors" style={{ backgroundColor: step >= s ? '#2563eb' : (isDark ? '#475569' : '#cbd5e1') }} />
          ))}
        </div>
      </div>
    </div>
  )
}
