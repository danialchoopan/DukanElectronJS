import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [flatCategories, setFlatCategories] = useState<{ name: string; fullName: string; count: number }[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [parentCat, setParentCat] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
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
      setFlatCategories(Object.entries(catMap).map(([name, count]) => ({ name, fullName: name, count })).sort((a, b) => a.name.localeCompare(b.name)))
    }
  }

  useEffect(() => { loadCategories() }, [])

  const handleAddCategory = async () => {
    const fullName = parentCat ? `${parentCat} > ${newCatName.trim()}` : newCatName.trim()
    if (!newCatName.trim()) return
    if (flatCategories.some(c => c.fullName === fullName)) { showNotif('این دسته‌بندی قبلاً وجود دارد'); return }
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      let found = false
      for (const p of r.data) {
        if (p.category === fullName) { found = true; break }
      }
      if (!found && r.data.length > 0) {
        const placeholder = r.data[0]
        await window.api.products.update(placeholder.id, { category: fullName })
        await window.api.products.update(placeholder.id, { category: '' })
      }
    }
    showNotif(`دسته‌بندی "${fullName}" اضافه شد`)
    setNewCatName(''); setParentCat('')
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
    const r = await window.api.products.getAll()
    if (r.success && r.data) {
      for (const p of r.data) {
        if (p.category === catName || p.category.startsWith(catName + ' > ')) {
          await window.api.products.update(p.id, { category: '' })
        }
      }
      showNotif(`"${catName}" حذف شد`); loadCategories()
    }
  }

  const parentCategories = flatCategories.filter(c => !c.fullName.includes(' > '))

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>{notification}</div>}

      <h2 className="text-xl font-bold mb-4" style={{ color: textPrimary }}>{fa.nav.categories}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Add Category */}
        <div className="rounded-2xl p-5 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>افزودن دسته‌بندی</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>دسته‌بندی والد (اختیاری)</label>
              <select value={parentCat} onChange={(e) => setParentCat(e.target.value)} className="input-field text-sm">
                <option value="">-- بدون والد --</option>
                {parentCategories.map((c) => <option key={c.fullName} value={c.fullName}>{c.fullName}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="input-field flex-1" placeholder="نام دسته‌بندی"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory() }} />
              <button onClick={handleAddCategory} className="btn btn-primary">{fa.admin.create}</button>
            </div>
            {parentCat && <p className="text-xs" style={{ color: textSecondary }}>نام نهایی: {parentCat} &gt; {newCatName || '...'}</p>}
          </div>

          {selectedCat && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
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
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>دسته‌بندی‌ها ({flatCategories.length})</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {flatCategories.map((cat) => {
              const isSub = cat.fullName.includes(' > ')
              return (
                <div key={cat.fullName} className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${isSub ? 'mr-6' : ''}`}
                  style={{ backgroundColor: selectedCat === cat.fullName ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)' }}
                  onClick={() => { setSelectedCat(cat.fullName); setRenameInput(cat.fullName) }}>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{
                      backgroundColor: selectedCat === cat.fullName ? '#3b82f6' : 'var(--bg-card)',
                      color: selectedCat === cat.fullName ? '#fff' : textSecondary,
                    }}>{cat.count}</span>
                    <div>
                      <span className="text-sm font-bold" style={{ color: textPrimary }}>{cat.name}</span>
                      {isSub && <span className="text-xs mr-2" style={{ color: textSecondary }}>در {cat.fullName.split(' > ')[0]}</span>}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.fullName) }}
                    className="text-xs px-2 py-1 rounded hover:bg-red-100" style={{ color: '#ef4444' }}>{fa.admin.delete}</button>
                </div>
              )
            })}
            {flatCategories.length === 0 && <p className="text-center py-4 text-sm" style={{ color: textSecondary }}>هیچ دسته‌بندی وجود ندارد</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
