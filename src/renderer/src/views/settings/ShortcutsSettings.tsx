import { useState, useEffect } from 'react'
import { useShortcutsStore, SHORTCUT_CATEGORIES } from '../../store/shortcutsStore'
import { useTheme } from '../../hooks/useTheme'

export default function ShortcutsSettings() {
  const { shortcuts, editingId, setEditingId, updateShortcut, saveShortcuts, resetToDefaults } = useShortcutsStore()
  const [listening, setListening] = useState(false)
  const [conflicts, setConflicts] = useState<string[]>([])

  const { isDark } = useTheme()
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  useEffect(() => {
    if (!listening || !editingId) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const parts: string[] = []
      if (e.ctrlKey) parts.push('Ctrl')
      if (e.shiftKey) parts.push('Shift')
      if (e.altKey) parts.push('Alt')
      if (e.metaKey) parts.push('Meta')
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
      }
      const combo = parts.join('+')
      updateShortcut(editingId, combo)
      setEditingId(null)
      setListening(false)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [listening, editingId])

  useEffect(() => {
    const used = shortcuts.map(s => s.key)
    const dupes = shortcuts.filter(s => used.filter(u => u === s.key).length > 1).map(s => s.id)
    setConflicts([...new Set(dupes)])
  }, [shortcuts])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: textSecondary }}>روی کلید فعلی کلیک کنید و کلید جدید را فشار دهید</p>
        <div className="flex gap-2">
          <button onClick={() => { saveShortcuts() }} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#22c55e' }}>ذخیره</button>
          <button onClick={resetToDefaults} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>بازنشانی</button>
        </div>
      </div>

      {SHORTCUT_CATEGORIES.map((cat) => (
        <div key={cat.key} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="px-4 py-3 font-bold text-sm" style={{ borderBottom: `2px solid ${cardBorder}`, color: textPrimary }}>{cat.label}</div>
          {shortcuts.filter(s => s.category === cat.key).map((shortcut) => {
            const isEditing = editingId === shortcut.id
            const isConflict = conflicts.includes(shortcut.id)
            return (
              <div key={shortcut.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <span className="text-sm" style={{ color: textPrimary }}>{shortcut.label}</span>
                <button
                  onClick={() => { setEditingId(shortcut.id); setListening(true) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all"
                  style={{
                    backgroundColor: isEditing ? '#3b82f6' : isConflict ? '#ef4444' : (isDark ? '#334155' : '#f1f5f9'),
                    color: isEditing ? '#fff' : isConflict ? '#fff' : textPrimary,
                    minWidth: 100,
                  }}
                >
                  {isEditing ? '...' : shortcut.key}
                </button>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
