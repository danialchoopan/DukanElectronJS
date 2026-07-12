/**
 * GlobalSearch — fuzzy search across screens, settings, features, products, and customers.
 * Opened via Ctrl+K or search button. Supports keyboard navigation (↑↓ Enter Esc).
 */
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme'

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
const productIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
const customerIcon = <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>

export default function GlobalSearch({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { colors } = useTheme()

  const tPri = colors.text.primary
  const tSec = colors.text.secondary

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

    // ─── Static items: screens, settings, features ───
    const allItems: SearchResult[] = [
      // Main screens
      { id: 'nav-dashboard', type: 'screen', title: 'داشبورد', subtitle: 'صفحه اصلی', action: () => onNavigate('dashboard'), icon: screenIcon },
      { id: 'nav-pos', type: 'screen', title: 'فروش', subtitle: 'صفحه فروش (POS)', action: () => onNavigate('pos'), icon: screenIcon },
      { id: 'nav-sales', type: 'screen', title: 'تاریخچه فروش', subtitle: 'تاریخچه و گزارش فروش', action: () => onNavigate('sales'), icon: screenIcon },
      { id: 'nav-addproduct', type: 'screen', title: 'محصولات', subtitle: 'افزودن و مدیریت کالاها', action: () => onNavigate('addproduct'), icon: screenIcon },
      { id: 'nav-categories', type: 'screen', title: 'دسته‌بندی‌ها', subtitle: 'مدیریت دسته‌بندی محصولات', action: () => onNavigate('categories'), icon: screenIcon },
      { id: 'nav-inventory', type: 'screen', title: 'انبارداری', subtitle: 'مدیریت موجودی انبار', action: () => onNavigate('inventory'), icon: screenIcon },
      { id: 'nav-accounting', type: 'screen', title: 'حسابداری', subtitle: 'مدیریت مالی و حسابداری', action: () => onNavigate('accounting'), icon: screenIcon },
      { id: 'nav-reports', type: 'screen', title: 'گزارش‌ها', subtitle: 'گزارش‌های پیشرفته فروش', action: () => onNavigate('reports'), icon: screenIcon },
      { id: 'nav-crosssell', type: 'screen', title: 'فروش مکمل', subtitle: 'قوانین فروش مکمل', action: () => onNavigate('crossSell'), icon: screenIcon },
      { id: 'nav-service', type: 'screen', title: 'تعمیرات', subtitle: 'مدیریت سرویس و گارانتی', action: () => onNavigate('service'), icon: screenIcon },
      { id: 'nav-customers', type: 'screen', title: 'مشتریان', subtitle: 'مدیریت مشتریان و حساب', action: () => onNavigate('customers'), icon: screenIcon },
      { id: 'nav-suppliers', type: 'screen', title: 'تأمین‌کنندگان', subtitle: 'مدیریت تأمین‌کنندگان', action: () => onNavigate('suppliers'), icon: screenIcon },
      { id: 'nav-calculator', type: 'screen', title: 'ماشین حساب', subtitle: 'ماشین حساب حرفه‌ای', action: () => onNavigate('calculator'), icon: screenIcon },
      { id: 'nav-auditLog', type: 'screen', title: 'لاگ فعالیت', subtitle: 'تاریخچه فعالیت‌ها', action: () => onNavigate('auditLog'), icon: screenIcon },
      { id: 'nav-settings', type: 'screen', title: 'تنظیمات', subtitle: 'تنظیمات برنامه', action: () => onNavigate('settings'), icon: screenIcon },
      { id: 'nav-admin', type: 'screen', title: 'مدیریت', subtitle: 'مدیریت کاربران و سیستم', action: () => onNavigate('admin'), icon: screenIcon },
      { id: 'nav-help', type: 'screen', title: 'راهنما', subtitle: 'راهنمای استفاده', action: () => onNavigate('help'), icon: screenIcon },

      // Settings
      { id: 'set-shopname', type: 'setting', title: 'نام فروشگاه', subtitle: 'تنظیمات فروشگاه', action: () => onNavigate('admin', 'settings'), icon: screenIcon },
      { id: 'set-theme', type: 'setting', title: 'تنظیمات ظاهری', subtitle: 'تم، زبان، رنگ ناوبری', action: () => onNavigate('admin', 'ui'), icon: screenIcon },
      { id: 'set-backup', type: 'setting', title: 'پشتیبان‌گیری', subtitle: 'پشتیبان‌گیری و بازیابی', action: () => onNavigate('admin', 'settings'), icon: screenIcon },
      { id: 'set-users', type: 'setting', title: 'مدیریت کاربران', subtitle: 'ایجاد و ویرایش کاربران', action: () => onNavigate('admin', 'users'), icon: screenIcon },
      { id: 'set-login', type: 'setting', title: 'تنظیمات ورود', subtitle: 'نحوه ورود به سیستم', action: () => onNavigate('admin', 'login'), icon: screenIcon },
      { id: 'set-shortcuts', type: 'setting', title: 'میانبرها', subtitle: 'میانبرهای کلیدی', action: () => onNavigate('admin', 'shortcuts'), icon: screenIcon },
      { id: 'set-nav', type: 'setting', title: 'سفارشی‌سازی منو', subtitle: 'ترتیب و نمایش آیتم‌ها', action: () => onNavigate('admin', 'ui'), icon: screenIcon },

      // Accounting features
      { id: 'acc-dashboard', type: 'feature', title: 'داشبورد حسابداری', subtitle: 'حسابداری → داشبورد', action: () => onNavigate('accounting', 'dashboard'), icon: screenIcon },
      { id: 'acc-accounts', type: 'feature', title: 'دفتر حسابها', subtitle: 'حسابداری → دفتر حسابها', action: () => onNavigate('accounting', 'accounts'), icon: screenIcon },
      { id: 'acc-journal', type: 'feature', title: 'روزنامه', subtitle: 'حسابداری → روزنامه', action: () => onNavigate('accounting', 'journal'), icon: screenIcon },
      { id: 'acc-trial', type: 'feature', title: 'تراز آزمایشی', subtitle: 'حسابداری → تراز آزمایشی', action: () => onNavigate('accounting', 'trialBalance'), icon: screenIcon },
      { id: 'acc-pnl', type: 'feature', title: 'صورت سود و زیان', subtitle: 'حسابداری → سود و زیان', action: () => onNavigate('accounting', 'incomeStatement'), icon: screenIcon },
      { id: 'acc-balance', type: 'feature', title: 'ترازنامه', subtitle: 'حسابداری → ترازنامه', action: () => onNavigate('accounting', 'balanceSheet'), icon: screenIcon },
      { id: 'acc-aging', type: 'feature', title: 'مانده مشتریان', subtitle: 'حسابداری → مانده مشتریان', action: () => onNavigate('accounting', 'arAging'), icon: screenIcon },
      { id: 'acc-expenses', type: 'feature', title: 'هزینه‌ها', subtitle: 'حسابداری → هزینه‌ها', action: () => onNavigate('accounting', 'expenses'), icon: screenIcon },
      { id: 'acc-periods', type: 'feature', title: 'دوره‌های مالی', subtitle: 'حسابداری → دوره‌های مالی', action: () => onNavigate('accounting', 'periods'), icon: screenIcon },
      { id: 'acc-cashflow', type: 'feature', title: 'صورت جریان نقدی', subtitle: 'حسابداری → جریان نقدی', action: () => onNavigate('accounting', 'cashFlow'), icon: screenIcon },
      { id: 'acc-analytics', type: 'feature', title: 'تحلیل و نمودار', subtitle: 'حسابداری → تحلیل', action: () => onNavigate('accounting', 'analytics'), icon: screenIcon },

      // Inventory features
      { id: 'inv-products', type: 'feature', title: 'موجودی کالا', subtitle: 'انبارداری → موجودی', action: () => onNavigate('inventory', 'products'), icon: screenIcon },
      { id: 'inv-report', type: 'feature', title: 'گزارش انبار', subtitle: 'انبارداری → گزارش', action: () => onNavigate('inventory', 'report'), icon: screenIcon },
      { id: 'inv-history', type: 'feature', title: 'تاریخچه تغییرات', subtitle: 'انبارداری → تاریخچه', action: () => onNavigate('inventory', 'audit'), icon: screenIcon },

      // Dashboard features
      { id: 'dash-sales', type: 'feature', title: 'آمار فروش', subtitle: 'داشبورد → آمار', action: () => onNavigate('dashboard'), icon: screenIcon },
      { id: 'dash-top', type: 'feature', title: 'پرفروش‌ترین کالاها', subtitle: 'داشبورد → پرفروش‌ها', action: () => onNavigate('dashboard'), icon: screenIcon },
    ]

    // ─── Filter static items ───
    allItems.forEach(item => {
      if (item.title.includes(q) || item.subtitle.includes(q) || item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q)) {
        searchResults.push(item)
      }
    })

    // ─── Search products ───
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

    // ─── Search customers ───
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
      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: colors.bg.card, border: `1px solid ${colors.border.default}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${colors.border.default}` }}>
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }} placeholder="جستجو در برنامه..." className="flex-1 bg-transparent outline-none text-lg font-medium" style={{ color: tPri }} autoFocus />
          {query && <button onClick={() => setQuery('')} className="text-xs px-2 py-1 rounded" style={{ color: tSec, background: colors.bg.tertiary }}>پاک کردن</button>}
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ color: tSec, background: colors.bg.tertiary }}>ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: colors.accent.primary, borderTopColor: 'transparent' }} /></div>}
          {!loading && query && results.length === 0 && <div className="text-center py-8 text-sm" style={{ color: tSec }}>نتیجه‌ای یافت نشد</div>}
          {!loading && results.map((r, i) => (
            <div key={r.id} onClick={() => { r.action(); onClose() }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
              style={{ backgroundColor: i === selectedIndex ? colors.accent.active : 'transparent', borderLeft: i === selectedIndex ? `3px solid ${colors.accent.primary}` : '3px solid transparent' }}
              onMouseEnter={() => setSelectedIndex(i)}>
              <span style={{ color: tSec }}>{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: tPri }}>{r.title}</div>
                <div className="text-xs truncate" style={{ color: tSec }}>{r.subtitle}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: colors.bg.tertiary, color: tSec }}>
                {typeLabels[r.type] || r.type}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-[10px]" style={{ borderTop: `1px solid ${colors.border.default}`, color: tSec }}>
          <div className="flex gap-3"><span>↑↓ ناوبری</span><span>↵ انتخاب</span><span>ESC بستن</span></div>
          <span>{results.length} نتیجه</span>
        </div>
      </div>
    </div>
  )
}
