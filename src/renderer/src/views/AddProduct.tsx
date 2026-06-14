import { useState, useRef, useEffect } from 'react'
import { fa } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'
import { CameraIcon } from '../components/Icons'
import WebcamScanner from '../components/WebcamScanner'
import type { Product } from '../../../types'

export default function AddProduct() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const [showWebcam, setShowWebcam] = useState(false)
  const [notification, setNotification] = useState('')
  const [scanMode, setScanMode] = useState<'barcode' | 'manual'>('barcode')
  const [barcodeInput, setBarcodeInput] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    barcode: '', title: '', category: '', unit: 'number' as 'number' | 'weight',
    purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false,
  })

  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnColor = isDark ? '#94a3b8' : '#ffffff'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const showNotif = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }

  const loadProducts = async () => {
    const r = searchQuery ? await window.api.products.search(searchQuery) : await window.api.products.getAll()
    if (r.success && r.data) setProducts(r.data)
  }

  useEffect(() => { loadProducts() }, [searchQuery])

  const handleBarcodeScanned = async (code: string) => {
    const existing = await window.api.products.getByBarcode(code)
    if (existing.success && existing.data) {
      setEditProduct(existing.data)
      setForm({
        barcode: existing.data.barcode, title: existing.data.title, category: existing.data.category,
        unit: existing.data.unit, purchase_price: existing.data.purchase_price, sale_price: existing.data.sale_price,
        stock: existing.data.stock, minStock: existing.data.minStock, isLoose: existing.data.isLoose,
      })
      setShowForm(true)
      showNotif(`${existing.data.title} — ${fa.admin.edit}`)
    } else {
      setEditProduct(null)
      setForm({ barcode: code, title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false })
      setShowForm(true)
      showNotif(`${fa.admin.addProduct} — ${code}`)
    }
    setShowWebcam(false)
    setBarcodeInput('')
  }

  const handleBarcodeManual = () => {
    if (!barcodeInput.trim()) return
    handleBarcodeScanned(barcodeInput.trim())
  }

  const handleManualBarcode = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      handleBarcodeScanned(barcodeInput.trim())
    }
  }

  const handleSubmit = async () => {
    if (!form.title) return
    if (editProduct) {
      const r = await window.api.products.update(editProduct.id, form)
      if (r.success) showNotif(`${form.title} — ${fa.admin.saved}`)
    } else {
      const r = await window.api.products.create(form)
      if (r.success) showNotif(`${form.title} — ${fa.admin.create}`)
    }
    setShowForm(false)
    setEditProduct(null)
    setForm({ barcode: '', title: '', category: '', unit: 'number', purchase_price: 0, sale_price: 0, stock: 0, minStock: 0, isLoose: false })
    loadProducts()
  }

  return (
    <div className="h-full p-4 overflow-auto">
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
          {notification}
        </div>
      )}

      {showWebcam && <WebcamScanner onScan={handleBarcodeScanned} onClose={() => setShowWebcam(false)} />}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.admin.addProduct}</h2>
      </div>

      <div className="rounded-2xl p-6 mb-6 border-2" style={{ backgroundColor: cardBg, borderColor: scanMode === 'barcode' ? '#3b82f6' : cardBorder }}>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setScanMode('barcode')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: scanMode === 'barcode' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : (isDark ? '#334155' : '#f1f5f9'),
              color: scanMode === 'barcode' ? '#ffffff' : textSecondary,
              boxShadow: scanMode === 'barcode' ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
            }}>
            <CameraIcon className="w-4 h-4" />
            {fa.common.scanner}
          </button>
          <button onClick={() => setScanMode('manual')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{
              background: scanMode === 'manual' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : (isDark ? '#334155' : '#f1f5f9'),
              color: scanMode === 'manual' ? '#ffffff' : textSecondary,
              boxShadow: scanMode === 'manual' ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
            }}>
            {fa.admin.barcode}
          </button>
        </div>

        {scanMode === 'barcode' ? (
          <div className="flex gap-3">
            <button onClick={() => setShowWebcam(true)} className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-2">
              <CameraIcon className="w-5 h-5" />
              {fa.common.webcam}
            </button>
            <div className="flex-1">
              <input ref={barcodeRef} type="text" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleManualBarcode}
                className="input-field text-lg h-full" placeholder={fa.pos.scanOrSearch} autoFocus />
            </div>
            <button onClick={handleBarcodeManual} disabled={!barcodeInput.trim()} className="btn-success px-6 py-4 disabled:opacity-40">
              {fa.admin.create}
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <input ref={barcodeRef} type="text" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleManualBarcode}
              className="input-field text-lg flex-1" placeholder={fa.admin.barcode} autoFocus />
            <button onClick={handleBarcodeManual} disabled={!barcodeInput.trim()} className="btn-success px-6 py-4 disabled:opacity-40">
              {fa.admin.create}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="rounded-2xl p-6 mb-6 border-2" style={{ backgroundColor: cardBg, borderColor: '#22c55e' }}>
          <h3 className="font-bold mb-4" style={{ color: textPrimary }}>{editProduct ? fa.admin.edit : fa.admin.addProduct}</h3>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.barcode}</label>
              <input value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} className="input-field text-sm font-mono" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.title} *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-field text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.category}</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field text-sm" />
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
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={form.isLoose} onChange={(e) => setForm((f) => ({ ...f, isLoose: e.target.checked }))} className="w-4 h-4" />
              <label className="text-sm" style={{ color: textSecondary }}>{fa.admin.looseItem}</label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} disabled={!form.title} className="btn-success disabled:opacity-40">{editProduct ? fa.admin.save : fa.admin.create}</button>
            <button onClick={() => { setShowForm(false); setEditProduct(null) }} style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }} className="px-4 py-2 rounded-xl font-bold">{fa.admin.cancel}</button>
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-4">
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={fa.admin.search} className="input-field flex-1" />
      </div>

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
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${cardBorder}` }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <td className="px-4 py-2" style={{ color: textSecondary }}>{p.id}</td>
                <td className="px-4 py-2 font-mono text-xs" style={{ color: textPrimary }}>{p.barcode || '-'}</td>
                <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{p.title}</td>
                <td className="px-4 py-2" style={{ color: textSecondary }}>{p.category || '-'}</td>
                <td className="px-4 py-2" style={{ color: textPrimary }}>{p.purchase_price.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-2 font-bold" style={{ color: textPrimary }}>{p.sale_price.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-2" style={{ color: p.stock <= 0 ? '#ef4444' : textPrimary }}>{p.stock}</td>
                <td className="px-4 py-2">
                  <button onClick={() => {
                    setEditProduct(p)
                    setForm({ barcode: p.barcode, title: p.title, category: p.category, unit: p.unit, purchase_price: p.purchase_price, sale_price: p.sale_price, stock: p.stock, minStock: p.minStock, isLoose: p.isLoose })
                    setShowForm(true)
                  }} className="text-xs font-bold" style={{ color: '#3b82f6' }}>{fa.admin.edit}</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={8} className="text-center py-8" style={{ color: textSecondary }}>{fa.admin.noProducts}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
