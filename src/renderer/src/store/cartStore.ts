/**
 * Cart Store — manages the shopping cart state using Zustand.
 *
 * Handles adding products, updating quantities, removing items,
 * and computing totals. Validates stock availability before allowing
 * quantity increases beyond maxStock.
 *
 * Usage:
 *   const { items, addItem, updateQuantity, removeItem, getSubtotal } = useCartStore()
 */

import { create } from 'zustand'
import type { CartItem } from '../../../types'

interface CartState {
  items: CartItem[]
  lastError: string
  /** Add item to cart. Returns false if stock exceeded. */
  addItem: (item: Omit<CartItem, 'quantity'>) => boolean
  /** Add multiple items at once (e.g. from suspended invoice). */
  addItems: (items: CartItem[]) => void
  /** Update quantity for a specific product. Removes if quantity <= 0. */
  updateQuantity: (productId: number, quantity: number) => void
  /** Update unit price for a specific product (invoice-only override). */
  updateUnitPrice: (productId: number, unitPrice: number) => void
  /** Remove a product from the cart entirely. */
  removeItem: (productId: number) => void
  /** Get total price of all items (unitPrice * quantity). */
  getSubtotal: () => number
  /** Get total item count across all products. */
  getCount: () => number
  /** Clear all items from cart. */
  clearCart: () => void
  /** Reset cart and clear any error state. */
  resetAll: () => void
  /** Clear the last error message. */
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
        success = false
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

  /** Updates the unit price for a specific item in the cart.
   * This is an invoice-only override — does NOT change the product's actual price in DB. */
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
