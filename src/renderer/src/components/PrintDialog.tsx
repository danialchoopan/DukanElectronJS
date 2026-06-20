import { useState } from 'react'

interface PrintDialogProps {
  open: boolean
  title: string
  totalCount: number
  onPrint: (range: { start: number; end: number } | 'all') => void
  onClose: () => void
}

export default function PrintDialog({ open, title, totalCount, onPrint, onClose }: PrintDialogProps) {
  const [mode, setMode] = useState<'all' | 'range'>('all')
  const [start, setStart] = useState('1')
  const [end, setEnd] = useState(String(totalCount))
  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-md w-full mx-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>&#10005;</button>
        </div>

        <p className="text-sm mb-4" style={{ color: textSecondary }}>{"تعداد کل رکوردها: "}<span className="font-bold" style={{ color: textPrimary }}>{totalCount}</span></p>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all" style={{ backgroundColor: mode === 'all' ? 'rgba(0,97,148,0.1)' : 'transparent', border: `1px solid ${mode === 'all' ? '#006194' : cardBorder}` }}>
            <input type="radio" name="printMode" checked={mode === 'all'} onChange={() => setMode('all')} className="accent-[#006194]" />
            <span className="text-sm font-medium" style={{ color: textPrimary }}>{"چاپ همه ("}{totalCount}{" رکورد)"}</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all" style={{ backgroundColor: mode === 'range' ? 'rgba(0,97,148,0.1)' : 'transparent', border: `1px solid ${mode === 'range' ? '#006194' : cardBorder}` }}>
            <input type="radio" name="printMode" checked={mode === 'range'} onChange={() => setMode('range')} className="accent-[#006194]" />
            <span className="text-sm font-medium" style={{ color: textPrimary }}>{"چاپ بازه مشخص"}</span>
          </label>
          {mode === 'range' && (
            <div className="flex items-center gap-3 px-3">
              <div className="flex-1">
                <label className="text-xs block mb-1" style={{ color: textSecondary }}>{"از"}</label>
                <input type="number" min={1} max={totalCount} value={start} onChange={e => setStart(e.target.value)} className="input-field w-full text-sm" />
              </div>
              <span className="mt-4" style={{ color: textSecondary }}>{"تا"}</span>
              <div className="flex-1">
                <label className="text-xs block mb-1" style={{ color: textSecondary }}>{"تا"}</label>
                <input type="number" min={1} max={totalCount} value={end} onChange={e => setEnd(e.target.value)} className="input-field w-full text-sm" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            if (mode === 'all') onPrint('all')
            else onPrint({ start: parseInt(start) || 1, end: parseInt(end) || totalCount })
          }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#006194' }}>{"چاپ"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{"لغو"}</button>
        </div>
      </div>
    </div>
  )
}
