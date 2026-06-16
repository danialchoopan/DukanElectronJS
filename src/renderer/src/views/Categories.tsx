import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [categories, setCategories] = useState<{ name: string; count: number; products: string[] }[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [renameInput, setRenameInput] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
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
      setCategories(Object.entries(catMap).map(([name, data]) => ({ name, count: data.count, products: data.products })).sort((a, b) => b.count - a.count))
    }
  }

  useEffect(() => { loadCategories() }, [])

  const handleAddCategory = async () => {
    const name = newCatName.trim()
    if (!name) return
    if (categories.some(c => c.name === name)) { showNotif('این دسته‌بندی قبلاً وجود دارد'); return }
    await window.api.products.create({ title: `---${name}---`, purchase_price: 0, sale_price: 0, stock: 0, category: name, isLoose: false })
    showNotif(`دسته‌بندی "${name}" اضافه شد`)
    setNewCatName('')
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
      setRenameInput(''); setSelectedCat(null); loadCategories()
    }
  }

  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`آیا از حذف دسته‌بندی "${catName}" اطمینان دارید؟`)) return
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      for (const p of r.data) {
        if (p.category === catName) await window.api.products.update(p.id, { category: '' })
      }
      showNotif(`"${catName}" حذف شد`); loadCategories()
    }
  }

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>{notification}</div>}

      <h2 className="text-xl font-bold mb-4" style={{ color: textPrimary }}>{fa.nav.categories}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add / Rename Category */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>افزودن دسته‌بندی</h3>
          <div className="flex gap-2 mb-4">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field flex-1" placeholder="نام دسته‌بندی جدید"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }} />
            <button onClick={handleAddCategory} className="btn btn-primary">{fa.admin.create}</button>
          </div>

          {selectedCat && (
            <div className="pt-3" style={{ borderTop: '1px solid ' + cardBorder }}>
              <h4 className="text-sm font-bold mb-2" style={{ color: textPrimary }}>تغییر نام: {selectedCat}</h4>
              <div className="flex gap-2">
                <input value={renameInput} onChange={(e) => setRenameInput(e.target.value)} className="input-field flex-1" placeholder="نام جدید"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCategory(selectedCat) }} />
                <button onClick={() => handleRenameCategory(selectedCat)} className="btn btn-primary">تغییر</button>
                <button onClick={() => { setSelectedCat(null); setRenameInput('') }} className="btn btn-danger">{fa.admin.cancel}</button>
              </div>
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>دسته‌بندی‌ها ({categories.length})</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.name} className="p-3 rounded-xl transition-all cursor-pointer"
                style={{ backgroundColor: selectedCat === cat.name ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)' }}
                onClick={() => { setSelectedCat(cat.name); setRenameInput(cat.name) }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{
                      backgroundColor: selectedCat === cat.name ? '#3b82f6' : 'var(--bg-card)',
                      color: selectedCat === cat.name ? '#fff' : textSecondary,
                    }}>{cat.count}</span>
                    <span className="text-sm font-bold" style={{ color: textPrimary }}>{cat.name}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.name) }}
                    className="text-xs px-2 py-1 rounded hover:bg-red-100" style={{ color: '#ef4444' }}>{fa.admin.delete}</button>
                </div>
                {cat.products.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {cat.products.slice(0, 5).map((p, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-card)', color: textSecondary }}>{p}</span>
                    ))}
                    {cat.products.length > 5 && <span className="text-[10px]" style={{ color: textSecondary }}>+{cat.products.length - 5}</span>}
                  </div>
                )}
              </div>
            ))}
            {categories.length === 0 && <p className="text-center py-4 text-sm" style={{ color: textSecondary }}>هیچ دسته‌بندی وجود ندارد</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
