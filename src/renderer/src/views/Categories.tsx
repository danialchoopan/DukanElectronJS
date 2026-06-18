import { useState, useEffect, useMemo } from 'react'
import { useSettingsStore } from '../store/settingsStore'

interface Category {
  id: number
  name: string
  slug: string
  parentId: number | null
  level: number
  isActive: boolean
  productCount?: number
  createdAt: string
  children?: Category[]
}

export default function Categories() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [renameInput, setRenameInput] = useState('')
  const [newSubName, setNewSubName] = useState('')
  const [newParentName, setNewParentName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const colors = {
    primary: '#006194',
    outline: '#707881',
    outlineVariant: '#bfc7d2',
    onSurface: '#0d1c2e',
    surfaceContainerLow: '#eff4ff',
  }

  const toastTimer = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadCategories = async () => {
    const r = await window.api.categories.getAll()
    if (r.success && r.data) setCategories(r.data as Category[])
  }

  useEffect(() => { loadCategories() }, [])

  const parentCategories = useMemo(() =>
    categories.filter(c => c.parentId === null),
    [categories]
  )

  const getChildren = (parentId: number) =>
    categories.filter(c => c.parentId === parentId)

  const selectedCat = useMemo(() =>
    categories.find(c => c.id === selectedId) || null,
    [categories, selectedId]
  )

  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return parentCategories
    const q = searchQuery.trim().toLowerCase()
    return parentCategories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      categories.some(ch => ch.parentId === c.id && ch.name.toLowerCase().includes(q))
    )
  }, [parentCategories, categories, searchQuery])

  const filteredChildren = useMemo(() => {
    if (!selectedCat) return []
    const children = getChildren(selectedCat.id)
    if (!searchQuery.trim()) return children
    const q = searchQuery.trim().toLowerCase()
    return children.filter(c => c.name.toLowerCase().includes(q))
  }, [selectedCat, categories, searchQuery])

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectCategory = (cat: Category) => {
    if (selectedId === cat.id) {
      setSelectedId(null)
      return
    }
    setSelectedId(cat.id)
    setRenameInput(cat.name)
    setConfirmDeleteId(null)
    if (!expandedIds.has(cat.id) && getChildren(cat.id).length > 0) {
      setExpandedIds(prev => new Set(prev).add(cat.id))
    }
  }

  const handleAddParent = async () => {
    const name = newParentName.trim()
    if (!name) return
    if (categories.some(c => c.name === name)) { toastTimer('این دسته‌بندی قبلاً وجود دارد', 'error'); return }
    const r = await window.api.categories.create({ name })
    if (r.success) {
      toastTimer(`"${name}" اضافه شد`)
      setNewParentName('')
      loadCategories()
    } else {
      toastTimer(r.error || 'خطا در ایجاد دسته‌بندی', 'error')
    }
  }

  const handleAddSubcategory = async () => {
    if (!selectedCat) return
    const name = newSubName.trim()
    if (!name) return
    if (categories.some(c => c.name === name && c.parentId === selectedCat.id)) {
      toastTimer('این زیردسته قبلاً وجود دارد', 'error'); return
    }
    const r = await window.api.categories.create({ name, parentId: selectedCat.id })
    if (r.success) {
      toastTimer(`"${name}" اضافه شد`)
      setNewSubName('')
      setExpandedIds(prev => new Set(prev).add(selectedCat.id))
      loadCategories()
    } else {
      toastTimer(r.error || 'خطا در ایجاد زیردسته', 'error')
    }
  }

  const handleRename = async () => {
    if (!selectedCat || !renameInput.trim() || renameInput.trim() === selectedCat.name) return
    const r = await window.api.categories.update(selectedCat.id, { name: renameInput.trim() })
    if (r.success) {
      toastTimer('نام تغییر کرد')
      loadCategories()
    } else {
      toastTimer(r.error || 'خطا در تغییر نام', 'error')
    }
  }

  const handleToggleActive = async (id: number) => {
    await window.api.categories.toggleActive(id)
    loadCategories()
  }

  const handleDelete = async (id: number) => {
    const r = await window.api.categories.delete(id)
    if (r.success) {
      toastTimer('دسته‌بندی حذف شد')
      setConfirmDeleteId(null)
      if (selectedId === id) { setSelectedId(null); setConfirmDeleteId(null) }
      loadCategories()
    } else {
      toastTimer(r.error || 'خطا در حذف دسته‌بندی', 'error')
      setConfirmDeleteId(null)
    }
  }

  const totalCategories = categories.length

  const renderTreeItem = (cat: Category) => {
    const children = getChildren(cat.id)
    const isExpanded = expandedIds.has(cat.id)
    const isSelected = selectedId === cat.id
    const hasChildren = children.length > 0

    return (
      <div key={cat.id}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all"
          style={{
            backgroundColor: isSelected ? (isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)') : 'transparent',
            border: isSelected ? `2px solid ${colors.primary}` : '2px solid transparent',
          }}
          onClick={() => selectCategory(cat)}
        >
          {hasChildren ? (
            <button onClick={(e) => toggleExpand(cat.id, e)} className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M3 1L7 5L3 9" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="flex-shrink-0 w-5" />
          )}
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.isActive ? '#22c55e' : '#94a3b8' }} />
          <span className="text-sm font-medium flex-1 truncate" style={{ color: isDark ? '#f1f5f9' : '#0d1c2e' }}>{cat.name}</span>
          {cat.productCount != null && cat.productCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#94a3b8' : '#64748b' }}>
              {cat.productCount}
            </span>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div className="mr-4 border-r-2" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
            {children.map(child => (
              <div key={child.id} className="pr-2">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all"
                  style={{
                    backgroundColor: selectedId === child.id ? (isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)') : 'transparent',
                    border: selectedId === child.id ? `2px solid ${colors.primary}` : '2px solid transparent',
                  }}
                  onClick={() => selectCategory(child)}
                >
                  <span className="w-5" />
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: child.isActive ? '#22c55e' : '#94a3b8' }} />
                  <span className="text-sm font-medium flex-1 truncate" style={{ color: isDark ? '#f1f5f9' : '#0d1c2e' }}>{child.name}</span>
                  {child.productCount != null && child.productCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {child.productCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col" dir="rtl">
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
          style={{ background: toast.type === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left Panel: Category Tree */}
        <div className="flex flex-col rounded-2xl border overflow-hidden" style={{ width: '340px', minWidth: '340px', backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold" style={{ color: isDark ? '#f1f5f9' : '#0d1c2e' }}>دسته‌بندی‌ها</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: colors.primary, color: '#fff' }}>{totalCategories}</span>
            </div>
            <button
              onClick={() => { setSelectedId(null); setConfirmDeleteId(null); setNewParentName('') }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: colors.primary, color: '#fff' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="px-3 pb-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو..."
                className="w-full text-sm px-3 py-2 pr-8 rounded-xl border outline-none"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f1f5f9' : '#0d1c2e',
                }}
              />
              <svg className="absolute right-2.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
                <path d="M9.5 9.5L12.5 12.5" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filteredParents.length > 0 ? (
              filteredParents.map(cat => renderTreeItem(cat))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3 opacity-40">
                  <path d="M8 12L20 4L32 12V28L20 36L8 28V12Z" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
                  <path d="M8 12L20 20M20 20V36M20 20L32 12" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
                </svg>
                <p className="text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                  {searchQuery ? 'نتیجه‌ای یافت نشد' : 'هیچ دسته‌بندی وجود ندارد'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Details */}
        <div className="flex-1 rounded-2xl border overflow-y-auto" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
          {selectedCat ? (
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold" style={{ color: isDark ? '#f1f5f9' : '#0d1c2e' }}>{selectedCat.name}</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {selectedCat.level === 0 ? 'اصلی' : 'زیردسته'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {selectedCat.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(selectedCat.id)}
                    className="relative w-10 h-5 rounded-full transition-colors"
                    style={{ backgroundColor: selectedCat.isActive ? '#22c55e' : isDark ? '#475569' : '#d1d5db' }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
                      style={{ right: selectedCat.isActive ? '2px' : 'auto', left: selectedCat.isActive ? 'auto' : '2px' }}
                    />
                  </button>
                </div>
              </div>

              {/* Rename */}
              <div className="rounded-xl p-4" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : colors.surfaceContainerLow }}>
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>تغییر نام</label>
                <div className="flex gap-2">
                  <input
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename() }}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none"
                    style={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f1f5f9' : '#0d1c2e',
                    }}
                  />
                  <button
                    onClick={handleRename}
                    disabled={renameInput === selectedCat.name || !renameInput.trim()}
                    className="text-sm px-4 py-2 rounded-xl font-bold transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: colors.primary, color: '#fff' }}
                  >
                    ذخیره
                  </button>
                </div>
              </div>

              {/* Add subcategory */}
              <div className="rounded-xl p-4" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : colors.surfaceContainerLow }}>
                <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>افزودن زیردسته</label>
                <div className="flex gap-2">
                  <input
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && newSubName.trim()) handleAddSubcategory() }}
                    placeholder="نام زیردسته"
                    className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none"
                    style={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f1f5f9' : '#0d1c2e',
                    }}
                  />
                  <button
                    onClick={handleAddSubcategory}
                    disabled={!newSubName.trim()}
                    className="text-sm px-4 py-2 rounded-xl font-bold transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: '#16a34a', color: '#fff' }}
                  >
                    افزودن
                  </button>
                </div>
              </div>

              {/* Subcategory list */}
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: isDark ? '#f1f5f9' : '#0d1c2e' }}>
                  زیردسته‌ها ({filteredChildren.length})
                </h4>
                {filteredChildren.length > 0 ? (
                  <div className="space-y-1">
                    {filteredChildren.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.4)' : '#f8fafc' }}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sub.isActive ? '#22c55e' : '#94a3b8' }} />
                          <span className="text-sm font-medium" style={{ color: isDark ? '#f1f5f9' : '#0d1c2e' }}>{sub.name}</span>
                          {sub.productCount != null && sub.productCount > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#94a3b8' : '#64748b' }}>
                              {sub.productCount} کالا
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setConfirmDeleteId(sub.id)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: '#ef4444' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 3.5H11M5.5 3.5V2.5C5.5 2.22 5.72 2 6 2H8C8.28 2 8.5 2.22 8.5 2.5V3.5M10 3.5V11.5C10 11.78 9.78 12 9.5 12H4.5C4.22 12 4 11.78 4 11.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm py-2" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>هنوز زیردسته‌ای اضافه نشده</p>
                )}
              </div>

              {/* Delete confirmation for subcategories */}
              {confirmDeleteId && (
                <div className="rounded-xl p-3" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2', border: '1px solid #ef4444' }}>
                  <p className="text-sm font-bold mb-2" style={{ color: '#ef4444' }}>آیا از حذف این دسته‌بندی اطمینان دارید؟</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(confirmDeleteId)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: '#ef4444', color: '#fff' }}>بله، حذف شود</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: isDark ? '#334155' : '#f1f5f9' }}>لغو</button>
                  </div>
                </div>
              )}

              {/* Delete parent category */}
              <div className="pt-2 border-t" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                {confirmDeleteId === selectedCat.id ? (
                  <div className="rounded-xl p-3" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fee2e2', border: '1px solid #ef4444' }}>
                    <p className="text-sm font-bold mb-2" style={{ color: '#ef4444' }}>آیا از حذف این دسته‌بندی اطمینان دارید؟</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(selectedCat.id)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: '#ef4444', color: '#fff' }}>بله، حذف شود</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: isDark ? '#334155' : '#f1f5f9' }}>لغو</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(selectedCat.id)}
                    className="text-sm px-4 py-2 rounded-xl font-bold transition-colors"
                    style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2', color: '#ef4444' }}
                  >
                    حذف دسته‌بندی
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              {selectedId === null && categories.length === 0 ? (
                /* No categories exist — show add parent form */
                <div className="text-center space-y-4">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto opacity-40">
                    <path d="M10 16L24 6L38 16V32L24 42L10 32V16Z" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
                    <path d="M10 16L24 26M24 26V42M24 26L38 16" stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="1.5" />
                  </svg>
                  <p className="text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>هیچ دسته‌بندی وجود ندارد</p>
                  <div className="rounded-xl p-4 max-w-xs mx-auto" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : colors.surfaceContainerLow }}>
                    <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>افزودن دسته‌بندی اصلی</label>
                    <div className="flex gap-2">
                      <input
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newParentName.trim()) handleAddParent() }}
                        placeholder="نام دسته‌بندی"
                        className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none"
                        style={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                          color: isDark ? '#f1f5f9' : '#0d1c2e',
                        }}
                      />
                      <button
                        onClick={handleAddParent}
                        disabled={!newParentName.trim()}
                        className="text-sm px-4 py-2 rounded-xl font-bold transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: colors.primary, color: '#fff' }}
                      >
                        افزودن
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Category was deselected or not selected yet — show empty state with optional add form */
                <div className="text-center space-y-4 p-6">
                  <div className="rounded-xl p-4 max-w-xs mx-auto" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : colors.surfaceContainerLow }}>
                    <label className="text-xs font-medium block mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>افزودن دسته‌بندی اصلی</label>
                    <div className="flex gap-2">
                      <input
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newParentName.trim()) handleAddParent() }}
                        placeholder="نام دسته‌بندی"
                        className="flex-1 text-sm px-3 py-2 rounded-xl border outline-none"
                        style={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                          color: isDark ? '#f1f5f9' : '#0d1c2e',
                        }}
                      />
                      <button
                        onClick={handleAddParent}
                        disabled={!newParentName.trim()}
                        className="text-sm px-4 py-2 rounded-xl font-bold transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: colors.primary, color: '#fff' }}
                      >
                        افزودن
                      </button>
                    </div>
                  </div>
                  <p className="text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>یک دسته‌بندی را انتخاب کنید</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
