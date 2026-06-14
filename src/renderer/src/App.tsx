import { useState, useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useSettingsStore } from './store/settingsStore'
import { setLanguage } from './i18n'
import LockScreen from './views/LockScreen'
import CashierPOS from './views/CashierPOS'
import Dashboard from './views/Dashboard'
import AdminPanel from './views/AdminPanel'
import CustomerManagement from './views/CustomerManagement'
import ExpenseManagement from './views/ExpenseManagement'
import SalesHistory from './views/SalesHistory'
import AddProduct from './views/AddProduct'
import Accounting from './views/Accounting'
import Inventory from './views/Inventory'
import Help from './views/Help'
import SetupWizard from './views/SetupWizard'
import TitleBar from './components/TitleBar'

type View = 'pos' | 'dashboard' | 'admin' | 'customers' | 'expenses' | 'sales' | 'addproduct' | 'accounting' | 'inventory' | 'help'

export default function App() {
  const user = useAuthStore((s) => s.user)
  const [currentView, setCurrentView] = useState<View>('pos')
  const [isFirstRun, setIsFirstRun] = useState<boolean | null>(null)
  const { init: initSettings, language } = useSettingsStore()

  useEffect(() => {
    initSettings()
    window.api.system.isFirstRun().then((r) => {
      if (r.success && r.data) setIsFirstRun(r.data.isFirstRun)
    })
  }, [])

  useEffect(() => {
    setLanguage(language)
  }, [language])

  useEffect(() => {
    const cleanup = window.api.onNavigate((page) => {
      switch (page) {
        case 'pos': setCurrentView('pos'); break
        case 'inventory': setCurrentView('inventory'); break
        case 'dashboard': setCurrentView('dashboard'); break
        case 'admin': setCurrentView('admin'); break
        case 'sales': setCurrentView('sales'); break
        case 'addproduct': setCurrentView('addproduct'); break
        case 'accounting': setCurrentView('accounting'); break
      }
    })
    return cleanup
  }, [])

  if (isFirstRun === null) {
    return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>Loading...</div>
  }

  if (isFirstRun) {
    return <SetupWizard onComplete={() => setIsFirstRun(false)} />
  }

  if (!user) return <LockScreen />

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <TitleBar currentView={currentView} onNavigate={(v) => setCurrentView(v as View)} />
      <div className="flex-1 overflow-hidden">
        {currentView === 'pos' && <CashierPOS />}
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'sales' && <SalesHistory />}
        {currentView === 'addproduct' && <AddProduct />}
        {currentView === 'inventory' && <Inventory />}
        {currentView === 'accounting' && <Accounting />}
        {currentView === 'help' && <Help />}
        {currentView === 'admin' && user.role === 'admin' && <AdminPanel />}
        {currentView === 'customers' && <CustomerManagement />}
        {currentView === 'expenses' && <ExpenseManagement />}
      </div>
    </div>
  )
}
