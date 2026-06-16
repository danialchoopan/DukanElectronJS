import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')
  const [notification, setNotification] = useState('')

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const showNotif = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }

  const loadCategories = async () => {
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      const catMap: Record<string, number> = {}
      r.data.forEach((p) => {
        if (p.category) catMap[p.category] = (catMap[p.category] || 0) + 1
      })
      setCategories(Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count))
    }
  }

  useEffect(() => { loadCategories() }, [])

  const handleRenameCategory = async (oldName: string) => {
    if (!renameInput.trim() || renameInput.trim() === oldName) return
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      for (const p of r.data) {
        if (p.category === oldName) {
          await window.api.products.update(p.id, { category: renameInput.trim() })
        }
      }
      showNotif(`"${oldName}" به "${renameInput.trim()}" تغییر کرد`)
      setRenameInput('')
      setSelectedCategory(null)
      loadCategories()
    }
  }

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی "${catName}" اطمینان دارید؟`)) return
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      for (const p of r.data) {
        if (p.category === catName) {
          await window.api.products.update(p.id, { category: '' })
        }
      }
      showNotif(`"${catName}" حذف شد`)
      loadCategories()
    }
  }

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>{notification}</div>
      )}

      <h2 className="text-xl font-bold mb-4" style={{ color: textPrimary }}>{fa.nav.categories}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rename Category */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>تغییر نام دسته‌بندی</h3>
          {selectedCategory ? (
            <div>
              <p className="text-sm mb-2" style={{ color: textSecondary }}>انتخاب شده: <b style={{ color: textPrimary }}>{selectedCategory}</b></p>
              <div className="flex gap-2">
                <input value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="input-field flex-1" placeholder="نام جدید" />
                <button onClick={() => handleRenameCategory(selectedCategory)} className="btn btn-primary">تغییر نام</button>
                <button onClick={() => { setSelectedCategory(null); setRenameInput('') }} className="btn btn-danger">{fa.admin.cancel}</button>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: textSecondary }}>روی یک دسته‌بندی کلیک کنید تا نام آن را تغییر دهید</p>
          )}
        </div>

        {/* Category List */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>دسته‌بندی‌ها ({categories.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer"
                style={{ backgroundColor: selectedCategory === cat.name ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)' }}
                onClick={() => { setSelectedCategory(cat.name); setRenameInput(cat.name) }}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{
                    backgroundColor: selectedCategory === cat.name ? '#3b82f6' : 'var(--bg-card)',
                    color: selectedCategory === cat.name ? '#fff' : textSecondary,
                  }}>{cat.count}</span>
                  <span className="text-sm font-medium" style={{ color: textPrimary }}>{cat.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.name) }}
                  className="text-xs px-2 py-1 rounded" style={{ color: '#ef4444' }}>حذف</button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-center py-4 text-sm" style={{ color: textSecondary }}>هیچ دسته‌بندی وجود ندارد</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
