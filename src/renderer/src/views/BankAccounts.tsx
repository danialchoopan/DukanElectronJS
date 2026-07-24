/**
 * BankAccounts — bank account management with deposit/withdraw/transfer.
 * Features: list, add, deposit, withdraw, transfer, transaction history.
 */
import { useState, useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import ShamsiDateInput from '../components/business/ShamsiDateInput'
import FormattedPriceInput from '../components/ui/FormattedPriceInput'
import Dialog, { DialogField, DialogInput, DialogButton } from '../components/ui/Dialog'

export default function BankAccounts() {
  const { isDark, colors } = useTheme()
  const tPri = colors.text.primary
  const tSec = colors.text.secondary
  const cBg = colors.bg.card
  const cBorder = colors.border.default
  const sBg = colors.bg.primary
  const primary = '#006194'
  const ERR = '#ef4444'
  const SUC = '#22c55e'

  const [accounts, setAccounts] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [dialog, setDialog] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', account_number: '', bank_name: '', branch: '', account_type: 'current', initial_balance: 0, iban: '', notes: '' })
  const [txAmount, setTxAmount] = useState<number>(0)
  const [txDesc, setTxDesc] = useState('')
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10))
  const [transferTo, setTransferTo] = useState(0)
  const [loading, setLoading] = useState(false)

  const inStyle = { background: colors.bg.input, border: `1px solid ${cBorder}`, color: tPri }

  const load = async () => {
    const r = await window.api.bankAccounts.getAll()
    if (r.success && r.data) setAccounts(r.data)
  }

  const refreshSelected = async (id: number) => {
    const r = await window.api.bankAccounts.getAll()
    if (r.success && r.data) {
      setAccounts(r.data)
      setSelected(r.data.find((a: any) => a.id === id) || null)
    }
    const tx = await window.api.bankAccounts.transactions(id)
    if (tx.success && tx.data) setTransactions(tx.data)
  }

  useEffect(() => { load() }, [])

  const totalBalance = accounts.reduce((s: number, a: any) => s + (a.current_balance || 0), 0)

  const handleSave = async () => {
    if (!form.name.trim()) return
    setLoading(true)
    if (dialog === 'addBank') {
      await window.api.bankAccounts.create(form)
    } else if (dialog === 'editBank' && selected) {
      await window.api.bankAccounts.update(selected.id, form)
    }
    setDialog(null); setForm({ name: '', account_number: '', bank_name: '', branch: '', account_type: 'current', initial_balance: 0, iban: '', notes: '' })
    setLoading(false)
    await load()
  }

  const handleDeposit = async () => {
    if (!selected || txAmount <= 0) return
    setLoading(true)
    await window.api.bankAccounts.deposit({ accountId: selected.id, amount: txAmount, date: txDate, description: txDesc || 'واریز' })
    setTxAmount(0); setTxDesc(''); setDialog(null)
    setLoading(false)
    await refreshSelected(selected.id)
  }

  const handleWithdraw = async () => {
    if (!selected || txAmount <= 0) return
    setLoading(true)
    const r = await window.api.bankAccounts.withdraw({ accountId: selected.id, amount: txAmount, date: txDate, description: txDesc || 'برداشت' })
    if (!r.success) { alert(r.error); setLoading(false); return }
    setTxAmount(0); setTxDesc(''); setDialog(null)
    setLoading(false)
    await refreshSelected(selected.id)
  }

  const handleTransfer = async () => {
    if (!selected || !transferTo || txAmount <= 0 || selected.id === transferTo) return
    setLoading(true)
    const r = await window.api.bankAccounts.transfer({ fromId: selected.id, toId: transferTo, amount: txAmount, date: txDate, description: txDesc || 'انتقال' })
    if (!r.success) { alert(r.error); setLoading(false); return }
    setTxAmount(0); setTxDesc(''); setDialog(null)
    setLoading(false)
    await refreshSelected(selected.id)
  }

  return (
    <div className="h-full p-5 overflow-auto" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold" style={{ color: tPri }}>حساب‌های بانکی</h2>
        <button onClick={() => { setDialog('addBank'); setForm({ name: '', account_number: '', bank_name: '', branch: '', account_type: 'current', initial_balance: 0, iban: '', notes: '' }) }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)` }}>+ حساب جدید</button>
      </div>

      {/* Total Balance Card */}
      <div className="rounded-2xl p-4 border mb-4" style={{ backgroundColor: cBg, borderColor: cBorder }}>
        <div className="text-xs" style={{ color: tSec }}>مجموع موجودی حساب‌ها</div>
        <div className="text-2xl font-extrabold" style={{ color: SUC }}>{totalBalance.toLocaleString('fa-IR')} تومان</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Account List */}
        <div className="space-y-2">
          {accounts.filter(a => a.status !== 'inactive').map(a => (
            <div key={a.id} onClick={() => { setSelected(a); refreshSelected(a.id) }}
              className="rounded-xl p-3 cursor-pointer transition-all" style={{ backgroundColor: cBg, border: `1px solid ${selected?.id === a.id ? primary : cBorder}`, borderLeft: selected?.id === a.id ? `3px solid ${primary}` : `3px solid transparent` }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold" style={{ color: tPri }}>{a.name}</div>
                  <div className="text-[10px]" style={{ color: tSec }}>{a.bank_name || ''} {a.account_number ? `— ${a.account_number}` : ''}</div>
                </div>
                <div className="text-sm font-bold" style={{ color: SUC }}>{a.current_balance.toLocaleString('fa-IR')}</div>
              </div>
            </div>
          ))}
          {accounts.length === 0 && <div className="text-center py-8 text-sm" style={{ color: tSec }}>حسابی ثبت نشده</div>}
        </div>

        {/* Account Detail */}
        <div className="lg:col-span-2 space-y-3">
          {selected ? (<>
            <div className="rounded-xl p-4 border flex flex-wrap items-center justify-between gap-2" style={{ backgroundColor: cBg, borderColor: cBorder }}>
              <div>
                <div className="text-lg font-extrabold" style={{ color: tPri }}>{selected.name}</div>
                <div className="text-xs" style={{ color: tSec }}>{selected.bank_name || '—'} — {selected.account_number || '—'}</div>
                <div className="text-xs" style={{ color: tSec }}>IBAN: {selected.iban || '—'}</div>
              </div>
              <div className="text-xl font-extrabold" style={{ color: SUC }}>{selected.current_balance.toLocaleString('fa-IR')} تومان</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setDialog('deposit'); setTxAmount(0); setTxDesc(''); setTxDate(new Date().toISOString().slice(0, 10)) }} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${SUC}, #16a34a)` }}>واریز</button>
              <button onClick={() => { setDialog('withdraw'); setTxAmount(0); setTxDesc(''); setTxDate(new Date().toISOString().slice(0, 10)) }} className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${ERR}, #dc2626)` }}>برداشت</button>
              <button onClick={() => { setDialog('transfer'); setTxAmount(0); setTxDesc(''); setTransferTo(0); setTxDate(new Date().toISOString().slice(0, 10)) }} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: cBg, border: `1px solid ${cBorder}`, color: tPri }}>انتقال</button>
            </div>

            {/* Transaction History */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: cBorder }}>
              <div className="px-3 py-2 font-bold text-sm" style={{ backgroundColor: sBg, color: tPri }}>تاریخچه تراکنش‌ها</div>
              {transactions.length === 0 ? (
                <div className="text-center py-6 text-xs" style={{ color: tSec }}>تراکنشی ثبت نشده</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr style={{ backgroundColor: sBg }}>
                      <th className="px-3 py-2 text-right" style={{ color: tSec }}>تاریخ</th>
                      <th className="px-3 py-2 text-right" style={{ color: tSec }}>نوع</th>
                      <th className="px-3 py-2 text-right" style={{ color: tSec }}>مبلغ</th>
                      <th className="px-3 py-2 text-right" style={{ color: tSec }}>مانده</th>
                      <th className="px-3 py-2 text-right" style={{ color: tSec }}>شرح</th>
                    </tr></thead>
                    <tbody>
                      {transactions.map((t: any) => (
                        <tr key={t.id} style={{ borderTop: `1px solid ${cBorder}` }}>
                          <td className="px-3 py-2" style={{ color: tSec }}>{t.transactionDate}</td>
                          <td className="px-3 py-2"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: t.type === 'deposit' ? SUC + '15' : t.type === 'withdrawal' ? ERR + '15' : primary + '15', color: t.type === 'deposit' ? SUC : t.type === 'withdrawal' ? ERR : primary }}>{t.type === 'deposit' ? 'واریز' : t.type === 'withdrawal' ? 'برداشت' : 'انتقال'}</span></td>
                          <td className="px-3 py-2 font-bold" style={{ color: t.type === 'deposit' ? SUC : ERR }}>{t.amount.toLocaleString('fa-IR')}</td>
                          <td className="px-3 py-2 font-bold" style={{ color: tPri }}>{t.balanceAfter.toLocaleString('fa-IR')}</td>
                          <td className="px-3 py-2 text-xs" style={{ color: tSec }}>{t.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>) : (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: cBg, border: `1px solid ${cBorder}` }}>
              <div className="text-sm" style={{ color: tSec }}>حساب بانکی انتخاب کنید</div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Bank Dialog */}
      <Dialog open={dialog === 'addBank' || dialog === 'editBank'} onClose={() => setDialog(null)} title={dialog === 'addBank' ? 'حساب جدید' : 'ویرایش حساب'} maxWidth="max-w-md"
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setDialog(null)}>لغو</DialogButton>
          <DialogButton variant="primary" onClick={handleSave} disabled={loading || !form.name.trim()}>ذخیره</DialogButton>
        </>}>
        <DialogField label="نام حساب *"><DialogInput value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="مثال: بانک ملی" /></DialogField>
        <DialogField label="شماره حساب"><DialogInput value={form.account_number} onChange={v => setForm(f => ({ ...f, account_number: v }))} /></DialogField>
        <DialogField label="نام بانک"><DialogInput value={form.bank_name} onChange={v => setForm(f => ({ ...f, bank_name: v }))} /></DialogField>
        <DialogField label="شعبه"><DialogInput value={form.branch} onChange={v => setForm(f => ({ ...f, branch: v }))} /></DialogField>
        <DialogField label="IBAN"><DialogInput value={form.iban} onChange={v => setForm(f => ({ ...f, iban: v }))} /></DialogField>
        {dialog === 'addBank' && <DialogField label="موجودی اولیه"><FormattedPriceInput value={form.initial_balance} onChange={v => setForm(f => ({ ...f, initial_balance: v }))} className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none" style={inStyle} /></DialogField>}
        <DialogField label="توضیحات"><DialogInput value={form.notes} onChange={v => setForm(f => ({ ...f, notes: v }))} /></DialogField>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={dialog === 'deposit'} onClose={() => setDialog(null)} title={`واریز به ${selected?.name || ''}`} maxWidth="max-w-sm"
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setDialog(null)}>لغو</DialogButton>
          <DialogButton variant="success" onClick={handleDeposit} disabled={loading || txAmount <= 0}>واریز</DialogButton>
        </>}>
        <DialogField label="مبلغ واریز *"><FormattedPriceInput value={txAmount} onChange={v => setTxAmount(v)} className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none" style={inStyle} /></DialogField>
        <DialogField label="تاریخ"><ShamsiDateInput value={txDate} onChange={v => setTxDate(v)} /></DialogField>
        <DialogField label="توضیحات"><DialogInput value={txDesc} onChange={setTxDesc} placeholder="اختیاری" /></DialogField>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={dialog === 'withdraw'} onClose={() => setDialog(null)} title={`برداشت از ${selected?.name || ''}`} maxWidth="max-w-sm"
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="7 17 17 7"/><path d="M7 7h10v10"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setDialog(null)}>لغو</DialogButton>
          <DialogButton variant="danger" onClick={handleWithdraw} disabled={loading || txAmount <= 0}>برداشت</DialogButton>
        </>}>
        <DialogField label="مبلغ برداشت *"><FormattedPriceInput value={txAmount} onChange={v => setTxAmount(v)} className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none" style={inStyle} /></DialogField>
        <DialogField label="تاریخ"><ShamsiDateInput value={txDate} onChange={v => setTxDate(v)} /></DialogField>
        <DialogField label="توضیحات"><DialogInput value={txDesc} onChange={setTxDesc} placeholder="اختیاری" /></DialogField>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={dialog === 'transfer'} onClose={() => setDialog(null)} title={`انتقال از ${selected?.name || ''}`} maxWidth="max-w-sm"
        icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
        footer={<>
          <DialogButton variant="ghost" onClick={() => setDialog(null)}>لغو</DialogButton>
          <DialogButton variant="primary" onClick={handleTransfer} disabled={loading || txAmount <= 0 || !transferTo}>انتقال</DialogButton>
        </>}>
        <DialogField label="حساب مقصد *">
          <select value={transferTo} onChange={e => setTransferTo(Number(e.target.value))} className="input-field text-sm w-full" style={inStyle}>
            <option value={0}>انتخاب کنید</option>
            {accounts.filter(a => a.id !== selected?.id && a.status !== 'inactive').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </DialogField>
        <DialogField label="مبلغ انتقال *"><FormattedPriceInput value={txAmount} onChange={v => setTxAmount(v)} className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none" style={inStyle} /></DialogField>
        <DialogField label="تاریخ"><ShamsiDateInput value={txDate} onChange={v => setTxDate(v)} /></DialogField>
        <DialogField label="توضیحات"><DialogInput value={txDesc} onChange={setTxDesc} placeholder="اختیاری" /></DialogField>
      </Dialog>
    </div>
  )
}
