import { useAuthStore } from '../../store/authStore'
import { useSettingsStore, getNavColors } from '../../store/settingsStore'
import { t, fa } from '../../i18n'
import { DashboardIcon, UsersIcon, SettingsIcon, LogoutIcon, LanguageIcon, MoonIcon, SunIcon } from '../ui/Icons'

type View = 'pos' | 'dashboard' | 'admin' | 'customers' | 'expenses' | 'sales' | 'addproduct' | 'accounting' | 'inventory' | 'help'

interface Props {
  currentView: View
  onNavigate: (view: string) => void
}

export default function TitleBar({ currentView, onNavigate }: Props) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, setTheme, language, setLanguage, navTheme } = useSettingsStore()
  const ui = t()
  const isDark = theme === 'dark'
  const navBg = getNavColors(navTheme, isDark)

  const navItems: { key: View; label: string; icon: JSX.Element; adminOnly?: boolean }[] = [
    { key: 'pos', label: ui.nav.checkout, icon: <CartIconNav /> },
    { key: 'dashboard', label: ui.nav.dashboard, icon: <DashboardIcon className="w-4 h-4" /> },
    { key: 'sales', label: fa.dashboard.recentSales, icon: <ClipboardIcon /> },
    { key: 'addproduct', label: fa.admin.addProduct, icon: <PackageIcon /> },
    { key: 'inventory', label: ui.nav.inventory, icon: <BoxIcon /> },
    { key: 'accounting', label: ui.nav.accounting, icon: <CalculatorIcon /> },
    { key: 'customers', label: ui.nav.customers, icon: <UsersIcon className="w-4 h-4" /> },
    { key: 'admin', label: ui.nav.admin, icon: <SettingsIcon className="w-4 h-4" />, adminOnly: true },
    { key: 'help', label: fa.nav.help, icon: <HelpIcon /> },
  ]

  return (
    <div className="drag flex items-center justify-between px-4 h-12 no-select" style={{ backgroundColor: navBg, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
      <div className="flex items-center gap-1 no-drag">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null
          const active = currentView === item.key
          return (
            <button key={item.key} onClick={() => onNavigate(item.key)}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-bold transition-all duration-150"
              style={active ? {
                color: '#ffffff',
                background: isDark ? 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(99,102,241,0.8))' : 'linear-gradient(135deg, #2563eb, #4f46e5)',
                boxShadow: isDark ? '0 2px 8px rgba(59,130,246,0.4)' : '0 2px 8px rgba(37,99,235,0.35)',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              } : { color: isDark ? '#cbd5e1' : '#374151' }}>
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2 no-drag">
        <button onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')} className="flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg font-bold" style={{ color: isDark ? '#94a3b8' : '#4b5563' }}>
          <LanguageIcon className="w-3.5 h-3.5" />{language === 'fa' ? 'EN' : 'FA'}
        </button>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="px-2 py-1.5 rounded-lg">
          {theme === 'dark' ? <SunIcon className="w-4 h-4 text-yellow-400" /> : <MoonIcon className="w-4 h-4 text-slate-600" />}
        </button>
        <div className="w-px h-5 mx-1" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
        <span className="text-xs font-medium" style={{ color: isDark ? '#94a3b8' : '#4b5563' }}>{user?.name}</span>
        <button onClick={logout} className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg" style={{ color: isDark ? '#94a3b8' : '#4b5563' }}>
          <LogoutIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function CartIconNav() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> }
function ClipboardIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> }
function PackageIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function BoxIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function CalculatorIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg> }
function HelpIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
