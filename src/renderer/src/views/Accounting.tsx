import { useState } from 'react'
import { fa } from '../i18n'
import AccountingDashboard from './accounting/AccountingDashboard'
import ChartOfAccounts from './accounting/ChartOfAccounts'
import JournalEntries from './accounting/JournalEntries'
import TrialBalance from './accounting/TrialBalance'
import IncomeStatement from './accounting/IncomeStatement'
import BalanceSheet from './accounting/BalanceSheet'
import ARAging from './accounting/ARAging'

type AccountingTab = 'dashboard' | 'accounts' | 'journal' | 'trialBalance' | 'incomeStatement' | 'balanceSheet' | 'arAging'

export default function Accounting() {
  const [tab, setTab] = useState<AccountingTab>('dashboard')
  const isDark = document.documentElement.classList.contains('dark')
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const tabs: { key: AccountingTab; label: string; icon: JSX.Element; group: number }[] = [
    {
      key: 'dashboard', label: fa.accounting.tabs.dashboard, group: 0,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>),
    },
    {
      key: 'accounts', label: fa.accounting.tabs.chartOfAccounts, group: 1,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="5" r="3" /><line x1="12" y1="8" x2="12" y2="14" /><circle cx="6" cy="19" r="3" /><circle cx="18" cy="19" r="3" /><line x1="12" y1="14" x2="6" y2="16" /><line x1="12" y1="14" x2="18" y2="16" /></svg>),
    },
    {
      key: 'journal', label: fa.accounting.tabs.journal, group: 1,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>),
    },
    {
      key: 'trialBalance', label: fa.accounting.tabs.trialBalance, group: 1,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></svg>),
    },
    {
      key: 'incomeStatement', label: fa.accounting.tabs.incomeStatement, group: 2,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
    },
    {
      key: 'balanceSheet', label: fa.accounting.tabs.balanceSheet, group: 2,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /></svg>),
    },
    {
      key: 'arAging', label: fa.accounting.tabs.arAging, group: 2,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    },
  ]

  const groups = [0, 1, 2]

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center gap-3 mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.accounting.tabs.dashboard}</h2>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {groups.map((g, gi) => (
          <div key={g} className="flex gap-1 items-center">
            {gi > 0 && (
              <div className="w-px h-6 mx-1 flex-shrink-0" style={{ backgroundColor: cardBorder }} />
            )}
            {tabs.filter(t => t.group === g).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: tab === t.key ? '#3b82f6' : (isDark ? '#1e293b' : '#f8fafc'),
                  color: tab === t.key ? '#ffffff' : textSecondary,
                  border: `1px solid ${tab === t.key ? '#3b82f6' : cardBorder}`,
                }}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div>
        {tab === 'dashboard' && <AccountingDashboard />}
        {tab === 'accounts' && <ChartOfAccounts />}
        {tab === 'journal' && <JournalEntries />}
        {tab === 'trialBalance' && <TrialBalance />}
        {tab === 'incomeStatement' && <IncomeStatement />}
        {tab === 'balanceSheet' && <BalanceSheet />}
        {tab === 'arAging' && <ARAging />}
      </div>
    </div>
  )
}
