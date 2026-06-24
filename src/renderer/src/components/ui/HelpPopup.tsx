import { useState } from 'react'

interface HelpPopupProps {
  title: string
  sections: { heading: string; items: string[] }[]
}

export default function HelpPopup({ title, sections }: HelpPopupProps) {
  const [open, setOpen] = useState(false)
  const isDark = document.documentElement.classList.contains('dark')
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  if (!open) return (
    <button onClick={() => setOpen(true)} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12" y2="17" /></svg>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setOpen(false)}>
      <div className="rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-auto" style={{ backgroundColor: cardBg, border: '1px solid ' + cardBorder }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{title}</h3>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>&#10005;</button>
        </div>
        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i}>
              <h4 className="text-sm font-bold mb-2" style={{ color: textPrimary }}>{s.heading}</h4>
              <ul className="space-y-1.5">
                {s.items.map((item, j) => (
                  <li key={j} className="text-xs flex items-start gap-2" style={{ color: textSecondary }}>
                    <span style={{ color: '#3b82f6' }}>&#9679;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
