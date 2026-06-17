import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

interface CategoryItem {
  name: string
  fullName: string
  count: number
  isParent: boolean
}

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [parentCat, setParentCat] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [renameInput, setRenameInput] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [notification, setNotification] = useState('')

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const showNotif = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }

  const loadCategories = async () => {
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      const catMap: Record<string, { count: number; products: string[] }> = {}
      r.data.forEach((p) => {
        if (p.category && p.category.trim()) {
          const cat = p.category.trim()
          if (!catMap[cat]) catMap[cat] = { count: 0, products: [] }
          catMap[cat].count++
          catMap[cat].products.push(p.title)
        }
      })
      const cats: CategoryItem[] = Object.entries(catMap).map(([name, data]) => ({
        name, fullName: name, count: data.count,
        isParent: !name.includes(' > '),
      })).sort((a, b) => {
        if (a.isParent && !b.isParent) return -1
        if (!a.isParent && b.isParent) return 1
        return a.name.localeCompare(b.name)
      })
      setCategories(cats)
    }
  }

  useEffect(() => { loadCategories() }, [])

  const handleAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    const fullName = parentCat ? `${parentCat} > ${name}` : name
    if (categories.some(c => c.fullName === fullName)) { showNotif('این دسته‌بندی قبلاً وجود دارد'); return }

    const r = await window.api.products.getAll()
    if (r.success && r.data && r.data.length > 0) {
      const placeholder = r.data[0]
      await window.api.products.update(placeholder.id, { category: fullName })
      await window.api.products.update(placeholder.id, { category: '' })
    }

    showNotif(`دسته‌بندی "${fullName}" اضافه شد`)
    setNewCatName(''); setParentCat(''); setShowAddForm(false)
    loadCategories()
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
    if (!confirm(`آیا از حذف "${catName}" اطمینان دارید؟ تمام محصولات این دسته‌بندی بدون دسته می‌شوند.`)) return
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      for (const p of r.data) {
        if (p.category === catName || p.category.startsWith(catName + ' > ')) {
          await window.api.products.update(p.id, { category: '' })
        }
      }
      showNotif(`"${catName}" حذف شد`)
      setSelectedCat(null); loadCategories()
    }
  }

  const selectedCatData = categories.find(c => c.fullName === selectedCat)
  const subcategories = selectedCat ? categories.filter(c => c.fullName.startsWith(selectedCat + ' > ')) : []
  const parentCategories = categories.filter(c => c.isParent)

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>{notification}</div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.nav.categories}</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          + افزودن دسته‌بندی
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="rounded-2xl p-5 mb-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#3b82f6' }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>افزودن دسته‌بندی جدید</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>دسته‌بندی والد (اختیاری)</label>
              <select value={parentCat} onChange={(e) => setParentCat(e.target.value)} className="input-field text-sm">
                <option value="">-- بدون والد --</option>
                {parentCategories.map((c) => <option key={c.fullName} value={c.fullName}>{c.fullName}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>نام دسته‌بندی *</label>
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field text-sm" placeholder="نام دسته‌بندی"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }} autoFocus />
            </div>
          </div>
          {parentCat && newCatName && (
            <p className="text-xs mt-2 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)', color: textSecondary }}>
              دسته نهایی: <b style={{ color: textPrimary }}>{parentCat} &gt; {newCatName}</b>
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={handleAddCategory} disabled={!newCatName.trim()} className="btn btn-primary disabled:opacity-40">{fa.admin.create}</button>
            <button onClick={() => { setShowAddForm(false); setNewCatName(''); setParentCat('') }} className="btn btn-danger">{fa.admin.cancel}</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category List */}
        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3 text-sm" style={{ color: textPrimary }}>دسته‌بندی‌ها ({categories.length})</h3>
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.fullName}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${selectedCat === cat.fullName ? 'ring-2 ring-blue-500' : ''}`}
                style={{ backgroundColor: selectedCat === cat.fullName ? 'rgba(59,130,246,0.1)' : cat.isParent ? 'var(--bg-tertiary)' : 'transparent' }}
                onClick={() => { setSelectedCat(selectedCat === cat.fullName ? null : cat.fullName); setRenameInput(cat.fullName) }}>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ backgroundColor: selectedCat === cat.fullName ? '#3b82f6' : 'var(--bg-card)', color: selectedCat === cat.fullName ? '#fff' : textSecondary }}>
                    {cat.count}
                  </span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: textPrimary }}>{cat.isParent ? cat.name : `↳ ${cat.name}`}</div>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>
                هیچ دسته‌بندی وجود ندارد
              </p>
            )}
          </div>
        </div>

        {/* Category Details */}
        <div className="lg:col-span-2 rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          {selectedCatData ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{selectedCatData.fullName}</h3>
                  <p className="text-sm" style={{ color: textSecondary }}>{selectedCatData.count} محصول در این دسته‌بندی</p>
                </div>
                <button onClick={() => handleDeleteCategory(selectedCatData.fullName)} className="btn btn-danger text-sm">
                  {fa.admin.delete} دسته‌بندی
                </button>
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
                    placeholder="نام زیردسته" onKeyDown={(e) => { if (e.key === 'Enter' && newCatName.trim()) { handleAddCategory(); setParentCat(selectedCatData.fullName) } }} />
                  <button onClick={() => { setParentCat(selectedCatData.fullName); handleAddCategory() }} disabled={!newCatName.trim()}
                    className="btn btn-success text-sm disabled:opacity-40">افزودن</button>
                </div>
              </div>

              {/* Subcategories */}
              {subcategories.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-bold mb-2" style={{ color: textPrimary }}>زیردسته‌ها ({subcategories.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {subcategories.map((sub) => (
                      <div key={sub.fullName} className="flex items-center gap-1 px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <span className="text-sm" style={{ color: textPrimary }}>{sub.name}</span>
                        <span className="text-[10px]" style={{ color: textSecondary }}>({sub.count})</span>
                        <button onClick={() => handleDeleteCategory(sub.fullName)} className="text-[10px] px-1" style={{ color: '#ef4444' }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products in this category */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: textPrimary }}>محصولات ({selectedCatData.count})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const r = categories.find(c => c.fullName === selectedCatData.fullName)
                    if (!r) return null
                    return null
                  })()}
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
