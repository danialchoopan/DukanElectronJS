import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import FormattedPriceInput from '../components/FormattedPriceInput'
import Dialog, { DialogField, DialogInput, DialogTextarea, DialogButton } from '../components/Dialog'

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
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number } | null>(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', company: '', taxId: '', description: '' })
  const [payAmount, setPayAmount] = useState('')
  const [payDesc, setPayDesc] = useState('')
  const [purchaseForm, setPurchaseForm] = useState({ supplierId: 0, items: [{ productTitle: '', quantity: 1, unitCost: 0 }], taxAmount: 0, discountAmount: 0, paidAmount: 0, notes: '' })

  const cBg = isDark ? '#1e293b' : '#ffffff'
  const cBorder = isDark ? '#334155' : '#e2e8f0'
  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const sBg = isDark ? '#0f172a' : '#f8fafc'
  const primary = '#006194'
  const ERR = '#ef4444'
  const SUC = '#22c55e'
  const WRN = '#f59e0b'
  const inBg = isDark ? '#0f172a' : '#f8fafc'
  const inStyle = { background: inBg, border: `1px solid ${cBorder}`, color: tPri }

  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl p-4 border ${className}`} style={{ backgroundColor: cBg, borderColor: cBorder }}>{children}</div>
  )

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

  const handleDeleteSupplier = async () => {
    if (!confirmDelete) return
    await window.api.suppliers.delete(confirmDelete.id)
    if (selectedSupplier?.id === confirmDelete.id) { setSelectedSupplier(null); setLedger([]) }
    setConfirmDelete(null)
    await load()
  }

  const handlePay = async () => {
    if (!selectedSupplier || !payAmount) return
    const amt = parseFloat(payAmount.replace(/,/g, ''))
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
    setConfirmDelete({ type: 'ledger', id: entryId })
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'ledger') {
      await window.api.suppliers.deleteLedgerEntry(confirmDelete.id)
      if (selectedSupplier) await refreshSelected(selectedSupplier.id)
    } else if (confirmDelete.type === 'supplier') {
      await handleDeleteSupplier()
    }
    setConfirmDelete(null)
  }

  const addPurchaseItem = () => {
    setPurchaseForm(p => ({ ...p, items: [...p.items, { productTitle: '', quantity: 1, unitCost: 0 }] }))
  }

  const removePurchaseItem = (idx: number) => {
    setPurchaseForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))
  }

  const updatePurchaseItem = (idx: number, field: string, value: any) => {
    setPurchaseForm(p => ({
      ...p,
      items: p.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }))
  }

  const purchaseSubtotal = purchaseForm.items.reduce((s, i) => s + (i.quantity * i.unitCost), 0)
  const purchaseTotal = purchaseSubtotal + purchaseForm.taxAmount - purchaseForm.discountAmount

  const handleCreatePurchase = async () => {
    if (!purchaseForm.supplierId || purchaseForm.items.length === 0) return
    setLoading(true)
    await window.api.purchases.create({
      supplierId: purchaseForm.supplierId,
      items: purchaseForm.items.filter(i => i.productTitle.trim()),
      taxAmount: purchaseForm.taxAmount,
      discountAmount: purchaseForm.discountAmount,
      paidAmount: purchaseForm.paidAmount,
      notes: purchaseForm.notes,
    })
    setDialog(null)
    setPurchaseForm({ supplierId: 0, items: [{ productTitle: '', quantity: 1, unitCost: 0 }], taxAmount: 0, discountAmount: 0, paidAmount: 0, notes: '' })
    await load()
    setLoading(false)
  }

  const kpis = [
    { label: 'تأمین کنندگان', value: stats.totalSuppliers, color: primary },
    { label: 'بدهکار', value: stats.totalDebtors, color: ERR },
    { label: 'مبلغ بدهی', value: stats.totalDebtAmount.toLocaleString('fa-IR') + ' ت', color: WRN },
    { label: 'کل خریدها', value: purchaseStats.totalPurchases, color: SUC },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 h-full p-4 overflow-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: tPri }}>تأمین کنندگان</h2>
          <p className="text-xs" style={{ color: tSec }}>مدیریت تأمین کنندگان و خریدها</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
            <div className="text-lg font-extrabold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        {[{ key: 'suppliers' as Tab, label: 'تأمین کنندگان' }, { key: 'purchases' as Tab, label: 'خریدها' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={{ background: tab === t.key ? `linear-gradient(135deg, ${primary}, #007bb9)` : cBg, color: tab === t.key ? '#fff' : tSec, border: `1px solid ${tab === t.key ? primary : cBorder}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <Card className="!p-0 overflow-hidden">
              <div className="p-3" style={{ borderBottom: `1px solid ${cBorder}` }}>
                <div className="flex gap-2">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="flex-1 px-3 py-2 rounded-lg text-sm font-bold outline-none" style={inStyle} />
                  <button onClick={() => { setDialog('create'); setForm({ name: '', phone: '', email: '', address: '', company: '', taxId: '', description: '' }) }}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80" style={{ background: `linear-gradient(135deg, ${SUC}, #16a34a)` }}>+ جدید</button>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {filtered.map(s => (
                  <button key={s.id} onClick={() => { setSelectedSupplier(s); refreshSelected(s.id) }}
                    className="w-full text-right p-3 transition-all flex justify-between items-center hover:bg-blue-500/5"
                    style={{ borderBottom: `1px solid ${cBorder}`, backgroundColor: selectedSupplier?.id === s.id ? primary + '10' : 'transparent', borderLeft: selectedSupplier?.id === s.id ? `3px solid ${primary}` : '3px solid transparent' }}>
                    <div>
                      <div className="text-sm font-bold" style={{ color: tPri }}>{s.name}</div>
                      <div className="text-[10px]" style={{ color: tSec }}>{s.company || s.phone || '-'}</div>
                    </div>
                    <div className="text-xs font-bold" style={{ color: s.balance > 0 ? ERR : SUC }}>
                      {s.balance > 0 ? `${s.balance.toLocaleString('fa-IR')} بدهی` : 'تسویه'}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && <div className="text-center py-8 text-sm" style={{ color: tSec }}>تأمین کننده‌ای یافت نشد</div>}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedSupplier ? (
              <div className="space-y-3">
                <Card>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="text-lg font-extrabold" style={{ color: tPri }}>{selectedSupplier.name}</div>
                      <div className="text-xs" style={{ color: tSec }}>{selectedSupplier.company} {selectedSupplier.phone ? `— ${selectedSupplier.phone}` : ''}</div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => { setDialog('pay'); setPayAmount(''); setPayDesc('') }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80" style={{ background: `linear-gradient(135deg, ${WRN}, #d97706)` }}>پرداخت</button>
                      <button onClick={() => { setDialog('edit'); setForm({ name: selectedSupplier.name, phone: selectedSupplier.phone || '', email: selectedSupplier.email || '', address: selectedSupplier.address || '', company: selectedSupplier.company || '', taxId: selectedSupplier.taxId || '', description: selectedSupplier.description || '' }) }} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-70" style={{ backgroundColor: sBg, color: tSec }}>ویرایش</button>
                      <button onClick={() => setConfirmDelete({ type: 'supplier', id: selectedSupplier.id })} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-70" style={{ backgroundColor: ERR + '15', color: ERR }}>حذف</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-lg p-2" style={{ backgroundColor: sBg }}>
                      <div className="text-[10px]" style={{ color: tSec }}>مانده حساب</div>
                      <div className="text-sm font-bold" style={{ color: selectedSupplier.balance > 0 ? ERR : SUC }}>{selectedSupplier.balance.toLocaleString('fa-IR')} ت</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: sBg }}>
                      <div className="text-[10px]" style={{ color: tSec }}>تلفن</div>
                      <div className="text-sm font-bold" style={{ color: tPri }}>{selectedSupplier.phone || '-'}</div>
                    </div>
                    <div className="rounded-lg p-2" style={{ backgroundColor: sBg }}>
                      <div className="text-[10px]" style={{ color: tSec }}>شرکت</div>
                      <div className="text-sm font-bold" style={{ color: tPri }}>{selectedSupplier.company || '-'}</div>
                    </div>
                  </div>
                </Card>

                <Card className="!p-0 overflow-hidden">
                  <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${cBorder}` }}>
                    <span className="font-bold text-sm" style={{ color: tPri }}>تاریخچه تراکنش‌ها</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: primary + '15', color: primary }}>{ledger.length}</span>
                  </div>
                  {ledger.length === 0 ? (
                    <div className="text-center py-8 text-sm" style={{ color: tSec }}>تراکنشی ثبت نشده</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm table-fixed">
                        <colgroup>
                          <col className="w-[18%]" />
                          <col className="w-[18%]" />
                          <col className="w-[18%]" />
                          <col className="w-[38%]" />
                          <col className="w-[8%]" />
                        </colgroup>
                        <thead><tr style={{ backgroundColor: sBg }}>
                          <th className="px-3 py-2 text-right text-xs" style={{ color: tSec }}>تاریخ</th>
                          <th className="px-3 py-2 text-right text-xs" style={{ color: tSec }}>نوع</th>
                          <th className="px-3 py-2 text-right text-xs" style={{ color: tSec }}>مبلغ</th>
                          <th className="px-3 py-2 text-right text-xs" style={{ color: tSec }}>شرح</th>
                          <th className="px-2 py-2 w-8"></th>
                        </tr></thead>
                        <tbody>
                          {ledger.map((e: any) => (
                            <tr key={e.id} style={{ borderTop: `1px solid ${cBorder}` }}>
                              <td className="px-3 py-2 text-xs" style={{ color: tSec }}>{new Date(e.createdAt).toLocaleDateString('fa-IR')}</td>
                              <td className="px-3 py-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                                  backgroundColor: e.type === 'purchase' ? primary + '15' : e.type === 'payment' ? SUC + '15' : e.type === 'return' ? WRN + '15' : ERR + '15',
                                  color: e.type === 'purchase' ? primary : e.type === 'payment' ? SUC : e.type === 'return' ? WRN : ERR,
                                }}>
                                  {e.type === 'purchase' ? 'خرید' : e.type === 'payment' ? 'پرداخت' : e.type === 'return' ? 'برگشت' : e.type}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-xs" style={{ color: e.amount > 0 ? ERR : SUC }}>
                                {e.amount > 0 ? '+' : ''}{e.amount.toLocaleString('fa-IR')}
                              </td>
                              <td className="px-3 py-2 text-xs truncate" style={{ color: tSec }}>{e.description}</td>
                              <td className="px-2 py-2">
                                <button onClick={() => handleDeleteLedger(e.id)} className="text-xs p-1 rounded transition-all hover:bg-red-500/10" style={{ color: ERR }}>
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="text-sm" style={{ color: tSec }}>یک تأمین کننده انتخاب کنید</div>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === 'purchases' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => { setDialog('purchase'); setPurchaseForm({ supplierId: suppliers[0]?.id || 0, items: [{ productTitle: '', quantity: 1, unitCost: 0 }], taxAmount: 0, discountAmount: 0, paidAmount: 0, notes: '' }) }}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-80" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>+ خرید جدید</button>
          </div>
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[12%]" />
                  <col className="w-[22%]" />
                </colgroup>
                <thead><tr style={{ backgroundColor: sBg }}>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider" style={{ color: tSec }}>شماره فاکتور</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider" style={{ color: tSec }}>تأمین کننده</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider" style={{ color: tSec }}>تاریخ</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider" style={{ color: tSec }}>مبلغ کل</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider" style={{ color: tSec }}>پرداخت</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider" style={{ color: tSec }}>مانده</th>
                  <th className="px-4 py-2 text-right text-xs uppercase tracking-wider" style={{ color: tSec }}>وضعیت</th>
                </tr></thead>
                <tbody>
                  {purchases.map(p => (
                    <tr key={p.id} className="cursor-pointer hover:bg-blue-500/5 transition-all" style={{ borderTop: `1px solid ${cBorder}` }}>
                      <td className="px-4 py-2 font-mono text-xs font-bold" style={{ color: primary }}>{p.invoiceNumber}</td>
                      <td className="px-4 py-2 text-xs truncate" style={{ color: tPri }}>{p.supplierName}</td>
                      <td className="px-4 py-2 text-xs" style={{ color: tSec }}>{new Date(p.purchaseDate).toLocaleDateString('fa-IR')}</td>
                      <td className="px-4 py-2 text-xs font-mono font-bold" style={{ color: tPri }}>{p.totalAmount.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-2 text-xs font-mono font-bold" style={{ color: SUC }}>{p.paidAmount.toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-2 text-xs font-mono font-bold" style={{ color: p.totalAmount - p.paidAmount > 0 ? ERR : SUC }}>{(p.totalAmount - p.paidAmount).toLocaleString('fa-IR')}</td>
                      <td className="px-4 py-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                          backgroundColor: p.status === 'paid' ? SUC + '15' : p.status === 'received' ? primary + '15' : WRN + '15',
                          color: p.status === 'paid' ? SUC : p.status === 'received' ? primary : WRN,
                        }}>
                          {p.status === 'paid' ? 'پرداخت شده' : p.status === 'received' ? 'دریافت شده' : 'در انتظار'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-sm" style={{ color: tSec }}>خریدی ثبت نشده</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="تأیید حذف"
        subtitle={confirmDelete?.type === 'supplier' ? 'تأمین کننده و تمام تراکنش‌ها حذف می‌شوند' : 'این رکورد از تاریخچه حذف می‌شود'}
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setConfirmDelete(null)}>لغو</DialogButton>
          <DialogButton variant="danger" onClick={confirmDeleteAction}>حذف</DialogButton>
        </>}>
        <p className="text-center text-sm" style={{ color: tSec }}>آیا از حذف اطمینان دارید؟</p>
      </Dialog>

      <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)}
        title={dialog === 'edit' ? 'ویرایش تأمین کننده' : 'تأمین کننده جدید'}
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setDialog(null)}>لغو</DialogButton>
          <DialogButton variant="primary" onClick={handleSaveSupplier} disabled={loading || !form.name.trim()}>ذخیره</DialogButton>
        </>}>
        <DialogField label="نام *"><DialogInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} autoFocus /></DialogField>
        <div className="grid grid-cols-2 gap-3">
          <DialogField label="تلفن"><DialogInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} /></DialogField>
          <DialogField label="شرکت"><DialogInput value={form.company} onChange={v => setForm(f => ({ ...f, company: v }))} /></DialogField>
        </div>
        <DialogField label="آدرس"><DialogInput value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} /></DialogField>
        <div className="grid grid-cols-2 gap-3">
          <DialogField label="ایمیل"><DialogInput value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} /></DialogField>
          <DialogField label="شماره مالیاتی"><DialogInput value={form.taxId} onChange={v => setForm(f => ({ ...f, taxId: v }))} /></DialogField>
        </div>
        <DialogField label="توضیحات"><DialogTextarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} rows={2} /></DialogField>
      </Dialog>

      <Dialog open={dialog === 'pay' && !!selectedSupplier} onClose={() => setDialog(null)}
        title={`پرداخت به ${selectedSupplier?.name || ''}`}
        subtitle={`مانده بدهی: ${selectedSupplier?.balance.toLocaleString('fa-IR') || 0} تومان`}
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setDialog(null)}>لغو</DialogButton>
          <DialogButton variant="success" onClick={handlePay} disabled={loading || !payAmount || parseFloat(payAmount.replace(/,/g, '')) <= 0}>پرداخت</DialogButton>
        </>}>
        <DialogField label="مبلغ پرداخت">
          <FormattedPriceInput value={parseFloat(payAmount.replace(/,/g, '')) || 0} onChange={(v) => setPayAmount(v ? String(v) : '')} className="w-full px-3 py-3 rounded-xl text-lg font-bold text-center outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }} />
        </DialogField>
        <DialogField label="توضیحات"><DialogInput value={payDesc} onChange={setPayDesc} placeholder="اختیاری" /></DialogField>
      </Dialog>

      <Dialog open={dialog === 'purchase'} onClose={() => setDialog(null)} title="خرید جدید" maxWidth="max-w-lg"
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setDialog(null)}>لغو</DialogButton>
          <DialogButton variant="primary" onClick={handleCreatePurchase} disabled={loading || !purchaseForm.supplierId || purchaseForm.items.length === 0}>ثبت خرید</DialogButton>
        </>}>
        <DialogField label="تأمین کننده *">
          <select value={purchaseForm.supplierId} onChange={e => setPurchaseForm(p => ({ ...p, supplierId: Number(e.target.value) }))}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }}>
            <option value={0}>انتخاب کنید...</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company || ''})</option>)}
          </select>
        </DialogField>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold" style={{ color: tSec }}>اقلام خرید</label>
          <button onClick={addPurchaseItem} className="text-xs font-bold px-2 py-1 rounded-lg transition-all hover:opacity-70" style={{ color: primary, backgroundColor: primary + '10' }}>+ افزودن</button>
        </div>
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {purchaseForm.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input value={item.productTitle} onChange={e => updatePurchaseItem(idx, 'productTitle', e.target.value)} placeholder="نام کالا" className="flex-1 px-2 py-1.5 rounded-lg text-xs font-bold outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }} />
              <FormattedPriceInput value={item.quantity} onChange={v => updatePurchaseItem(idx, 'quantity', v)} className="w-20 px-2 py-1.5 rounded-lg text-xs font-bold text-center outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }} />
              <FormattedPriceInput value={item.unitCost} onChange={v => updatePurchaseItem(idx, 'unitCost', v)} className="w-28 px-2 py-1.5 rounded-lg text-xs font-bold text-center outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }} />
              <span className="text-[10px] font-bold min-w-[60px] text-left" style={{ color: tPri }}>{(item.quantity * item.unitCost).toLocaleString('fa-IR')}</span>
              {purchaseForm.items.length > 1 && <button onClick={() => removePurchaseItem(idx)} className="text-xs p-1 rounded transition-all hover:opacity-70" style={{ color: ERR }}>✕</button>}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <DialogField label="مالیات"><FormattedPriceInput value={purchaseForm.taxAmount} onChange={v => setPurchaseForm(p => ({ ...p, taxAmount: v }))} className="w-full px-2 py-1.5 rounded-lg text-xs font-bold text-center outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }} /></DialogField>
          <DialogField label="تخفیف"><FormattedPriceInput value={purchaseForm.discountAmount} onChange={v => setPurchaseForm(p => ({ ...p, discountAmount: v }))} className="w-full px-2 py-1.5 rounded-lg text-xs font-bold text-center outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }} /></DialogField>
          <DialogField label="پرداخت"><FormattedPriceInput value={purchaseForm.paidAmount} onChange={v => setPurchaseForm(p => ({ ...p, paidAmount: v }))} className="w-full px-2 py-1.5 rounded-lg text-xs font-bold text-center outline-none" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, color: tPri }} /></DialogField>
        </div>
        <div className="flex justify-between p-3 rounded-xl mt-2" style={{ backgroundColor: sBg }}>
          <span className="text-sm font-bold" style={{ color: tSec }}>جمع کل:</span>
          <span className="text-sm font-extrabold" style={{ color: primary }}>{purchaseTotal.toLocaleString('fa-IR')} تومان</span>
        </div>
      </Dialog>
    </div>
  )
}