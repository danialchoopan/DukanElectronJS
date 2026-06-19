import { useState, useEffect, useCallback } from 'react'
import type { Customer, CustomerLedgerEntry, Sale } from '../../../types'
import { fa } from '../i18n'
import { formatJalaliShort, formatJalaliDateTime } from '../utils/jalali'

type FilterType = 'all' | 'debtor' | 'creditor' | 'inactive'
type DetailTab = 'details' | 'purchases' | 'ledger'
type LedgerFilter = 'all' | 'charge' | 'payment' | 'sale'
type DialogMode = null | 'charge' | 'pay' | 'delete' | 'create' | 'edit'

interface CustomerStats {
  totalCustomers: number
  totalDebtors: number
  totalCreditors: number
  totalDebtAmount: number
  totalCreditAmount: number
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats>({ totalCustomers: 0, totalDebtors: 0, totalCreditors: 0, totalDebtAmount: 0, totalCreditAmount: 0 })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<Customer | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('details')
  const [ledgerEntries, setLedgerEntries] = useState<CustomerLedgerEntry[]>([])
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('all')
  const [purchases, setPurchases] = useState<Sale[]>([])
  const [expandedPurchase, setExpandedPurchase] = useState<number | null>(null)
  const [dialog, setDialog] = useState<DialogMode>(null)
  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' })
  const [chargePayAmount, setChargePayAmount] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0d1c2e'
  const textSecondary = isDark ? '#94a3b8' : '#707881'
  const surfaceHover = isDark ? 'rgba(0,97,148,0.08)' : 'rgba(0,97,148,0.04)'

  const PRIMARY = '#006194'
  const ERROR = '#ba1a1a'
  const SUCCESS = '#16a34a'
  const OUTLINE = '#707881'

  const loadAll = useCallback(async () => {
    const [listRes, statsRes] = await Promise.all([
      window.api.customers.getAllWithStats(),
      window.api.customers.getStats(),
    ])
    if (listRes.success && listRes.data) setCustomers(listRes.data)
    if (statsRes.success && statsRes.data) setStats(statsRes.data)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    if (!selected) return
    if (detailTab === 'ledger') {
      window.api.customers.getLedger(selected.id).then((r: any) => {
        if (r.success && r.data) setLedgerEntries(r.data)
      })
    } else if (detailTab === 'purchases') {
      window.api.customers.purchaseHistory(selected.id).then((r) => {
        if (r.success && r.data) setPurchases(r.data)
      })
    }
  }, [selected, detailTab])

  const refreshSelected = useCallback(async (id: number) => {
    const r = await window.api.customers.getWithStats(id)
    if (r.success && r.data) {
      setSelected(r.data)
      setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, ...r.data } : c))
    }
    const s = await window.api.customers.getStats()
    if (s.success && s.data) setStats(s.data)
  }, [])

  const filteredCustomers = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !(c.phone || '').toLowerCase().includes(q)) return false
    }
    switch (filter) {
      case 'debtor': return c.balance < 0
      case 'creditor': return c.balance > 0
      case 'inactive': return !c.isActive
      default: return true
    }
  })

  const filteredLedger = ledgerFilter === 'all' ? ledgerEntries : ledgerEntries.filter((e) => e.type === ledgerFilter)

  let runningBalance = 0
  const ledgerWithBalance = [...filteredLedger].reverse().map((e) => {
    if (e.type === 'charge' || e.type === 'payment') runningBalance += e.amount
    else runningBalance -= e.amount
    return { ...e, runningBalance }
  }).reverse()

  const openChargeDialog = () => {
    setChargePayAmount('')
    setDialog('charge')
  }

  const openPayDialog = () => {
    setChargePayAmount('')
    setDialog('pay')
  }

  const handleCharge = async () => {
    if (!selected || !chargePayAmount) return
    const amt = parseFloat(chargePayAmount)
    if (amt <= 0) return
    setLoading(true)
    await window.api.customers.charge(selected.id, amt)
    setDialog(null)
    setChargePayAmount('')
    await refreshSelected(selected.id)
    setLoading(false)
  }

  const handlePay = async () => {
    if (!selected || !chargePayAmount) return
    const amt = parseFloat(chargePayAmount)
    if (amt <= 0) return
    setLoading(true)
    await window.api.customers.pay(selected.id, amt)
    setDialog(null)
    setChargePayAmount('')
    await refreshSelected(selected.id)
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    const r = await window.api.customers.create({ name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim() })
    setDialog(null)
    setForm({ name: '', phone: '', address: '', notes: '' })
    if (r.success && r.data) {
      await loadAll()
      setSelected(r.data)
      setDetailTab('details')
    }
    setLoading(false)
  }

  const handleEdit = async () => {
    if (!selected || !form.name.trim()) return
    setLoading(true)
    await window.api.customers.update(selected.id, { name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), notes: form.notes.trim() })
    setDialog(null)
    await refreshSelected(selected.id)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!selected) return
    if (selected.balance < 0 && !deleteConfirm) {
      setDeleteConfirm(true)
      return
    }
    if (selected.balance < 0 && deleteConfirm) {
      setLoading(true)
      await window.api.customers.deleteSoft(selected.id)
      setSelected(null)
      setDialog(null)
      setDeleteConfirm(false)
      await loadAll()
      setLoading(false)
      return
    }
    if (selected.balance === 0 || selected.balance > 0) {
      if (!deleteConfirm) {
        setDialog('delete')
        setDeleteConfirm(true)
        return
      }
      setLoading(true)
      await window.api.customers.deleteSoft(selected.id)
      setSelected(null)
      setDialog(null)
      setDeleteConfirm(false)
      await loadAll()
      setLoading(false)
    }
  }

  const openEditDialog = () => {
    if (!selected) return
    setForm({ name: selected.name, phone: selected.phone || '', address: (selected as any).address || '', notes: (selected as any).notes || '' })
    setDialog('edit')
  }

  const openCreateDialog = () => {
    setForm({ name: '', phone: '', address: '', notes: '' })
    setDialog('create')
  }

  const paymentLabel = (m: string) => {
    if (m === 'cash') return fa.payment.cash
    if (m === 'card') return fa.payment.card
    return fa.payment.ledger
  }

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="text-xs font-medium mb-1" style={{ color: textSecondary }}>{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: textSecondary }}>{sub}</div>}
    </div>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ padding: '16px', gap: '16px' }}>
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="كلى مشتریان" value={stats.totalCustomers} color={PRIMARY} />
        <StatCard label="بدهكاران" value={stats.totalDebtors} sub={`${stats.totalDebtAmount.toLocaleString('fa-IR')} ${fa.common.toman}`} color={ERROR} />
        <StatCard label="طلبكاران" value={stats.totalCreditors} sub={`${stats.totalCreditAmount.toLocaleString('fa-IR')} ${fa.common.toman}`} color={SUCCESS} />
        <StatCard label="بدون بدهی" value={stats.totalCustomers - stats.totalDebtors - stats.totalCreditors} color={OUTLINE} />
      </div>

      {/* 2-Panel Layout */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Left Panel */}
        <div className="flex flex-col rounded-xl overflow-hidden" style={{ width: '33%', minWidth: '320px', backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          {/* Search */}
          <div className="p-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={fa.customer.search}
                className="input-field w-full text-sm"
                style={{ paddingRight: '36px' }}
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-1 p-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            {([
              { key: 'all' as FilterType, label: fa.common.all },
              { key: 'debtor' as FilterType, label: 'بدهكار' },
              { key: 'creditor' as FilterType, label: 'طلبكار' },
              { key: 'inactive' as FilterType, label: 'غیرفعال' },
            ]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="flex-1 text-xs font-bold py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: filter === f.key ? PRIMARY : 'transparent',
                  color: filter === f.key ? '#ffffff' : textSecondary,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Add Button */}
          <div className="p-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            <button onClick={openCreateDialog} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all" style={{ backgroundColor: PRIMARY, color: '#ffffff' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {fa.customer.addCustomer}
            </button>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto p-2" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredCustomers.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: textSecondary }}>
                {fa.customer.noCustomers}
              </div>
            )}
            {filteredCustomers.map((c) => {
              const avatarColor = c.balance < 0 ? ERROR : c.balance > 0 ? SUCCESS : OUTLINE
              const isSelected = selected?.id === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelected(c); setDetailTab('details'); setDeleteConfirm(false); setDialog(null) }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-right transition-all"
                  style={{
                    backgroundColor: isSelected ? `${PRIMARY}18` : 'transparent',
                    border: `1px solid ${isSelected ? PRIMARY : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = surfaceHover }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ border: `2px solid ${avatarColor}`, color: avatarColor, backgroundColor: `${avatarColor}15` }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate" style={{ color: textPrimary }}>{c.name}</div>
                    <div className="text-xs truncate" style={{ color: textSecondary }}>{c.phone || '-'}</div>
                    {c.purchaseCount !== undefined && (
                      <div className="text-xs" style={{ color: textSecondary }}>
                        {c.purchaseCount} خرید {c.lastPurchaseDate ? `· ${formatJalaliShort(c.lastPurchaseDate)}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-bold shrink-0" style={{ color: avatarColor }}>
                    {c.balance.toLocaleString('fa-IR')}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center" style={{ color: textSecondary }}>
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <div className="text-sm">یك مشتری را انتخاب كنید</div>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Header */}
              <div className="flex items-center gap-1 p-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                {([
                  { key: 'details' as DetailTab, label: 'جزئیات' },
                  { key: 'purchases' as DetailTab, label: 'تاریخچه خرید' },
                  { key: 'ledger' as DetailTab, label: 'تاریخچه حساب' },
                ]).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setDetailTab(t.key); setDeleteConfirm(false) }}
                    className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{
                      backgroundColor: detailTab === t.key ? PRIMARY : 'transparent',
                      color: detailTab === t.key ? '#ffffff' : textSecondary,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Details Tab */}
                {detailTab === 'details' && (
                  <div className="space-y-4">
                    {/* Customer Header */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0" style={{ border: `3px solid ${selected.balance < 0 ? ERROR : selected.balance > 0 ? SUCCESS : OUTLINE}`, color: selected.balance < 0 ? ERROR : selected.balance > 0 ? SUCCESS : OUTLINE, backgroundColor: `${selected.balance < 0 ? ERROR : selected.balance > 0 ? SUCCESS : OUTLINE}15` }}>
                        {selected.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="text-lg font-bold" style={{ color: textPrimary }}>{selected.name}</div>
                        <div className="text-sm" style={{ color: textSecondary }}>{selected.phone || 'بدون تلفن'}</div>
                        {(selected as any).address && <div className="text-sm mt-1" style={{ color: textSecondary }}>{(selected as any).address}</div>}
                        {(selected as any).notes && <div className="text-xs mt-1 italic" style={{ color: textSecondary }}>{(selected as any).notes}</div>}
                      </div>
                    </div>

                    {/* Balance Card */}
                    <div className="rounded-xl p-4" style={{ backgroundColor: selected.balance < 0 ? `${ERROR}10` : selected.balance > 0 ? `${SUCCESS}10` : isDark ? '#1e293b' : '#f1f5f9', border: `1px solid ${selected.balance < 0 ? `${ERROR}40` : selected.balance > 0 ? `${SUCCESS}40` : cardBorder}` }}>
                      <div className="text-xs font-medium mb-1" style={{ color: textSecondary }}>{fa.customer.balance}</div>
                      <div className="text-2xl font-bold" style={{ color: selected.balance < 0 ? ERROR : selected.balance > 0 ? SUCCESS : textPrimary }}>
                        {selected.balance.toLocaleString('fa-IR')} {fa.common.toman}
                      </div>
                      <div className="text-xs mt-1" style={{ color: textSecondary }}>
                        {selected.balance < 0 ? 'بدهی مشتری' : selected.balance > 0 ? 'مانده حساب مشتری' : 'تسویه شده'}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg p-3" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                        <div className="text-xs" style={{ color: textSecondary }}>تعداد خرید</div>
                        <div className="text-lg font-bold" style={{ color: textPrimary }}>{selected.purchaseCount || 0}</div>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                        <div className="text-xs" style={{ color: textSecondary }}>مجموع خرید</div>
                        <div className="text-lg font-bold" style={{ color: textPrimary }}>{(selected as any).totalSpent?.toLocaleString('fa-IR') || '0'}</div>
                      </div>
                      <div className="rounded-lg p-3" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                        <div className="text-xs" style={{ color: textSecondary }}>آخرین خرید</div>
                        <div className="text-sm font-bold" style={{ color: textPrimary }}>{selected.lastPurchaseDate ? formatJalaliShort(selected.lastPurchaseDate) : '-'}</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={openChargeDialog} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: `${SUCCESS}15`, color: SUCCESS, border: `1px solid ${SUCCESS}40` }}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        {fa.customer.charge}
                      </button>
                      <button onClick={openPayDialog} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: '#f59e0b15', color: '#d97706', border: '1px solid #f59e0b40' }}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        {fa.customer.payDebt}
                      </button>
                      <button onClick={openEditDialog} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: `${PRIMARY}15`, color: PRIMARY, border: `1px solid ${PRIMARY}40` }}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        {fa.admin.edit}
                      </button>
                      <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: `${ERROR}15`, color: ERROR, border: `1px solid ${ERROR}40` }}>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        {fa.admin.delete}
                      </button>
                    </div>

                    {/* Delete Warning */}
                    {dialog === 'delete' && deleteConfirm && (
                      <div className="rounded-xl p-4" style={{ backgroundColor: `${ERROR}10`, border: `1px solid ${ERROR}40` }}>
                        <div className="text-sm font-bold mb-2" style={{ color: ERROR }}>آیا از حذف این مشتری اطمینان دارید؟</div>
                        <div className="text-xs mb-3" style={{ color: textSecondary }}>اطلاعات حسابداری و فروش حفظ خواهد شد.</div>
                        <div className="flex gap-2">
                          <button onClick={handleDelete} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: ERROR, color: '#ffffff' }}>
                            {loading ? '...' : fa.common.confirm}
                          </button>
                          <button onClick={() => { setDialog(null); setDeleteConfirm(false) }} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                            {fa.admin.cancel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Purchases Tab */}
                {detailTab === 'purchases' && (
                  <div>
                    {purchases.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: textSecondary }}>خریدی ثبت نشده</div>
                    ) : (
                      <div className="space-y-2">
                        {purchases.map((s) => (
                          <div key={s.id}>
                            <button
                              onClick={() => setExpandedPurchase(expandedPurchase === s.id ? null : s.id)}
                              className="w-full flex items-center justify-between p-3 rounded-lg text-right transition-all"
                              style={{ backgroundColor: expandedPurchase === s.id ? surfaceHover : 'transparent', border: `1px solid ${cardBorder}` }}
                              onMouseEnter={(e) => { if (expandedPurchase !== s.id) e.currentTarget.style.backgroundColor = surfaceHover }}
                              onMouseLeave={(e) => { if (expandedPurchase !== s.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-xs" style={{ color: textSecondary }}>{formatJalaliShort(s.createdAt)}</div>
                                <div className="text-sm font-bold" style={{ color: PRIMARY }}>{s.invoiceNumber}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: s.paymentMethod === 'cash' ? `${SUCCESS}15` : s.paymentMethod === 'card' ? `${PRIMARY}15` : '#f59e0b15', color: s.paymentMethod === 'cash' ? SUCCESS : s.paymentMethod === 'card' ? PRIMARY : '#d97706' }}>
                                  {paymentLabel(s.paymentMethod)}
                                </div>
                                <div className="text-sm font-bold" style={{ color: textPrimary }}>{s.total_amount.toLocaleString('fa-IR')}</div>
                                <svg className="w-4 h-4 transition-transform" style={{ transform: expandedPurchase === s.id ? 'rotate(180deg)' : 'rotate(0deg)', color: textSecondary }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                              </div>
                            </button>
                            {expandedPurchase === s.id && s.items && (
                              <div className="mr-4 mt-1 rounded-lg overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                                      <th className="text-right px-3 py-1.5" style={{ color: textSecondary }}>كالا</th>
                                      <th className="text-right px-3 py-1.5" style={{ color: textSecondary }}>تعداد</th>
                                      <th className="text-right px-3 py-1.5" style={{ color: textSecondary }}>قیمت واحد</th>
                                      <th className="text-right px-3 py-1.5" style={{ color: textSecondary }}>جمع</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {s.items.map((item) => (
                                      <tr key={item.id} style={{ borderTop: `1px solid ${cardBorder}` }}>
                                        <td className="px-3 py-1.5" style={{ color: textPrimary }}>{item.productTitle}</td>
                                        <td className="px-3 py-1.5" style={{ color: textPrimary }}>{item.quantity}</td>
                                        <td className="px-3 py-1.5" style={{ color: textPrimary }}>{item.unitPrice.toLocaleString('fa-IR')}</td>
                                        <td className="px-3 py-1.5 font-bold" style={{ color: textPrimary }}>{item.subtotal.toLocaleString('fa-IR')}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Ledger Tab */}
                {detailTab === 'ledger' && (
                  <div>
                    <div className="flex gap-1 mb-3">
                      {([
                        { key: 'all' as LedgerFilter, label: fa.common.all },
                        { key: 'charge' as LedgerFilter, label: 'شارژ' },
                        { key: 'payment' as LedgerFilter, label: 'پرداخت' },
                        { key: 'sale' as LedgerFilter, label: 'فروش' },
                      ]).map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setLedgerFilter(f.key)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{
                            backgroundColor: ledgerFilter === f.key ? PRIMARY : 'transparent',
                            color: ledgerFilter === f.key ? '#ffffff' : textSecondary,
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {ledgerWithBalance.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: textSecondary }}>تراكنشی ثبت نشده</div>
                    ) : (
                      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${cardBorder}` }}>
                        <table className="w-full text-sm">
                          <thead>
                            <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                              <th className="text-right px-3 py-2" style={{ color: textSecondary }}>تاریخ</th>
                              <th className="text-right px-3 py-2" style={{ color: textSecondary }}>نوع</th>
                              <th className="text-right px-3 py-2" style={{ color: textSecondary }}>مبلغ</th>
                              <th className="text-right px-3 py-2" style={{ color: textSecondary }}>شرح</th>
                              <th className="text-right px-3 py-2" style={{ color: textSecondary }}>مانده</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ledgerWithBalance.map((e) => (
                              <tr key={e.id} style={{ borderTop: `1px solid ${cardBorder}` }}>
                                <td className="px-3 py-2 text-xs" style={{ color: textSecondary }}>{formatJalaliDateTime(e.createdAt)}</td>
                                <td className="px-3 py-2">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                                    backgroundColor: e.type === 'charge' ? `${SUCCESS}15` : e.type === 'payment' ? '#f59e0b15' : `${PRIMARY}15`,
                                    color: e.type === 'charge' ? SUCCESS : e.type === 'payment' ? '#d97706' : PRIMARY,
                                  }}>
                                    {e.type === 'charge' ? 'شارژ' : e.type === 'payment' ? 'پرداخت' : 'فروش'}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-bold" style={{ color: e.type === 'sale' ? ERROR : SUCCESS }}>
                                  {e.type === 'sale' ? '-' : '+'}{e.amount.toLocaleString('fa-IR')}
                                </td>
                                <td className="px-3 py-2 text-xs" style={{ color: textSecondary }}>{e.description}</td>
                                <td className="px-3 py-2 font-bold text-xs" style={{ color: textPrimary }}>{e.runningBalance.toLocaleString('fa-IR')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {dialog === 'charge' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl p-6 w-96" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm font-bold mb-4" style={{ color: SUCCESS }}>شارژ حساب {selected?.name}</div>
            <div className="mb-4">
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.customer.chargeAmount}</label>
              <input
                type="number"
                value={chargePayAmount}
                onChange={(e) => setChargePayAmount(e.target.value)}
                className="input-field w-full text-sm"
                placeholder="مبلغ را وارد كنید"
                autoFocus
              />
            </div>
            {chargePayAmount && parseFloat(chargePayAmount) > 0 && (
              <div className="text-xs mb-3 p-2 rounded-lg" style={{ backgroundColor: `${SUCCESS}10`, color: SUCCESS }}>
                + {parseFloat(chargePayAmount).toLocaleString('fa-IR')} {fa.common.toman} به مانده حساب اضافه می‌شود
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleCharge} disabled={loading || !chargePayAmount || parseFloat(chargePayAmount) <= 0} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: SUCCESS, color: '#ffffff', opacity: (!chargePayAmount || parseFloat(chargePayAmount) <= 0) ? 0.5 : 1 }}>
                {loading ? '...' : fa.common.confirm}
              </button>
              <button onClick={() => setDialog(null)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                {fa.admin.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'pay' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl p-6 w-96" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm font-bold mb-1" style={{ color: '#d97706' }}>پرداخت بدهی {selected?.name}</div>
            <div className="text-xs mb-4" style={{ color: textSecondary }}>مانده فعلی: {selected?.balance.toLocaleString('fa-IR')} {fa.common.toman}</div>
            <div className="mb-4">
              <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.customer.payAmount}</label>
              <input
                type="number"
                value={chargePayAmount}
                onChange={(e) => setChargePayAmount(e.target.value)}
                className="input-field w-full text-sm"
                placeholder="مبلغ را وارد كنید"
                autoFocus
              />
            </div>
            {chargePayAmount && parseFloat(chargePayAmount) > 0 && (
              <div className="text-xs mb-3 p-2 rounded-lg" style={{ backgroundColor: '#f59e0b10', color: '#d97706' }}>
                - {parseFloat(chargePayAmount).toLocaleString('fa-IR')} {fa.common.toman} از مانده حساب كسر می‌شود
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handlePay} disabled={loading || !chargePayAmount || parseFloat(chargePayAmount) <= 0} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: '#d97706', color: '#ffffff', opacity: (!chargePayAmount || parseFloat(chargePayAmount) <= 0) ? 0.5 : 1 }}>
                {loading ? '...' : fa.common.confirm}
              </button>
              <button onClick={() => setDialog(null)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                {fa.admin.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {(dialog === 'create' || dialog === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl p-6 w-96" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm font-bold mb-4" style={{ color: PRIMARY }}>{dialog === 'create' ? fa.customer.addCustomer : fa.admin.edit}</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.admin.name} *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.customer.phone}</label>
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>آدرس</label>
                <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="input-field w-full text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>یادداشت</label>
                <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field w-full text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={dialog === 'create' ? handleCreate : handleEdit} disabled={loading || !form.name.trim()} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: PRIMARY, color: '#ffffff', opacity: (!form.name.trim()) ? 0.5 : 1 }}>
                {loading ? '...' : dialog === 'create' ? fa.admin.create : fa.common.save}
              </button>
              <button onClick={() => setDialog(null)} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                {fa.admin.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'delete' && selected && selected.balance >= 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl p-6 w-96" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-sm font-bold mb-2" style={{ color: ERROR }}>{fa.admin.delete} {selected.name}</div>
            <div className="text-xs mb-4" style={{ color: textSecondary }}>آیا از حذف این مشتری اطمینان دارید؟ اطلاعات حسابداری و فروش حفظ خواهد شد.</div>
            <div className="flex gap-2">
              <button onClick={handleDelete} disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: ERROR, color: '#ffffff' }}>
                {loading ? '...' : fa.common.confirm}
              </button>
              <button onClick={() => { setDialog(null); setDeleteConfirm(false) }} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
                {fa.admin.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
