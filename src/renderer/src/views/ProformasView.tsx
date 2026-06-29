/**
 * ProformasView — proforma invoice management and conversion.
 *
 * Features:
 *   - Create proforma with product selection
 *   - Status workflow: draft → sent → converted/expired
 *   - Convert proforma to final sale in one click
 *   - Proforma validity period with auto-expire
 *   - Inventory reservation on proforma creation
 *   - Print proforma
 *   - History and audit trail
 *   - Status filter
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { formatPriceFA, formatPriceComma, formatISOToJalali } from '../utils/jalali'
import Dialog, { DialogButton } from '../components/ui/Dialog'

const STATUS_COLORS: Record<string, string> = { draft: '#f59e0b', sent: '#3b82f6', converted: '#22c55e', expired: '#ef4444' }
const STATUS_LABELS: Record<string, string> = { draft: 'پیش‌نویس', sent: 'ارسال شده', converted: 'تبدیل شده', expired: 'منقضی شده' }

export default function ProformasView() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const user = useAuthStore(s => s.user)
  const [proformas, setProformas] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [filter, setFilter] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<any>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [createForm, setCreateForm] = useState({ customerId: '', validDays: 30, discount: 0, taxRate: 0, notes: '' })
  const [cartItems, setCartItems] = useState<{ productId: number; productTitle: string; quantity: number; unitPrice: number }[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputStyle = { backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: tPri }

  const load = async () => {
    const [pRes, cRes, prodRes] = await Promise.all([
      window.api.proformas.getAll(filter || undefined),
      window.api.customers.getAll(),
      window.api.products.getAll(),
    ])
    if (pRes.success && pRes.data) setProformas(pRes.data)
    if (cRes.success && cRes.data) setCustomers(cRes.data)
    if (prodRes.success && prodRes.data) setAllProducts(prodRes.data)
  }
  useEffect(() => { load() }, [filter])

  const loadDetail = async (id: number) => {
    const r = await window.api.proformas.getById(id)
    if (r.success && r.data) { setShowDetail(r.data); setDetailData(r.data) }
  }

  const filteredProducts = allProducts.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery)
  ).slice(0, 10)

  const handleAddProduct = (product: any) => {
    const existing = cartItems.find(i => i.productId === product.id)
    if (existing) {
      setCartItems(cartItems.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCartItems([...cartItems, { productId: product.id, productTitle: product.title, quantity: 1, unitPrice: product.sale_price }])
    }
    setSearchQuery('')
  }

  const handleCreate = async () => {
    if (cartItems.length === 0) return
    const r = await window.api.proformas.create({
      customerId: createForm.customerId ? Number(createForm.customerId) : undefined,
      userId: user?.id || 1,
      items: cartItems,
      validDays: createForm.validDays,
      discount: createForm.discount,
      taxRate: createForm.taxRate,
      notes: createForm.notes,
    })
    if (r.success) {
      setShowCreate(false); setCartItems([])
      setCreateForm({ customerId: '', validDays: 30, discount: 0, taxRate: 0, notes: '' })
      await load()
    }
  }

  const handleConvert = async (proformaId: number) => {
    if (!user) return
    const r = await window.api.proformas.convertToSale(proformaId, user.id, 'cash')
    if (r.success) {
      setShowDetail(null); setDetailData(null)
      await load()
    } else {
      alert(`خطا: ${r.error}`)
    }
  }

  const handleExpire = async () => {
    await window.api.proformas.expire()
    await load()
  }

  const subtotal = cartItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const afterDiscount = subtotal - createForm.discount
  const tax = Math.round(afterDiscount * createForm.taxRate / 100)
  const total = afterDiscount + tax

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([['', 'همه'], ['draft', 'پیش‌نویس'], ['sent', 'ارسال شده'], ['converted', 'تبدیل شده'], ['expired', 'منقضی شده']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: filter === key ? '#006194' : cardBg, color: filter === key ? '#fff' : tSec, border: `1px solid ${filter === key ? '#006194' : cardBorder}` }}>{label}</button>
        ))}
        <div className="flex-1" />
        <button onClick={handleExpire} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>بررسی انقضا</button>
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>+ پیش‌فاکتور جدید</button>
      </div>

      {/* Proforma List */}
      <div className="space-y-2">
        {proformas.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-90"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={() => loadDetail(p.id)}>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: tPri }}>{p.proformaNumber}</div>
              <div className="text-[10px]" style={{ color: tSec }}>{p.customerName || 'بدون مشتری'} | تا {formatISOToJalali(p.validUntil)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: tPri }}>{formatPriceFA(p.totalAmount)}</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLORS[p.status]}20`, color: STATUS_COLORS[p.status] }}>{STATUS_LABELS[p.status]}</span>
          </div>
        ))}
        {proformas.length === 0 && <p className="text-sm text-center py-8" style={{ color: tSec }}>پیش‌فاکتوری ثبت نشده</p>}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <Dialog open={true} onClose={() => { setShowCreate(false); setCartItems([]) }} title="پیش‌فاکتور جدید" maxWidth="max-w-lg"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowCreate(false); setCartItems([]) }}>لغو</DialogButton>
            <DialogButton variant="primary" onClick={handleCreate} disabled={cartItems.length === 0}>ثبت پیش‌فاکتور</DialogButton>
          </>}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>مشتری</label>
                <select value={createForm.customerId} onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                  <option value="">بدون مشتری</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>اعتبار (روز)</label><input type="number" value={createForm.validDays} onChange={(e) => setCreateForm({ ...createForm, validDays: Number(e.target.value) })} className="input-field text-sm w-full" style={inputStyle} /></div>
            </div>
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>افزودن کالا</label>
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجوی کالا..." className="input-field text-sm w-full" style={inputStyle} />
              {searchQuery && filteredProducts.length > 0 && (
                <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border" style={{ borderColor: cardBorder }}>
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => handleAddProduct(p)} className="w-full text-right px-3 py-1.5 text-xs hover:bg-blue-500/5" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                      <span className="font-bold" style={{ color: tPri }}>{p.title}</span>
                      <span className="mr-2" style={{ color: tSec }}>{formatPriceFA(p.sale_price)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: cardBorder }}>
                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <span className="flex-1 font-bold" style={{ color: tPri }}>{item.productTitle}</span>
                    <input type="number" value={item.quantity} onChange={(e) => setCartItems(cartItems.map((ci, j) => j === i ? { ...ci, quantity: Number(e.target.value) } : ci))} className="w-12 text-center input-field" style={{ ...inputStyle, padding: '2px 4px' }} min={1} />
                    <input type="number" value={item.unitPrice} onChange={(e) => setCartItems(cartItems.map((ci, j) => j === i ? { ...ci, unitPrice: Number(e.target.value) } : ci))} className="w-20 text-center input-field" style={{ ...inputStyle, padding: '2px 4px' }} />
                    <span className="w-16 text-left font-mono" style={{ color: tPri }}>{formatPriceComma(item.quantity * item.unitPrice)}</span>
                    <button onClick={() => setCartItems(cartItems.filter((_, j) => j !== i))} className="text-[10px]" style={{ color: '#ef4444' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>تخفیف</label><input type="number" value={createForm.discount || ''} onChange={(e) => setCreateForm({ ...createForm, discount: Number(e.target.value) })} className="input-field text-xs w-full" style={inputStyle} /></div>
              <div><label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>مالیات %</label><input type="number" value={createForm.taxRate || ''} onChange={(e) => setCreateForm({ ...createForm, taxRate: Number(e.target.value) })} className="input-field text-xs w-full" style={inputStyle} /></div>
              <div className="flex items-end"><div className="text-sm font-bold" style={{ color: tPri }}>جمع: {formatPriceComma(total)}</div></div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Detail Dialog */}
      {showDetail && detailData && (
        <Dialog open={true} onClose={() => { setShowDetail(null); setDetailData(null) }} title={detailData.proformaNumber} maxWidth="max-w-lg"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowDetail(null); setDetailData(null) }}>بستن</DialogButton>
            {detailData.status === 'draft' && <DialogButton variant="primary" onClick={async () => { await window.api.proformas.updateStatus(detailData.id, 'sent'); await loadDetail(detailData.id) }}>ارسال</DialogButton>}
            {(detailData.status === 'draft' || detailData.status === 'sent') && <DialogButton variant="success" onClick={() => handleConvert(detailData.id)}>تبدیل به فاکتور</DialogButton>}
          </>}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>مشتری</div><div className="font-bold" style={{ color: tPri }}>{detailData.customerName || 'بدون مشتری'}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>وضعیت</div><div className="font-bold" style={{ color: STATUS_COLORS[detailData.status] }}>{STATUS_LABELS[detailData.status]}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>جمع کل</div><div className="font-bold" style={{ color: tPri }}>{formatPriceFA(detailData.totalAmount)}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>معتبر تا</div><div className="font-bold" style={{ color: tPri }}>{formatISOToJalali(detailData.validUntil)}</div></div>
            </div>
            <h4 className="text-xs font-bold" style={{ color: tPri }}>اقلام</h4>
            <div className="rounded-lg border overflow-hidden" style={{ borderColor: cardBorder }}>
              {(detailData.items || []).map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 px-3 py-1.5 text-xs" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                  <span className="flex-1 font-bold" style={{ color: tPri }}>{item.productTitle}</span>
                  <span style={{ color: tSec }}>×{item.quantity}</span>
                  <span className="w-20 text-left font-mono" style={{ color: tPri }}>{formatPriceComma(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
