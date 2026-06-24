import { useState, useEffect } from 'react'
import { fa } from '../../i18n'
import { printA4Report } from '../../utils/a4Print'
import { formatJalaliDateTime } from '../../utils/jalali'
import HelpPopup from '../../components/HelpPopup'

interface AccountNode { account: any; children: AccountNode[] }

export default function ChartOfAccounts() {
  const [tree, setTree] = useState<AccountNode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'asset' as string, parentId: null as number | null, description: '' })
  const [filterType, setFilterType] = useState('all')
  const [allAccounts, setAllAccounts] = useState<any[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [balances, setBalances] = useState<Record<number, { totalDebit: number; totalCredit: number; balance: number }>>({})
  const [ledgerAccount, setLedgerAccount] = useState<any>(null)
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([])

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const typeColors: Record<string, { bg: string; fg: string; icon: string }> = {
    asset: { bg: isDark ? '#0c1e3a' : '#dbeafe', fg: '#3b82f6', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    liability: { bg: isDark ? '#450a0a' : '#fee2e2', fg: '#ef4444', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    equity: { bg: isDark ? '#2e1065' : '#f3e8ff', fg: '#a855f7', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    income: { bg: isDark ? '#052e16' : '#dcfce7', fg: '#22c55e', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    expense: { bg: isDark ? '#451a03' : '#fef3c7', fg: '#f59e0b', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  }

  const load = async () => {
    const [treeRes, allRes, tbRes] = await Promise.all([
      window.api.accounts.getTree(),
      window.api.accounts.getAll(),
      window.api.journal.getTrialBalance(),
    ])
    if (treeRes.success && treeRes.data) setTree(treeRes.data)
    if (allRes.success && allRes.data) setAllAccounts(allRes.data)
    if (tbRes.success && tbRes.data) {
      const balanceMap: Record<number, { totalDebit: number; totalCredit: number; balance: number }> = {}
      tbRes.data.forEach((r: any) => {
        balanceMap[r.accountId] = { totalDebit: r.totalDebit, totalCredit: r.totalCredit, balance: r.balance }
      })
      setBalances(balanceMap)
    }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ code: '', name: '', type: 'asset', parentId: null, description: '' }); setEditingId(null); setShowForm(true) }
  const openEdit = (a: any) => { setForm({ code: a.code, name: a.name, type: a.type, parentId: a.parentId, description: a.description || '' }); setEditingId(a.id); setShowForm(true) }

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) { showToast('کد و نام حساب الزامی است', 'error'); return }
    if (editingId) { await window.api.accounts.update(editingId, form); showToast('حساب با موفقیت ویرایش شد') }
    else { await window.api.accounts.create(form); showToast('حساب جدید ایجاد شد') }
    setShowForm(false); load()
  }

  const handleDelete = async (id: number) => {
    const r = await window.api.accounts.delete(id)
    if (r && r.success === false) { showToast(r.error || 'خطا در حذف', 'error') }
    else { showToast('حساب حذف شد') }
    setDeleteConfirmId(null); load()
  }

  const handleToggle = async (id: number) => { await window.api.accounts.toggleActive(id); load() }

  const toggleExpand = (id: number) => {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setExpandedIds(next)
  }

  const openLedger = async (id: number, name: string) => {
    const r = await window.api.journal.getLedger(id)
    if (r.success && r.data) { setLedgerEntries(r.data); setLedgerAccount({ id, name }) }
  }

  const renderNode = (node: AccountNode, depth: number = 0) => {
    const a = node.account
    const tc = typeColors[a.type] || typeColors.asset
    const matchesFilter = filterType === 'all' || a.type === filterType
    const matchesSearch = !searchQuery || a.name.includes(searchQuery) || a.code.includes(searchQuery)
    if (!matchesFilter || !matchesSearch) return null
    const hasChildren = node.children.length > 0
    const isExpanded = expandedIds.has(a.id)
    const bal = balances[a.id]
    const hasActivity = bal && (bal.totalDebit !== 0 || bal.totalCredit !== 0)
    return (
      <div key={a.id}>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1 transition-all cursor-pointer group" style={{ marginRight: depth * 20, backgroundColor: isDark ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.02)', border: '1px solid transparent', opacity: a.isActive ? 1 : 0.5 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.05)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = isDark ? 'rgba(59,130,246,0.04)' : 'rgba(59,130,246,0.02)' }}>
          {hasChildren && (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(a.id) }} className="w-5 h-5 flex items-center justify-center rounded transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', color: textSecondary }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}
          {!hasChildren && <span className="w-5" />}
          <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tc.bg }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={tc.fg} strokeWidth="1.5"><path d={tc.icon} /></svg>
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0" style={{ backgroundColor: tc.bg, color: tc.fg }}>{a.code}</span>
          <span className="text-sm font-medium flex-1" style={{ color: textPrimary }}>{a.name}</span>
          {hasActivity && (
            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0`}
              style={{ backgroundColor: bal.balance > 0 ? '#dcfce7' : bal.balance < 0 ? '#fee2e2' : (isDark ? '#1e293b' : '#f1f5f9'), color: bal.balance > 0 ? '#16a34a' : bal.balance < 0 ? '#dc2626' : textSecondary }}>
              {Math.abs(bal.balance).toLocaleString('fa-IR')}
            </span>
          )}
          {!hasActivity && <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: textSecondary }}>—</span>}
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0" style={{ backgroundColor: tc.bg, color: tc.fg }}>{fa.accounting.accounts.types[a.type as keyof typeof fa.accounting.accounts.types]}</span>
          {hasChildren && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9', color: textSecondary }}>{node.children.length}</span>}
          <div className="flex items-center gap-1 shrink-0">
            {hasActivity && (
              <button onClick={(e) => { e.stopPropagation(); openLedger(a.id, a.name) }} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: isDark ? 'rgba(0,97,148,0.15)' : '#dbeafe', color: '#006194' }} title="مشاهده تراکنش‌ها">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); openEdit(a) }} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleToggle(a.id) }} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: a.isActive ? (isDark ? '#052e16' : '#dcfce7') : (isDark ? '#1e293b' : '#f1f5f9'), color: a.isActive ? '#22c55e' : textSecondary }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={a.isActive ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' : 'M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94'}/></svg>
            </button>
            {!hasChildren && (
              <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(a.id) }} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', color: '#ef4444' }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            )}
          </div>
        </div>
        {deleteConfirmId === a.id && (
          <div className="mr-6 mb-2 rounded-xl p-3" style={{ marginRight: (depth + 1) * 20, backgroundColor: isDark ? '#450a0a' : '#fef2f2', border: '1px solid #ef4444' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#ef4444' }}>آیا از حذف حساب «{a.name}» اطمینان دارید؟</p>
            <div className="flex gap-2"><button onClick={() => handleDelete(a.id)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: '#ef4444', color: '#fff' }}>بله</button><button onClick={() => setDeleteConfirmId(null)} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>لغو</button></div>
          </div>
        )}
        {hasChildren && isExpanded && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    )
  }

  const types = ['all', 'asset', 'liability', 'equity', 'income', 'expense']
  const typeCounts = types.filter(t => t !== 'all').reduce((acc, t) => { acc[t] = allAccounts.filter(a => a.type === t).length; return acc }, {} as Record<string, number>)
  const totalBalances = types.filter(t => t !== 'all').reduce((acc, t) => {
    acc[t] = allAccounts.filter(a => a.type === t).reduce((sum, a) => sum + (balances[a.id]?.balance || 0), 0)
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto px-4">
      {toast && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: toast.type === 'success' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>{toast.msg}</div>}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.accounting.accounts.title}</h3>
          <HelpPopup title="راهنمای دفتر حسابها" sections={[
            { heading: 'دفتر حسابها چیست؟', items: ['ساختار اصلی حسابداری برای دسته‌بندی تراکنش‌ها', 'هر حساب دارای کد، نام، و نوع (دارایی/بدهی/سرمایه/درآمد/هزینه)', 'مانده هر حساب به صورت خودکار از تراکنش‌ها محاسبه می‌شود'] },
            { heading: 'روش کار', items: ['با کلیک روی دکمه + می‌توان حساب جدید ایجاد کرد', 'حساب‌ها به صورت سلسله‌مراتبی (والد و زیرمجموعه) سازماندهی می‌شوند', 'برای مشاهده تراکنش‌های یک حساب روی دکمه سند کلیک کنید'] },
            { heading: 'رنگ‌بندی مانده‌ها', items: ['سبز = مانده مثبت (دارایی یا درآمد)', 'قرمز = مانده منفی (بدهی یا هزینه)', 'خط تیره = بدون تراکنش'] },
            { heading: 'هماهنگی با سایر بخش‌ها', items: ['تمام تراکنش‌های فروش، هزینه و مرجوعی به صورت خودکار در حساب‌ها ثبت می‌شود', 'مانده حساب‌ها در تراز آزمایشی و صورت‌های مالی نمایش داده می‌شود'] }
          ]} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={async () => {
            let html = '<table><thead><tr><th>کد</th><th>نام</th><th>نوع</th><th>مانده</th><th>وضعیت</th></tr></thead><tbody>'
            allAccounts.forEach(a => {
              const bal = balances[a.id]
              const balStr = bal ? Math.abs(bal.balance).toLocaleString('fa-IR') : '—'
              html += `<tr><td>${a.code}</td><td>${a.name}</td><td>${fa.accounting.accounts.types[a.type as keyof typeof fa.accounting.accounts.types]}</td><td>${balStr}</td><td>${a.isActive ? 'فعال' : 'غیرفعال'}</td></tr>`
            })
            html += '</tbody></table>'
            await printA4Report(html, 'دفتر حسابها')
          }} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg> چاپ
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80" style={{ backgroundColor: '#006194' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> + {fa.accounting.accounts.addAccount}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {types.filter(t => t !== 'all').map(t => (
          <div key={t} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: typeColors[t]?.bg }}>
            <div className="text-[10px] font-bold" style={{ color: typeColors[t]?.fg }}>{fa.accounting.accounts.types[t as keyof typeof fa.accounting.accounts.types]}</div>
            <div className="text-sm font-bold font-mono" style={{ color: typeColors[t]?.fg }}>{Math.abs(totalBalances[t] || 0).toLocaleString('fa-IR')}</div>
            <div className="text-[9px] opacity-70" style={{ color: typeColors[t]?.fg }}>{typeCounts[t] || 0} حساب</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="جستجو..." className="input-field text-sm w-full pr-9" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }} />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{ background: filterType === t ? '#006194' : (isDark ? '#334155' : '#f1f5f9'), color: filterType === t ? '#fff' : textSecondary }}>
            {t === 'all' ? fa.dashboard.all : fa.accounting.accounts.types[t as keyof typeof fa.accounting.accounts.types]}
            {t !== 'all' && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: filterType === t ? 'rgba(255,255,255,0.2)' : (isDark ? '#1e293b' : '#e2e8f0') }}>{typeCounts[t] || 0}</span>}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border p-3 space-y-1" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        {tree.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: textSecondary }}>{fa.accounting.accounts.noAccounts}</p>
        ) : tree.map(node => renderNode(node))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#006194' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4" style={{ color: textPrimary }}>{editingId ? fa.accounting.accounts.editAccount : fa.accounting.accounts.addAccount}</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.code} *</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-field text-sm" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }} placeholder="مثال: 1000" /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.name} *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field text-sm" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }} /></div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.type}</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field text-sm" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }}>
                  {['asset', 'liability', 'equity', 'income', 'expense'].map(t => <option key={t} value={t}>{fa.accounting.accounts.types[t as keyof typeof fa.accounting.accounts.types]}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.parent}</label>
                <select value={form.parentId ?? ''} onChange={e => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })} className="input-field text-sm" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }}>
                  <option value="">—</option>
                  {allAccounts.filter(a => a.id !== editingId && a.isActive).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.description}</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field text-sm" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80" style={{ backgroundColor: '#006194' }}>{fa.accounting.accounts.save}</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{fa.accounting.accounts.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {ledgerAccount && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setLedgerAccount(null)}>
          <div className="rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[70vh] overflow-auto" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: textPrimary }}>تراکنش‌های {ledgerAccount.name}</h3>
              <button onClick={() => setLedgerAccount(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>✕</button>
            </div>
            {ledgerEntries.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>تراکنشی ثبت نشده</p>
            ) : (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: cardBorder }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                        <th className="px-3 py-2 text-right" style={{ color: textSecondary }}>تاریخ</th>
                        <th className="px-3 py-2 text-right" style={{ color: textSecondary }}>شرح</th>
                        <th className="px-3 py-2 text-left" style={{ color: textSecondary }}>بدهکار</th>
                        <th className="px-3 py-2 text-left" style={{ color: textSecondary }}>بستانکار</th>
                        <th className="px-3 py-2 text-left" style={{ color: textSecondary }}>مانده</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerEntries.map((e, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${cardBorder}` }}>
                          <td className="px-3 py-2 text-xs" style={{ color: textSecondary }}>{formatJalaliDateTime(e.entryDate)}</td>
                          <td className="px-3 py-2" style={{ color: textPrimary }}>{e.description}</td>
                          <td className="px-3 py-2 text-left font-mono text-xs" style={{ color: e.debit > 0 ? '#22c55e' : textSecondary }}>{e.debit > 0 ? e.debit.toLocaleString('fa-IR') : '-'}</td>
                          <td className="px-3 py-2 text-left font-mono text-xs" style={{ color: e.credit > 0 ? '#ef4444' : textSecondary }}>{e.credit > 0 ? e.credit.toLocaleString('fa-IR') : '-'}</td>
                          <td className="px-3 py-2 text-left font-mono font-bold text-xs" style={{ color: e.balance >= 0 ? '#22c55e' : '#ef4444' }}>{Math.abs(e.balance).toLocaleString('fa-IR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <button onClick={() => setLedgerAccount(null)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80" style={{ backgroundColor: '#006194' }}>بستن</button>
          </div>
        </div>
      )}
    </div>
  )
}