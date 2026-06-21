import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'

type SearchResult = {
  id: string
  type: 'screen' | 'product' | 'customer' | 'setting' | 'feature'
  title: string
  subtitle: string
  icon: JSX.Element
  action: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (view: string, tab?: string, highlightId?: string) => void
}

const screenIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
const productIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
const customerIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>

export default function GlobalSearch({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0d1c2e'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const primary = '#006194'

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && results[selectedIndex]) { results[selectedIndex].action(); onClose() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, selectedIndex, onClose])

  useEffect(() => {
    if (!query.trim() || !open) { setResults([]); return }
    setLoading(true)
    const q = query.toLowerCase()
    const searchResults: SearchResult[] = []

    const allItems: SearchResult[] = [
      { id: 'nav-dashboard', type: 'screen', title: 'داشبورد', subtitle: 'صفحه اصلی', action: () => onNavigate('dashboard'), icon: screenIcon },
      { id: 'nav-pos', type: 'screen', title: 'فروش', subtitle: 'صفحه فروش', action: () => onNavigate('pos'), icon: screenIcon },
      { id: 'nav-inventory', type: 'screen', title: 'انبارداری', subtitle: 'مدیریت موجودی', action: () => onNavigate('inventory'), icon: screenIcon },
      { id: 'nav-accounting', type: 'screen', title: 'حسابداری', subtitle: 'مدیریت مالی', action: () => onNavigate('accounting'), icon: screenIcon },
      { id: 'nav-sales', type: 'screen', title: 'آخرین فروش\u200cها', subtitle: 'تاریخچه فروش', action: () => onNavigate('sales'), icon: screenIcon },
      { id: 'nav-addproduct', type: 'screen', title: 'محصولات', subtitle: 'مدیریت کالاها', action: () => onNavigate('addproduct'), icon: screenIcon },
      { id: 'nav-customers', type: 'screen', title: 'مشتریان', subtitle: 'مدیریت مشتریان', action: () => onNavigate('customers'), icon: screenIcon },
      { id: 'nav-categories', type: 'screen', title: 'دسته\u200cبندی\u200cها', subtitle: 'مدیریت دسته‌بندی', action: () => onNavigate('categories'), icon: screenIcon },
      { id: 'nav-admin', type: 'screen', title: 'تنظیمات', subtitle: 'مدیریت سیستم', action: () => onNavigate('admin'), icon: screenIcon },

      { id: 'set-shopname', type: 'setting', title: 'نام فروشگاه', subtitle: 'تنظیمات \u2192 نام فروشگاه', action: () => onNavigate('admin', 'settings', 'set-shopname'), icon: screenIcon },
      { id: 'set-address', type: 'setting', title: 'آدرس فروشگاه', subtitle: 'تنظیمات \u2192 آدرس', action: () => onNavigate('admin', 'settings', 'set-address'), icon: screenIcon },
      { id: 'set-phone', type: 'setting', title: 'تلفن فروشگاه', subtitle: 'تنظیمات \u2192 تلفن', action: () => onNavigate('admin', 'settings', 'set-phone'), icon: screenIcon },
      { id: 'set-tax', type: 'setting', title: 'مالیات بر ارزش افزوده', subtitle: 'تنظیمات \u2192 مالیات', action: () => onNavigate('admin', 'settings', 'set-tax'), icon: screenIcon },
      { id: 'set-theme', type: 'setting', title: 'تنظیمات ظاهری', subtitle: 'تنظیمات \u2192 تم و زبان', action: () => onNavigate('admin', 'ui', 'set-theme'), icon: screenIcon },
      { id: 'set-backup', type: 'setting', title: 'پشتیبان\u200cگیری', subtitle: 'تنظیمات \u2192 پشتیبانی', action: () => onNavigate('admin', 'settings', 'set-backup'), icon: screenIcon },
      { id: 'set-users', type: 'setting', title: 'مدیریت کاربران', subtitle: 'تنظیمات \u2192 کاربران', action: () => onNavigate('admin', 'users', 'set-users'), icon: screenIcon },
      { id: 'set-shortcuts', type: 'setting', title: 'میانبرها', subtitle: 'تنظیمات \u2192 میانبرهای کلیدی', action: () => onNavigate('admin', 'shortcuts', 'set-shortcuts'), icon: screenIcon },
      { id: 'set-receipt', type: 'setting', title: 'تنظیمات فاکتور', subtitle: 'تنظیمات \u2192 پایان فاکتور', action: () => onNavigate('admin', 'customization', 'set-receipt'), icon: screenIcon },

      { id: 'acc-dashboard', type: 'feature', title: 'داشبورد حسابداری', subtitle: 'حسابداری \u2192 داشبورد', action: () => onNavigate('accounting', 'dashboard'), icon: screenIcon },
      { id: 'acc-accounts', type: 'feature', title: 'دفتر حسابها', subtitle: 'حسابداری \u2192 دفتر حسابها', action: () => onNavigate('accounting', 'accounts'), icon: screenIcon },
      { id: 'acc-journal', type: 'feature', title: 'روزنامه', subtitle: 'حسابداری \u2192 روزنامه', action: () => onNavigate('accounting', 'journal'), icon: screenIcon },
      { id: 'acc-trial', type: 'feature', title: 'تراز آزمایشی', subtitle: 'حسابداری \u2192 تراز آزمایشی', action: () => onNavigate('accounting', 'trialBalance'), icon: screenIcon },
      { id: 'acc-pnl', type: 'feature', title: 'صورت سود و زیان', subtitle: 'حسابداری \u2192 سود و زیان', action: () => onNavigate('accounting', 'incomeStatement'), icon: screenIcon },
      { id: 'acc-balance', type: 'feature', title: 'ترازنامه', subtitle: 'حسابداری \u2192 ترازنامه', action: () => onNavigate('accounting', 'balanceSheet'), icon: screenIcon },
      { id: 'acc-aging', type: 'feature', title: 'مانده مشتریان', subtitle: 'حسابداری \u2192 مانده مشتریان', action: () => onNavigate('accounting', 'arAging'), icon: screenIcon },
      { id: 'acc-expenses', type: 'feature', title: 'هزینه\u200cها', subtitle: 'حسابداری \u2192 هزینه\u200cها', action: () => onNavigate('accounting', 'expenses'), icon: screenIcon },
      { id: 'acc-periods', type: 'feature', title: 'دوره\u200cهای مالی', subtitle: 'حسابداری \u2192 دوره\u200cهای مالی', action: () => onNavigate('accounting', 'periods'), icon: screenIcon },
      { id: 'acc-cashflow', type: 'feature', title: 'صورت جریان نقدی', subtitle: 'حسابداری \u2192 جریان نقدی', action: () => onNavigate('accounting', 'cashFlow'), icon: screenIcon },

      { id: 'inv-products', type: 'feature', title: 'موجودی کالا', subtitle: 'انبارداری \u2192 موجودی', action: () => onNavigate('inventory', 'products'), icon: screenIcon },
      { id: 'inv-report', type: 'feature', title: 'گزارش انبار', subtitle: 'انبارداری \u2192 گزارش', action: () => onNavigate('inventory', 'report'), icon: screenIcon },
      { id: 'inv-history', type: 'feature', title: 'تاریخچه تغییرات', subtitle: 'انبارداری \u2192 تاریخچه', action: () => onNavigate('inventory', 'audit'), icon: screenIcon },

      { id: 'dash-sales', type: 'feature', title: 'آمار فروش', subtitle: 'داشبورد \u2192 آمار', action: () => onNavigate('dashboard'), icon: screenIcon },
      { id: 'dash-performance', type: 'feature', title: 'عملکرد صندوک\u200cدارها', subtitle: 'داشبورد \u2192 عملکرد', action: () => onNavigate('dashboard'), icon: screenIcon },
      { id: 'dash-top', type: 'feature', title: 'پرفروش\u200cترین کالاها', subtitle: 'داشبورد \u2192 پرفروش\u200cها', action: () => onNavigate('dashboard'), icon: screenIcon },
    ]

    allItems.forEach(item => {
      if (item.title.includes(q) || item.subtitle.includes(q) || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)) {
        searchResults.push(item)
      }
    })

    // Search products
    window.api.products.search(query).then(r => {
      if (r.success && r.data) {
        r.data.slice(0, 5).forEach((p: any) => {
          searchResults.push({
            id: `product-${p.id}`, type: 'product', title: p.title,
            subtitle: `${p.category || ''} — ${p.stock} عدد — ${p.sale_price.toLocaleString('fa-IR')} تومان`,
            action: () => onNavigate('inventory', 'products', `product-${p.id}`), icon: productIcon,
          })
        })
      }
      setResults(searchResults)
      setLoading(false)
    })

    // Search customers
    window.api.customers.search(query).then(r => {
      if (r.success && r.data) {
        r.data.slice(0, 3).forEach((c: any) => {
          searchResults.push({
            id: `customer-${c.id}`, type: 'customer', title: c.name,
            subtitle: `${c.phone || ''} — ${c.customerType === 'legal' ? 'حقوقی' : 'حقیقی'}`,
            action: () => onNavigate('customers', undefined, `customer-${c.id}`), icon: customerIcon,
          })
        })
      }
      setResults(searchResults)
      setLoading(false)
    })
  }, [query, open])

  if (!open) return null

  const typeLabels: Record<string, string> = { screen: 'صفحه', product: 'محصول', customer: 'مشتری', setting: 'تنظیم', feature: 'ویژگی' }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }} placeholder="جستجو در برنامه..." className="flex-1 bg-transparent outline-none text-lg font-medium" style={{ color: textPrimary }} autoFocus />
          {query && <button onClick={() => setQuery('')} className="text-xs px-2 py-1 rounded" style={{ color: textSecondary, background: isDark ? '#334155' : '#f1f5f9' }}>پاک کردن</button>}
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ color: textSecondary, background: isDark ? '#334155' : '#f1f5f9' }}>ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: primary, borderTopColor: 'transparent' }} /></div>}
          {!loading && query && results.length === 0 && <div className="text-center py-8 text-sm" style={{ color: textSecondary }}>نتیجه‌ای یافت نشد</div>}
          {!loading && results.map((r, i) => (
            <div key={r.id} onClick={() => { r.action(); onClose() }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
              style={{ backgroundColor: i === selectedIndex ? (isDark ? 'rgba(0,97,148,0.15)' : 'rgba(0,97,148,0.08)') : 'transparent', borderLeft: i === selectedIndex ? `3px solid ${primary}` : '3px solid transparent' }}
              onMouseEnter={() => setSelectedIndex(i)}>
              <span style={{ color: textSecondary }}>{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: textPrimary }}>{r.title}</div>
                <div className="text-xs truncate" style={{ color: textSecondary }}>{r.subtitle}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                {typeLabels[r.type] || r.type}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-[10px]" style={{ borderTop: `1px solid ${cardBorder}`, color: textSecondary }}>
          <div className="flex gap-3"><span>↑↓ ناوبری</span><span>↵ انتخاب</span><span>ESC بستن</span></div>
          <span>{results.length} نتیجه</span>
        </div>
      </div>
    </div>
  )
}
