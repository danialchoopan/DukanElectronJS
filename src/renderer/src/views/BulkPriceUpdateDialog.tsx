/**
 * BulkPriceUpdateDialog — update product prices in bulk with preview.
 *
 * Supports:
 * - Filter by: all products, category, brand, or manual selection
 * - Action: percentage increase/decrease or fixed amount
 * - Rounding: ceil, floor, nearest, none with configurable interval
 * - Preview table showing old vs new prices
 * - Apply to sale_price, purchase_price, or both
 */
import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { roundPrice, type RoundingMode } from '../utils/rounding'

interface Props {
  open: boolean
  onClose: () => void
}

export default function BulkPriceUpdateDialog({ open, onClose }: Props) {
  const { colors } = useTheme()
  const tPri = colors.text.primary
  const tSec = colors.text.secondary
  const cBg = colors.bg.card
  const cBorder = colors.border.default

  const [products, setProducts] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'category' | 'brand'>('all')
  const [filterValue, setFilterValue] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([])
  const [action, setAction] = useState<'percent' | 'fixed'>('percent')
  const [actionValue, setActionValue] = useState(10)
  const [applyTo, setApplyTo] = useState<'sale' | 'purchase' | 'both'>('sale')
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('nearest')
  const [roundingInterval, setRoundingInterval] = useState(1000)
  const [step, setStep] = useState<'config' | 'preview'>('config')
  const [preview, setPreview] = useState<{ id: number; title: string; oldPrice: number; newPrice: number }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    loadProducts()
    loadCategories()
    loadBrands()
  }, [open])

  const loadProducts = async () => {
    const r = await window.api.products.getAll()
    if (r.success && r.data) setProducts(r.data)
  }

  const loadCategories = async () => {
    const r = await window.api.products.getCategories()
    if (r.success && r.data) setCategories(r.data)
  }

  const loadBrands = async () => {
    try {
      const r = await window.api.brands?.getAll()
      if (r?.success && r.data) setBrands(r.data)
    } catch {}
  }

  const getFilteredProducts = () => {
    if (filter === 'all') return products
    if (filter === 'category' && filterValue) return products.filter(p => p.category === filterValue)
    if (filter === 'brand' && filterValue) return products.filter(p => String(p.brand_id) === filterValue)
    return products
  }

  const calculatePreview = () => {
    const filtered = getFilteredProducts()
    const items = filtered.map(p => {
      let newSale = p.sale_price
      if (applyTo === 'sale' || applyTo === 'both') {
        const base = p.sale_price
        if (action === 'percent') newSale = roundPrice(base * (1 + actionValue / 100), roundingInterval, roundingMode)
        else newSale = roundPrice(base + actionValue, roundingInterval, roundingMode)
      }
      return { id: p.id, title: p.title, oldPrice: p.sale_price, newPrice: newSale }
    })
    setPreview(items)
    setStep('preview')
  }

  const applyChanges = async () => {
    setLoading(true)
    let success = 0
    for (const item of preview) {
      try {
        const updateData: any = {}
        if (applyTo === 'sale' || applyTo === 'both') updateData.sale_price = item.newPrice
        if (applyTo === 'purchase' || applyTo === 'both') {
          const base = products.find(p => p.id === item.id)?.purchase_price || 0
          updateData.purchase_price = action === 'percent' ? roundPrice(base * (1 + actionValue / 100), roundingInterval, roundingMode) : roundPrice(base + actionValue, roundingInterval, roundingMode)
        }
        await window.api.products.update(item.id, updateData)
        success++
      } catch {}
    }
    setLoading(false)
    alert(`${success} کالا با موفقیت بروزرسانی شد`)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto" style={{ backgroundColor: cBg, border: `1px solid ${cBorder}` }} onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4" style={{ color: tPri }}>بروزرسانی انبوه قیمت‌ها</h3>

        {step === 'config' ? (
          <div className="space-y-4">
            {/* Filter */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: tSec }}>فیلتر</label>
                <select value={filter} onChange={e => { setFilter(e.target.value as any); setFilterValue('') }}
                  className="input-field text-sm" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${cBorder}`, color: tPri }}>
                  <option value="all">همه کالاها</option>
                  <option value="category">بر اساس دسته‌بندی</option>
                  <option value="brand">بر اساس برند</option>
                </select>
              </div>
              {filter !== 'all' && (
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: tSec }}>{filter === 'category' ? 'دسته‌بندی' : 'برند'}</label>
                  <select value={filterValue} onChange={e => setFilterValue(e.target.value)}
                    className="input-field text-sm" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${cBorder}`, color: tPri }}>
                    <option value="">انتخاب کنید</option>
                    {filter === 'category' ? categories.map(c => <option key={c} value={c}>{c}</option>) : brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Action */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: tSec }}>نوع تغییر</label>
                <select value={action} onChange={e => setAction(e.target.value as any)}
                  className="input-field text-sm" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${cBorder}`, color: tPri }}>
                  <option value="percent">درصدی (+ / -)</option>
                  <option value="fixed">مبلغ ثابت (+ / -)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: tSec }}>{action === 'percent' ? 'درصد (%)' : 'مبلغ (تومان)'}</label>
                <input type="number" value={actionValue} onChange={e => setActionValue(parseFloat(e.target.value) || 0)}
                  className="input-field text-sm" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${cBorder}`, color: tPri }} />
              </div>
            </div>

            {/* Apply to */}
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: tSec }}>اعمال روی</label>
              <div className="flex gap-2">
                {[{ key: 'sale', label: 'قیمت فروش' }, { key: 'purchase', label: 'قیمت خرید' }, { key: 'both', label: 'هر دو' }].map(opt => (
                  <button key={opt.key} onClick={() => setApplyTo(opt.key as any)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: applyTo === opt.key ? colors.accent.primary : 'transparent', color: applyTo === opt.key ? '#fff' : tSec, border: `1px solid ${applyTo === opt.key ? colors.accent.primary : cBorder}` }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rounding */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1" style={{ color: tSec }}>گرد کردن</label>
                <select value={roundingMode} onChange={e => setRoundingMode(e.target.value as RoundingMode)}
                  className="input-field text-sm" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${cBorder}`, color: tPri }}>
                  <option value="none">بدون گرد</option>
                  <option value="ceil">گرد به بالا</option>
                  <option value="floor">گرد به پایین</option>
                  <option value="nearest">گرد نزدیک</option>
                </select>
              </div>
              {roundingMode !== 'none' && (
                <div>
                  <label className="text-xs font-bold block mb-1" style={{ color: tSec }}>فاصله گرد</label>
                  <select value={roundingInterval} onChange={e => setRoundingInterval(parseInt(e.target.value))}
                    className="input-field text-sm" style={{ backgroundColor: colors.bg.tertiary, border: `1px solid ${cBorder}`, color: tPri }}>
                    {[100, 500, 1000, 5000, 10000].map(v => <option key={v} value={v}>{v.toLocaleString('fa-IR')}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: colors.bg.tertiary, color: tSec }}>لغو</button>
              <div className="flex-1" />
              <button onClick={calculatePreview}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${colors.accent.primary}, #007bb9)` }}>
                پیش‌نمایش ({getFilteredProducts().length} کالا)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold" style={{ color: tSec }}>پیش‌نمایش ({preview.length} کالا)</p>
            <div className="max-h-60 overflow-auto rounded-xl border" style={{ borderColor: cBorder }}>
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ backgroundColor: colors.bg.primary }}>
                    <th className="px-3 py-2 text-right" style={{ color: tSec }}>نام</th>
                    <th className="px-3 py-2 text-right" style={{ color: tSec }}>قیمت فعلی</th>
                    <th className="px-3 py-2 text-right" style={{ color: tSec }}>قیمت جدید</th>
                    <th className="px-3 py-2 text-center" style={{ color: tSec }}>تغییر</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(item => (
                    <tr key={item.id} style={{ borderTop: `1px solid ${cBorder}` }}>
                      <td className="px-3 py-1.5" style={{ color: tPri }}>{item.title}</td>
                      <td className="px-3 py-1.5" style={{ color: tSec }}>{item.oldPrice.toLocaleString('fa-IR')}</td>
                      <td className="px-3 py-1.5 font-bold" style={{ color: '#22c55e' }}>{item.newPrice.toLocaleString('fa-IR')}</td>
                      <td className="px-3 py-1.5 text-center font-bold" style={{ color: item.newPrice > item.oldPrice ? '#22c55e' : '#ef4444' }}>
                        {item.newPrice > item.oldPrice ? '↑' : item.newPrice < item.oldPrice ? '↓' : '='}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('config')} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: colors.bg.tertiary, color: tSec }}>بازگشت</button>
              <div className="flex-1" />
              <button onClick={applyChanges} disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${colors.accent.primary}, #007bb9)` }}>
                {loading ? 'در حال بروزرسانی...' : `اعمال تغییرات (${preview.length} کالا)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
