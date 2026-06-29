/**
 * AddProduct — product management screen for creating, editing, and listing products.
 *
 * Features:
 *   - Barcode scanning (manual + webcam) for quick product lookup
 *   - Create/edit dialog with: title, category, subcategory (with inline create),
 *     purchase/sale price, stock, minStock, loose item toggle, sellable toggle,
 *     description, product image upload
 *   - Automatic barcode generation (PRD-XXXXXX format)
 *   - Zero sale price warning: auto-unchecks isSellable
 *   - Paginated, sortable, filterable product list
 *   - Print labels with QR codes and barcodes for selected products
 *   - Excel export of product list
 *   - Inline stock and price editing in the list view
 *   - Product detail popup with image, stock info, and QR code
 *
 * Category system:
 *   - Parent categories loaded from the categories table
 *   - Subcategories filtered by selected parent
 *   - Inline subcategory creation via API call
 */

import { useState, useEffect } from 'react'
import { fa } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'
import { printA4Report, downloadExcel } from '../utils/a4Print'
import { formatDateNow } from '../utils/jalali'
import WebcamScanner from '../components/business/WebcamScanner'
import FormattedPriceInput from '../components/ui/FormattedPriceInput'
import type { Product } from '../../../types'
import { useSortable } from '../hooks/useSortable'
import PrintDialog from '../components/print/PrintDialog'
import { getProductImageUrl } from '../utils/productImage'
import Dialog from '../components/ui/Dialog'

const primary = '#006194'

const PAGE_SIZES = [5, 10, 20, 50]

export default function AddProduct() {
  const theme = useSettingsStore((s) => s.theme)
  const showCameraScanner = useSettingsStore((s) => s.showCameraScanner)
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
    barcode: '', title: '', category: '', subcategory: '', unit: 'number' as 'number' | 'weight',
    purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, isSellable: true, hasExpiry: false, expiryDate: '', expiryAlertDays: 30, description: '', imageBase64: '',
  })
  const [subcategories, setSubcategories] = useState<{ id: number; name: string }[]>([])
  const [newSubcategory, setNewSubcategory] = useState('')
  const [showNewSubcatInput, setShowNewSubcatInput] = useState(false)
  const [detailProduct, setDetailProduct] = useState<any>(null)
  const [detailImageUrl, setDetailImageUrl] = useState('')
  const [detailEditMode, setDetailEditMode] = useState(false)
  const [detailForm, setDetailForm] = useState<any>({})
  const [_showDetailConfirm, setShowDetailConfirm] = useState(false)

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

  const loadSubcategories = async (parentId: number) => {
    const r = await window.api.categories.getSubcategories(parentId)
    if (r.success && r.data) {
      setSubcategories(r.data)
    } else {
      setSubcategories([])
    }
  }

  const handleCategoryChange = (catName: string) => {
    setForm(f => ({ ...f, category: catName, subcategory: '' }))
    const parentCat = categories.find(c => c.name === catName)
    if (parentCat) {
      loadSubcategories(parentCat.id)
    } else {
      setSubcategories([])
    }
  }

  const handleCreateSubcategory = async () => {
    if (!newSubcategory.trim() || !form.category) return
    const parentCat = categories.find(c => c.name === form.category)
    if (!parentCat) return
    const r = await window.api.categories.create({ name: newSubcategory.trim(), parentId: parentCat.id })
    if (r.success && r.data) {
      setSubcategories(prev => [...prev, { id: r.data.id, name: r.data.name }])
      setForm(f => ({ ...f, subcategory: r.data.name }))
      setNewSubcategory('')
      setShowNewSubcatInput(false)
      showNotif(`زیردسته "${r.data.name}" ایجاد شد`)
    }
  }

  useEffect(() => { loadProducts(); loadCategories() }, [searchQuery])

  const handleBarcodeScanned = async (code: string) => {
    const existing = await window.api.products.getByBarcode(code)
    if (existing.success && existing.data) {
      setEditProduct(existing.data)
      setForm({
        barcode: existing.data.barcode, title: existing.data.title, category: existing.data.category, subcategory: existing.data.subcategory || '',
        unit: existing.data.unit, purchase_price: existing.data.purchase_price, sale_price: existing.data.sale_price,
        stock: existing.data.stock, minStock: existing.data.minStock, isLoose: existing.data.isLoose, isSellable: existing.data.isSellable,
        hasExpiry: existing.data.hasExpiry, expiryDate: existing.data.expiryDate || '', expiryAlertDays: existing.data.expiryAlertDays || 30,
        description: existing.data.description || '', imageBase64: existing.data.imageBase64 || '',
      })
      setShowForm(true)
      showNotif(`${existing.data.title} — ${fa.admin.edit}`)
    } else {
      setEditProduct(null)
      setForm({ barcode: code, title: '', category: '', subcategory: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, isSellable: true, hasExpiry: false, expiryDate: '', expiryAlertDays: 30, description: '', imageBase64: '' })
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
        setForm({ barcode: '', title: '', category: '', subcategory: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, isSellable: true, hasExpiry: false, expiryDate: '', expiryAlertDays: 30, description: '', imageBase64: '' })
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
        setForm({ barcode: '', title: '', category: '', subcategory: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, isSellable: true, hasExpiry: false, expiryDate: '', expiryAlertDays: 30, description: '', imageBase64: '' })
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
      setForm({ barcode: '', title: '', category: '', subcategory: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, isSellable: true, hasExpiry: false, expiryDate: '', expiryAlertDays: 30, description: '', imageBase64: '' })
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
    html += `<div class="header-info"><span>تاریخ: ${formatDateNow()}</span><span>تعداد: ${data.length}</span></div>`
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
          onClick={() => { setEditProduct(null); setForm({ barcode: '', title: '', category: '', subcategory: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false, isSellable: true, hasExpiry: false, expiryDate: '', expiryAlertDays: 30, description: '', imageBase64: '' }); setShowForm(true) }}
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
        {showCameraScanner && (
          <button
            onClick={() => setShowWebcam(true)}
            className="text-sm px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all duration-200"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, color: textSecondary, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            اسکن بارکد
          </button>
        )}
      </div>

      {/* Product Form */}
      {/* Add/Edit Product Dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditProduct(null) }}
        title={editProduct ? 'ویرایش کالا' : 'افزودن کالای جدید'}
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
        footer={<>
          <button onClick={() => { setShowForm(false); setEditProduct(null) }} className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{fa.admin.cancel}</button>
          <button onClick={handleSubmit} disabled={!form.title || !form.category} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', opacity: (!form.title || !form.category) ? 0.5 : 1 }}>{editProduct ? fa.admin.save : fa.admin.create}</button>
        </>}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.title} *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field text-sm" autoFocus style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.category} *</label>
              <select value={form.category} onChange={(e) => handleCategoryChange(e.target.value)}
                className="input-field text-sm" style={{ ...inputStyle, borderColor: !form.category ? '#ef4444' : cardBorder }}>
                <option value="">-- انتخاب دسته‌بندی --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
              {!form.category && <p className="text-[10px] mt-1" style={{ color: '#ef4444' }}>انتخاب دسته‌بندی الزامی است</p>}
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>زیردسته</label>
              <div className="flex gap-1">
                <select value={showNewSubcatInput ? '__new__' : form.subcategory}
                  onChange={(e) => {
                    if (e.target.value === '__new__') { setShowNewSubcatInput(true); setForm(f => ({ ...f, subcategory: '' })) }
                    else { setShowNewSubcatInput(false); setForm(f => ({ ...f, subcategory: e.target.value })) }
                  }}
                  className="input-field text-sm flex-1" style={{ ...inputStyle, opacity: !form.category ? 0.5 : 1 }} disabled={!form.category}>
                  <option value="">-- زیردسته --</option>
                  {subcategories.map(sc => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                  <option value="__new__">+ افزودن زیردسته جدید</option>
                </select>
              </div>
              {showNewSubcatInput && (
                <div className="flex gap-1 mt-1">
                  <input value={newSubcategory} onChange={(e) => setNewSubcategory(e.target.value)} placeholder="نام زیردسته جدید"
                    className="input-field text-xs flex-1" style={inputStyle} onKeyDown={(e) => e.key === 'Enter' && handleCreateSubcategory()} />
                  <button onClick={handleCreateSubcategory} className="px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>افزودن</button>
                  <button onClick={() => { setShowNewSubcatInput(false); setNewSubcategory('') }} className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ color: textSecondary }}>لغو</button>
                </div>
              )}
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isLoose} onChange={(e) => setForm((f) => ({ ...f, isLoose: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: primary }} />
                <label className="text-sm font-bold" style={{ color: textSecondary }}>{fa.admin.looseItem}</label>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.purchasePrice}</label>
              <FormattedPriceInput value={form.purchase_price} onChange={(v) => setForm((f) => ({ ...f, purchase_price: v }))} className="input-field text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.salePrice}</label>
              <FormattedPriceInput value={form.sale_price} onChange={(v) => {
                setForm((f) => ({ ...f, sale_price: v, isSellable: v > 0 ? f.isSellable : false }))
              }} className="input-field text-sm" style={inputStyle} />
              {form.sale_price === 0 && <p className="text-[10px] mt-1" style={{ color: '#f59e0b' }}>قیمت فروش صفر است — کالا در صفحه فروش نمایش داده نمی‌شود</p>}
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.stock}</label>
              <FormattedPriceInput value={form.stock} onChange={(v) => setForm((f) => ({ ...f, stock: v }))} className="input-field text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{fa.admin.minStock}</label>
              <FormattedPriceInput value={form.minStock} onChange={(v) => setForm((f) => ({ ...f, minStock: v }))} className="input-field text-sm" placeholder="0" style={inputStyle} />
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isSellable} onChange={(e) => setForm((f) => ({ ...f, isSellable: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#22c55e' }} />
                <label className="text-sm font-bold" style={{ color: textSecondary }}>فعال برای فروش</label>
                {!form.isSellable && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>غیرفعال</span>}
              </div>
              {!form.isSellable && <p className="text-[10px] mt-1" style={{ color: '#f59e0b' }}>این کالا در صفحه فروش (POS) نمایش داده نخواهد شد</p>}
            </div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.hasExpiry || false} onChange={(e) => setForm((f) => ({ ...f, hasExpiry: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#ef4444' }} />
                <label className="text-sm font-bold" style={{ color: textSecondary }}>دارای تاریخ انقضا</label>
              </div>
              {form.hasExpiry && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="text-[10px] font-bold block mb-1" style={{ color: textSecondary }}>تاریخ انقضا</label>
                    <input type="date" value={form.expiryDate || ''} onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                      className="input-field text-xs w-full" style={{ ...inputStyle, direction: 'ltr', textAlign: 'center' }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold block mb-1" style={{ color: textSecondary }}>روزهای هشدار</label>
                    <input type="number" value={form.expiryAlertDays || 30} onChange={(e) => setForm((f) => ({ ...f, expiryAlertDays: parseInt(e.target.value) || 30 }))}
                      className="input-field text-xs w-full" style={inputStyle} min={1} max={365} />
                  </div>
                </div>
              )}
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
                  <div className="flex gap-2 items-start">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: cardBorder }}>
                      <img src={form.imageBase64} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    <button onClick={() => setForm((f) => ({ ...f, imageBase64: '' }))} className="text-xs px-2 py-1 rounded-lg font-bold" style={{ color: '#ef4444', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' }}>حذف</button>
                  </div>
                )}
              </div>
            </div>
          </div>
      </Dialog>

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
    setForm({ barcode: p.barcode, title: p.title, category: p.category, subcategory: p.subcategory || '', unit: p.unit, purchase_price: p.purchase_price, sale_price: p.sale_price, stock: p.stock, minStock: p.minStock, isLoose: p.isLoose, isSellable: p.isSellable, hasExpiry: p.hasExpiry, expiryDate: p.expiryDate || '', expiryAlertDays: p.expiryAlertDays || 30, description: p.description || '', imageBase64: p.imageBase64 || '' })
    if (p.category) {
      const parentCat = categories.find(c => c.name === p.category)
      if (parentCat) loadSubcategories(parentCat.id)
    }
    setShowForm(true)
  }

  return (
                <tr
                  key={p.id}
                  className="transition-all duration-150"
                  style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}
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
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDetail(p)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{ color: primary, backgroundColor: isDark ? 'rgba(0,97,148,0.1)' : 'rgba(0,97,148,0.06)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.12)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(0,97,148,0.1)' : 'rgba(0,97,148,0.06)' }}
                      >
                        جزئیات
                      </button>
                      <button
                        onClick={() => startEdit(p)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{ color: '#22c55e', backgroundColor: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.06)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.12)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.06)' }}
                      >
                        {fa.admin.edit}
                      </button>
                    </div>
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
        <Dialog open={!!detailProduct} onClose={() => setDetailProduct(null)} maxWidth="max-w-xl"
          title={detailEditMode ? 'ویرایش کالا' : 'جزئیات کالا'}
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          footer={<>
            <button onClick={() => setDetailProduct(null)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>بستن</button>
            {!detailEditMode ? (
              <button onClick={() => { setDetailEditMode(true); setDetailForm({ title: detailProduct.title, barcode: detailProduct.barcode || '', category: detailProduct.category || '', purchase_price: detailProduct.purchase_price, sale_price: detailProduct.sale_price, stock: detailProduct.stock, minStock: detailProduct.minStock || 0, description: detailProduct.description || '', imageBase64: detailProduct.imageBase64 || '' }) }} className="px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #006194, #007bb9)' }}>ویرایش</button>
            ) : (
              <button onClick={async () => { await window.api.products.update(detailProduct.id, detailForm); setDetailProduct(null); setDetailEditMode(false); loadProducts() }} className="px-5 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>ذخیره تغییرات</button>
            )}
          </>}>
          {detailImageUrl && (
            <div className="flex justify-center mb-4">
              <img src={detailImageUrl} className="w-24 h-24 rounded-xl object-cover" style={{ border: `1px solid ${cardBorder}` }} />
            </div>
          )}
          {!detailEditMode ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>نام</div><div className="text-sm font-bold" style={{ color: textPrimary }}>{detailProduct.title}</div></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>بارکد</div><div className="text-sm font-bold font-mono" style={{ color: textPrimary }}>{detailProduct.barcode || '-'}</div></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>دسته‌بندی</div><div className="text-sm font-bold" style={{ color: textPrimary }}>{detailProduct.category || '-'}</div></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>موجودی</div><div className="text-sm font-bold" style={{ color: detailProduct.stock <= 0 ? '#ef4444' : '#22c55e' }}>{detailProduct.stock}</div></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>قیمت خرید</div><div className="text-sm font-bold" style={{ color: textPrimary }}>{detailProduct.purchase_price.toLocaleString('fa-IR')} تومان</div></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>قیمت فروش</div><div className="text-sm font-bold" style={{ color: textPrimary }}>{detailProduct.sale_price.toLocaleString('fa-IR')} تومان</div></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>حداقل موجودی</div><div className="text-sm font-bold" style={{ color: textPrimary }}>{detailProduct.minStock || 0}</div></div>
              <div className="rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>واحد</div><div className="text-sm font-bold" style={{ color: textPrimary }}>{detailProduct.unit === 'weight' ? 'کیلوگرم' : 'عددی'}</div></div>
              {detailProduct.description && <div className="col-span-2 rounded-lg p-3" style={{ backgroundColor: inputBg }}><div className="text-[10px] font-bold mb-1" style={{ color: textSecondary }}>توضیحات</div><div className="text-sm" style={{ color: textPrimary }}>{detailProduct.description}</div></div>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>نام</label><input value={detailForm.title} onChange={e => setDetailForm({ ...detailForm, title: e.target.value })} className="input-field text-sm" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>بارکد</label><input value={detailForm.barcode} onChange={e => setDetailForm({ ...detailForm, barcode: e.target.value })} className="input-field text-sm font-mono" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>دسته‌بندی</label><input value={detailForm.category} onChange={e => setDetailForm({ ...detailForm, category: e.target.value })} className="input-field text-sm" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>موجودی</label><FormattedPriceInput value={detailForm.stock} onChange={v => setDetailForm({ ...detailForm, stock: v })} className="input-field text-sm" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>قیمت خرید</label><FormattedPriceInput value={detailForm.purchase_price} onChange={v => setDetailForm({ ...detailForm, purchase_price: v })} className="input-field text-sm" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>قیمت فروش</label><FormattedPriceInput value={detailForm.sale_price} onChange={v => setDetailForm({ ...detailForm, sale_price: v })} className="input-field text-sm" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>حداقل موجودی</label><FormattedPriceInput value={detailForm.minStock} onChange={v => setDetailForm({ ...detailForm, minStock: v })} className="input-field text-sm" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>واحد</label><select value={detailForm.unit || 'number'} onChange={e => setDetailForm({ ...detailForm, unit: e.target.value })} className="input-field text-sm" style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }}><option value="number">عددی</option><option value="weight">کیلوگرم</option></select></div>
              <div className="col-span-2"><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>توضیحات</label><textarea value={detailForm.description || ''} onChange={e => setDetailForm({ ...detailForm, description: e.target.value })} className="input-field text-sm" rows={2} style={{ backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
            </div>
          )}
      </Dialog>
      )}
      <PrintDialog open={showPrintDialog} title="چاپ لیست کالاها" totalCount={products.length} onClose={() => setShowPrintDialog(false)} onPrint={(range) => { setShowPrintDialog(false); handlePrintProducts(range) }} />
    </div>
  )
}
