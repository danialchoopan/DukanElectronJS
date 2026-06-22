import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'

type Tab = 'suppliers' | 'purchases'

export default function Suppliers() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'

  const [tab, setTab] = useState<Tab>('suppliers')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchases, setPurchases] = useState<any[]>([])
  const [stats, setStats] = useState({ totalSuppliers: 0, totalDebtors: 0, totalDebtAmount: 0 })
  const [purchaseStats, setPurchaseStats] = useState({ totalPurchases: 0, totalPending: 0, totalPaid: 0 })
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [dialog, setDialog] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', company: '', taxId: '', description: '' })
  const [payAmount, setPayAmount] = useState('')
  const [payDesc, setPayDesc] = useState('')

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const surfaceBg = isDark ? '#0f172a' : '#f8fafc'
  const surfaceHover = isDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)'
  const primary = '#006194'
  const ERROR = '#ef4444'
  const SUCCESS = '#22c55e'
  const WARNING = '#f59e0b'

  const load = useCallback(async () => {
    const sr = await window.api.suppliers.getAll()
    if (sr.success && sr.data) setSuppliers(sr.data)
    const st = await window.api.suppliers.stats()
    if (st.success && st.data) setStats(st.data)
    const pr = await window.api.purchases.getAll()
    if (pr.success && pr.data) setPurchases(pr.data)
    const ps = await window.api.purchases.stats()
    if (ps.success && ps.data) setPurchaseStats(ps.data)
  }, [])

  useEffect(() => { load() }, [load])

  const refreshSelected = async (id: number) => {
    const r = await window.api.suppliers.getById(id)
    if (r.success && r.data) setSelectedSupplier(r.data)
    const lr = await window.api.suppliers.ledger(id)
    if (lr.success && lr.data) setLedger(lr.data)
    await load()
  }

  const filtered = search ? suppliers.filter(s => s.name.includes(search) || s.phone.includes(search) || s.company.includes(search)) : suppliers

  const handleSaveSupplier = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    if (dialog === 'edit' && selectedSupplier) {
      await window.api.suppliers.update(selectedSupplier.id, form)
    } else {
      await window.api.suppliers.create(form)
    }
    setDialog(null)
    setForm({ name: '', phone: '', email: '', address: '', company: '', taxId: '', description: '' })
    await load()
    setLoading(false)
  }

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm('آیا از حذف این تأمین\u200cکننده اطمینان دارید؟')) return
    await window.api.suppliers.delete(id)
    if (selectedSupplier?.id === id) { setSelectedSupplier(null); setLedger([]) }
    await load()
  }

  const handlePay = async () => {
    if (!selectedSupplier || !payAmount) return
    const amt = parseFloat(payAmount)
    if (amt <= 0) return
    setLoading(true)
    await window.api.suppliers.pay(selectedSupplier.id, amt, payDesc || undefined)
    setDialog(null)
    setPayAmount('')
    setPayDesc('')
    await refreshSelected(selectedSupplier.id)
    setLoading(false)
  }

  const handleDeleteLedger = async (entryId: number) => {
    if (!confirm('آیا از حذف این رکورد اطمینان دارید؟')) return
    await window.api.suppliers.deleteLedgerEntry(entryId)
    if (selectedSupplier) await refreshSelected(selectedSupplier.id)
  }

  const tabs = [
    { key: 'suppliers' as Tab, label: 'تأمین\u200cکنندگان', icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>) },
    { key: 'purchases' as Tab, label: 'خریدها', icon: (<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>) },
  ]

  const kpis = [
    { label: 'تأمین\u200cکنندگان', value: stats.totalSuppliers, color: primary },
    { label: 'بدهکار', value: stats.totalDebtors, color: ERROR },
    { label: 'مبلغ بدهی', value: stats.totalDebtAmount.toLocaleString('fa-IR') + ' ت', color: WARNING },
    { label: 'کل خریدها', value: purchaseStats.totalPurchases, color: SUCCESS },
  ]

  return (
    <div className="h-full p-4 overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: textPrimary }}>تأمین\u200cکنندگان</h2>
          <p className="text-xs" style={{ color: textSecondary }}>مدیریت تأمین\u200cکنندگان و خریدها</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="rounded-xl p-3 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="text-[10px] font-bold" style={{ color: textSecondary }}>{kpi.label}</div>
            <div className="text-lg font-extrabold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: tab === t.key ? `linear-gradient(135deg, ${primary}, #007bb9)` : cardBg, color: tab === t.key ? '#fff' : textSecondary, border: `1px solid ${tab === t.key ? primary : cardBorder}` }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Supplier List */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
              <div className="p-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <div className="flex gap-2">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="input-field text-sm flex-1" />
                  <button onClick={() => { setDialog('create'); setForm({ name: '', phone: '', email: '', address: '', company: '', taxId: '', description: '' }) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${SUCCESS}, #16a34a)` }}>+ جدید</button>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {filtered.map(s => (
                  <button key={s.id} onClick={() => { setSelectedSupplier(s); refreshSelected(s.id) }}
                    className="w-full text-right p-3 transition-all border-b flex justify-between items-center"
                    style={{ borderColor: cardBorder, backgroundColor: selectedSupplier?.id === s.id ? primary + '10' : 'transparent', borderLeft: selectedSupplier?.id === s.id ? `3px solid ${primary}` : '3px solid transparent' }}
                    onMouseEnter={e => { if (selectedSupplier?.id !== s.id) e.currentTarget.style.backgroundColor = surfaceHover }}
                    onMouseLeave={e => { if (selectedSupplier?.id !== s.id) e.currentTarget.style.backgroundColor = 'transparent' }}>
                    <div>
                      <div className="text-sm font-bold" style={{ color: textPrimary }}>{s.name}</div>
                      <div className="text-[10px]" style={{ color: textSecondary }}>{s.company || s.phone || '-'}</div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: s.balance > 0 ? ERROR : SUCCESS }}>
                      {s.balance > 0 ? `${s.balance.toLocaleString('fa-IR')} بدهی` : 'تسویه'}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <div className="text-center py-8 text-sm" style={{ color: textSecondary }}>تأمین\u200cکننده‌ای یافت نشد</div>}
              </div>
            </div>
          </div>

          {/* Right: Supplier Detail */}
          <div className="lg:col-span-2">
            {selectedSupplier ? (
              <div className="space-y-3">
                {/* Supplier Info */}
                <div className="rounded-xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-lg font-extrabold" style={{ color: textPrimary }}>{selectedSupplier.name}</div>
                      <div className="text-xs" style={{ color: textSecondary }}>{selectedSupplier.company} {selectedSupplier.phone ? `— ${selectedSupplier.phone}` : ''}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setDialog('pay'); setPayAmount(''); setPayDesc('') }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${WARNING}, #d97706)` }}>پرداخت</button>
                      <button onClick={() => { setDialog('edit'); setForm({ name: selectedSupplier.name, phone: selectedSupplier.phone, email: selectedSupplier.email, address: selectedSupplier.address, company: selectedSupplier.company, taxId: selectedSupplier.taxId, description: selectedSupplier.description }) }} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: surfaceBg, color: textSecondary }}>ویرایش</button>
                      <button onClick={() => handleDeleteSupplier(selectedSupplier.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ backgroundColor: ERROR + '15', color: ERROR }}>حذف</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: surfaceBg }}>
                      <div className="text-[10px]" style={{ color: textSecondary }}>مانده حساب</div>
                      <div className="text-sm font-bold" style={{ color: selectedSupplier.balance > 0 ? ERROR : SUCCESS }}>{selectedSupplier.balance.toLocaleString('fa-IR')} تومان</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: surfaceBg }}>
                      <div className="text-[10px]" style={{ color: textSecondary }}>تلفن</div>
                      <div className="text-sm font-bold" style={{ color: textPrimary }}>{selectedSupplier.phone || '-'}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: surfaceBg }}>
                      <div className="text-[10px]" style={{ color: textSecondary }}>شرکت</div>
                      <div className="text-sm font-bold" style={{ color: textPrimary }}>{selectedSupplier.company || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Ledger */}
                <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                  <div className="p-3 font-bold text-sm" style={{ borderBottom: `1px solid ${cardBorder}`, color: textPrimary }}>تاریخچه تراکنش‌ها</div>
                  {ledger.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: textSecondary }}>تراکنشی ثبت نشده</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead><tr style={{ backgroundColor: surfaceBg }}>
                        <th className="px-3 py-2 text-right text-xs" style={{ color: textSecondary }}>تاریخ</th>
                        <th className="px-3 py-2 text-right text-xs" style={{ color: textSecondary }}>نوع</th>
                        <th className="px-3 py-2 text-right text-xs" style={{ color: textSecondary }}>مبلغ</th>
                        <th className="px-3 py-2 text-right text-xs" style={{ color: textSecondary }}>شرح</th>
                        <th className="px-2 py-2 w-8"></th>
                      </tr></thead>
                      <tbody>
                        {ledger.map((e: any) => (
                          <tr key={e.id} style={{ borderTop: `1px solid ${cardBorder}` }}>
                            <td className="px-3 py-2 text-xs" style={{ color: textSecondary }}>{new Date(e.createdAt).toLocaleDateString('fa-IR')}</td>
                            <td className="px-3 py-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                                backgroundColor: e.type === 'purchase' ? primary + '15' : e.type === 'payment' ? SUCCESS + '15' : e.type === 'return' ? WARNING + '15' : ERROR + '15',
                                color: e.type === 'purchase' ? primary : e.type === 'payment' ? SUCCESS : e.type === 'return' ? WARNING : ERROR,
                              }}>
                                {e.type === 'purchase' ? 'خرید' : e.type === 'payment' ? 'پرداخت' : e.type === 'return' ? 'برگشت' : e.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-bold text-xs" style={{ color: e.amount > 0 ? ERROR : SUCCESS }}>
                              {e.amount > 0 ? '+' : ''}{e.amount.toLocaleString('fa-IR')}
                            </td>
                            <td className="px-3 py-2 text-xs" style={{ color: textSecondary }}>{e.description}</td>
                            <td className="px-2 py-2">
                              <button onClick={() => handleDeleteLedger(e.id)} className="text-xs p-1 rounded hover:bg-red-500/10" style={{ color: ERROR }}>
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border p-12 text-center" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
                <div className="text-sm" style={{ color: textSecondary }}>یک تأمین\u200cکننده انتخاب کنید</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Purchases Tab */}
      {tab === 'purchases' && (
        <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: surfaceBg }}>
              <th className="px-4 py-2 text-right text-xs" style={{ color: textSecondary }}>شماره فاکتور</th>
              <th className="px-4 py-2 text-right text-xs" style={{ color: textSecondary }}>تأمین\u200cکننده</th>
              <th className="px-4 py-2 text-right text-xs" style={{ color: textSecondary }}>تاریخ</th>
              <th className="px-4 py-2 text-right text-xs" style={{ color: textSecondary }}>مبلغ کل</th>
              <th className="px-4 py-2 text-right text-xs" style={{ color: textSecondary }}>پرداخت</th>
              <th className="px-4 py-2 text-right text-xs" style={{ color: textSecondary }}>مانده</th>
              <th className="px-4 py-2 text-right text-xs" style={{ color: textSecondary }}>وضعیت</th>
            </tr></thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} style={{ borderTop: `1px solid ${cardBorder}` }}>
                  <td className="px-4 py-2 font-mono text-xs font-bold" style={{ color: primary }}>{p.invoiceNumber}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: textPrimary }}>{p.supplierName}</td>
                  <td className="px-4 py-2 text-xs" style={{ color: textSecondary }}>{new Date(p.purchaseDate).toLocaleDateString('fa-IR')}</td>
                  <td className="px-4 py-2 text-xs font-bold" style={{ color: textPrimary }}>{p.totalAmount.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2 text-xs font-bold" style={{ color: SUCCESS }}>{p.paidAmount.toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2 text-xs font-bold" style={{ color: p.totalAmount - p.paidAmount > 0 ? ERROR : SUCCESS }}>{(p.totalAmount - p.paidAmount).toLocaleString('fa-IR')}</td>
                  <td className="px-4 py-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                      backgroundColor: p.status === 'paid' ? SUCCESS + '15' : p.status === 'received' ? primary + '15' : WARNING + '15',
                      color: p.status === 'paid' ? SUCCESS : p.status === 'received' ? primary : WARNING,
                    }}>
                      {p.status === 'paid' ? 'پرداخت شده' : p.status === 'received' ? 'دریافت شده' : 'در انتظار'}
                    </span>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: textSecondary }}>خریدی ثبت نشده</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      {(dialog === 'create' || dialog === 'edit') && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setDialog(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4" style={{ color: textPrimary }}>{dialog === 'edit' ? 'ویرایش تأمین\u200cکننده' : 'تأمین\u200cکننده جدید'}</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>نام *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field text-sm" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} autoFocus /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>تلفن</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input-field text-sm" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
                <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>شرکت</label><input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="input-field text-sm" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              </div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>آدرس</label><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="input-field text-sm" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>ایمیل</label><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-field text-sm" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
                <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>شماره مالیاتی</label><input value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} className="input-field text-sm" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
              </div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>توضیحات</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field text-sm" rows={2} style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDialog(null)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: surfaceBg, color: textSecondary }}>لغو</button>
              <button onClick={handleSaveSupplier} disabled={loading || !form.name.trim()} className="flex-1 py-2 rounded-xl text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, opacity: loading || !form.name.trim() ? 0.5 : 1 }}>ذخیره</button>
            </div>
          </div>
        </div>
      )}

      {dialog === 'pay' && selectedSupplier && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setDialog(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-1" style={{ color: textPrimary }}>پرداخت به {selectedSupplier.name}</h3>
            <p className="text-xs mb-4" style={{ color: textSecondary }}>مانده بدهی: {selectedSupplier.balance.toLocaleString('fa-IR')} تومان</p>
            <div className="space-y-3">
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>مبلغ پرداخت</label><input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="input-field text-lg font-bold text-center" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} placeholder="0" autoFocus /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>توضیحات</label><input value={payDesc} onChange={e => setPayDesc(e.target.value)} className="input-field text-sm" style={{ backgroundColor: surfaceBg, border: `1px solid ${cardBorder}`, color: textPrimary }} placeholder="اختیاری" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDialog(null)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: surfaceBg, color: textSecondary }}>لغو</button>
              <button onClick={handlePay} disabled={loading || !payAmount || parseFloat(payAmount) <= 0} className="flex-1 py-2 rounded-xl text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${SUCCESS}, #16a34a)`, opacity: loading || !payAmount ? 0.5 : 1 }}>پرداخت</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
