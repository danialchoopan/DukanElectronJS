import { useState, useEffect } from 'react'
import type { Product } from '../../../types'

interface Props {
  onProductAdd: (product: Product) => void
}

export default function PopularItems({ onProductAdd }: Props) {
  const [popular, setPopular] = useState<Product[]>([])
  const isDark = document.documentElement.classList.contains('dark')

  useEffect(() => {
    const loadPopular = async () => {
      const r = await window.api.sales.getTopProducts()
      if (r.success && r.data && r.data.length > 0) {
        const productIds = r.data.map((p: any) => p.productTitle)
        const allProducts = await window.api.products.getAll()
        if (allProducts.success && allProducts.data) {
          const popularProducts = allProducts.data.filter((p: Product) =>
            productIds.includes(p.title) && p.stock > 0
          ).slice(0, 8)
          setPopular(popularProducts)
        }
      } else {
        const allProducts = await window.api.products.getAll()
        if (allProducts.success && allProducts.data) {
          setPopular(allProducts.data.filter((p: Product) => p.stock > 0).slice(0, 8))
        }
      }
    }
    loadPopular()
  }, [])

  if (popular.length === 0) return null

  return (
    <div className="rounded-2xl border p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>پرفروش‌ها / سریع</h3>
      <div className="grid grid-cols-4 gap-2">
        {popular.map((p) => (
          <button key={p.id} onClick={() => onProductAdd(p)}
            className="rounded-xl p-3 text-center transition-all hover:scale-105"
            style={{
              backgroundColor: isDark ? '#334155' : '#f1f5f9',
              border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
            }}>
            <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{p.title}</div>
            <div className="text-[10px] mt-1 font-bold" style={{ color: '#22c55e' }}>{p.sale_price.toLocaleString('fa-IR')}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
