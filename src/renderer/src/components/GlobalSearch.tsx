import { useState, useEffect, useRef } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { fa } from '../i18n'

type SearchResult = {
  id: string
  type: 'screen' | 'product' | 'customer' | 'setting'
  title: string
  subtitle: string
  icon: JSX.Element
  action: () => void
}

interface Props {
  open: boolean
  onClose: () => void
  onNavigate: (view: string) => void
}

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
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter' && results[selectedIndex]) {
        results[selectedIndex].action()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, results, selectedIndex, onClose])

  useEffect(() => {
    if (!query.trim() || !open) { setResults([]); return }
    setLoading(true)
    const q = query.toLowerCase()

    const searchResults: SearchResult[] = []

    // Search screens
    const screens: SearchResult[] = [
      { id: 'nav-dashboard', type: 'screen', title: fa.nav.dashboard, subtitle: 'داشبورد', action: () => onNavigate('dashboard'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
      { id: 'nav-pos', type: 'screen', title: fa.nav.checkout, subtitle: 'فروش', action: () => onNavigate('pos'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg> },
      { id: 'nav-inventory', type: 'screen', title: fa.nav.inventory, subtitle: 'انبارداری', action: () => onNavigate('inventory'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
      { id: 'nav-accounting', type: 'screen', title: fa.nav.accounting, subtitle: 'حسابداری', action: () => onNavigate('accounting'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg> },
      { id: 'nav-sales', type: 'screen', title: fa.dashboard.recentSales, subtitle: 'آخرین فروش\u200cها', action: () => onNavigate('sales'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/></svg> },
      { id: 'nav-addproduct', type: 'screen', title: fa.admin.addProduct, subtitle: 'محصولات', action: () => onNavigate('addproduct'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> },
      { id: 'nav-customers', type: 'screen', title: fa.nav.customers, subtitle: 'مشتریان', action: () => onNavigate('customers'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
      { id: 'nav-categories', type: 'screen', title: fa.nav.categories, subtitle: 'دسته\u200cبندی\u200cها', action: () => onNavigate('categories'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/></svg> },
      { id: 'nav-admin', type: 'screen', title: fa.nav.admin, subtitle: 'تنظیمات', action: () => onNavigate('admin'), icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
    ]
    screens.forEach(s => {
      if (s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)) {
        searchResults.push(s)
      }
    })

    // Search products
    window.api.products.search(query).then(r => {
      if (r.success && r.data) {
        r.data.slice(0, 5).forEach((p: any) => {
          searchResults.push({
            id: `product-${p.id}`,
            type: 'product',
            title: p.title,
            subtitle: `${p.category || ''} \u2014 ${p.stock} عدد`,
            action: () => onNavigate('inventory'),
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
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
            id: `customer-${c.id}`,
            type: 'customer',
            title: c.name,
            subtitle: `${c.phone || ''} \u2014 ${c.customerType === 'legal' ? 'حقوقی' : 'حقیقی'}`,
            action: () => onNavigate('customers'),
            icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
          })
        })
      }
      setResults(searchResults)
      setLoading(false)
    })
  }, [query, open])

  if (!open) return null

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
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: primary, borderTopColor: 'transparent' }} />
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: textSecondary }}>نتیجه\u200cای یافت نشد</div>
          )}
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
                {r.type === 'screen' ? 'صفحه' : r.type === 'product' ? 'محصول' : r.type === 'customer' ? 'مشتری' : 'تنظیم'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-2 text-[10px]" style={{ borderTop: `1px solid ${cardBorder}`, color: textSecondary }}>
          <div className="flex gap-3">
            <span>↑↓ ناوبری</span>
            <span>↵ انتخاب</span>
            <span>ESC بستن</span>
          </div>
          <span>{results.length} نتیجه</span>
        </div>
      </div>
    </div>
  )
}
