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

  const tabs: { key: AccountingTab; label: string }[] = [
    { key: 'dashboard', label: fa.accounting.tabs.dashboard },
    { key: 'accounts', label: fa.accounting.tabs.chartOfAccounts },
    { key: 'journal', label: fa.accounting.tabs.journal },
    { key: 'trialBalance', label: fa.accounting.tabs.trialBalance },
    { key: 'incomeStatement', label: fa.accounting.tabs.incomeStatement },
    { key: 'balanceSheet', label: fa.accounting.tabs.balanceSheet },
    { key: 'arAging', label: fa.accounting.tabs.arAging },
  ]

  return (
    <div className="h-full p-4 overflow-auto">
      <h2 className="text-xl font-bold mb-4" style={{ color: textPrimary }}>{fa.accounting.tabs.dashboard}</h2>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === t.key ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400'}`}>
            {t.label}
          </button>
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
