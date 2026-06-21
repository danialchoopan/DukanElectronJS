import { useState, useEffect } from 'react'
import { printA4Report } from '../utils/a4Print'

interface Props {
  open: boolean
  onClose: () => void
  html: string
  title: string
  isInvoice?: boolean
}

interface TemplateInfo { key: string; name: string; color: string }

const BUILT_IN: TemplateInfo[] = [
  { key: 'default', name: 'پیش‌فرض', color: '#006194' },
  { key: 'classic', name: 'کلاسیک', color: '#1a1a1a' },
  { key: 'modern', name: 'مدرن', color: '#2563eb' },
  { key: 'minimal', name: 'مینیمال', color: '#64748b' },
  { key: 'elegant', name: 'شیک', color: '#7c3aed' },
]

export default function PrintPreviewDialog({ open, onClose, html, title, isInvoice = false }: Props) {
  const [templates, setTemplates] = useState<TemplateInfo[]>(BUILT_IN)
  const [activeTemplate, setActiveTemplate] = useState('default')
  const [loading, setLoading] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')

  useEffect(() => {
    if (!open) return
    ;(async () => {
      const r = await window.api.settings.get('printTemplates')
      if (r.success && r.data) {
        try {
          const names: string[] = JSON.parse(r.data)
          setTemplates([...BUILT_IN, ...names.map(n => ({ key: n, name: n, color: '#6366f1' }))])
        } catch { setTemplates(BUILT_IN) }
      }
      const s = await window.api.printSettings.getAll()
      if (s.success && s.data?.printActiveTemplate) setActiveTemplate(s.data.printActiveTemplate)
    })()
  }, [open])

  if (!open) return null

  const getPreviewStyle = (color: string) => ({
    borderTop: color === '#1a1a1a' ? '6px double #1a1a1a' : color === '#2563eb' ? `3px solid #2563eb` : color === '#7c3aed' ? `8px solid #7c3aed` : 'none',
  })

  const handlePrint = async (templateKey: string) => {
    setLoading(true)
    const t = templates.find(x => x.key === templateKey) || templates[0]

    const allData = await (async () => {
      const r = await window.api.settings.get('printTemplateData')
      return r.success && r.data ? JSON.parse(r.data || '{}') : {}
    })()

    const custom: Record<string, string> = allData[templateKey] || {}
    if (t.key !== 'default' && !allData[templateKey]) {
      custom.printColorScheme = t.color
      if (t.key === 'classic') { custom.printBorderStyle = 'double'; custom.printHeaderAlign = 'center' }
      if (t.key === 'modern') { custom.printBorderStyle = 'simple'; custom.printColorScheme = t.color }
      if (t.key === 'minimal') { custom.printBorderStyle = 'none'; custom.printHeaderAlign = 'right' }
      if (t.key === 'elegant') { custom.printBorderStyle = 'decorative'; custom.printColorScheme = t.color }
    }

    await printA4Report(html, title, { isInvoice, customization: custom })
    setLoading(false)
    onClose()
  }

  const borderColor = (templates.find(t => t.key === activeTemplate) || templates[0]).color

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0' }` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#006194" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span className="text-sm font-bold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>پیش‌نمایش چاپ</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: '#94a3b8' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Template Selector */}
          <div className="mb-4">
            <div className="text-xs font-bold mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>قالب چاپ را انتخاب کنید</div>
            <div className="flex gap-2 flex-wrap">
              {templates.map(t => {
                const isActive = activeTemplate === t.key
                return (
                  <button key={t.key} onClick={() => setActiveTemplate(t.key)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2"
                    style={{
                      borderColor: isActive ? t.color : 'transparent',
                      backgroundColor: isActive ? t.color + '15' : (isDark ? '#0f172a' : '#f8fafc'),
                      color: isActive ? t.color : (isDark ? '#94a3b8' : '#64748b'),
                    }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
            <div style={{ backgroundColor: '#fff', padding: '24px', ...getPreviewStyle(borderColor) }}>
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#94a3b8' : '#64748b' }}>لغو</button>
          <button onClick={() => handlePrint(activeTemplate)} disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${borderColor}, ${borderColor}cc)`, boxShadow: `0 4px 12px ${borderColor}33`, opacity: loading ? 0.5 : 1 }}>
            {loading ? 'در حال چاپ...' : 'چاپ'}
          </button>
        </div>
      </div>
    </div>
  )
}
