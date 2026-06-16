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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {/* Language */}
      <div className="rounded-2xl p-4 border" style={cardStyle}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{ui.admin.language}</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { setLang('fa'); setLanguage('fa') }} className="py-2.5 rounded-xl text-sm font-bold"
            style={{ background: language === 'fa' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-tertiary)', color: language === 'fa' ? '#fff' : 'var(--text-secondary)' }}>فارسی</button>
          <button onClick={() => { setLang('en'); setLanguage('en') }} className="py-2.5 rounded-xl text-sm font-bold"
            style={{ background: language === 'en' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-tertiary)', color: language === 'en' ? '#fff' : 'var(--text-secondary)' }}>English</button>
        </div>
      </div>

      {/* Theme */}
      <div className="rounded-2xl p-4 border" style={cardStyle}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{ui.admin.theme}</h3>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setTheme('dark')} className="py-2.5 rounded-xl text-xs font-bold"
            style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #1e293b, #0f172a)' : 'var(--bg-tertiary)', color: theme === 'dark' ? '#fff' : 'var(--text-secondary)', border: theme === 'dark' ? '2px solid #3b82f6' : '2px solid transparent' }}>
            {ui.admin.darkMode}
          </button>
          <button onClick={() => setTheme('light')} className="py-2.5 rounded-xl text-xs font-bold"
            style={{ background: theme === 'light' ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' : 'var(--bg-tertiary)', color: theme === 'light' ? '#0f172a' : 'var(--text-secondary)', border: theme === 'light' ? '2px solid #3b82f6' : '2px solid transparent' }}>
            {ui.admin.lightMode}
          </button>
          <button onClick={() => setHighContrast(!highContrast)} className="py-2.5 rounded-xl text-xs font-bold"
            style={{ background: highContrast ? 'linear-gradient(135deg, #000, #1a1a1a)' : 'var(--bg-tertiary)', color: highContrast ? '#fff' : 'var(--text-secondary)', border: highContrast ? '2px solid #f59e0b' : '2px solid transparent' }}>
            کنتراست
          </button>
        </div>
      </div>

      {/* Nav Color */}
      <div className="rounded-2xl p-4 border" style={cardStyle}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>رنگ نوار بالا</h3>
        <div className="grid grid-cols-3 gap-2">
          {themes.map((th) => (
            <button key={th.key} onClick={() => setNavTheme(th.key)}
              className="py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})`, color: '#fff', border: navTheme === th.key ? '3px solid #fff' : '3px solid transparent', transform: navTheme === th.key ? 'scale(1.05)' : 'scale(1)' }}>
              {th.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="rounded-2xl p-4 border" style={cardStyle}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>اندازه متن</h3>
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {fontSizes.map((fs) => (
            <button key={fs.key} onClick={() => setFontSize(fs.key)}
              className="py-2 rounded-lg font-bold text-center"
              style={{ background: fontSize === fs.key ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--bg-tertiary)', color: fontSize === fs.key ? '#fff' : 'var(--text-secondary)', fontSize: `${fs.scale * 14}px` }}>
              {fs.label}
            </button>
          ))}
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>دستی</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>{Math.round(fontSizeCustom * 100)}%</span>
          </div>
          <input type="range" min="0.7" max="1.6" step="0.01" value={fontSizeCustom} onChange={(e) => setFontSizeCustom(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, #3b82f6 ${((fontSizeCustom - 0.7) / 0.9) * 100}%, var(--bg-tertiary) ${((fontSizeCustom - 0.7) / 0.9) * 100}%)` }} />
        </div>
      </div>

      {/* Camera Scanner */}
      <div className="rounded-2xl p-4 border" style={cardStyle}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>اسکنر دوربین</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>نمایش دکمه دوربین در صفحه فروش</p>
          <button onClick={() => setShowCameraScanner(!showCameraScanner)}
            className="relative w-11 h-6 rounded-full transition-all duration-200"
            style={{ backgroundColor: showCameraScanner ? '#3b82f6' : 'var(--bg-tertiary)' }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: showCameraScanner ? '22px' : '2px' }} />
          </button>
        </div>
      </div>

      {/* High Contrast */}
      <div className="rounded-2xl p-4 border" style={cardStyle}>
        <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>ظاهر</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>کنتراست بالا</span>
          <button onClick={() => setHighContrast(!highContrast)}
            className="relative w-11 h-6 rounded-full transition-all duration-200"
            style={{ backgroundColor: highContrast ? '#f59e0b' : 'var(--bg-tertiary)' }}>
            <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
              style={{ left: highContrast ? '22px' : '2px' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
