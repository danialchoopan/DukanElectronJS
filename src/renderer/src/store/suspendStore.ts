import { create } from 'zustand'
import type { CartItem } from '../../../types'

const MAX_SLOTS = 3

interface SuspendedSlot {
  id: number | null
  items: CartItem[]
}

interface SuspendState {
  slots: SuspendedSlot[]
  activeSlot: number

  setSlot: (index: number, id: number | null, items: CartItem[]) => void
  clearSlot: (index: number) => void
  loadSlots: (serverSlots: { id: number; slotIndex: number; items: CartItem[] }[]) => void
  clear: () => void
}

export const useSuspendStore = create<SuspendState>((set) => ({
  slots: Array.from({ length: MAX_SLOTS }, () => ({ id: null, items: [] })),
  activeSlot: -1,

  setSlot: (index, id, items) => {
    set((state) => {
      const newSlots = [...state.slots]
      newSlots[index] = { id, items }
      return { slots: newSlots }
    })
  },

  clearSlot: (index) => {
    set((state) => {
      const newSlots = [...state.slots]
      newSlots[index] = { id: null, items: [] }
      return { slots: newSlots }
    })
  },

  loadSlots: (serverSlots) => {
    set(() => {
      const slots: SuspendedSlot[] = Array.from({ length: MAX_SLOTS }, () => ({ id: null, items: [] }))
      for (const s of serverSlots) {
        if (s.slotIndex >= 0 && s.slotIndex < MAX_SLOTS) {
          slots[s.slotIndex] = { id: s.id, items: s.items }
        }
      }
      return { slots }
    })
  },

  clear: () => set({
    slots: Array.from({ length: MAX_SLOTS }, () => ({ id: null, items: [] })),
    activeSlot: -1,
  }),
}))
