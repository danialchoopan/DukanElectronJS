import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { t, fa } from '../i18n'
import { DashboardIcon, UsersIcon, SettingsIcon, LogoutIcon, MoonIcon, SunIcon } from './Icons'

type View = 'pos' | 'dashboard' | 'admin' | 'customers' | 'expenses' | 'sales' | 'addproduct' | 'accounting' | 'inventory' | 'help' | 'categories'

interface Props {
  currentView: View
  onNavigate: (view: string) => void
}

export default function Sidebar({ currentView, onNavigate }: Props) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, setTheme, language, setLanguage } = useSettingsStore()
  const ui = t()
  const isDark = theme === 'dark'
  const navBg = isDark ? '#1e293b' : '#ffffff'

  const navItems: { key: View; label: string; icon: JSX.Element; adminOnly?: boolean }[] = [
    { key: 'dashboard', label: ui.nav.dashboard, icon: <DashboardIcon className="w-5 h-5" /> },
    { key: 'pos', label: ui.nav.checkout, icon: <CartIconNav /> },
    { key: 'sales', label: fa.dashboard.recentSales, icon: <ClipboardIcon /> },
    { key: 'addproduct', label: fa.admin.addProduct, icon: <PackageIcon /> },
    { key: 'categories', label: fa.nav.categories, icon: <TagIcon /> },
    { key: 'inventory', label: ui.nav.inventory, icon: <BoxIcon /> },
    { key: 'accounting', label: ui.nav.accounting, icon: <CalculatorIcon /> },
    { key: 'customers', label: ui.nav.customers, icon: <UsersIcon className="w-5 h-5" /> },
    { key: 'expenses', label: fa.nav.expenses, icon: <ReceiptIcon /> },
    { key: 'admin', label: ui.nav.admin, icon: <SettingsIcon className="w-5 h-5" />, adminOnly: true },
    { key: 'help', label: fa.nav.help, icon: <HelpIcon /> },
  ]

  return (
    <div className="h-full flex flex-col border-l" style={{ backgroundColor: navBg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', width: '220px', minWidth: '220px' }}>
      {/* Logo */}
      <div className="p-4 flex items-center gap-2 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <StoreLogo />
        <span className="text-lg font-bold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{ui.app.title}</span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null
          const active = currentView === item.key
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-bold transition-all"
              style={{
                backgroundColor: active ? '#3b82f6' : 'transparent',
                color: active ? '#ffffff' : isDark ? '#94a3b8' : '#4b5563',
              }}>
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-3 border-t space-y-2" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-between px-1">
          <button onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')} className="text-xs font-bold px-2 py-1 rounded" style={{ color: isDark ? '#94a3b8' : '#4b5563' }}>
            {language === 'fa' ? 'EN' : 'FA'}
          </button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-sm px-2 py-1 rounded">
            {theme === 'dark' ? <SunIcon className="w-4 h-4 text-yellow-400" /> : <MoonIcon className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium" style={{ color: isDark ? '#94a3b8' : '#4b5563' }}>{user?.name}</span>
          <button onClick={logout} className="text-xs px-2 py-1 rounded" style={{ color: isDark ? '#94a3b8' : '#4b5563' }}>
            <LogoutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function CartIconNav() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> }
function ClipboardIcon() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> }
function PackageIcon() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function TagIcon() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function BoxIcon() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function CalculatorIcon() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg> }
function HelpIcon() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function StoreLogo() { return <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function ReceiptIcon() { return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 2v20l2-1.5L8 21l2 1.5L12 21l2 1.5L16 21l2 1.5 2-1.5L22 22V2l-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5L10 2 8 3.5 6 2 4 2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg> }
