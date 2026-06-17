import { useState, useEffect } from 'react'
import type { Product } from '../../../types'
import { fa } from '../i18n'
import { generateReceiptHTML, printContent } from '../utils/receipt'
import { gregorianToJalali } from '../utils/jalali'
import Pagination from '../components/Pagination'

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [lowStock, setLowStock] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStock, setFilterStock] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [categories, setCategories] = useState<string[]>([])

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const btnColor = isDark ? '#94a3b8' : '#ffffff'

  const loadProducts = async () => {
    const r = search ? await window.api.products.search(search) : await window.api.products.getAll()
    if (r.success && r.data) {
      setProducts(r.data)
      const cats = [...new Set(r.data.map((p: Product) => p.category).filter(Boolean))]
      setCategories(cats)
    }
  }

  const loadLowStock = async () => {
    const r = await window.api.products.getLowStock()
    if (r.success && r.data) setLowStock(r.data)
  }

  useEffect(() => { loadProducts(); loadLowStock() }, [search])

  const handleRestock = async () => {
    if (!selectedProduct || !restockQty) return
    const qty = parseInt(restockQty)
    if (qty <= 0) return
    await window.api.products.updateStock(selectedProduct.id, qty)
    setSelectedProduct(null)
    setRestockQty('')
    loadProducts()
    loadLowStock()
  }

  const filteredProducts = products.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (filterStock === 'out' && p.stock > 0) return false
    if (filterStock === 'low' && (p.stock <= 0 || p.stock > p.minStock)) return false
    if (filterStock === 'in' && p.stock <= 0) return false
    return true
  })

  const outOfStock = products.filter(p => p.stock <= 0)

  const totalStockValue = filteredProducts.reduce((a, p) => a + (p.stock * p.purchase_price), 0)
  const totalRetailValue = filteredProducts.reduce((a, p) => a + (p.stock * p.sale_price), 0)
  const totalProfit = totalRetailValue - totalStockValue
  const pagedProducts = filteredProducts.slice(page * pageSize, (page + 1) * pageSize)

  const handlePrintReport = () => {
    const now = new Date()
    const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
    const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    const dateStr = `${jd} ${jMonths[jm - 1]} ${jy}`

    const html = generateReceiptHTML({
      title: 'گزارش موجودی انبار',
      date: dateStr,
      items: filteredProducts.map((p) => ({
        name: p.title,
        qty: p.stock,
        price: p.purchase_price,
        total: p.stock * p.purchase_price,
      })),
      subtotal: totalStockValue,
      total: totalStockValue,
      extra: [
        { label: 'تعداد کالاها', value: String(filteredProducts.length) },
        { label: 'ارزش فروش', value: `${totalRetailValue.toLocaleString('fa-IR')} تومان` },
        { label: 'سود بالقوه', value: `${totalProfit.toLocaleString('fa-IR')} تومان`, color: '#16a34a' },
        { label: 'کم‌موجودی', value: `${lowStock.length} کالا`, color: lowStock.length > 0 ? '#ef4444' : undefined },
      ],
      footer: 'گزارش موجودی انبار',
      storeName: 'فروشگاه',
    })
    printContent(html)
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.nav.inventory}</h2>
        <button onClick={handlePrintReport} className="btn-primary text-sm flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          چاپ گزارش
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: fa.admin.products, value: filteredProducts.length, color: textPrimary, bg: cardBg },
          { label: fa.admin.outOfStock, value: filteredProducts.filter(p => p.stock <= 0).length, color: '#ef4444', bg: isDark ? '#450a0a' : '#fee2e2' },
          { label: 'ارزش خرید', value: `${totalStockValue.toLocaleString('fa-IR')}`, color: '#f59e0b', bg: isDark ? '#451a03' : '#fef3c7' },
          { label: 'سود بالقوه', value: `${totalProfit.toLocaleString('fa-IR')}`, color: '#22c55e', bg: isDark ? '#052e16' : '#dcfce7' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-3 text-center border" style={{ backgroundColor: s.bg, borderColor: cardBorder }}>
            <div className="text-xs font-medium" style={{ color: textSecondary }}>{s.label}</div>
            <div className="text-xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {outOfStock.length > 0 && (
        <div className="rounded-2xl p-4 mb-4 border-2" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', borderColor: '#ef4444' }}>
          <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#ef4444' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            موجودی تمام شده — {outOfStock.length} کالا
          </h3>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map((p) => (
              <button key={p.id} onClick={() => { setSelectedProduct(p); setRestockQty('') }}
                className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#fecaca', color: '#991b1b' }}>
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="rounded-2xl p-4 mb-4 border-2" style={{ backgroundColor: isDark ? '#451a03' : '#fef3c7', borderColor: '#f59e0b' }}>
          <h3 className="font-bold mb-2 flex items-center gap-2" style={{ color: '#d97706' }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            موجودی کم — {lowStock.length} کالا
          </h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <button key={p.id} onClick={() => { setSelectedProduct(p); setRestockQty('') }}
                className="px-3 py-1.5 rounded-lg text-sm font-bold" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                {p.title} ({p.stock})
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedProduct && (
        <div className="rounded-2xl p-4 mb-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#3b82f6' }}>
          <h3 className="font-bold mb-3" style={{ color: textPrimary }}>ریستاک: {selectedProduct.title}</h3>
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>موجودی فعلی: {selectedProduct.stock}</label>
              <input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="input-field text-sm" placeholder="تعداد" />
            </div>
            <button onClick={handleRestock} disabled={!restockQty || parseInt(restockQty) <= 0} className="btn-success disabled:opacity-40">+ افزودن</button>
            <button onClick={() => setSelectedProduct(null)} className="text-sm px-3 py-2 rounded-xl font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: btnColor }}>{fa.admin.cancel}</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={fa.admin.search} className="input-field flex-1 min-w-[200px]" />
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field w-40 text-sm">
          <option value="all">همه دسته‌ها</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} className="input-field w-40 text-sm">
          <option value="all">همه موجودی</option>
          <option value="in">موجود</option>
          <option value="low">کم‌موجودی</option>
          <option value="out">تمام شده</option>
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ID</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.barcode}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.title}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.category}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.stock}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.purchasePrice}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>{fa.admin.salePrice}</th>
              <th className="text-right px-4 py-2" style={{ color: textSecondary }}>ارزش</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((p) => {
              const isZero = p.stock <= 0
              const isLow = p.stock > 0 && p.stock <= p.minStock
              const rowBg = isZero ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)') : isLow ? (isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)') : 'transparent'
              return (
              <tr key={p.id} style={{ borderBottom: `1px solid ${cardBorder}`, backgroundColor: rowBg }}
                onMouseEnter={(e) => { if (!isZero && !isLow) e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)' }}
                onMouseLeave={(e) => { if (!isZero && !isLow) e.currentTarget.style.backgroundColor = 'transparent' }}>
                <td className="px-4 py-2" style={{ color: textSecondary }}>{p.id}</td>
                <td className="px-4 py-2 font-mono text-xs" style={{ color: textPrimary }}>{p.barcode || '-'}</td>
                <td className="px-4 py-2 font-medium" style={{ color: textPrimary }}>{p.title}</td>
                <td className="px-4 py-2" style={{ color: textSecondary }}>{p.category || '-'}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                    backgroundColor: p.stock <= 0 ? '#fecaca' : p.stock <= p.minStock ? '#fef3c7' : '#dcfce7',
                    color: p.stock <= 0 ? '#991b1b' : p.stock <= p.minStock ? '#92400e' : '#166534',
                  }}>{p.stock}</span>
                </td>
                <td className="px-4 py-2" style={{ color: textPrimary }}>{p.purchase_price.toLocaleString('fa-IR')}</td>
                <td className="px-4 py-2" style={{ color: textPrimary }}>{(p.stock * p.purchase_price).toLocaleString('fa-IR')}</td>
                <td className="px-4 py-2">
                  <button onClick={() => { setSelectedProduct(p); setRestockQty('') }} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: '#22c55e' }}>+ ریستاک</button>
                </td>
              </tr>
              )
            })}
            {pagedProducts.length === 0 && <tr><td colSpan={9} className="text-center py-8" style={{ color: textSecondary }}>{fa.admin.noProducts}</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination total={filteredProducts.length} pageSize={pageSize} page={page}
        onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(0) }} />
    </div>
  )
}
