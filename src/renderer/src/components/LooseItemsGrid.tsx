import { useCartStore } from '../store/cartStore'
import { useEffect, useState } from 'react'
import type { Product } from '../../../types'
import { fa } from '../i18n'

interface Props {
  refreshKey?: number
}

export default function LooseItemsGrid({ refreshKey }: Props) {
  const [looseItems, setLooseItems] = useState<Product[]>([])
  const addItem = useCartStore((s) => s.addItem)

  const loadLoose = async () => {
    const r = await window.api.products.getLoose()
    if (r.success && r.data) setLooseItems(r.data)
  }

  useEffect(() => { loadLoose() }, [refreshKey])

  if (looseItems.length === 0) return null

  return (
    <div className="card">
      <h3 className="text-sm font-bold text-gray-400 mb-2">{fa.admin.looseItem}</h3>
      <div className="grid grid-cols-6 gap-2">
        {looseItems.map((item) => (
          <button key={item.id} disabled={item.stock <= 0} onClick={() => addItem({ productId: item.id, title: item.title, unitPrice: item.sale_price, purchasePrice: item.purchase_price, maxStock: item.stock, imageBase64: item.imageBase64 || "" })}
            className="bg-gray-700 hover:bg-blue-600 rounded p-3 text-center transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            <div className="text-sm font-bold">{item.title}</div>
            <div className="text-xs text-gray-400 mt-1">{item.sale_price.toLocaleString('fa-IR')}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
