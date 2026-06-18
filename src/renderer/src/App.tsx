import { useState, useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'
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

export default function App() {
  const user = useAuthStore((s) => s.user)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const { init: initSettings, language } = useSettingsStore()

  useEffect(() => {
    initSettings()
    window.api.system.isFirstRun().then((r) => {
      if (r.success && r.data) setIsFirstRun(r.data.isFirstRun)
    })
  }, [])

  useEffect(() => { setLanguage(language) }, [language])

  useEffect(() => {
    const cleanup = window.api.onNavigate((page) => {
      const map: Record<string, View> = { pos: 'pos', inventory: 'inventory', dashboard: 'dashboard', admin: 'admin', sales: 'sales', addproduct: 'addproduct', categories: 'categories' }
      if (map[page]) setCurrentView(map[page])
    })
    return cleanup
  }, [])

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
