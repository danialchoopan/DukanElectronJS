import { useState, useEffect, useRef } from 'react'
import { printA4Report } from '../../utils/a4Print'

interface PrintSettings {
  printInvoiceTitle: string
  printReprintTitle: string
  printReportTitle: string
  printFooter: string
  printColorScheme: string
  printShowSignature: string
  printShowTax: string
  printLogo: string
  printSignature: string
  printWatermark: string
  printWatermarkOpacity: string
}

const defaults: PrintSettings = {
  printInvoiceTitle: 'فاکتور فروش',
  printReprintTitle: 'چاپ دوباره فاکتور',
  printReportTitle: 'گزارش',
  printFooter: '',
  printColorScheme: '#006194',
  printShowSignature: 'true',
  printShowTax: 'true',
  printLogo: '',
  printSignature: '',
  printWatermark: '',
  printWatermarkOpacity: '20',
}

export default function CustomizationSettings() {
  const [settings, setSettings] = useState<PrintSettings>(defaults)
  const [saved, setSaved] = useState(false)
  const [previews, setPreviews] = useState<{ logo: string; signature: string; watermark: string }>({ logo: '', signature: '', watermark: '' })
  const logoRef = useRef<HTMLInputElement>(null)
  const sigRef = useRef<HTMLInputElement>(null)
  const wmRef = useRef<HTMLInputElement>(null)
  const isDark = document.documentElement.classList.contains('dark')
  const primary = '#006194'

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const btnBg = isDark ? '#334155' : '#f1f5f9'
  const inputStyle = { background: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }
  const inputClass = "w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 outline-none focus:ring-2 placeholder:text-xs"

  const loadSettings = async () => {
    const r = await window.api.printSettings.getAll()
    if (r.success && r.data) {
      setSettings((prev) => ({ ...prev, ...r.data }))
      const p = { logo: '', signature: '', watermark: '' }
      if (r.data.printLogo) { const ar = await window.api.printSettings.getAsset(r.data.printLogo); if (ar.success && ar.data) p.logo = ar.data }
      if (r.data.printSignature) { const ar = await window.api.printSettings.getAsset(r.data.printSignature); if (ar.success && ar.data) p.signature = ar.data }
      if (r.data.printWatermark) { const ar = await window.api.printSettings.getAsset(r.data.printWatermark); if (ar.success && ar.data) p.watermark = ar.data }
      setPreviews(p)
    }
  }

  useEffect(() => { loadSettings() }, [])

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleUpload = async (type: 'logo' | 'signature' | 'watermark', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await fileToBase64(file)
    const result = await window.api.printSettings.uploadAsset(type, base64)
    if (result.success && result.data) {
      const key = type === 'logo' ? 'printLogo' : type === 'signature' ? 'printSignature' : 'printWatermark'
      await window.api.printSettings.save({ [key]: result.data.filename })
      await loadSettings()
    }
    e.target.value = ''
  }

  const handleRemove = async (type: 'logo' | 'signature' | 'watermark') => {
    const key = type === 'logo' ? 'printLogo' : type === 'signature' ? 'printSignature' : 'printWatermark'
    await window.api.printSettings.save({ [key]: '' })
    await loadSettings()
  }

  const updateField = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    await window.api.printSettings.save(settings as unknown as Record<string, string>)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = async () => {
    if (!confirm('آیا از بازنشانی تنظیمات چاپ اطمینان دارید؟')) return
    await window.api.printSettings.reset()
    await loadSettings()
  }

  const handlePreview = async () => {
    let logoData = ''
    let sigData = ''
    let wmData = ''
    if (settings.printLogo) { const r = await window.api.printSettings.getAsset(settings.printLogo); if (r.success && r.data) logoData = r.data }
    if (settings.printSignature) { const r = await window.api.printSettings.getAsset(settings.printSignature); if (r.success && r.data) sigData = r.data }
    if (settings.printWatermark) { const r = await window.api.printSettings.getAsset(settings.printWatermark); if (r.success && r.data) wmData = r.data }

    const sampleHtml = `
      <table>
        <thead>
          <tr><th>ردیف</th><th>کالا</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>محصول نمونه</td><td>۲</td><td>۵۰,۰۰۰</td><td>۱۰۰,۰۰۰</td></tr>
          <tr><td>2</td><td>محصول نمونه ۲</td><td>۱</td><td>۳۰,۰۰۰</td><td>۳۰,۰۰۰</td></tr>
          <tr class="total-row"><td colspan="4">جمع کل</td><td>۱۳۰,۰۰۰</td></tr>
        </tbody>
      </table>
    `

    printA4Report(sampleHtml, settings.printInvoiceTitle, {
      isInvoice: true,
      customization: {
        printColorScheme: settings.printColorScheme,
        printLogo: logoData,
        printSignature: sigData,
        printWatermark: wmData,
        printWatermarkOpacity: settings.printWatermarkOpacity,
        printShowSignature: settings.printShowSignature,
        printShowTax: settings.printShowTax,
        printFooter: settings.printFooter,
        printInvoiceTitle: settings.printInvoiceTitle,
        printReprintTitle: settings.printReprintTitle,
        printReportTitle: settings.printReportTitle,
      },
    })
  }

  const renderImageUpload = (
    type: 'logo' | 'signature' | 'watermark',
    label: string,
    ref: React.RefObject<HTMLInputElement>,
    extra?: React.ReactNode,
  ) => {
    const previewKey = type as keyof typeof previews
    const hasPreview = !!previews[previewKey]
    return (
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold" style={{ color: textSecondary }}>{label}</label>
          <div className="flex gap-2">
            <button
              onClick={() => ref.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
              style={{ backgroundColor: btnBg, color: textSecondary }}
            >
              بارگذاری
            </button>
            {hasPreview && (
              <button
                onClick={() => handleRemove(type)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444' }}
              >
                حذف
              </button>
            )}
          </div>
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(type, e)} />
        {hasPreview ? (
          <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: cardBorder }}>
            <img src={previews[previewKey]} alt={label} className="max-h-32 mx-auto object-contain" />
          </div>
        ) : (
          <div className="rounded-xl flex items-center justify-center h-20" style={{ backgroundColor: inputBg, border: `1px dashed ${cardBorder}` }}>
            <span className="text-xs" style={{ color: textSecondary }}>تصویری انتخاب نشده</span>
          </div>
        )}
        {extra}
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Logo */}
      {renderImageUpload('logo', 'لوگوی چاپ', logoRef)}

      {/* Signature */}
      {renderImageUpload('signature', 'امضای چاپ', sigRef)}

      {/* Watermark */}
      {renderImageUpload('watermark', 'واترمارک', wmRef, (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold" style={{ color: textSecondary }}>شفافیت واترمارک</span>
            <span className="text-xs font-bold font-mono" style={{ color: primary }}>{settings.printWatermarkOpacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={parseInt(settings.printWatermarkOpacity) || 20}
            onChange={(e) => updateField('printWatermarkOpacity', e.target.value)}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: primary }}
          />
        </div>
      ))}

      {/* Color Scheme */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        <label className="text-xs font-bold block mb-3" style={{ color: textSecondary }}>رنگ اصلی چاپ</label>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={settings.printColorScheme}
            onChange={(e) => updateField('printColorScheme', e.target.value)}
            className="w-12 h-12 rounded-xl border cursor-pointer"
            style={{ borderColor: cardBorder, background: 'none' }}
          />
          <div className="flex-1">
            <span className="text-xs font-mono font-bold" style={{ color: textSecondary }}>{settings.printColorScheme}</span>
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ backgroundColor: settings.printColorScheme + '20', color: settings.printColorScheme }}>متن نمونه</span>
              <span className="text-xs px-3 py-1 rounded-lg font-bold text-white" style={{ backgroundColor: settings.printColorScheme }}>پس زمینه</span>
            </div>
          </div>
        </div>
      </div>

      {/* Text Customization */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm" style={{ color: textPrimary }}>متن‌های چاپ</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>عنوان فاکتور فروش</label>
            <input
              value={settings.printInvoiceTitle}
              onChange={(e) => updateField('printInvoiceTitle', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="فاکتور فروش"
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>عنوان چاپ دوباره</label>
            <input
              value={settings.printReprintTitle}
              onChange={(e) => updateField('printReprintTitle', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="چاپ دوباره فاکتور"
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>عنوان گزارش</label>
            <input
              value={settings.printReportTitle}
              onChange={(e) => updateField('printReportTitle', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="گزارش"
            />
          </div>
          <div>
            <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>متن فوتر چاپ</label>
            <input
              value={settings.printFooter}
              onChange={(e) => updateField('printFooter', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="متن پایانی چاپ"
            />
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)' }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <h3 className="font-extrabold text-sm" style={{ color: textPrimary }}>تنظیمات نمایش</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: textSecondary }}>نمایش خطوط امضا در فاکتورها</span>
            <button
              onClick={() => updateField('printShowSignature', settings.printShowSignature === 'true' ? 'false' : 'true')}
              className="relative w-10 h-5 rounded-full transition-all duration-200"
              style={{ backgroundColor: settings.printShowSignature === 'true' ? primary : (isDark ? '#475569' : '#d1d5db') }}
            >
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: settings.printShowSignature === 'true' ? '20px' : '2px' }} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: textSecondary }}>نمایش اطلاعات مالیات در چاپ</span>
            <button
              onClick={() => updateField('printShowTax', settings.printShowTax === 'true' ? 'false' : 'true')}
              className="relative w-10 h-5 rounded-full transition-all duration-200"
              style={{ backgroundColor: settings.printShowTax === 'true' ? primary : (isDark ? '#475569' : '#d1d5db') }}
            >
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: settings.printShowTax === 'true' ? '20px' : '2px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview + Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handlePreview}
          className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200"
          style={{
            background: `linear-gradient(135deg, ${settings.printColorScheme || primary}, ${settings.printColorScheme || primary}cc)`,
            color: '#ffffff',
            boxShadow: `0 4px 12px ${(settings.printColorScheme || primary) + '4d'}`,
          }}
        >
          پیش‌نمایش چاپ
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-200"
          style={{
            background: saved
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : `linear-gradient(135deg, ${primary}, #007bb9)`,
            color: '#ffffff',
            boxShadow: saved ? '0 4px 12px rgba(34,197,94,0.3)' : '0 4px 12px rgba(0,97,148,0.3)',
          }}
        >
          {saved ? 'ذخیره شد!' : 'ذخیره'}
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200"
          style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', color: '#ef4444' }}
        >
          بازنشانی
        </button>
      </div>
    </div>
  )
}
