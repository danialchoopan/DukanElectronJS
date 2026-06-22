import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'
import { useShortcutsStore } from './store/shortcutsStore'
import { setLanguage } from './i18n'
import { setShopName, setTaxRate, setPrintCustomization } from './utils/a4Print'
import LockScreen from './views/LockScreen'
import SalesTerminal from './views/SalesTerminal'
import Dashboard from './views/Dashboard'
import AdminPanel from './views/AdminPanel'
import CustomerManagement from './views/CustomerManagement'
import SalesHistory from './views/SalesHistory'
import AddProduct from './views/AddProduct'
import Accounting from './views/Accounting'
import Inventory from './views/Inventory'
import Categories from './views/Categories'
import Help from './views/Help'
import Suppliers from './views/Suppliers'
import SetupWizard from './views/SetupWizard'
import Sidebar from './components/Sidebar'
import GlobalSearch from './components/GlobalSearch'
import PrintPreviewDialog from './components/PrintPreviewDialog'

type View = 'pos' | 'dashboard' | 'admin' | 'customers' | 'expenses' | 'sales' | 'addproduct' | 'accounting' | 'inventory' | 'suppliers' | 'help' | 'categories'

const NAV_MAP: Record<string, View> = {
  'nav-pos': 'pos', 'nav-inventory': 'inventory', 'nav-dashboard': 'dashboard',
  'nav-customers': 'customers', 'nav-categories': 'categories', 'nav-accounting': 'accounting',
  'nav-sales': 'sales', 'nav-addproduct': 'addproduct', 'nav-admin': 'admin', 'nav-help': 'help',
}

const VIEW_MAP: Record<string, View> = {
  pos: 'pos', inventory: 'inventory', dashboard: 'dashboard', admin: 'admin',
  sales: 'sales', addproduct: 'addproduct', categories: 'categories',
  customers: 'customers', accounting: 'accounting', help: 'help', suppliers: 'suppliers',
}

export default function App() {
  const user = useAuthStore((s) => s.user)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [navParams, setNavParams] = useState<{ tab?: string; highlightId?: string } | null>(null)
  const { init: initSettings, language, theme, setTheme } = useSettingsStore()
  const { shortcuts, loadFromStorage } = useShortcutsStore()

  useEffect(() => {
    initSettings().then(() => {
      window.api.printSettings.getAll().then((r) => {
        if (r.success && r.data) setPrintCustomization(r.data)
      })
      window.api.settings.getAll().then((r) => {
        if (r.success && r.data?.storeName) setShopName(r.data.storeName, r.data.storePhone || '')
        if (r.success && r.data?.taxRate) setTaxRate(parseFloat(r.data.taxRate) || 0)
      })
    })
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

  useEffect(() => {
    let lastShiftTime = 0
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        const now = Date.now()
        if (now - lastShiftTime < 500) {
          setShowGlobalSearch(true)
          lastShiftTime = 0
        } else {
          lastShiftTime = now
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleNavigate = useCallback((view: string, tab?: string, highlightId?: string) => {
    setCurrentView(view as View)
    const effectiveHighlight = highlightId || (tab ? `tab-${tab}` : undefined)
    if (tab || effectiveHighlight) setNavParams({ tab, highlightId: effectiveHighlight })
    else setNavParams(null)
  }, [])

  if (isFirstRun === null) return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Loading...</div>
  if (isFirstRun) return <SetupWizard onComplete={() => setIsFirstRun(false)} />
  if (!user) return <LockScreen />

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Sidebar currentView={currentView} onNavigate={(v) => setCurrentView(v as View)} />
      <div className="flex-1 overflow-hidden">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'pos' && <SalesTerminal />}
        {currentView === 'sales' && <SalesHistory />}
        {currentView === 'addproduct' && <AddProduct />}
        {currentView === 'categories' && <Categories />}
        {currentView === 'inventory' && <Inventory initialTab={navParams?.tab} highlightId={navParams?.highlightId} onHighlightDone={() => setNavParams(null)} />}
        {currentView === 'accounting' && <Accounting initialTab={navParams?.tab} highlightId={navParams?.highlightId} onHighlightDone={() => setNavParams(null)} />}
        {currentView === 'customers' && <CustomerManagement highlightId={navParams?.highlightId} onHighlightDone={() => setNavParams(null)} />}
        {currentView === 'suppliers' && <Suppliers />}
        {currentView === 'admin' && user.role === 'admin' && <AdminPanel initialTab={navParams?.tab} highlightId={navParams?.highlightId} onHighlightDone={() => setNavParams(null)} />}
        {currentView === 'help' && <Help />}
      </div>
      <GlobalSearch open={showGlobalSearch} onClose={() => setShowGlobalSearch(false)} onNavigate={(view, tab, highlightId) => { handleNavigate(view, tab, highlightId); setShowGlobalSearch(false) }} />
      <PrintPreviewDialog />
    </div>
  )
}
