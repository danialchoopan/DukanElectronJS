import { useState, useEffect } from 'react'
import { fa } from '../i18n'
import HelpPopup from '../components/ui/HelpPopup'
import AccountingDashboard from './accounting/AccountingDashboard'
import ChartOfAccounts from './accounting/ChartOfAccounts'
import JournalEntries from './accounting/JournalEntries'
import TrialBalance from './accounting/TrialBalance'
import IncomeStatement from './accounting/IncomeStatement'
import BalanceSheet from './accounting/BalanceSheet'
import ARAging from './accounting/ARAging'
import ExpenseManagement from './accounting/ExpenseManagement'
import FiscalPeriods from './accounting/FiscalPeriods'
import CashFlowStatement from './accounting/CashFlowStatement'
import PriceHistory from './accounting/PriceHistory'
import AccountingAnalytics from './accounting/AccountingAnalytics'
import { useHighlight } from '../hooks/useHighlight'
import { useTheme } from '../hooks/useTheme'

type AccountingTab = 'dashboard' | 'analytics' | 'accounts' | 'journal' | 'trialBalance' | 'incomeStatement' | 'balanceSheet' | 'arAging' | 'expenses' | 'periods' | 'cashFlow' | 'priceHistory'

interface Props {
  initialTab?: string
  highlightId?: string
  onHighlightDone?: () => void
}

export default function Accounting({ initialTab, highlightId, onHighlightDone }: Props) {
  const [tab, setTab] = useState<AccountingTab>((initialTab as AccountingTab) || 'dashboard')
  const { isDark } = useTheme()
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  useEffect(() => {
    if (initialTab && (tabs.some(t => t.key === initialTab))) {
      setTab(initialTab as AccountingTab)
    }
  }, [initialTab])

  useHighlight(highlightId, onHighlightDone)

  const tabs: { key: AccountingTab; label: string; icon: JSX.Element; group: number }[] = [
    { key: 'dashboard', label: fa.accounting.tabs.dashboard, group: 0,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>),
    },
    { key: 'analytics', label: 'تحلیل و نمودار', group: 0,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21.21 15.89A10 10 0 118 2.83" /><path d="M22 12A10 10 0 0012 2v10z" /></svg>),
    },
    { key: 'accounts', label: fa.accounting.tabs.chartOfAccounts, group: 1,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="5" r="3" /><line x1="12" y1="8" x2="12" y2="14" /><circle cx="6" cy="19" r="3" /><circle cx="18" cy="19" r="3" /><line x1="12" y1="14" x2="6" y2="16" /><line x1="12" y1="14" x2="18" y2="16" /></svg>),
    },
    { key: 'journal', label: fa.accounting.tabs.journal, group: 1,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>),
    },
    { key: 'trialBalance', label: fa.accounting.tabs.trialBalance, group: 1,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><line x1="4.93" y1="19.07" x2="7.76" y2="16.24" /><line x1="16.24" y1="7.76" x2="19.07" y2="4.93" /></svg>),
    },
    { key: 'incomeStatement', label: fa.accounting.tabs.incomeStatement, group: 2,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>),
    },
    { key: 'balanceSheet', label: fa.accounting.tabs.balanceSheet, group: 2,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="15" y2="16" /></svg>),
    },
    { key: 'arAging', label: fa.accounting.tabs.arAging, group: 2,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
    },
    { key: 'expenses', label: fa.nav.expenses, group: 3,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
    },
    { key: 'periods', label: fa.accounting.periods.title, group: 3,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>),
    },
    { key: 'cashFlow', label: fa.accounting.tabs.cashFlow, group: 4,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>),
    },
    { key: 'priceHistory', label: 'تاریخچه قیمت', group: 4,
      icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>),
    },
  ]

  const groups = [0, 1, 2, 3, 4]

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center gap-3 mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.accounting.tabs.dashboard}</h2>
        <HelpPopup title="راهنمای حسابداری" sections={[
          { heading: 'داشبورد حسابداری', items: ['نمای کلی از وضعیت مالی فروشگاه', 'آمار کل حساب‌ها و تعداد سند حسابداری', 'وضعیت دوره مالی فعال', 'امکان انتقال اطلاعات قبلی به دفتر کل'] },
          { heading: 'دفتر حسابها', items: ['مدیریت ساختار حساب‌ها با کد و نام', 'ایجاد حساب‌های والد و زیرمجموعه', 'انواع حساب: دارایی، بدهی، سرمایه، درآمد، هزینه', 'غیرفعال کردن حساب‌ها بدون حذف اطلاعات'] },
          { heading: 'روزنامه', items: ['مشاهده تمام اسناد حسابداری ثبت شده', 'هر سند باید بدهکار و بستانکار برابر باشد', 'اسناد خودکار از فروش، هزینه و مرجوعی ایجاد می‌شوند'] },
          { heading: 'تراز آزمایشی', items: ['نمایش مانده تمام حساب‌ها در یک نگاه', 'جمع بدهکار باید با جمع بستانکار برابر باشد', 'فیلتر تاریخی برای بررسی دوره‌های مختلف'] },
          { heading: 'صورت سود و زیان', items: ['درآمدها - بهای تمام شده = سود ناخالص', 'سود ناخالص - هزینه‌های عملیاتی = سود خالص'] },
          { heading: 'ترازنامه', items: ['دارایی‌ها = بدهی‌ها + سرمایه', 'دارایی‌های جاری و غیرجاری', 'سود انباشته از صورت سود و زیان'] },
          { heading: 'مانده مشتریان', items: ['گزارش بدهی مشتریان بر اساس سنین بدهی', 'رنگ‌بندی برای شناسایی سریع بدهکاران'] },
          { heading: 'هزینه‌ها', items: ['ثبت هزینه‌ها با دسته‌بندی و تصویر رسید', 'گزارش هزینه‌ها بر اساس دسته', 'خودکار سند حسابداری برای هر هزینه'] },
        ]} />
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        {groups.map((g, gi) => (
          <div key={g} className="flex gap-1 items-center">
            {gi > 0 && (<div className="w-px h-6 mx-1 flex-shrink-0" style={{ backgroundColor: cardBorder }} />)}
            {tabs.filter(t => t.group === g).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} data-highlight-id={`tab-${t.key}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${highlightId === `tab-${t.key}` ? 'highlight-tab' : ''}`}
                style={{ backgroundColor: tab === t.key ? '#3b82f6' : (isDark ? '#1e293b' : '#f8fafc'), color: tab === t.key ? '#ffffff' : textSecondary, border: `1px solid ${tab === t.key ? '#3b82f6' : cardBorder}` }}>
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div>
        {tab === 'dashboard' && <AccountingDashboard />}
        {tab === 'analytics' && <AccountingAnalytics />}
        {tab === 'accounts' && <ChartOfAccounts />}
        {tab === 'journal' && <JournalEntries />}
        {tab === 'trialBalance' && <TrialBalance />}
        {tab === 'incomeStatement' && <IncomeStatement />}
        {tab === 'balanceSheet' && <BalanceSheet />}
        {tab === 'arAging' && <ARAging />}
        {tab === 'expenses' && <ExpenseManagement />}
        {tab === 'periods' && <FiscalPeriods />}
        {tab === 'cashFlow' && <CashFlowStatement />}
        {tab === 'priceHistory' && <PriceHistory />}
      </div>
    </div>
  )
}
