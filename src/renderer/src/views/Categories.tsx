import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [newSubCategory, setNewSubCategory] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    if (categories.some(c => c.name === newCategory.trim())) {
      showNotif('این دسته‌بندی قبلاً وجود دارد')
      return
    }
    const r = await window.api.products.create({
      title: newCategory.trim(), purchase_price: 0, sale_price: 0, stock: 0, category: newCategory.trim(), isLoose: false,
    })
    if (r.success) {
      showNotif(`${newCategory} اضافه شد`)
      setNewCategory('')
      loadCategories()
    }
  }

  const handleAddSubCategory = async () => {
    if (!newSubCategory.trim() || !selectedCategory) return
    const fullName = `${selectedCategory} > ${newSubCategory.trim()}`
    if (categories.some(c => c.name === fullName)) {
      showNotif('این زیردسته قبلاً وجود دارد')
      return
    }
    const r = await window.api.products.create({
      title: newSubCategory.trim(), purchase_price: 0, sale_price: 0, stock: 0, category: fullName, isLoose: false,
    })
    if (r.success) {
      showNotif(`${fullName} اضافه شد`)
      setNewSubCategory('')
      loadCategories()
    }
  }

  const handleDeleteCategory = async (catName: string) => {
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      const products = r.data.filter((p) => p.category === catName || p.category.startsWith(catName + ' > '))
      for (const p of products) {
        await window.api.products.delete(p.id)
      }
      showNotif(`${catName} حذف شد`)
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
        {/* Add Category */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>افزودن دسته‌بندی</h3>
          <div className="flex gap-2">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-field flex-1" placeholder="نام دسته‌بندی جدید" />
            <button onClick={handleAddCategory} className="btn btn-primary">افزودن</button>
          </div>

          {selectedCategory && (
            <div className="mt-4">
              <h4 className="text-sm font-bold mb-2" style={{ color: textPrimary }}>افزودن زیردسته برای: {selectedCategory}</h4>
              <div className="flex gap-2">
                <input value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} className="input-field flex-1" placeholder="نام زیردسته" />
                <button onClick={handleAddSubCategory} className="btn btn-success">افزودن</button>
              </div>
            </div>
          )}
        </div>

        {/* Category List */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>دسته‌بندی‌ها ({categories.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: selectedCategory === cat.name ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)' }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: selectedCategory === cat.name ? '#3b82f6' : 'var(--bg-tertiary)', color: selectedCategory === cat.name ? '#fff' : textSecondary }}>
                    {cat.count}
                  </button>
                  <span className="text-sm font-medium" style={{ color: textPrimary }}>{cat.name}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedCategory(cat.name)} className="text-xs px-2 py-1 rounded" style={{ color: '#3b82f6' }}>
                    {selectedCategory === cat.name ? 'انتخاب شده' : 'زیردسته'}
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.name)} className="text-xs px-2 py-1 rounded" style={{ color: '#ef4444' }}>حذف</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="text-center py-4 text-sm" style={{ color: textSecondary }}>هیچ دسته‌بندی وجود ندارد</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
