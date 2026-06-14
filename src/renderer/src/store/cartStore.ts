import { create } from 'zustand'
import type { CartItem } from '../../../types'

interface CartState {
  items: CartItem[]

  addItem: (item: Omit<CartItem, 'quantity'>) => void
  addItems: (items: CartItem[]) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  getSubtotal: () => number
  getCount: () => number
  clearCart: () => void
  resetAll: () => void
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (item) => {
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    })
  },

  addItems: (newItems) => {
    set((state) => {
      const merged = [...state.items]
      for (const newItem of newItems) {
        const existing = merged.find((i) => i.productId === newItem.productId)
        if (existing) {
          const idx = merged.indexOf(existing)
          merged[idx] = { ...existing, quantity: existing.quantity + newItem.quantity }
        } else {
          merged.push({ ...newItem })
        }
      }
      return { items: merged }
    })
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      set((state) => ({
        items: state.items.filter((i) => i.productId !== productId),
      }))
    } else {
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        ),
      }))
    }
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.productId !== productId),
    }))
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  },

  getCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0)
  },

  clearCart: () => set({ items: [] }),

  resetAll: () => set({ items: [] }),
}))
