import { create } from 'zustand'
import type { CartItem } from '../../../types'

interface CartState {
  items: CartItem[]
  lastError: string

  addItem: (item: Omit<CartItem, 'quantity'>) => boolean
  addItems: (items: CartItem[]) => void
  updateQuantity: (productId: number, quantity: number) => void
  updateUnitPrice: (productId: number, unitPrice: number) => void
  removeItem: (productId: number) => void
  getSubtotal: () => number
  getCount: () => number
  clearCart: () => void
  resetAll: () => void
  clearError: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  lastError: '',

  addItem: (item) => {
    let success = true
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        const newQty = existing.quantity + 1
        if (item.maxStock !== undefined && newQty > item.maxStock) {
          success = false
          return { ...state, lastError: `${item.title}: حداکثر ${item.maxStock} عدد در انبار موجود است` }
        }
        return {
          items: state.items.map((i) =>
            i.productId === item.productId ? { ...i, quantity: newQty } : i
          ),
          lastError: '',
        }
      }
      if (item.maxStock !== undefined && item.maxStock <= 0) {
        return { ...state, lastError: `${item.title}: تمام شده` }
      }
      return { items: [...state.items, { ...item, quantity: 1 }], lastError: '' }
    })
    return success
  },

  addItems: (newItems) => {
    set((state) => {
      const merged = [...state.items]
      for (const newItem of newItems) {
        const existing = merged.find((i) => i.productId === newItem.productId)
        if (existing) {
          const idx = merged.indexOf(existing)
          const newQty = existing.quantity + newItem.quantity
          if (newItem.maxStock !== undefined && newQty > newItem.maxStock) {
            return { ...state, items: merged, lastError: `${newItem.title}: حداکثر ${newItem.maxStock} عدد` }
          }
          merged[idx] = { ...existing, quantity: newQty }
        } else {
          merged.push({ ...newItem })
        }
      }
      return { items: merged, lastError: '' }
    })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
    } else {
      set((state) => {
        const item = state.items.find((i) => i.productId === productId)
        if (item && item.maxStock !== undefined && quantity > item.maxStock) {
          return { ...state, lastError: `${item.title}: حداکثر ${item.maxStock} عدد در انبار` }
        }
        return {
          items: state.items.map((i) => i.productId === productId ? { ...i, quantity } : i),
          lastError: '',
        }
      })
    }
  },

  updateUnitPrice: (productId, unitPrice) => {
    if (unitPrice < 0) return
    set((state) => ({
      items: state.items.map((i) => i.productId === productId ? { ...i, unitPrice } : i),
    }))
  },

  removeItem: (productId) => {
    set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
  },

  getSubtotal: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
  getCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  clearCart: () => set({ items: [], lastError: '' }),
  resetAll: () => set({ items: [], lastError: '' }),
  clearError: () => set({ lastError: '' }),
}))
