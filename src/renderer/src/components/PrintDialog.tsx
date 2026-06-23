import { useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'

interface PrintColumn {
  key: string
  label: string
  visible?: boolean
}

interface PrintDialogProps {
  open: boolean
  title: string
  totalCount: number
  columns?: PrintColumn[]
  onPrint: (range: { start: number; end: number } | 'all', selectedColumns?: string[]) => void
  onClose: () => void
}

export default function PrintDialog({ open, title, totalCount, columns, onPrint, onClose }: PrintDialogProps) {
  const [mode, setMode] = useState<'all' | 'range'>('all')
  const [start, setStart] = useState('1')
  const [end, setEnd] = useState(String(totalCount))
  const [selectedCols, setSelectedCols] = useState<Set<string>>(
    () => new Set(columns?.filter(c => c.visible !== false).map(c => c.key) || [])
  )
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const cBg = isDark ? '#1e293b' : '#ffffff'
  const cBorder = isDark ? '#334155' : '#e2e8f0'
  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const primary = '#006194'

  if (!open) return null

  const toggleCol = (key: string) => {
    setSelectedCols(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: cBg, border: `1px solid ${cBorder}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${cBorder}` }}>
          <h3 className="text-base font-extrabold" style={{ color: tPri }}>{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs mb-4" style={{ color: tSec }}>تعداد کل رکوردها: <span className="font-bold" style={{ color: tPri }}>{totalCount}</span></p>

          {/* Print mode */}
          <div className="space-y-2 mb-4">
            <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{ backgroundColor: mode === 'all' ? primary + '10' : 'transparent', border: `1px solid ${mode === 'all' ? primary : cBorder}` }}>
              <input type="radio" name="printMode" checked={mode === 'all'} onChange={() => setMode('all')} style={{ accentColor: primary }} />
              <span className="text-sm font-medium" style={{ color: tPri }}>چاپ همه ({totalCount} رکورد)</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{ backgroundColor: mode === 'range' ? primary + '10' : 'transparent', border: `1px solid ${mode === 'range' ? primary : cBorder}` }}>
              <input type="radio" name="printMode" checked={mode === 'range'} onChange={() => setMode('range')} style={{ accentColor: primary }} />
              <span className="text-sm font-medium" style={{ color: tPri }}>چاپ بازه مشخص</span>
            </label>
            {mode === 'range' && (
              <div className="flex items-center gap-3 px-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>از</label>
                  <input type="number" min={1} max={totalCount} value={start} onChange={e => setStart(e.target.value)} className="input-field w-full text-sm" />
                </div>
                <span className="mt-4 text-xs" style={{ color: tSec }}>تا</span>
                <div className="flex-1">
                  <label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>تا</label>
                  <input type="number" min={1} max={totalCount} value={end} onChange={e => setEnd(e.target.value)} className="input-field w-full text-sm" />
                </div>
              </div>
            )}
          </div>

          {/* Column selection */}
          {columns && columns.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ color: tPri }}>ستون‌های چاپ</span>
                <button onClick={() => setSelectedCols(selectedCols.size === columns.length ? new Set() : new Set(columns.map(c => c.key)))}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ color: primary, backgroundColor: primary + '10' }}>
                  {selectedCols.size === columns.length ? 'حذف همه' : 'انتخاب همه'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {columns.map(col => (
                  <label key={col.key} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                    style={{ backgroundColor: selectedCols.has(col.key) ? primary + '10' : 'transparent', border: `1px solid ${selectedCols.has(col.key) ? primary : cBorder}` }}>
                    <input type="checkbox" checked={selectedCols.has(col.key)} onChange={() => toggleCol(col.key)}
                      style={{ accentColor: primary }} />
                    <span className="text-xs font-bold" style={{ color: selectedCols.has(col.key) ? primary : tSec }}>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-3" style={{ borderTop: `1px solid ${cBorder}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: tSec }}>لغو</button>
          <button onClick={() => {
            const cols = columns ? Array.from(selectedCols) : undefined
            if (mode === 'all') onPrint('all', cols)
            else onPrint({ start: parseInt(start) || 1, end: parseInt(end) || totalCount }, cols)
          }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)`, boxShadow: `0 4px 12px ${primary}33` }}>
            چاپ
          </button>
        </div>
      </div>
    </div>
  )
}
