import { create } from 'zustand'

export interface Shortcut {
  id: string
  label: string
  key: string
  category: string
  view: string
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'nav-pos', label: 'فروش', key: 'F1', category: 'nav', view: 'all' },
  { id: 'nav-inventory', label: 'انبارداری', key: 'F2', category: 'nav', view: 'all' },
  { id: 'nav-dashboard', label: 'داشبورد', key: 'F3', category: 'nav', view: 'all' },
  { id: 'nav-customers', label: 'مشتریان', key: 'F8', category: 'nav', view: 'all' },
  { id: 'nav-categories', label: 'دسته‌بندی‌ها', key: 'F9', category: 'nav', view: 'all' },
  { id: 'nav-accounting', label: 'حسابداری', key: 'F10', category: 'nav', view: 'all' },
  { id: 'nav-sales', label: 'آخرین فروش‌ها', key: 'Ctrl+1', category: 'nav', view: 'all' },
  { id: 'nav-addproduct', label: 'افزودن کالا', key: 'Ctrl+2', category: 'nav', view: 'all' },
  { id: 'nav-admin', label: 'مدیریت', key: 'Ctrl+9', category: 'nav', view: 'all' },
  { id: 'nav-help', label: 'راهنما', key: 'Ctrl+0', category: 'nav', view: 'all' },
  { id: 'pos-suspend', label: 'نگه‌داشتن فاکتور', key: 'F4', category: 'pos', view: 'pos' },
  { id: 'pos-resume1', label: 'بازیابی فاکتور ۱', key: 'F5', category: 'pos', view: 'pos' },
  { id: 'pos-resume2', label: 'بازیابی فاکتور ۲', key: 'F6', category: 'pos', view: 'pos' },
  { id: 'pos-resume3', label: 'بازیابی فاکتور ۳', key: 'F7', category: 'pos', view: 'pos' },
  { id: 'global-search', label: 'جستجو', key: 'Ctrl+K', category: 'global', view: 'all' },
  { id: 'global-fullscreen', label: 'تمام‌صفحه', key: 'F11', category: 'global', view: 'all' },
  { id: 'global-theme', label: 'تغییر تم', key: 'Ctrl+Shift+T', category: 'global', view: 'all' },
]

interface ShortcutsState {
  shortcuts: Shortcut[]
  editingId: string | null
  setEditingId: (id: string | null) => void
  updateShortcut: (id: string, newKey: string) => void
  saveShortcuts: () => void
  resetToDefaults: () => void
  loadFromStorage: () => Promise<void>
}

export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  shortcuts: [...DEFAULT_SHORTCUTS],
  editingId: null,

  setEditingId: (id) => set({ editingId: id }),

  updateShortcut: (id, newKey) => {
    const shortcuts = get().shortcuts.map(s =>
      s.id === id ? { ...s, key: newKey } : s
    )
    set({ shortcuts })
  },

  saveShortcuts: () => {
    const { shortcuts } = get()
    window.api.settings.set('shortcuts', JSON.stringify(shortcuts))
  },

  resetToDefaults: () => {
    set({ shortcuts: [...DEFAULT_SHORTCUTS] })
    window.api.settings.set('shortcuts', JSON.stringify(DEFAULT_SHORTCUTS))
  },

  loadFromStorage: async () => {
    const result = await window.api.settings.getAll()
    if (result.success && result.data?.shortcuts) {
      try {
        const saved = JSON.parse(result.data.shortcuts as string)
        if (Array.isArray(saved)) {
          const merged = DEFAULT_SHORTCUTS.map(d => {
            const found = saved.find((s: Shortcut) => s.id === d.id)
            return found ? { ...d, key: found.key } : d
          })
          set({ shortcuts: merged })
        }
      } catch { /* use defaults */ }
    }
  },
}))

export const SHORTCUT_CATEGORIES = [
  { key: 'nav', label: 'ناوبری' },
  { key: 'pos', label: 'فروش' },
  { key: 'global', label: 'عمومی' },
]
