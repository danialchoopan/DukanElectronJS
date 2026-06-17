import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [categories, setCategories] = useState<{ name: string; fullName: string; count: number }[]>([])
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [newCatName, setNewCatName] = useState('')
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
        if (p.category && p.category.trim()) {
          catMap[p.category.trim()] = (catMap[p.category.trim()] || 0) + 1
        }
      })
      setCategories(Object.entries(catMap).map(([name, count]) => ({ name, fullName: name, count })).sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  useEffect(() => { loadCategories() }, [])

  const parentCategories = categories.filter(c => !c.fullName.includes(' > '))
  const subcategories = selectedCat ? categories.filter(c => c.fullName.startsWith(selectedCat + ' > ')) : []

  const handleAddSubcategory = async () => {
    if (!newCatName.trim() || !selectedCat) return
    const fullName = `${selectedCat} > ${newCatName.trim()}`
    if (categories.some(c => c.fullName === fullName)) { showNotif('این زیردسته قبلاً وجود دارد'); return }
    const r = await window.api.products.getAll()
    if (r.success && r.data && r.data.length > 0) {
      const p = r.data[0]
      await window.api.products.update(p.id, { category: fullName })
      await window.api.products.update(p.id, { category: '' })
    }
    showNotif(`زیردسته "${fullName}" اضافه شد`)
    setNewCatName(''); loadCategories()
  }

  const handleRenameCategory = async (oldName: string) => {
    if (!renameInput.trim() || renameInput.trim() === oldName) return
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      for (const p of r.data) {
        if (p.category === oldName) await window.api.products.update(p.id, { category: renameInput.trim() })
      }
      showNotif(`"${oldName}" به "${renameInput.trim()}" تغییر کرد`)
      setSelectedCat(null); setRenameInput(''); loadCategories()
    }
  }

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`آیا از حذف "${catName}" اطمینان دارید؟`)) return
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      for (const p of r.data) {
        if (p.category === catName || p.category.startsWith(catName + ' > ')) {
          await window.api.products.update(p.id, { category: '' })
        }
      }
      showNotif(`"${catName}" حذف شد`); setSelectedCat(null); loadCategories()
    }
  }

  const selectedCatData = categories.find(c => c.fullName === selectedCat)

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>{notification}</div>}

      <h2 className="text-xl font-bold mb-4" style={{ color: textPrimary }}>{fa.nav.categories}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Categories */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3 text-sm" style={{ color: textPrimary }}>دسته‌بندی‌ها ({parentCategories.length})</h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {parentCategories.map((cat) => {
              const isActive = selectedCat === cat.fullName
              const subs = categories.filter(c => c.fullName.startsWith(cat.fullName + ' > '))
              return (
                <div key={cat.fullName}>
                  <div className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)' }}
                    onClick={() => { setSelectedCat(isActive ? null : cat.fullName); setRenameInput(cat.fullName || '') }}>
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: isActive ? '#3b82f6' : 'var(--bg-card)', color: isActive ? '#fff' : textSecondary }}>
                        {cat.count}
                      </span>
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>{cat.name}</span>
                      {subs.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-card)', color: textSecondary }}>{subs.length} زیردسته</span>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.fullName) }}
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
          {selectedCatData ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{selectedCatData.fullName}</h3>
                  <p className="text-sm" style={{ color: textSecondary }}>{selectedCatData.count} محصول + {subcategories.length} زیردسته</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteCategory(selectedCatData.fullName)} className="btn btn-danger text-sm">{fa.admin.delete}</button>
                </div>
              </div>

              {/* Rename */}
              <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>تغییر نام</label>
                <div className="flex gap-2">
                  <input value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="input-field text-sm flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory(selectedCatData.fullName) }} />
                  <button onClick={() => handleRenameCategory(selectedCatData.fullName)} disabled={renameInput === selectedCatData.fullName || !renameInput.trim()}
                    className="btn btn-primary text-sm disabled:opacity-40">{fa.admin.save}</button>
                </div>
              </div>

              {/* Add Subcategory */}
              <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>افزودن زیردسته</label>
                <div className="flex gap-2">
                  <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field text-sm flex-1"
                    placeholder="نام زیردسته" onKeyDown={(e) => { if (e.key === 'Enter' && newCatName.trim()) handleAddSubcategory() }} />
                  <button onClick={handleAddSubcategory} disabled={!newCatName.trim()} className="btn btn-success text-sm disabled:opacity-40">افزودن</button>
                </div>
              </div>

              {/* Subcategories */}
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-2" style={{ color: textPrimary }}>زیردسته‌ها ({subcategories.length})</h4>
                {subcategories.length > 0 ? (
                  <div className="space-y-1">
                    {subcategories.map((sub) => (
                      <div key={sub.fullName} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: textPrimary }}>{sub.name.replace(selectedCatData.fullName + ' > ', '')}</span>
                          <span className="text-[10px]" style={{ color: textSecondary }}>({sub.count} محصول)</span>
                        </div>
                        <button onClick={() => handleDeleteCategory(sub.fullName)} className="text-xs px-1.5 py-0.5 rounded hover:bg-red-100" style={{ color: '#ef4444' }}>×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm py-2" style={{ color: textSecondary }}>هنوز زیردسته‌ای اضافه نشده</p>
                )}
              </div>

              {/* Add subcategory quick input */}
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>افزودن زیردسته جدید</label>
                <div className="flex gap-2">
                  <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field text-sm flex-1"
                    placeholder="نام زیردسته" onKeyDown={(e) => { if (e.key === 'Enter' && newCatName.trim()) handleAddSubcategory() }} />
                  <button onClick={handleAddSubcategory} disabled={!newCatName.trim()} className="btn btn-success text-sm disabled:opacity-40">+ افزودن</button>
                </div>
              </div>
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
