import { useState, useEffect } from 'react'
import { fa } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'
import WebcamScanner from '../components/WebcamScanner'
import type { Product } from '../../../types'

const PAGE_SIZES = [5, 10, 20, 50]

export default function AddProduct() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [showWebcam, setShowWebcam] = useState(false)
  const [notification, setNotification] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string; parentId: number | null }[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [form, setForm] = useState({
    barcode: '', title: '', category: '', unit: 'number' as 'number' | 'weight',
    purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, description: '', imageBase64: '',
  })

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const showNotif = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }

  const loadProducts = async () => {
    const r = searchQuery ? await window.api.products.search(searchQuery) : await window.api.products.getAll()
    if (r.success && r.data) { setProducts(r.data); setPage(0) }
  }
  const loadCategories = async () => {
    const r = await window.api.categories.getAll()
    if (r.success && r.data) {
      setCategories(r.data)
    }
  }

  useEffect(() => { loadProducts(); loadCategories() }, [searchQuery])

  const handleBarcodeScanned = async (code: string) => {
    const existing = await window.api.products.getByBarcode(code)
    if (existing.success && existing.data) {
      setEditProduct(existing.data)
      setForm({
        barcode: existing.data.barcode, title: existing.data.title, category: existing.data.category,
        unit: existing.data.unit, purchase_price: existing.data.purchase_price, sale_price: existing.data.sale_price,
        stock: existing.data.stock, minStock: existing.data.minStock, isLoose: existing.data.isLoose,
        description: existing.data.description || '', imageBase64: existing.data.imageBase64 || '',
      })
      setShowForm(true)
      showNotif(`${existing.data.title} — ${fa.admin.edit}`)
    } else {
      setEditProduct(null)
      setForm({ barcode: code, title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, description: '', imageBase64: '' })
      setShowForm(true)
      showNotif(`${fa.admin.addProduct} — ${code}`)
    }
    setShowWebcam(false)
  }

  const handleSubmit = async () => {
    if (!form.title || !form.category) return
    if (editProduct) {
      const r = await window.api.products.update(editProduct.id, form)
      if (r.success) {
        showNotif(`${form.title} — ${fa.admin.saved}`)
        setShowForm(false); setEditProduct(null)
        setForm({ barcode: '', title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, description: '', imageBase64: '' })
        await loadProducts(); await loadCategories()
        window.dispatchEvent(new Event('products:refresh'))
      } else {
        showNotif(`${r.error || 'خطا در بروزرسانی'}`)
      }
    } else {
      const r = await window.api.products.create(form)
      if (r.success) {
        showNotif(`${form.title} — ${fa.admin.create}`)
        setShowForm(false); setEditProduct(null)
        setForm({ barcode: '', title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, description: '', imageBase64: '' })
        await loadProducts(); await loadCategories()
        window.dispatchEvent(new Event('products:refresh'))
      } else {
        showNotif(`${r.error || 'خطا در ایجاد محصول'}`)
      }
    }
  }

  const handleDelete = async () => {
    if (!editProduct) return
    if (!confirm(`آیا از حذف "${editProduct.title}" اطمینان دارید؟\n\nاطلاعات حسابداری حفظ می‌شود ولی کالا از لیست موجودی حذف می‌شود.`)) return
    const r = await window.api.products.delete(editProduct.id)
    if (r.success) {
      showNotif(`${editProduct.title} — ${fa.admin.deleted}`)
      setShowForm(false); setEditProduct(null)
      setForm({ barcode: '', title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, description: '', imageBase64: '' })
      await loadProducts()
      window.dispatchEvent(new Event('products:refresh'))
    }
  }

  const totalPages = Math.ceil(products.length / pageSize)
  const pagedProducts = products.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>{notification}</div>
      )}
      {showWebcam && <WebcamScanner onScan={handleBarcodeScanned} onClose={() => setShowWebcam(false)} />}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.admin.addProduct}</h2>
        <button onClick={() => { setEditProduct(null); setForm({ barcode: '', title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, description: '', imageBase64: '' }); setShowForm(true) }} className="btn btn-primary text-sm">+ {fa.admin.addProduct}</button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={fa.admin.search} className="input-field flex-1" />
      </div>

      {/* Product Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#3b82f6' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold" style={{ color: textPrimary }}>{editProduct ? fa.admin.edit : fa.admin.addProduct}</h3>
            <button onClick={() => { setShowForm(false); setEditProduct(null) }} className="text-xl" style={{ color: textSecondary }}>&times;</button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.barcode} <span className="text-xs opacity-50">(اختیاری - خودکار تولید می‌شود)</span></label>
              <input value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} className="input-field text-sm font-mono" placeholder="خالی = خودکار" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.title} *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.category} *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input-field text-sm" style={{ borderColor: !form.category ? '#ef4444' : undefined }}>
                <option value="">-- انتخاب دسته‌بندی --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.parentId ? `↳ ${c.name}` : c.name}</option>
                ))}
              </select>
              {!form.category && <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>انتخاب دسته‌بندی الزامی است</p>}
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.purchasePrice}</label>
              <input type="number" value={form.purchase_price || ''} onChange={(e) => setForm((f) => ({ ...f, purchase_price: +e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.salePrice}</label>
              <input type="number" value={form.sale_price || ''} onChange={(e) => setForm((f) => ({ ...f, sale_price: +e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.stock}</label>
              <input type="number" value={form.stock || ''} onChange={(e) => setForm((f) => ({ ...f, stock: +e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>حداقل موجودی (هشدار)</label>
              <input type="number" value={form.minStock || ''} onChange={(e) => setForm((f) => ({ ...f, minStock: +e.target.value }))} className="input-field text-sm" placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>توضیحات / یادداشت</label>
              <textarea value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field text-sm" rows={2} placeholder="توضیحات محصول..." />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>تصویر محصول</label>
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string
                        setForm((f) => ({ ...f, imageBase64: base64 }))
                      }
                      reader.readAsDataURL(file)
                    }
                  }} className="input-field text-sm file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-blue-500 file:text-white" />
                </div>
                {form.imageBase64 && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0">
                    <img src={form.imageBase64} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
                {form.imageBase64 && (
                  <button onClick={() => setForm((f) => ({ ...f, imageBase64: '' }))} className="text-xs px-2 py-1 rounded" style={{ color: '#ef4444' }}>حذف</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" checked={form.isLoose} onChange={(e) => setForm((f) => ({ ...f, isLoose: e.target.checked }))} className="w-4 h-4" />
              <label className="text-sm" style={{ color: textSecondary }}>{fa.admin.looseItem}</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={!form.title || !form.category} className="btn btn-success disabled:opacity-40">{editProduct ? fa.admin.save : fa.admin.create}</button>
            <button onClick={() => { setShowForm(false); setEditProduct(null) }} className="btn btn-danger">{fa.admin.cancel}</button>
            {editProduct && (
              <button onClick={handleDelete} className="btn btn-danger ml-auto opacity-70 hover:opacity-100">{fa.admin.delete}</button>
            )}
          </div>
        </div>
      )}

      {/* Category Summary */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => { setSearchQuery(''); setPage(0) }} className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: !searchQuery ? '#3b82f6' : 'var(--bg-tertiary)', color: !searchQuery ? '#fff' : 'var(--text-secondary)' }}>همه ({products.length})</button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length
            return (
              <button key={cat.id} onClick={() => { setSearchQuery(cat.name); setPage(0) }} className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: searchQuery === cat.name ? '#3b82f6' : 'var(--bg-tertiary)', color: searchQuery === cat.name ? '#fff' : 'var(--text-secondary)' }}>
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Product Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ID</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.barcode}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.title}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.category}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.purchasePrice}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.salePrice}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.stock}</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((p) => {
              const isZero = p.stock <= 0
              const isLow = p.stock > 0 && p.stock <= p.minStock
              const rowBg = isZero ? 'rgba(239,68,68,0.08)' : isLow ? 'rgba(245,158,11,0.08)' : 'transparent'
              return (
                <tr key={p.id} style={{ borderBottom: `1px solid ${cardBorder}`, backgroundColor: rowBg }}>
                  <td className="px-4 py-2" style={{ color: textSecondary }}>{p.id}</td>
                  <td className="px-4 py-2 font-mono text-xs" style={{ color: textPrimary }}>{p.barcode || '-'}</td>
                  <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{p.title}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: textSecondary }}>{p.category || '-'}</span>
                  </td>
                  <td className="px-4 py-2" style={{ color: textPrimary }}>{p.purchase_price.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2 font-bold" style={{ color: textPrimary }}>{p.sale_price.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                      backgroundColor: p.stock <= 0 ? '#fecaca' : p.stock <= p.minStock ? '#fef3c7' : '#dcfce7',
                      color: p.stock <= 0 ? '#991b1b' : p.stock <= p.minStock ? '#92400e' : '#166534',
                    }}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-2">
                    <button onClick={() => startEdit(p)} className="text-xs font-bold px-2 py-1 rounded" style={{ color: '#3b82f6' }}>{fa.admin.edit}</button>
                  </td>
                </tr>
              )
            })}
            {pagedProducts.length === 0 && <tr><td colSpan={8} className="text-center py-8" style={{ color: textSecondary }}>{fa.admin.noProducts}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: textSecondary }}>تعداد در هر صفحه:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
            className="input-field text-sm w-20" style={{ padding: '4px 8px' }}>
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs" style={{ color: textSecondary }}>{products.length} کالا</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>اول</button>
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>قبلی</button>
            <span className="text-sm font-bold px-2" style={{ color: textPrimary }}>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>بعدی</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>آخر</button>
          </div>
        )}
      </div>
    </div>
  )

  function startEdit(p: Product) {
    setEditProduct(p)
    setForm({ barcode: p.barcode, title: p.title, category: p.category, unit: p.unit, purchase_price: p.purchase_price, sale_price: p.sale_price, stock: p.stock, minStock: p.minStock, isLoose: p.isLoose, description: p.description || '', imageBase64: p.imageBase64 || '' })
    setShowForm(true)
  }
}
