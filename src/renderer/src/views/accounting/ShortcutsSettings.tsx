import { useState, useEffect, useCallback } from 'react'
import { useShortcutsStore, actionLabels, defaultShortcuts, findConflicts, buildKeyCombo, type ShortcutAction } from '../../store/shortcutsStore'
import { useSettingsStore } from '../../store/settingsStore'

type ShortcutGroup = { title: string; actions: ShortcutAction[] }

const groups: ShortcutGroup[] = [
  { title: 'ناوبری', actions: ['navigate:pos', 'navigate:dashboard', 'navigate:inventory', 'navigate:accounting', 'navigate:sales', 'navigate:categories', 'navigate:customers', 'navigate:admin', 'navigate:help'] },
  { title: 'عملیات فروش', actions: ['pos:hold', 'pos:resume1', 'pos:resume2', 'pos:resume3', 'pos:payCash', 'pos:payCard', 'pos:payLedger', 'pos:search'] },
  { title: 'عمومی', actions: ['global:fullscreen', 'global:toggleTheme'] },
]

const groupsEn: ShortcutGroup[] = [
  { title: 'Navigation', actions: ['navigate:pos', 'navigate:dashboard', 'navigate:inventory', 'navigate:accounting', 'navigate:sales', 'navigate:categories', 'navigate:customers', 'navigate:admin', 'navigate:help'] },
  { title: 'POS Actions', actions: ['pos:hold', 'pos:resume1', 'pos:resume2', 'pos:resume3', 'pos:payCash', 'pos:payCard', 'pos:payLedger', 'pos:search'] },
  { title: 'Global', actions: ['global:fullscreen', 'global:toggleTheme'] },
]

export default function ShortcutsSettings() {
  const { shortcuts, editingAction, setShortcut, resetShortcuts, setEditingAction, saveToStorage } = useShortcutsStore()
  const { theme } = useSettingsStore()
  const isDark = theme === 'dark'
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isFa = document.documentElement.lang === 'fa'
  const activeGroups = isFa ? groups : groupsEn

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#475569'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editingAction) return
    e.preventDefault()
    e.stopPropagation()

    const key = buildKeyCombo(e)
    if (key === 'Escape') {
      setEditingAction(null)
      setConflictWarning(null)
      return
    }

    const conflicts = findConflicts(shortcuts, editingAction, key)
    if (conflicts.length > 0) {
      const conflictLabels = conflicts.map(c => actionLabels[c]).join(', ')
      setConflictWarning(`تداخل با: ${conflictLabels}`)
    } else {
      setConflictWarning(null)
    }

    setShortcut(editingAction, key)
    setEditingAction(null)
  }, [editingAction, shortcuts, setShortcut, setEditingAction])

  useEffect(() => {
    if (editingAction) {
      window.addEventListener('keydown', handleKeyDown, true)
      return () => window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [editingAction, handleKeyDown])

  const handleSave = async () => {
    await saveToStorage()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    resetShortcuts()
    setConflictWarning(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg" style={{ color: textPrimary }}>تنظیمات میانبرها</h3>
        <div className="flex gap-2">
          <button onClick={handleReset}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: isDark ? '#334155' : '#e2e8f0', color: textSecondary }}>
            بازنشانی پیش‌فرض
          </button>
          <button onClick={handleSave}
            className="btn-primary text-sm px-6 py-2">
            {saved ? 'ذخیره شد' : 'ذخیره'}
          </button>
        </div>
      </div>

      {conflictWarning && (
        <div className="rounded-xl p-3 text-sm font-bold"
          style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' }}>
          {conflictWarning}
        </div>
      )}

      {editingAction && (
        <div className="rounded-xl p-4 text-center"
          style={{ backgroundColor: cardBg, border: `2px solid #3b82f6` }}>
          <p className="text-sm mb-2" style={{ color: textSecondary }}>کلید مورد نظر را فشار دهید</p>
          <p className="font-bold text-lg" style={{ color: textPrimary }}>{actionLabels[editingAction]}</p>
          <p className="text-xs mt-2" style={{ color: textSecondary }}>ESC برای لغو</p>
        </div>
      )}

      {activeGroups.map((group) => (
        <div key={group.title} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h4 className="font-bold mb-3" style={{ color: textPrimary }}>{group.title}</h4>
          <div className="space-y-2">
            {group.actions.map((action) => {
              const currentKey = shortcuts[action]
              const isDefault = currentKey === defaultShortcuts[action]
              const isEditing = editingAction === action

              return (
                <div key={action} className="flex items-center justify-between py-2 px-3 rounded-xl transition-all"
                  style={{ backgroundColor: isEditing ? (isDark ? '#1e3a5f' : '#eff6ff') : 'transparent' }}>
                  <span className="text-sm" style={{ color: textPrimary }}>{actionLabels[action]}</span>
                  <div className="flex items-center gap-2">
                    {!isDefault && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0', color: textSecondary }}>
                        تغییر یافته
                      </span>
                    )}
                    <button onClick={() => setEditingAction(isEditing ? null : action)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all min-w-[80px] text-center"
                      style={{
                        background: isEditing
                          ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                          : inputBg,
                        color: isEditing ? '#ffffff' : textPrimary,
                        border: `1px solid ${isEditing ? '#3b82f6' : cardBorder}`,
                        boxShadow: isEditing ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
                      }}>
                      {isEditing ? '...' : currentKey}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
