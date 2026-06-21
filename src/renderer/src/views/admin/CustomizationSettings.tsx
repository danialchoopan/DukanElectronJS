import { useState, useEffect, useRef } from 'react'
import { printA4Report } from '../../utils/a4Print'
import { setPrintCustomization } from '../../utils/a4Print'

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
  printFontSize: string
  printHeaderSize: string
  printLineSpacing: string
  printMarginTop: string
  printMarginBottom: string
  printMarginLeft: string
  printMarginRight: string
  printPaperSize: string
  printHeaderField1: string
  printHeaderField2: string
  printHeaderField3: string
  printBorderStyle: string
  printHeaderAlign: string
  printActiveTemplate: string
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
  printFontSize: '11pt',
  printHeaderSize: '18pt',
  printLineSpacing: '1.5',
  printMarginTop: '15',
  printMarginBottom: '15',
  printMarginLeft: '15',
  printMarginRight: '15',
  printPaperSize: 'A4',
  printHeaderField1: '',
  printHeaderField2: '',
  printHeaderField3: '',
  printBorderStyle: 'none',
  printHeaderAlign: 'center',
  printActiveTemplate: 'default',
}

export default function CustomizationSettings() {
  const [settings, setSettings] = useState<PrintSettings>(defaults)
  const [saved, setSaved] = useState(false)
  const [previews, setPreviews] = useState<{ logo: string; signature: string; watermark: string }>({ logo: '', signature: '', watermark: '' })
  const [templates, setTemplates] = useState<string[]>([])
  const [showNewTemplateInput, setShowNewTemplateInput] = useState(false)
  const templateInputRef = useRef<HTMLInputElement>(null)
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
      setPrintCustomization(r.data)
      const p = { logo: '', signature: '', watermark: '' }
      if (r.data.printLogo) { const ar = await window.api.printSettings.getAsset(r.data.printLogo); if (ar.success && ar.data) p.logo = ar.data }
      if (r.data.printSignature) { const ar = await window.api.printSettings.getAsset(r.data.printSignature); if (ar.success && ar.data) p.signature = ar.data }
      if (r.data.printWatermark) { const ar = await window.api.printSettings.getAsset(r.data.printWatermark); if (ar.success && ar.data) p.watermark = ar.data }
      setPreviews(p)
    }
  }

  useEffect(() => { loadSettings(); loadTemplates() }, [])

  const loadTemplates = async () => {
    const r = await window.api.settings.get('printTemplates')
    if (r.success && r.data) {
      try { setTemplates(JSON.parse(r.data)) } catch {}
    }
  }

  const saveTemplateSettings = async (name: string) => {
    const r = await window.api.settings.get('printTemplateData')
    const allData: Record<string, any> = r.success && r.data ? JSON.parse(r.data || '{}') : {}
    allData[name] = { ...settings }
    await window.api.settings.set('printTemplateData', JSON.stringify(allData))
  }

  const loadTemplateSettings = async (name: string) => {
    const r = await window.api.settings.get('printTemplateData')
    if (r.success && r.data) {
      const allData: Record<string, any> = JSON.parse(r.data || '{}')
      if (allData[name]) {
        setSettings((prev) => ({ ...prev, ...allData[name], printActiveTemplate: name }))
      }
    }
  }

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
    setPrintCustomization(settings as unknown as Record<string, string>)
    if (settings.printActiveTemplate && settings.printActiveTemplate !== 'default') {
      await saveTemplateSettings(settings.printActiveTemplate)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selectTemplate = (name: string) => {
    updateField('printActiveTemplate', name)
    if (name !== 'default') loadTemplateSettings(name)
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

    await printA4Report(sampleHtml, settings.printInvoiceTitle, {
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
        printFontSize: settings.printFontSize,
        printHeaderSize: settings.printHeaderSize,
        printLineSpacing: settings.printLineSpacing,
        printMarginTop: settings.printMarginTop,
        printMarginBottom: settings.printMarginBottom,
        printMarginLeft: settings.printMarginLeft,
        printMarginRight: settings.printMarginRight,
        printPaperSize: settings.printPaperSize,
        printHeaderField1: settings.printHeaderField1,
        printHeaderField2: settings.printHeaderField2,
        printHeaderField3: settings.printHeaderField3,
        printBorderStyle: settings.printBorderStyle,
        printHeaderAlign: settings.printHeaderAlign,
        printActiveTemplate: settings.printActiveTemplate,
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select value={settings.printActiveTemplate || 'default'} onChange={e => { selectTemplate(e.target.value) }} className="input-field text-sm w-40">
            <option value="default">پیش‌فرض</option>
            {templates.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input ref={templateInputRef} placeholder="نام قالب جدید" className="input-field text-sm w-40" style={{ display: showNewTemplateInput ? 'block' : 'none' }} />
          {settings.printActiveTemplate && settings.printActiveTemplate !== 'default' && (
            <button onClick={async () => {
              const name = settings.printActiveTemplate
              const newTemplates = templates.filter(t => t !== name)
              setTemplates(newTemplates)
              await window.api.settings.set('printTemplates', JSON.stringify(newTemplates))
              updateField('printActiveTemplate', 'default')
            }} className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              حذف قالب
            </button>
          )}
          <button onClick={async () => {
            if (showNewTemplateInput && templateInputRef.current?.value.trim()) {
              const name = templateInputRef.current.value.trim()
              const newTemplates = [...templates, name]
              setTemplates(newTemplates)
              await window.api.settings.set('printTemplates', JSON.stringify(newTemplates))
              await saveTemplateSettings(name)
              updateField('printActiveTemplate', name)
              templateInputRef.current.value = ''
              setShowNewTemplateInput(false)
            } else {
              setShowNewTemplateInput(true)
              setTimeout(() => templateInputRef.current?.focus(), 50)
            }
          }} className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: primary }}>
            {showNewTemplateInput ? 'ذخیره قالب' : 'قالب جدید'}
          </button>
        </div>
      </div>
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

      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <h4 className="text-sm font-bold mb-3" style={{ color: textPrimary }}>اندازه و فاصله</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>اندازه قلم متن</label>
            <select value={settings.printFontSize || '11pt'} onChange={e => updateField('printFontSize', e.target.value)} className="input-field text-sm w-full">
              <option value="9pt">9pt</option><option value="10pt">10pt</option><option value="11pt">11pt</option>
              <option value="12pt">12pt</option><option value="14pt">14pt</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>اندازه عنوان</label>
            <select value={settings.printHeaderSize || '18pt'} onChange={e => updateField('printHeaderSize', e.target.value)} className="input-field text-sm w-full">
              <option value="14pt">14pt</option><option value="16pt">16pt</option>
              <option value="18pt">18pt</option><option value="20pt">20pt</option><option value="24pt">24pt</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>فاصله خطوط</label>
            <select value={settings.printLineSpacing || '1.5'} onChange={e => updateField('printLineSpacing', e.target.value)} className="input-field text-sm w-full">
              <option value="1.2">فشرده (1.2)</option><option value="1.5">عادی (1.5)</option>
              <option value="2.0">باز (2.0)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>اندازه کاغذ</label>
            <select value={settings.printPaperSize || 'A4'} onChange={e => updateField('printPaperSize', e.target.value)} className="input-field text-sm w-full">
              <option value="A4">A4</option><option value="A5">A5</option><option value="Letter">Letter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <h4 className="text-sm font-bold mb-3" style={{ color: textPrimary }}>حاشیه کاغذ (mm)</h4>
        <div className="grid grid-cols-4 gap-2">
          {['top','bottom','left','right'].map(dir => {
            const key = `printMargin${dir.charAt(0).toUpperCase() + dir.slice(1)}` as keyof PrintSettings
            return (
              <div key={dir}>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{dir === 'top' ? 'بالا' : dir === 'bottom' ? 'پایین' : dir === 'left' ? 'چپ' : 'راست'}</label>
                <input type="number" min="5" max="50" value={parseInt(settings[key] || '15')}
                  onChange={e => updateField(key, e.target.value)}
                  className="input-field text-sm w-full" />
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <h4 className="text-sm font-bold mb-3" style={{ color: textPrimary }}>فیلدهای سربرگ (با خط برای پر کردن)</h4>
        {[1,2,3].map(i => (
          <div key={i} className="mb-2">
            <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>فیلد {i}</label>
            <input value={settings[`printHeaderField${i}` as keyof PrintSettings] || ''} onChange={e => updateField(`printHeaderField${i}` as keyof PrintSettings, e.target.value)}
              className="input-field text-sm w-full" placeholder={`مثال: شماره: __________   تاریخ: __________`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h4 className="text-sm font-bold mb-3" style={{ color: textPrimary }}>حاشیه تزئینی</h4>
          <div className="flex gap-2">
            {['none','simple','double','decorative'].map(s => (
              <button key={s} onClick={() => updateField('printBorderStyle', s)}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ backgroundColor: (settings.printBorderStyle || 'none') === s ? primary : (isDark ? '#334155' : '#f1f5f9'), color: (settings.printBorderStyle || 'none') === s ? '#fff' : textSecondary }}>
                {s === 'none' ? 'بدون' : s === 'simple' ? 'ساده' : s === 'double' ? 'دوخط' : 'مُدِل'}
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg flex items-center justify-center" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: settings.printBorderStyle === 'simple' ? '3px solid #006194' : settings.printBorderStyle === 'double' ? '6px double #006194' : settings.printBorderStyle === 'decorative' ? '8px solid #006194' : '1px solid transparent' }}>
            <span className="text-xs" style={{ color: textSecondary }}>پیش‌نمایش سریع</span>
          </div>
        </div>
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h4 className="text-sm font-bold mb-3" style={{ color: textPrimary }}>جهت سربرگ</h4>
          <div className="flex gap-2">
            {['center','right'].map(a => (
              <button key={a} onClick={() => updateField('printHeaderAlign', a)}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{ backgroundColor: (settings.printHeaderAlign || 'center') === a ? primary : (isDark ? '#334155' : '#f1f5f9'), color: (settings.printHeaderAlign || 'center') === a ? '#fff' : textSecondary }}>
                {a === 'center' ? 'وسط' : 'راست'}
              </button>
            ))}
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
