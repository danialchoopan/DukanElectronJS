import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'
import { useShortcutsStore, buildKeyCombo } from './store/shortcutsStore'
import { setLanguage } from './i18n'
import LockScreen from './views/LockScreen'
import CashierPOS from './views/CashierPOS'
import Dashboard from './views/Dashboard'
import AdminPanel from './views/AdminPanel'
import CustomerManagement from './views/CustomerManagement'
import SalesHistory from './views/SalesHistory'
import AddProduct from './views/AddProduct'
import Accounting from './views/Accounting'
import Inventory from './views/Inventory'
import Categories from './views/Categories'
import Help from './views/Help'
import SetupWizard from './views/SetupWizard'
import Sidebar from './components/Sidebar'

type View = 'pos' | 'dashboard' | 'admin' | 'customers' | 'expenses' | 'sales' | 'addproduct' | 'accounting' | 'inventory' | 'help' | 'categories'

const VIEW_MAP: Record<string, View> = {
  pos: 'pos', inventory: 'inventory', dashboard: 'dashboard', admin: 'admin',
  sales: 'sales', addproduct: 'addproduct', categories: 'categories',
  customers: 'customers', accounting: 'accounting', help: 'help',
}

export default function App() {
  const user = useAuthStore((s) => s.user)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const { init: initSettings, language } = useSettingsStore()
  const { shortcuts, loadFromStorage } = useShortcutsStore()

  useEffect(() => {
    initSettings()
    loadFromStorage()
    window.api.system.isFirstRun().then((r) => {
      if (r.success && r.data) setIsFirstRun(r.data.isFirstRun)
    })
  }, [])

  useEffect(() => { setLanguage(language) }, [language])

  useEffect(() => {
    const cleanup = window.api.onNavigate((page) => {
      if (VIEW_MAP[page]) setCurrentView(VIEW_MAP[page])
    })
    return cleanup
  }, [])

  const navigateTo = useCallback((view: View) => {
    setCurrentView(view)
  }, [])

  useEffect(() => {
    if (!user) return

    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      const combo = buildKeyCombo(e)

      const navMap: Record<string, View> = {
        'navigate:pos': 'pos', 'navigate:inventory': 'inventory', 'navigate:dashboard': 'dashboard',
        'navigate:customers': 'customers', 'navigate:categories': 'categories', 'navigate:accounting': 'accounting',
        'navigate:sales': 'sales', 'navigate:admin': 'admin', 'navigate:help': 'help',
      }

      for (const [action, key] of Object.entries(shortcuts)) {
        if (key !== combo) continue
        if (isInput && !combo.startsWith('F') && !combo.startsWith('Ctrl')) continue

        e.preventDefault()
        e.stopPropagation()

        const act = action as keyof typeof shortcuts

        if (act in navMap && act.startsWith('navigate:')) {
          navigateTo(navMap[act])
          return
        }

        if (act === 'global:toggleTheme') {
          const settingsStore = useSettingsStore.getState()
          settingsStore.setTheme(settingsStore.theme === 'dark' ? 'light' : 'dark')
          return
        }

        if (act.startsWith('pos:')) {
          window.dispatchEvent(new CustomEvent('pos-shortcut', { detail: act }))
          return
        }

        if (act === 'pos:search') {
          const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]') ||
                              document.querySelector<HTMLInputElement>('input[placeholder*="جستجو"]') ||
                              document.querySelector<HTMLInputElement>('.input-field')
          searchInput?.focus()
          return
        }
      }
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [user, shortcuts, navigateTo])

  if (isFirstRun === null) return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Loading...</div>
  if (isFirstRun) return <SetupWizard onComplete={() => setIsFirstRun(false)} />
  if (!user) return <LockScreen />

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar currentView={currentView} onNavigate={(v) => setCurrentView(v as View)} />
      <div className="flex-1 overflow-hidden">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'pos' && <CashierPOS />}
        {currentView === 'sales' && <SalesHistory />}
        {currentView === 'addproduct' && <AddProduct />}
        {currentView === 'categories' && <Categories />}
        {currentView === 'inventory' && <Inventory />}
        {currentView === 'accounting' && <Accounting />}
        {currentView === 'customers' && <CustomerManagement />}
        {currentView === 'admin' && user.role === 'admin' && <AdminPanel />}
        {currentView === 'help' && <Help />}
      </div>
    </div>
  )
}
