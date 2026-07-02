/**
 * Reports — parent view for advanced sales reports.
 *
 * Contains 6 tabbed sub-reports:
 *   1. Best-Selling: top products by quantity/revenue with period comparison
 *   2. Sales by Hour: hourly heatmap + day-of-week patterns
 *   3. Period Comparison: compare any two date ranges
 *   4. Best Customers: top customers by revenue with tier system
 *   5. Category Profit: margin analysis per category
 *   6. Customer Patterns: purchase behavior, retention, churn analysis
 *
 * Accessible from the sidebar navigation (Reports section).
 */

import { useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import BestSellingReport from './reports/BestSellingReport'
import SalesByHourReport from './reports/SalesByHourReport'
import PeriodComparisonReport from './reports/PeriodComparisonReport'
import BestCustomersReport from './reports/BestCustomersReport'
import CategoryProfitReport from './reports/CategoryProfitReport'
import CustomerPatternsReport from './reports/CustomerPatternsReport'

type ReportTab = 'bestSelling' | 'salesByHour' | 'periodComparison' | 'bestCustomers' | 'categoryProfit' | 'customerPatterns'

export default function Reports() {
  const { isDark, colors } = useTheme()
  const [tab, setTab] = useState<ReportTab>('bestSelling')

  const tPri = colors.text.primary
  const tSec = colors.text.secondary
  const cardBg = colors.bg.card
  const cardBorder = colors.border.default

  const tabs: { key: ReportTab; label: string; icon: JSX.Element }[] = [
    { key: 'bestSelling', label: 'پرفروش‌ها', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.18 2.75L8 13.61l-5-4.87 6.91-1.01L12 2z"/></svg> },
    { key: 'salesByHour', label: 'فروش ساعتی', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { key: 'periodComparison', label: 'مقایسه دوره‌ها', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
    { key: 'bestCustomers', label: 'مشتریان برتر', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
    { key: 'categoryProfit', label: 'سود دسته‌ها', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg> },
    { key: 'customerPatterns', label: 'الگوی خرید', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg> },
  ]

  return (
    <div className="h-full p-5 overflow-auto" style={{ background: isDark ? '#0f172a' : '#f8fafc' }}>
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: tPri }}>گزارش‌های پیشرفته فروش</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${tab === t.key ? 'shadow-lg' : ''}`}
            style={tab === t.key ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' } : { backgroundColor: cardBg, color: tSec, border: `1px solid ${cardBorder}` }}>
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {tab === 'bestSelling' && <BestSellingReport />}
        {tab === 'salesByHour' && <SalesByHourReport />}
        {tab === 'periodComparison' && <PeriodComparisonReport />}
        {tab === 'bestCustomers' && <BestCustomersReport />}
        {tab === 'categoryProfit' && <CategoryProfitReport />}
        {tab === 'customerPatterns' && <CustomerPatternsReport />}
      </div>
    </div>
  )
}
