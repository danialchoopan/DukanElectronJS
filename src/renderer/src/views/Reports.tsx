/**
 * Reports — parent view for advanced sales reports.
 *
 * Contains 3 tabbed sub-reports:
 *   1. Best-Selling: top products by quantity/revenue with period comparison
 *   2. Sales by Hour: hourly heatmap + day-of-week patterns
 *   3. Period Comparison: compare any two date ranges
 *
 * Accessible from the sidebar navigation (Reports section).
 */

import { useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import BestSellingReport from './reports/BestSellingReport'
import SalesByHourReport from './reports/SalesByHourReport'
import PeriodComparisonReport from './reports/PeriodComparisonReport'

type ReportTab = 'bestSelling' | 'salesByHour' | 'periodComparison'

export default function Reports() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [tab, setTab] = useState<ReportTab>('bestSelling')

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const tabs: { key: ReportTab; label: string; icon: JSX.Element }[] = [
    { key: 'bestSelling', label: 'پرفروش‌ها', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-5.18 2.75L8 13.61l-5-4.87 6.91-1.01L12 2z"/></svg> },
    { key: 'salesByHour', label: 'فروش ساعتی', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { key: 'periodComparison', label: 'مقایسه دوره‌ها', icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
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
      </div>
    </div>
  )
}
