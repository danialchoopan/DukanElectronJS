import { create } from 'zustand'

export type ShortcutAction =
  | 'navigate:pos' | 'navigate:dashboard' | 'navigate:inventory'
  | 'navigate:accounting' | 'navigate:sales' | 'navigate:categories'
  | 'navigate:customers' | 'navigate:admin' | 'navigate:help'
  | 'pos:hold' | 'pos:resume1' | 'pos:resume2' | 'pos:resume3'
  | 'pos:payCash' | 'pos:payCard' | 'pos:payLedger' | 'pos:search'
  | 'global:fullscreen' | 'global:toggleTheme'

export type ShortcutMap = Record<ShortcutAction, string>

export const defaultShortcuts: ShortcutMap = {
  'navigate:pos': 'F1',
  'navigate:dashboard': 'F3',
  'navigate:inventory': 'F2',
  'navigate:accounting': 'F8',
  'navigate:sales': 'F9',
  'navigate:categories': 'F10',
  'navigate:customers': 'Ctrl+Shift+C',
  'navigate:admin': 'F4',
  'navigate:help': 'F12',
  'pos:hold': 'F4',
  'pos:resume1': 'F5',
  'pos:resume2': 'F6',
  'pos:resume3': 'F7',
  'pos:payCash': 'F8',
  'pos:payCard': 'F9',
  'pos:payLedger': 'F10',
  'pos:search': 'Ctrl+K',
  'global:fullscreen': 'F11',
  'global:toggleTheme': 'Ctrl+Shift+T',
}

export const actionLabels: Record<ShortcutAction, string> = {
  'navigate:pos': 'فروش (POS)',
  'navigate:dashboard': 'داشبورد',
  'navigate:inventory': 'انبارداری',
  'navigate:accounting': 'حسابداری',
  'navigate:sales': 'آخرین فروش\u200cها',
  'navigate:categories': 'دسته\u200cبندی\u200cها',
  'navigate:customers': 'مشتریان',
  'navigate:admin': 'تنظیمات',
  'navigate:help': 'راهنما',
  'pos:hold': 'نگه\u200cداشتن فاکتور',
  'pos:resume1': 'بازیابی فاکتور \u06f1',
  'pos:resume2': 'بازیابی فاکتور \u06f2',
  'pos:resume3': 'بازیابی فاکتور \u06f3',
  'pos:payCash': 'پرداخت نقدی',
  'pos:payCard': 'پرداخت کارتی',
  'pos:payLedger': 'پرداخت نسیه',
  'pos:search': 'جستجوی کالا',
  'global:fullscreen': 'تمام\u200cصفحه',
  'global:toggleTheme': 'تغییر تم',
}

export const actionLabelsEn: Record<ShortcutAction, string> = {
  'navigate:pos': 'Sales (POS)',
  'navigate:dashboard': 'Dashboard',
  'navigate:inventory': 'Inventory',
  'navigate:accounting': 'Accounting',
  'navigate:sales': 'Sales History',
  'navigate:categories': 'Categories',
  'navigate:customers': 'Customers',
  'navigate:admin': 'Settings',
  'navigate:help': 'Help',
  'pos:hold': 'Hold Invoice',
  'pos:resume1': 'Resume Invoice 1',
  'pos:resume2': 'Resume Invoice 2',
  'pos:resume3': 'Resume Invoice 3',
  'pos:payCash': 'Pay Cash',
  'pos:payCard': 'Pay Card',
  'pos:payLedger': 'Pay Ledger',
  'pos:search': 'Search Products',
  'global:fullscreen': 'Fullscreen',
  'global:toggleTheme': 'Toggle Theme',
}

interface ShortcutsState {
  shortcuts: ShortcutMap
  editingAction: ShortcutAction | null
  setShortcut: (action: ShortcutAction, key: string) => void
  resetShortcuts: () => void
  setEditingAction: (action: ShortcutAction | null) => void
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

export const useShortcutsStore = create<ShortcutsState>((set, get) => ({
  shortcuts: { ...defaultShortcuts },
  editingAction: null,

  setShortcut: (action, key) => {
    set((state) => ({ shortcuts: { ...state.shortcuts, [action]: key } }))
  },

  resetShortcuts: () => {
    set({ shortcuts: { ...defaultShortcuts } })
  },

  setEditingAction: (action) => set({ editingAction: action }),

  loadFromStorage: async () => {
    const r = await window.api.settings.getAll()
    if (r.success && r.data?.shortcuts) {
      try {
        const saved = JSON.parse(r.data.shortcuts as string)
        set({ shortcuts: { ...defaultShortcuts, ...saved } })
      } catch { /* use defaults */ }
    }
  },

  saveToStorage: async () => {
    const { shortcuts } = get()
    await window.api.settings.set('shortcuts', JSON.stringify(shortcuts))
  },
}))

export function getShortcutDisplayKey(key: string): string {
  return key
    .replace('Ctrl+', 'Ctrl\u200e+')
    .replace('Shift+', 'Shift\u200e+')
    .replace('Alt+', 'Alt\u200e+')
}

export function findConflicts(shortcuts: ShortcutMap, action: ShortcutAction, newKey: string): ShortcutAction[] {
  return (Object.keys(shortcuts) as ShortcutAction[]).filter(
    (a) => a !== action && shortcuts[a] === newKey
  )
}

export function buildKeyCombo(e: KeyboardEvent): string {
  let combo = ''
  if (e.ctrlKey || e.metaKey) combo += 'Ctrl+'
  if (e.shiftKey) combo += 'Shift+'
  if (e.altKey) combo += 'Alt+'
  if (e.key.startsWith('F') && e.key.length <= 3) combo += e.key
  else if (e.key.length === 1) combo += e.key.toUpperCase()
  else combo += e.key
  return combo
}
