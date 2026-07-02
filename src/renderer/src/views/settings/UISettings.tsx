/**
 * UISettings — appearance and accessibility settings panel.
 *
 * Controls:
 *   - Theme: dark/light mode toggle
 *   - Language: Farsi/English switch
 *   - Navigation theme: sidebar color variants
 *   - Font size: slider with custom override
 *   - High contrast: accessibility mode for visually impaired
 *   - Camera scanner toggle: enables barcode/QR scanning in POS and AddProduct
 *
 * All settings are persisted to the database via the settings store.
 * Theme changes are applied immediately by toggling the 'dark' class on <html>.
 */

import { t, setLanguage } from '../../i18n'
import { useSettingsStore, type NavTheme, getNavColors } from '../../store/settingsStore'

const themes: { key: NavTheme; name: string; colors: string[] }[] = [
  { key: 'blue', name: 'آبی', colors: ['#006194', '#007bb9'] },
  { key: 'green', name: 'سبز', colors: ['#16a34a', '#22c55e'] },
  { key: 'purple', name: 'بنفش', colors: ['#7c3aed', '#a855f7'] },
  { key: 'orange', name: 'نارنجی', colors: ['#ea580c', '#f97316'] },
  { key: 'teal', name: 'سبزآبی', colors: ['#0d9488', '#14b8a6'] },
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
  const { theme, setTheme, language, setLanguage: setLang, navTheme, setNavTheme, fontSize, setFontSize, fontSizeCustom, setFontSizeCustom, highContrast, setHighContrast, showCameraScanner, setShowCameraScanner, showCalculatorNav, setShowCalculatorNav } = useSettingsStore()
  const isDark = theme === 'dark'
  const ui = t()
  const primary = getNavColors(navTheme, isDark)
  const cBg = isDark ? '#1e293b' : '#ffffff'
  const cBorder = isDark ? '#334155' : '#e2e8f0'
  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: cBg, borderColor: cBorder }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${primary}15` }}>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: primary }} />
        </div>
        <h3 className="text-sm font-extrabold" style={{ color: tPri }}>{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Theme */}
        <Card title={ui.admin.theme}>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setTheme('dark')} className="py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: theme === 'dark' ? `linear-gradient(135deg, ${primary}, ${primary}cc)` : isDark ? '#0f172a' : '#f8fafc', color: theme === 'dark' ? '#fff' : tSec, border: `1px solid ${theme === 'dark' ? primary : cBorder}` }}>
              {ui.admin.darkMode}
            </button>
            <button onClick={() => setTheme('light')} className="py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: theme === 'light' ? `linear-gradient(135deg, ${primary}, ${primary}cc)` : isDark ? '#0f172a' : '#f8fafc', color: theme === 'light' ? '#fff' : tSec, border: `1px solid ${theme === 'light' ? primary : cBorder}` }}>
              {ui.admin.lightMode}
            </button>
            <button onClick={() => setHighContrast(!highContrast)} className="py-2.5 rounded-xl text-xs font-bold transition-all"
              style={{ background: highContrast ? `linear-gradient(135deg, ${primary}, ${primary}cc)` : isDark ? '#0f172a' : '#f8fafc', color: highContrast ? '#fff' : tSec, border: `1px solid ${highContrast ? primary : cBorder}` }}>
              کنتراست
            </button>
          </div>
        </Card>

        {/* Nav Color */}
        <Card title="رنگ اصلی برنامه">
          <div className="grid grid-cols-3 gap-2">
            {themes.map((th) => (
              <button key={th.key} onClick={() => setNavTheme(th.key)}
                className="py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: navTheme === th.key ? `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})` : isDark ? '#0f172a' : '#f8fafc', color: navTheme === th.key ? '#fff' : tSec, border: `1px solid ${navTheme === th.key ? th.colors[0] : cBorder}`, transform: navTheme === th.key ? 'scale(1.05)' : 'scale(1)' }}>
                {th.name}
              </button>
            ))}
          </div>
          <div className="mt-3 p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cBorder}` }}>
            <div className="text-[10px] font-bold mb-1" style={{ color: tSec }}>پیش‌نمایش</div>
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-lg" style={{ backgroundColor: primary }} />
              <div className="w-6 h-6 rounded-lg" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }} />
              <div className="flex-1 h-6 rounded-lg" style={{ backgroundColor: primary + '20' }} />
            </div>
          </div>
        </Card>

        {/* Language */}
        <Card title={ui.admin.language}>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setLang('fa'); setLanguage('fa') }} className="py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: language === 'fa' ? `linear-gradient(135deg, ${primary}, ${primary}cc)` : isDark ? '#0f172a' : '#f8fafc', color: language === 'fa' ? '#fff' : tSec, border: `1px solid ${language === 'fa' ? primary : cBorder}` }}>فارسی</button>
            <button onClick={() => { setLang('en'); setLanguage('en') }} className="py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{ background: language === 'en' ? `linear-gradient(135deg, ${primary}, ${primary}cc)` : isDark ? '#0f172a' : '#f8fafc', color: language === 'en' ? '#fff' : tSec, border: `1px solid ${language === 'en' ? primary : cBorder}` }}>English</button>
          </div>
        </Card>

        {/* Font Size */}
        <Card title="اندازه متن">
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            {fontSizes.map((fs) => (
              <button key={fs.key} onClick={() => setFontSize(fs.key)}
                className="py-2 rounded-lg font-bold text-center transition-all"
                style={{ background: fontSize === fs.key ? `linear-gradient(135deg, ${primary}, ${primary}cc)` : isDark ? '#0f172a' : '#f8fafc', color: fontSize === fs.key ? '#fff' : tSec, fontSize: `${fs.scale * 14}px`, border: `1px solid ${fontSize === fs.key ? primary : cBorder}` }}>
                {fs.label}
              </button>
            ))}
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold" style={{ color: tSec }}>دستی</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: tPri }}>{Math.round(fontSizeCustom * 100)}%</span>
            </div>
            <input type="range" min="0.7" max="1.6" step="0.01" value={fontSizeCustom} onChange={(e) => setFontSizeCustom(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: primary }} />
          </div>
        </Card>

        {/* Camera Scanner */}
        <Card title="اسکنر دوربین">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: tSec }}>فعال‌سازی اسکن بارکد و QR با دوربین</p>
              <p className="text-[10px] mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>صفحه فروش + صفحه افزودن کالا</p>
            </div>
            <button onClick={() => setShowCameraScanner(!showCameraScanner)}
              className="relative w-11 h-6 rounded-full transition-all duration-200"
              style={{ backgroundColor: showCameraScanner ? primary : isDark ? '#475569' : '#d1d5db' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: showCameraScanner ? '22px' : '2px' }} />
            </button>
          </div>
        </Card>

        {/* Calculator Nav Toggle */}
        <Card title="ماشین حساب">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: tSec }}>نمایش آیتم ماشین حساب در منوی ناوبری</p>
              <p className="text-[10px] mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>قابل دسترسی با Ctrl+M حتی بدون نمایش در منو</p>
            </div>
            <button onClick={() => setShowCalculatorNav(!showCalculatorNav)}
              className="relative w-11 h-6 rounded-full transition-all duration-200"
              style={{ backgroundColor: showCalculatorNav ? primary : isDark ? '#475569' : '#d1d5db' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: showCalculatorNav ? '22px' : '2px' }} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
