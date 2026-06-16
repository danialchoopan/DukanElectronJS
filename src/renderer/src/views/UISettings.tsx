import { t, setLanguage } from '../i18n'
import { useSettingsStore, type NavTheme } from '../store/settingsStore'

const themes: { key: NavTheme; name: string; colors: string[] }[] = [
  { key: 'blue', name: 'آبی', colors: ['#2563eb', '#7c3aed'] },
  { key: 'green', name: 'سبز', colors: ['#16a34a', '#0891b2'] },
  { key: 'purple', name: 'بنفش', colors: ['#9333ea', '#ec4899'] },
  { key: 'orange', name: 'نارنجی', colors: ['#ea580c', '#dc2626'] },
  { key: 'teal', name: 'سبزآبی', colors: ['#0d9488', '#2563eb'] },
  { key: 'slate', name: 'خاکستری', colors: ['#475569', '#64748b'] },
]

const fontSizes = [
  { key: 'sm', label: 'کوچک', scale: 0.85 },
  { key: 'md', label: 'متوسط', scale: 1 },
  { key: 'md-lg', label: 'متوسط بزرگ', scale: 1.08 },
  { key: 'lg', label: 'بزرگ', scale: 1.15 },
  { key: 'xl', label: 'خیلی بزرگ', scale: 1.3 },
]

export default function UISettings() {
  const { theme, setTheme, language, setLanguage: setLang, navTheme, setNavTheme, fontSize, setFontSize, fontSizeCustom, setFontSizeCustom, highContrast, setHighContrast, showCameraScanner, setShowCameraScanner } = useSettingsStore()
  const ui = t()
  const cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }

  return (
    <div className="grid grid-cols-2 gap-6 w-full">
      {/* Language */}
      <div className="rounded-2xl p-5 border" style={cardStyle}>
        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{ui.admin.language}</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setLang('fa'); setLanguage('fa') }} className="py-3 rounded-xl text-lg font-bold transition-all"
            style={{ background: language === 'fa' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-tertiary)', color: language === 'fa' ? '#ffffff' : 'var(--text-secondary)' }}>فارسی</button>
          <button onClick={() => { setLang('en'); setLanguage('en') }} className="py-3 rounded-xl text-lg font-bold transition-all"
            style={{ background: language === 'en' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-tertiary)', color: language === 'en' ? '#ffffff' : 'var(--text-secondary)' }}>English</button>
        </div>
      </div>

      {/* Theme */}
      <div className="rounded-2xl p-5 border" style={cardStyle}>
        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>{ui.admin.theme}</h3>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setTheme('dark')} className="py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'var(--bg-tertiary)', color: theme === 'dark' ? '#ffffff' : 'var(--text-secondary)', border: theme === 'dark' ? '2px solid #3b82f6' : '2px solid transparent' }}>
            {ui.admin.darkMode}
          </button>
          <button onClick={() => setTheme('light')} className="py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: theme === 'light' ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' : 'var(--bg-tertiary)', color: theme === 'light' ? '#0f172a' : 'var(--text-secondary)', border: theme === 'light' ? '2px solid #3b82f6' : '2px solid transparent' }}>
            {ui.admin.lightMode}
          </button>
          <button onClick={() => setHighContrast(!highContrast)} className="py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: highContrast ? 'linear-gradient(135deg, #000000, #1a1a1a)' : 'var(--bg-tertiary)', color: highContrast ? '#ffffff' : 'var(--text-secondary)', border: highContrast ? '2px solid #f59e0b' : '2px solid transparent' }}>
            کنتراست بالا
          </button>
        </div>
      </div>

      {/* Nav Color */}
      <div className="rounded-2xl p-5 border" style={cardStyle}>
        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>رنگ نوار بالا</h3>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((th) => (
            <button key={th.key} onClick={() => setNavTheme(th.key)}
              className="py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})`, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.3)', border: navTheme === th.key ? '3px solid #ffffff' : '3px solid transparent', transform: navTheme === th.key ? 'scale(1.05)' : 'scale(1)', boxShadow: navTheme === th.key ? '0 4px 12px rgba(0,0,0,0.3)' : 'none' }}>
              {th.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="rounded-2xl p-5 border" style={cardStyle}>
        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>اندازه متن</h3>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {fontSizes.map((fs) => (
            <button key={fs.key} onClick={() => setFontSize(fs.key)}
              className="py-3 rounded-xl font-bold transition-all text-center"
              style={{ background: fontSize === fs.key ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-tertiary)', color: fontSize === fs.key ? '#ffffff' : 'var(--text-secondary)', fontSize: `${fs.scale * 14}px` }}>
              {fs.label}
            </button>
          ))}
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>تغییر دستی</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{Math.round(fontSizeCustom * 100)}%</span>
          </div>
          <input type="range" min="0.7" max="1.6" step="0.01" value={fontSizeCustom} onChange={(e) => setFontSizeCustom(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((fontSizeCustom - 0.7) / 0.9) * 100}%, var(--bg-tertiary) ${((fontSizeCustom - 0.7) / 0.9) * 100}%, var(--bg-tertiary) 100%)` }} />
          <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}><span>۷۰٪</span><span>۱۰۰٪</span><span>۱۶۰٪</span></div>
        </div>
      </div>

      {/* Camera Scanner Toggle */}
      <div className="rounded-2xl p-5 border" style={cardStyle}>
        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>اسکنر دوربین</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>نمایش دکمه دوربین در صفحه فروش</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>با فعال کردن این گزینه، دکمه اسکنر دوربین در صفحه فروش نمایش داده می‌شود</p>
          </div>
          <button onClick={() => setShowCameraScanner(!showCameraScanner)}
            className="relative w-12 h-6 rounded-full transition-all duration-200"
            style={{ backgroundColor: showCameraScanner ? '#3b82f6' : 'var(--bg-tertiary)' }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: showCameraScanner ? '24px' : '2px' }} />
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl p-5 border" style={cardStyle}>
        <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>ظاهر</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>کنتراست بالا</span>
            <button onClick={() => setHighContrast(!highContrast)}
              className="relative w-12 h-6 rounded-full transition-all duration-200"
              style={{ backgroundColor: highContrast ? '#f59e0b' : 'var(--bg-tertiary)' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: highContrast ? '24px' : '2px' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
