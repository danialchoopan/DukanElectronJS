import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'
import { useShortcutsStore } from './store/shortcutsStore'
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

const NAV_MAP: Record<string, View> = {
  'nav-pos': 'pos', 'nav-inventory': 'inventory', 'nav-dashboard': 'dashboard',
  'nav-customers': 'customers', 'nav-categories': 'categories', 'nav-accounting': 'accounting',
  'nav-sales': 'sales', 'nav-addproduct': 'addproduct', 'nav-admin': 'admin', 'nav-help': 'help',
}

const VIEW_MAP: Record<string, View> = {
  pos: 'pos', inventory: 'inventory', dashboard: 'dashboard', admin: 'admin',
  sales: 'sales', addproduct: 'addproduct', categories: 'categories',
  customers: 'customers', accounting: 'accounting', help: 'help',
}

export default function App() {
  const user = useAuthStore((s) => s.user)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const { init: initSettings, language, theme, setTheme } = useSettingsStore()
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

  const navigateTo = useCallback((view: View) => setCurrentView(view), [])

  useEffect(() => {
    if (!user) return

    const handler = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      let combo = ''
      if (e.ctrlKey || e.metaKey) combo += 'Ctrl+'
      if (e.shiftKey) combo += 'Shift+'
      if (e.altKey) combo += 'Alt+'
      if (e.key.startsWith('F') && e.key.length <= 3) combo += e.key
      else if (e.key.length === 1) combo += e.key.toUpperCase()
      else combo += e.key

      const match = shortcuts.find(s => {
        if (s.key !== combo) return false
        if (s.view !== 'all' && s.view !== currentView) return false
        if (isInput && !s.key.startsWith('F') && !s.key.startsWith('Ctrl')) return false
        return true
      })

      if (match) {
        e.preventDefault()
        e.stopPropagation()

        if (NAV_MAP[match.id]) {
          navigateTo(NAV_MAP[match.id])
        } else if (match.id === 'global-theme') {
          setTheme(theme === 'dark' ? 'light' : 'dark')
        } else if (match.id === 'global-search') {
          const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="جستجو"]') ||
                              document.querySelector<HTMLInputElement>('.input-field')
          searchInput?.focus()
        }
      }
    }

    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [user, shortcuts, currentView, navigateTo, theme, setTheme])

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
