import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

interface Category {
  id: number
  name: string
  parentId: number | null
  createdAt: string
}

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [selectedCat, setSelectedCat] = useState<Category | null>(null)
  const [renameInput, setRenameInput] = useState('')
  const [notification, setNotification] = useState('')

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const showNotif = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }

  const loadCategories = async () => {
    const r = await window.api.categories.getAll()
    if (r.success && r.data) setCategories(r.data)
  }

  useEffect(() => { loadCategories() }, [])

  const parentCategories = categories.filter(c => !c.parentId)
  const subcategories = selectedCat ? categories.filter(c => c.parentId === selectedCat.id) : []

  const handleAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    if (categories.some(c => c.name === name)) { showNotif('این دسته‌بندی قبلاً وجود دارد'); return }
    await window.api.categories.create({ name, parentId: selectedCat?.id || undefined })
    showNotif(`"${name}" اضافه شد`)
    setNewCatName(''); loadCategories()
  }

  const handleRenameCategory = async () => {
    if (!selectedCat || !renameInput.trim() || renameInput.trim() === selectedCat.name) return
    await window.api.categories.update(selectedCat.id, renameInput.trim())
    showNotif(`"${selectedCat.name}" به "${renameInput.trim()}" تغییر کرد`)
    setSelectedCat(null); setRenameInput(''); loadCategories()
  }

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`آیا از حذف "${cat.name}" اطمینان دارید؟`)) return
    await window.api.categories.delete(cat.id)
    showNotif(`"${cat.name}" حذف شد`)
    if (selectedCat?.id === cat.id) setSelectedCat(null)
    loadCategories()
  }

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>{notification}</div>}

      <h2 className="text-xl font-bold mb-4" style={{ color: textPrimary }}>{fa.nav.categories}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Categories */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ color: textPrimary }}>دسته‌بندی‌ها ({parentCategories.length})</h3>
            <button onClick={() => { setSelectedCat(null); setNewCatName('') }} className="btn btn-primary text-xs">+ افزودن</button>
          </div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {parentCategories.map((cat) => {
              const isActive = selectedCat?.id === cat.id
              const subs = categories.filter(c => c.parentId === cat.id)
              return (
                <div key={cat.id}>
                  <div className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)' }}
                    onClick={() => { setSelectedCat(isActive ? null : cat); setRenameInput(cat.name) }}>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: isActive ? '#3b82f6' : 'var(--bg-card)', color: isActive ? '#fff' : textSecondary }}>
                        {subs.length}
                      </span>
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>{cat.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat) }}
                      className="text-[10px] px-1.5 py-0.5 rounded hover:bg-red-100" style={{ color: '#ef4444' }}>×</button>
                  </div>
                </div>
              )
            })}
            {parentCategories.length === 0 && <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>هیچ دسته‌بندی وجود ندارد</p>}
          </div>
        </div>

        {/* Category Details */}
        <div className="lg:col-span-2 rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          {selectedCat ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{selectedCat.name}</h3>
                  <p className="text-sm" style={{ color: textSecondary }}>{subcategories.length} زیردسته</p>
                </div>
                <button onClick={() => handleDeleteCategory(selectedCat)} className="btn btn-danger text-sm">{fa.admin.delete}</button>
              </div>

              <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>تغییر نام</label>
                <div className="flex gap-2">
                  <input value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="input-field text-sm flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory() }} />
                  <button onClick={handleRenameCategory} disabled={renameInput === selectedCat.name || !renameInput.trim()}
                    className="btn btn-primary text-sm disabled:opacity-40">{fa.admin.save}</button>
                </div>
              </div>

              <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>افزودن زیردسته</label>
                <div className="flex gap-2">
                  <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field text-sm flex-1"
                    placeholder="نام زیردسته" onKeyDown={(e) => { if (e.key === 'Enter' && newCatName.trim()) handleAddCategory() }} />
                  <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="btn btn-success text-sm disabled:opacity-40">+ افزودن</button>
                </div>
              </div>

              <h4 className="text-sm font-bold mb-2" style={{ color: textPrimary }}>زیردسته‌ها ({subcategories.length})</h4>
              {subcategories.length > 0 ? (
                <div className="space-y-1">
                  {subcategories.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <span className="text-sm" style={{ color: textPrimary }}>{sub.name}</span>
                      <button onClick={() => handleDeleteCategory(sub)} className="text-xs px-1.5 py-0.5 rounded hover:bg-red-100" style={{ color: '#ef4444' }}>×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm py-2" style={{ color: textSecondary }}>هنوز زیردسته‌ای اضافه نشده</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <p className="text-sm" style={{ color: textSecondary }}>یک دسته‌بندی را از لیست انتخاب کنید</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
