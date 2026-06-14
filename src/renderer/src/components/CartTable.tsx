import { useCartStore } from '../store/cartStore'
import type { CartItem } from '../../../types'
import { fa } from '../i18n'

interface Props { items: CartItem[] }

export default function CartTable({ items }: Props) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
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
              <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</td>
              <td className="px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '6px' }}>-</button>
                  <span className="w-10 text-center font-bold" style={{ color: 'var(--text-primary)' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '10px', borderRadius: '6px' }}>+</button>
                </div>
              </td>
              <td className="px-3 py-2 text-left" style={{ color: 'var(--text-primary)' }}>{item.unitPrice.toLocaleString('fa-IR')}</td>
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
