import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useSettingsStore, getNavColors } from '../../store/settingsStore'
import { t, fa } from '../../i18n'
import { DashboardIcon, UsersIcon, SettingsIcon, LogoutIcon, MoonIcon, SunIcon, LanguageIcon } from '../ui/Icons'

type View = 'pos' | 'dashboard' | 'admin' | 'settings' | 'customers' | 'expenses' | 'sales' | 'addproduct' | 'accounting' | 'inventory' | 'suppliers' | 'help' | 'categories' | 'reports' | 'crossSell' | 'installments' | 'proformas' | 'service' | 'credit' | 'calculator' | 'auditLog' | 'restorePoints'

interface Props {
  currentView: View
  onNavigate: (view: string) => void
}

export default function Sidebar({ currentView, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { theme, setTheme, language, setLanguage, navTheme } = useSettingsStore()
  const ui = t()
  const isDark = theme === 'dark'

  const navItems: { key: View; label: string; icon: JSX.Element; adminOnly?: boolean }[] = [
    { key: 'dashboard', label: ui.nav.dashboard, icon: <DashboardIcon className="w-5 h-5" /> },
    { key: 'pos', label: ui.nav.checkout, icon: <CartIconNav /> },
    { key: 'sales', label: fa.dashboard.recentSales, icon: <ClipboardIcon /> },
    { key: 'addproduct', label: fa.admin.addProduct, icon: <PackageIcon /> },
    { key: 'categories', label: fa.nav.categories, icon: <TagIcon /> },
    { key: 'inventory', label: ui.nav.inventory, icon: <BoxIcon /> },
    { key: 'accounting', label: ui.nav.accounting, icon: <CalculatorIcon /> },
    { key: 'reports', label: 'گزارش‌ها', icon: <ChartIcon /> },
    { key: 'proformas', label: 'پیش‌فاکتور', icon: <ProformaIcon /> },
    { key: 'installments', label: 'اقساط', icon: <InstallmentIcon /> },
    { key: 'crossSell', label: 'فروش مکمل', icon: <RuleIcon /> },
    { key: 'service', label: 'تعمیرات', icon: <WrenchIcon /> },
    { key: 'credit', label: 'اعتبار مشتری', icon: <CreditIcon /> },
    { key: 'calculator', label: 'ماشین حساب', icon: <CalcIcon /> },
    { key: 'auditLog', label: 'لاگ فعالیت', icon: <AuditLogIcon /> },
    { key: 'restorePoints', label: 'نقاط بازیابی', icon: <RestoreIcon /> },
    { key: 'customers', label: ui.nav.customers, icon: <UsersIcon className="w-5 h-5" /> },
    { key: 'suppliers', label: 'تأمین\u200cکنندگان', icon: <TruckIcon /> },
    { key: 'settings', label: 'تنظیمات', icon: <SettingsIcon className="w-5 h-5" /> },
    { key: 'admin', label: 'مدیریت', icon: <AdminIcon />, adminOnly: true },
    { key: 'help', label: fa.nav.help, icon: <HelpIcon /> },
  ]

  const primary = getNavColors(navTheme, isDark)
  const sidebarWidth = collapsed ? 64 : 220

  return (
    <div
      className="h-full flex flex-col relative"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        transition: 'width 0.25s ease, min-width 0.25s ease',
        background: isDark
          ? 'linear-gradient(180deg, #0f1a2e 0%, #162033 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isDark
          ? '-4px 0 24px rgba(0,0,0,0.25)'
          : '-4px 0 24px rgba(0,0,0,0.04)',
      }}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-10"
        style={{
          backgroundColor: primary,
          color: '#fff',
          boxShadow: '0 2px 8px rgba(0,97,148,0.3)',
        }}
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points={collapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
        </svg>
      </button>

      {/* Logo */}
      <div
        className={`flex items-center ${collapsed ? 'justify-center px-0 py-4' : 'px-4 py-4 gap-3'}`}
        style={{
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          background: isDark
            ? 'linear-gradient(135deg, rgba(0,97,148,0.15) 0%, transparent 60%)'
            : 'linear-gradient(135deg, rgba(0,97,148,0.06) 0%, transparent 60%)',
        }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primary}, #007bb9)`,
            boxShadow: '0 2px 8px rgba(0,97,148,0.3)',
          }}
        >
          <StoreLogo />
        </div>
        {!collapsed && (
          <span className="text-base font-extrabold tracking-tight whitespace-nowrap" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
            {ui.app.title}
          </span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null
            const active = currentView === item.key
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 group relative ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'}`}
                style={{
                  backgroundColor: active
                    ? isDark ? 'rgba(0,97,148,0.2)' : 'rgba(0,97,148,0.08)'
                    : 'transparent',
                  color: active
                    ? isDark ? '#93ccff' : primary
                    : isDark ? '#94a3b8' : '#64748b',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = 'transparent'
                }}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full"
                    style={{
                      background: `linear-gradient(180deg, ${primary}, #007bb9)`,
                      boxShadow: '0 0 8px rgba(0,97,148,0.4)',
                    }}
                  />
                )}
                <span style={{ color: active ? (isDark ? '#93ccff' : primary) : undefined }}>
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Bottom Controls */}
      <div
        className={`py-3 space-y-2.5 ${collapsed ? 'px-2' : 'px-3'}`}
        style={{
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          background: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
        }}
      >
        {/* User Row */}
        {collapsed ? (
          <div className="flex justify-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              title={user?.name}
              style={{
                background: `linear-gradient(135deg, ${primary}, #007bb9)`,
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,97,148,0.25)',
              }}
            >
              {user?.name?.charAt(0) || '?'}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: `linear-gradient(135deg, ${primary}, #007bb9)`,
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(0,97,148,0.25)',
              }}
            >
              {user?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>
                {user?.name}
              </div>
              <div className="text-[10px] font-medium" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                {user?.role === 'admin' ? fa.admin.admin : fa.admin.cashier}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{ color: isDark ? '#64748b' : '#94a3b8' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = isDark ? '#64748b' : '#94a3b8'
              }}
              title={ui.nav.logout}
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Theme & Language Row */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              title={language === 'fa' ? 'English' : 'فارسی'}
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
              }}
            >
              <LanguageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              title={isDark ? ui.admin.lightMode : ui.admin.darkMode}
              style={{
                color: isDark ? '#fbbf24' : '#64748b',
                background: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(251,191,36,0.15)' : 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(251,191,36,0.08)' : 'rgba(0,0,0,0.04)'
              }}
            >
              {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
              }}
            >
              <LanguageIcon className="w-3.5 h-3.5" />
              {language === 'fa' ? 'EN' : 'FA'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                color: isDark ? '#fbbf24' : '#64748b',
                background: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(251,191,36,0.15)' : 'rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(251,191,36,0.08)' : 'rgba(0,0,0,0.04)'
              }}
            >
              {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function CartIconNav() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

function CalculatorIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="16" y1="14" x2="16" y2="18" />
      <line x1="8" y1="10" x2="8" y2="10.01" />
      <line x1="12" y1="10" x2="12" y2="10.01" />
      <line x1="16" y1="10" x2="16" y2="10.01" />
      <line x1="8" y1="14" x2="8" y2="14.01" />
      <line x1="12" y1="14" x2="12" y2="14.01" />
      <line x1="8" y1="18" x2="8" y2="18.01" />
      <line x1="12" y1="18" x2="12" y2="18.01" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ProformaIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function InstallmentIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function RuleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function CreditIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function CalcIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10.01" />
      <line x1="12" y1="10" x2="12" y2="10.01" />
      <line x1="16" y1="10" x2="16" y2="10.01" />
      <line x1="8" y1="14" x2="8" y2="14.01" />
      <line x1="12" y1="14" x2="12" y2="14.01" />
      <line x1="8" y1="18" x2="8" y2="18.01" />
      <line x1="12" y1="18" x2="12" y2="18.01" />
      <line x1="16" y1="14" x2="16" y2="18" />
    </svg>
  )
}

function AuditLogIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function StoreLogo() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
