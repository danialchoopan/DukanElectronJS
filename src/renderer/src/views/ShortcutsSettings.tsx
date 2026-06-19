import { useShortcutsStore, SHORTCUT_CATEGORIES } from '../store/shortcutsStore'
import { useSettingsStore } from '../store/settingsStore'

export default function ShortcutsSettings() {
  const { shortcuts, editingId, setEditingId, updateShortcut, resetToDefaults, saveShortcuts } = useShortcutsStore()
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    let combo = ''
    if (e.ctrlKey || e.metaKey) combo += 'Ctrl+'
    if (e.shiftKey) combo += 'Shift+'
    if (e.altKey) combo += 'Alt+'
    const key = e.key
    if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') return
    if (key === 'Escape') { setEditingId(null); return }
    if (key.startsWith('F') && key.length <= 3) combo += key
    else if (key.length === 1) combo += key.toUpperCase()
    else combo += key

    updateShortcut(id, combo)
    setEditingId(null)
    saveShortcuts()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg" style={{ color: textPrimary }}>میانبرهای کلیدی</h3>
          <p className="text-xs mt-1" style={{ color: textSecondary }}>روی دکمه کلید کلیک کنید و کلید جدید را فشار دهید. برای لغو ESC را بزنید.</p>
        </div>
        <button onClick={() => { resetToDefaults(); saveShortcuts() }} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
          بازنشانی پیش‌فرض
        </button>
      </div>

      {SHORTCUT_CATEGORIES.map((cat) => {
        const catShortcuts = shortcuts.filter(s => s.category === cat.key)
        if (catShortcuts.length === 0) return null
        return (
          <div key={cat.key} className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="px-4 py-2.5 font-bold text-sm" style={{ borderBottom: `1px solid ${cardBorder}`, color: textPrimary }}>
              {cat.label}
            </div>
            <div className="divide-y" style={{ borderColor: cardBorder }}>
              {catShortcuts.map((s) => {
                const isEditing = editingId === s.id
                return (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5"
                    style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{s.label}</span>
                    <button
                      onClick={() => setEditingId(isEditing ? null : s.id)}
                      onKeyDown={isEditing ? (e) => handleKeyDown(e, s.id) : undefined}
                      autoFocus={isEditing}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all min-w-[120px] text-center ${isEditing ? 'animate-pulse ring-2 ring-blue-500' : ''}`}
                      style={{
                        backgroundColor: isEditing ? (isDark ? '#1e3a5f' : '#dbeafe') : (isDark ? '#0f172a' : '#f1f5f9'),
                        color: isEditing ? '#3b82f6' : (isDark ? '#94a3b8' : '#475569'),
                        border: `1px solid ${isEditing ? '#3b82f6' : cardBorder}`,
                      }}>
                      {isEditing ? 'کلید را فشار دهید...' : s.key}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
