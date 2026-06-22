import { useState, useEffect } from 'react'
import { fa } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'
import { printA4Report, downloadExcel } from '../utils/a4Print'
import WebcamScanner from '../components/WebcamScanner'
import FormattedPriceInput from '../components/FormattedPriceInput'
import type { Product } from '../../../types'
import { useSortable } from '../hooks/useSortable'
import PrintDialog from '../components/PrintDialog'
import { getProductImageUrl } from '../utils/productImage'

const primary = '#006194'

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
  const [detailProduct, setDetailProduct] = useState<any>(null)
  const [detailImageUrl, setDetailImageUrl] = useState('')
  const [detailEditMode, setDetailEditMode] = useState(false)
  const [detailForm, setDetailForm] = useState<any>({})
  const [showDetailConfirm, setShowDetailConfirm] = useState(false)

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnBg = isDark ? '#334155' : '#f1f5f9'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'

  const showNotif = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }

  const loadProducts = async () => {
    const r = searchQuery ? await window.api.products.search(searchQuery) : await window.api.products.getAll()
    if (r.success && r.data) { setProducts(r.data); setPage(0) }
  }
  const loadCategories = async () => {
    const r = await window.api.categories.getAll()
    if (r.success && r.data) {
      setCategories(r.data.filter((c: any) => c.parentId === null))
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [bulkResults, setBulkResults] = useState<any[] | null>(null)
  const [bulkPreview, setBulkPreview] = useState<any[] | null>(null)

  const handleDeleteConfirm = async () => {
    if (!editProduct) return
    setShowDeleteConfirm(false)
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
  const { sorted, sortKey, sortDir, toggleSort } = useSortable(pagedProducts)
  const [showPrintDialog, setShowPrintDialog] = useState(false)

  const handlePrintProducts = async (range: { start: number; end: number } | 'all') => {
    let data = products
    if (range !== 'all') {
      data = products.slice(range.start - 1, range.end)
    }
    let html = '<h1>لیست کالاها</h1>'
    html += `<div class="header-info"><span>تاریخ: ${new Date().toLocaleDateString('fa-IR')}</span><span>تعداد: ${data.length}</span></div>`
    html += '<table><thead><tr><th>بارکد</th><th>نام</th><th>دسته</th><th>موجودی</th><th>قیمت خرید</th><th>قیمت فروش</th></tr></thead><tbody>'
    data.forEach((p) => {
      html += `<tr><td>${p.barcode}</td><td>${p.title}</td><td>${p.category || '-'}</td><td>${p.stock}</td><td>${p.purchase_price.toLocaleString('fa-IR')}</td><td>${p.sale_price.toLocaleString('fa-IR')}</td></tr>`
    })
    html += '</tbody></table>'
    await printA4Report(html, 'لیست کالاها')
  }

  const handleExcelProducts = () => {
    const headers = ['بارکد', 'نام', 'دسته', 'موجودی', 'حداقل موجودی', 'قیمت خرید', 'قیمت فروش', 'وضعیت']
    const csvRows = products.map((p: any) => [p.barcode, p.title, p.category || '-', p.stock, p.minStock, p.purchase_price, p.sale_price, p.isActive ? 'فعال' : 'غیرفعال'])
    downloadExcel('products-list.csv', headers, csvRows)
  }

  const inputStyle = { background: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }

  return (
    <div className="h-full p-5 overflow-auto" style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>{notification}</div>
      )}
      {showWebcam && <WebcamScanner onScan={handleBarcodeScanned} onClose={() => setShowWebcam(false)} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full mx-4 text-center border" style={{ backgroundColor: cardBg, borderColor: cardBorder, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M12 9v2m0 4h.01M5.07 19H18.93A2 2 0 0020.82 16L13.9 3.46a2 2 0 00-3.8 0L3.18 16a2 2 0 001.89 3z"/></svg>
            </div>
            <h3 className="font-extrabold mb-2" style={{ color: textPrimary }}>{fa.admin.delete}؟</h3>
            <p className="text-sm mb-2" style={{ color: textSecondary }}>
              آیا از حذف "{editProduct?.title}" اطمینان دارید؟
            </p>
            <p className="text-xs mb-5" style={{ color: '#f59e0b' }}>
              اطلاعات حسابداری حفظ می‌شود ولی کالا از لیست موجودی حذف می‌شود.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDeleteConfirm} className="btn btn-danger flex-1">حذف</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-primary flex-1">{fa.admin.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, boxShadow: '0 2px 8px rgba(0,97,148,0.25)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight" style={{ color: textPrimary }}>{fa.admin.addProduct}</h2>
            <p className="text-xs font-medium" style={{ color: textSecondary }}>{products.length} کالا در سیستم</p>
          </div>
        </div>
        <button
          onClick={() => { setEditProduct(null); setForm({ barcode: '', title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, description: '', imageBase64: '' }); setShowForm(true) }}
          className="btn btn-primary text-sm"
        >
          + {fa.admin.addProduct}
        </button>
        <button onClick={() => setShowBulkForm(true)} className="text-sm px-4 py-2 rounded-xl font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary, border: `1px solid ${cardBorder}` }}>
          <svg className="w-4 h-4 inline ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          ورود گروهی
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`${fa.admin.search}...`}
            className="input-field text-sm pr-10"
          />
        </div>
        <button
          onClick={() => setShowWebcam(true)}
          className="text-sm px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all duration-200"
          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textSecondary, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          اسکن بارکد
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <div
          key={editProduct ? `edit-${editProduct.id}` : 'new'}
          className="rounded-2xl p-5 mb-5 border overflow-hidden"
          style={{
            backgroundColor: cardBg,
            borderColor: primary,
            borderRightWidth: '4px',
            boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,97,148,0.08)',
          }}
        >
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)' }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2">
                  {editProduct ? <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /> : <path d="M12 5v14M5 12h14" />}
                </svg>
              </div>
              <h3 className="font-extrabold" style={{ color: textPrimary }}>{editProduct ? fa.admin.edit : fa.admin.addProduct}</h3>
            </div>
            <button
              onClick={() => { setShowForm(false); setEditProduct(null) }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: btnBg, color: textSecondary }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = textSecondary }}
            >
              &times;
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.title} *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field text-sm" autoFocus style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.category} *</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input-field text-sm" style={{ ...inputStyle, borderColor: !form.category ? '#ef4444' : cardBorder }}>
                <option value="">-- انتخاب دسته‌بندی --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.parentId ? `↳ ${c.name}` : c.name}</option>
                ))}
              </select>
              {!form.category && <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>انتخاب دسته‌بندی الزامی است</p>}
            </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.purchasePrice}</label>
                <FormattedPriceInput value={form.purchase_price} onChange={(v) => setForm((f) => ({ ...f, purchase_price: v }))} className="input-field text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.salePrice}</label>
                <FormattedPriceInput value={form.sale_price} onChange={(v) => setForm((f) => ({ ...f, sale_price: v }))} className="input-field text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.stock}</label>
                <FormattedPriceInput value={form.stock} onChange={(v) => setForm((f) => ({ ...f, stock: v }))} className="input-field text-sm" style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.minStock}</label>
                <FormattedPriceInput value={form.minStock} onChange={(v) => setForm((f) => ({ ...f, minStock: v }))} className="input-field text-sm" placeholder="0" style={inputStyle} />
              </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.salePrice}</label>
              <input type="number" value={form.sale_price || ''} onChange={(e) => setForm((f) => ({ ...f, sale_price: +e.target.value }))} className="input-field text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.stock}</label>
              <input type="number" value={form.stock || ''} onChange={(e) => setForm((f) => ({ ...f, stock: +e.target.value }))} className="input-field text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>حداقل موجودی (هشدار)</label>
              <input type="number" value={form.minStock || ''} onChange={(e) => setForm((f) => ({ ...f, minStock: +e.target.value }))} className="input-field text-sm" placeholder="0" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>توضیحات / یادداشت</label>
              <textarea value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field text-sm" rows={2} placeholder="توضیحات محصول..." style={inputStyle} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>تصویر محصول</label>
              <div className="flex gap-3 items-start">
                <div className="flex-1">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200" style={{ border: `2px dashed ${cardBorder}`, color: textSecondary, backgroundColor: inputBg }}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <span className="text-xs font-bold">انتخاب تصویر</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          const base64 = ev.target?.result as string
                          setForm((f) => ({ ...f, imageBase64: base64 }))
                        }
                        reader.readAsDataURL(file)
                      }
                    }} />
                  </label>
                </div>
                {form.imageBase64 && (
                  <>
                    <div className="w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: cardBorder }}>
                      <img src={form.imageBase64} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => setForm((f) => ({ ...f, imageBase64: '' }))} className="text-xs px-2 py-1 rounded-lg font-bold" style={{ color: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}>حذف</button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" checked={form.isLoose} onChange={(e) => setForm((f) => ({ ...f, isLoose: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: primary }} />
              <label className="text-sm" style={{ color: textSecondary }}>{fa.admin.looseItem}</label>
            </div>
          </div>
          <div className="flex gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
            <button onClick={handleSubmit} disabled={!form.title || !form.category} className="btn btn-success disabled:opacity-40">{editProduct ? fa.admin.save : fa.admin.create}</button>
            <button onClick={() => { setShowForm(false); setEditProduct(null) }} className="btn btn-danger">{fa.admin.cancel}</button>
            {editProduct && (
              <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger ml-auto opacity-70 hover:opacity-100">{fa.admin.delete}</button>
            )}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setSearchQuery(''); setPage(0) }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
            style={{
              background: !searchQuery ? `linear-gradient(135deg, ${primary}, #007bb9)` : btnBg,
              color: !searchQuery ? '#ffffff' : textSecondary,
              boxShadow: !searchQuery ? '0 4px 12px rgba(0,97,148,0.3)' : 'none',
            }}
          >
            همه ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.name).length
            return (
              <button
                key={cat.id}
                onClick={() => { setSearchQuery(cat.name); setPage(0) }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
                style={{
                  background: searchQuery === cat.name ? `linear-gradient(135deg, ${primary}, #007bb9)` : btnBg,
                  color: searchQuery === cat.name ? '#ffffff' : textSecondary,
                  boxShadow: searchQuery === cat.name ? '0 4px 12px rgba(0,97,148,0.3)' : 'none',
                }}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Product Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: cardBg,
          borderColor: cardBorder,
          boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `2px solid ${cardBorder}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)' }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke={primary} strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            </div>
            <span className="font-extrabold text-sm" style={{ color: textPrimary }}>لیست کالاها</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrintDialog(true)}
              className="text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textSecondary, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = primary; e.currentTarget.style.color = primary }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.color = textSecondary }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              چاپ لیست
            </button>
            <button
              onClick={handleExcelProducts}
              className="text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all duration-200"
              style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textSecondary, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = primary; e.currentTarget.style.color = primary }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = cardBorder; e.currentTarget.style.color = textSecondary }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              خروجی اکسل
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
              {([
                { key: 'id' as keyof Product, label: '#' },
                { key: 'barcode' as keyof Product, label: fa.admin.barcode },
                { key: 'title' as keyof Product, label: fa.admin.title },
                { key: 'category' as keyof Product, label: fa.admin.category },
                { key: 'purchase_price' as keyof Product, label: fa.admin.purchasePrice },
                { key: 'sale_price' as keyof Product, label: fa.admin.salePrice },
                { key: 'stock' as keyof Product, label: fa.admin.stock },
              ]).map(col => (
                <th key={String(col.key)}
                  className="px-4 py-2.5 cursor-pointer select-none transition-all duration-200 text-right text-xs font-bold"
                  style={{ color: sortKey === col.key ? primary : textSecondary, borderBottom: `2px solid ${cardBorder}` }}
                  onClick={() => toggleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <span className="text-[10px] opacity-40">{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5" style={{ borderBottom: `2px solid ${cardBorder}` }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const isZero = p.stock <= 0
              const isLow = p.stock > 0 && p.stock <= p.minStock
  const openDetail = async (p: any) => {
    setDetailProduct(p)
    if (p.imageBase64 && !p.imageBase64.startsWith('data:')) {
      const url = await getProductImageUrl(p.imageBase64)
      setDetailImageUrl(url)
    } else {
      setDetailImageUrl(p.imageBase64 || '')
    }
    setDetailForm({ title: p.title, barcode: p.barcode || '', category: p.category || '', purchase_price: p.purchase_price, sale_price: p.sale_price, stock: p.stock, minStock: p.minStock || 0, description: p.description || '', imageBase64: p.imageBase64 || '' })
    setDetailEditMode(false)
    setShowDetailConfirm(false)
  }

  function startEdit(p: Product) {
    setEditProduct(p)
    setForm({ barcode: p.barcode, title: p.title, category: p.category, unit: p.unit, purchase_price: p.purchase_price, sale_price: p.sale_price, stock: p.stock, minStock: p.minStock, isLoose: p.isLoose, description: p.description || '', imageBase64: p.imageBase64 || '' })
    setShowForm(true)
  }

  return (
                <tr
                  key={p.id}
                  onClick={() => openDetail(p)}
                  className="cursor-pointer transition-all duration-150"
                  style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(0,97,148,0.06)' : 'rgba(0,97,148,0.03)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <td className="px-4 py-2.5" style={{ color: textSecondary }}>{p.id}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-bold" style={{ color: primary }}>{p.barcode || '-'}</td>
                  <td className="px-4 py-2.5 font-bold" style={{ color: textPrimary }}>{p.title}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{
                      backgroundColor: isDark ? 'rgba(0,97,148,0.15)' : 'rgba(0,97,148,0.08)',
                      color: primary,
                    }}>{p.category || '-'}</span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: textSecondary }}>{p.purchase_price.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2.5 font-extrabold" style={{ color: textPrimary }}>{p.sale_price.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{
                      backgroundColor: isZero ? (isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2') : isLow ? (isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7') : (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7'),
                      color: isZero ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e',
                    }}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200"
                      style={{ color: primary, backgroundColor: isDark ? 'rgba(0,97,148,0.1)' : 'rgba(0,97,148,0.06)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.12)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(0,97,148,0.1)' : 'rgba(0,97,148,0.06)' }}
                    >
                      {fa.admin.edit}
                    </button>
                  </td>
                </tr>
              )
            })}
            {pagedProducts.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="1" opacity="0.5">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold" style={{ color: textSecondary }}>{fa.admin.noProducts}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold" style={{ color: textSecondary }}>تعداد در هر صفحه:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0) }}
            className="input-field text-sm w-20" style={{ ...inputStyle, padding: '4px 8px' }}>
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs" style={{ color: textSecondary }}>{products.length} کالا</span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(0)} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40"
              style={{ backgroundColor: btnBg, color: textSecondary }}>اول</button>
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40"
              style={{ backgroundColor: btnBg, color: textSecondary }}>قبلی</button>
            <span className="text-sm font-extrabold px-3" style={{ color: primary }}>{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40"
              style={{ backgroundColor: btnBg, color: textSecondary }}>بعدی</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 disabled:opacity-40"
              style={{ backgroundColor: btnBg, color: textSecondary }}>آخر</button>
          </div>
        )}
      </div>
      {showBulkForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => { setShowBulkForm(false); setBulkResults(null); setBulkText('') }}>
          <div className="rounded-2xl p-6 max-w-2xl w-full mx-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>ورود گروهی کالا</h3>
            {!bulkPreview && !bulkResults ? (
              <>
                <p className="text-xs mb-3" style={{ color: textSecondary }}>هر خط یک کالا: نام, بارکد (اختیاری), دسته, قیمت خرید, قیمت فروش, موجودی</p>
                <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} className="input-field w-full text-sm font-mono" rows={10} placeholder={'شیر کاله,626001,لبنیات,28000,32000,50\nبرنج ایرانی,PRD-001,خشکبار,85000,98000,20\nروغن لادن,,روغن,120000,135000,15'} />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => {
                    const lines = bulkText.trim().split('\n').filter(Boolean)
                    const products = lines.map(line => {
                      const parts = line.split(',').map(s => s.trim())
                      return { title: parts[0] || '', barcode: parts[1] || '', category: parts[2] || '', purchase_price: parseFloat(parts[3]) || 0, sale_price: parseFloat(parts[4]) || 0, stock: parseInt(parts[5]) || 0 }
                    })
                    setBulkPreview(products)
                  }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#006194' }}>پیش‌نمایش</button>
                  <button onClick={() => {
                    const BOM = '\uFEFF'
                    const csv = BOM + 'نام,بارکد,دسته,قیمت خرید,قیمت فروش,موجودی\nشیر کاله,626001,لبنیات,28000,32000,50\nبرنج ایرانی,PRD-001,خشکبار,85000,98000,20\nروغن لادن,,روغن,120000,135000,15\n'
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                    const link = document.createElement('a')
                    link.href = URL.createObjectURL(blob)
                    link.download = 'sample-import.csv'
                    link.click()
                    URL.revokeObjectURL(link.href)
                  }} className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>دانلود نمونه</button>
                  <button onClick={() => { setShowBulkForm(false); setBulkResults(null); setBulkText('') }} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>لغو</button>
                </div>
              </>
            ) : bulkPreview && !bulkResults ? (
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: textPrimary }}>پیش‌نمایش ({bulkPreview.length} کالا)</p>
                <div className="max-h-60 overflow-auto rounded-xl border mb-3" style={{ borderColor: cardBorder }}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                        <th className="px-3 py-2 text-right" style={{ color: textSecondary }}>نام</th>
                        <th className="px-3 py-2 text-right" style={{ color: textSecondary }}>بارکد</th>
                        <th className="px-3 py-2 text-right" style={{ color: textSecondary }}>دسته</th>
                        <th className="px-3 py-2 text-right" style={{ color: textSecondary }}>ق خرید</th>
                        <th className="px-3 py-2 text-right" style={{ color: textSecondary }}>ق فروش</th>
                        <th className="px-3 py-2 text-center" style={{ color: textSecondary }}>موجودی</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.map((p, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${cardBorder}` }}>
                          <td className="px-3 py-2" style={{ color: textPrimary }}>{p.title}</td>
                          <td className="px-3 py-2 font-mono" style={{ color: textSecondary }}>{p.barcode || '-'}</td>
                          <td className="px-3 py-2" style={{ color: textPrimary }}>{p.category}</td>
                          <td className="px-3 py-2" style={{ color: textPrimary }}>{p.purchase_price.toLocaleString('fa-IR')}</td>
                          <td className="px-3 py-2" style={{ color: textPrimary }}>{p.sale_price.toLocaleString('fa-IR')}</td>
                          <td className="px-3 py-2 text-center" style={{ color: textPrimary }}>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    const r = await window.api.products.bulkImport(bulkPreview)
                    if (r.success && r.data) { setBulkResults(r.data.results); setBulkPreview(null) }
                  }} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#006194' }}>تایید ورود {bulkPreview.length} کالا</button>
                  <button onClick={() => setBulkPreview(null)} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>بازگشت</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm mb-3" style={{ color: textPrimary }}>نتیجه ورود گروهی:</p>
                <div className="max-h-60 overflow-auto rounded-xl border" style={{ borderColor: cardBorder }}>
                  {bulkResults!.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <span className="text-sm" style={{ color: textPrimary }}>{r.title}</span>
                      {r.success ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>موفق</span>
                      ) : (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>{r.error || 'خطا'}</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => { setBulkResults(null); setBulkText(''); setShowBulkForm(false); loadProducts() }} className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#006194' }}>پایان</button>
              </div>
            )}
          </div>
        </div>
      )}
      {detailProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setDetailProduct(null)}>
          <div className="rounded-2xl p-6 max-w-lg w-full mx-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: textPrimary }}>جزئیات کالا</h3>
              <div className="flex gap-2">
                {!detailEditMode && (
                  <button onClick={() => setDetailEditMode(true)} className="text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textPrimary }}>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    ویرایش
                  </button>
                )}
                <button onClick={() => setDetailProduct(null)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>✕</button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {detailImageUrl && (
                <div className="col-span-2 flex justify-center">
                  <img src={detailImageUrl} className="w-32 h-32 rounded-xl object-cover" style={{ border: `1px solid ${cardBorder}` }} />
                </div>
              )}
              {!detailEditMode ? (
                <>
                  <InfoField label="نام" value={detailProduct.title} />
                  <InfoField label="بارکد" value={detailProduct.barcode || '-'} />
                  <InfoField label="دسته" value={detailProduct.category || '-'} />
                  <InfoField label="موجودی" value={String(detailProduct.stock)} color={detailProduct.stock <= 0 ? '#ef4444' : '#22c55e'} />
                  <InfoField label="قیمت خرید" value={detailProduct.purchase_price.toLocaleString('fa-IR')} />
                  <InfoField label="قیمت فروش" value={detailProduct.sale_price.toLocaleString('fa-IR')} />
                  <InfoField label="حداقل موجودی" value={String(detailProduct.minStock || 0)} />
                  <InfoField label="واحد" value={detailProduct.unit === 'weight' ? 'وزنی' : 'عددی'} />
                </>
              ) : (
                <div className="col-span-2 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {['title','barcode','category','stock','minStock','purchase_price','sale_price'].map(field => (
                      <div key={field}>
                        <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{field}</label>
                        <input type={field.includes('price') || field === 'stock' || field === 'minStock' ? 'number' : 'text'}
                          value={detailForm[field] || ''} onChange={e => setDetailForm({ ...detailForm, [field]: field.includes('price') || field === 'stock' || field === 'minStock' ? parseFloat(e.target.value) || 0 : e.target.value })}
                          className="input-field text-sm w-full" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>توضیحات</label>
                    <textarea value={detailForm.description || ''} onChange={e => setDetailForm({ ...detailForm, description: e.target.value })} className="input-field text-sm w-full" rows={2} />
                  </div>
                  {!showDetailConfirm ? (
                    <button onClick={() => setShowDetailConfirm(true)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ backgroundColor: '#006194' }}>ذخیره تغییرات</button>
                  ) : (
                    <div className="rounded-xl p-3" style={{ backgroundColor: isDark ? '#450a0a' : '#fef2f2', border: '1px solid #ef4444' }}>
                      <p className="text-xs font-bold mb-2 text-center" style={{ color: '#ef4444' }}>آیا از ذخیره تغییرات اطمینان دارید؟</p>
                      <div className="flex gap-2">
                        <button onClick={async () => {
                          await window.api.products.update(detailProduct.id, detailForm)
                          setDetailProduct(null)
                          setDetailEditMode(false)
                          setShowDetailConfirm(false)
                          loadProducts()
                        }} className="flex-1 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: '#ef4444' }}>بله، ذخیره شود</button>
                        <button onClick={() => setShowDetailConfirm(false)} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>لغو</button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => { setDetailEditMode(false); setShowDetailConfirm(false); setDetailForm({ title: detailProduct.title, barcode: detailProduct.barcode || '', category: detailProduct.category || '', purchase_price: detailProduct.purchase_price, sale_price: detailProduct.sale_price, stock: detailProduct.stock, minStock: detailProduct.minStock || 0, description: detailProduct.description || '', imageBase64: detailProduct.imageBase64 || '' }) }} className="text-xs py-2" style={{ color: textSecondary }}>لغو ویرایش</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <PrintDialog open={showPrintDialog} title="چاپ لیست کالاها" totalCount={products.length} onClose={() => setShowPrintDialog(false)} onPrint={(range) => { setShowPrintDialog(false); handlePrintProducts(range) }} />
    </div>
  )
}

function InfoField({ label, value, color }: { label: string; value: string; color?: string }) {
  const isDark = document.documentElement.classList.contains('dark')
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
      <div className="text-xs" style={{ color: '#94a3b8' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color: color || '#0f172a' }}>{value}</div>
    </div>
  )
}
