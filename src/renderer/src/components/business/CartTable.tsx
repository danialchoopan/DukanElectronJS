import { useCartStore } from '../../store/cartStore'
import type { CartItem } from '../../../../types'
import { fa } from '../../i18n'
import { useState, useEffect, useRef } from 'react'
import { getProductImageUrl } from '../../utils/productImage'

interface Props { items: CartItem[] }

function CartItemImage({ imageBase64 }: { imageBase64: string }) {
  const [src, setSrc] = useState(imageBase64 || '')
  useEffect(() => {
    if (imageBase64 && !imageBase64.startsWith('data:') && !imageBase64.startsWith('http')) {
      getProductImageUrl(imageBase64).then(setSrc)
    }
  }, [imageBase64])
  if (!src) return null
  return <img src={src} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
}

function EditableCell({ value, onSave, type = 'number' }: { value: number; onSave: (v: number) => void; type?: 'number' }) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setTemp(String(value))
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 10)
    }
  }, [editing, value])

  const commit = () => {
    const num = parseFloat(temp)
    if (!isNaN(num) && num > 0) onSave(num)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        className="w-20 text-center text-sm font-bold rounded-lg px-2 py-1 outline-none"
        style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', border: '2px solid #3b82f6' }}
      />
    )
  }

  return (
    <span
      onDoubleClick={() => setEditing(true)}
      className="cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-all select-none"
      title="دوبار کلیک برای ویرایش"
    >
      {value.toLocaleString('fa-IR')}
    </span>
  )
}

export default function CartTable({ items }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const updateUnitPrice = useCartStore((s) => s.updateUnitPrice)
  const removeItem = useCartStore((s) => s.removeItem)

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0" style={{ backgroundColor: 'var(--bg-card)' }}>
          <tr>
            <th className="text-right px-3 py-2" style={{ color: 'var(--text-muted)' }}>#</th>
            <th className="text-right px-3 py-2" style={{ color: 'var(--text-muted)' }}>{fa.admin.title}</th>
            <th className="text-center px-3 py-2" style={{ color: 'var(--text-muted)' }}>{fa.pos.qty}</th>
            <th className="text-right px-3 py-2" style={{ color: 'var(--text-muted)' }}>{fa.pos.unitPrice}</th>
            <th className="text-right px-3 py-2" style={{ color: 'var(--text-muted)' }}>{fa.pos.subtotalCol}</th>
            <th className="px-3 py-2 w-16"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
              <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                <div className="flex items-center gap-2">
                  <CartItemImage imageBase64={item.imageBase64 || ''} />
                  {item.title}
                </div>
              </td>
              <td className="px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '6px' }}>-</button>
                  <EditableCell value={item.quantity} onSave={(v) => updateQuantity(item.productId, Math.round(v))} />
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '6px' }}>+</button>
                </div>
              </td>
              <td className="px-3 py-2 text-left">
                <EditableCell value={item.unitPrice} onSave={(v) => updateUnitPrice(item.productId, v)} />
              </td>
              <td className="px-3 py-2 text-left font-bold" style={{ color: 'var(--text-primary)' }}>{(item.unitPrice * item.quantity).toLocaleString('fa-IR')}</td>
              <td className="px-3 py-2"><button onClick={() => removeItem(item.productId)} className="btn-danger" style={{ padding: '4px 8px', fontSize: '10px', borderRadius: '6px' }}>X</button></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={6} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>{fa.pos.noItems}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}