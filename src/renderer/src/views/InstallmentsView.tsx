/**
 * InstallmentsView — installment sales management and payment tracking.
 *
 * Features:
 *   - Create installment plan with down payment
 *   - Payment schedule display with status badges
 *   - Record payments against installments
 *   - Overdue tracking with penalty calculation
 *   - Status: active, completed, overdue, cancelled
 *   - Shamsi calendar integration for due dates
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { formatPriceFA, formatISOToJalali } from '../utils/jalali'
import Dialog, { DialogButton } from '../components/ui/Dialog'

const STATUS_COLORS: Record<string, string> = { active: '#22c55e', completed: '#3b82f6', overdue: '#ef4444', cancelled: '#94a3b8', pending: '#f59e0b', paid: '#22c55e', partial: '#a855f7' }
const STATUS_LABELS: Record<string, string> = { active: 'فعال', completed: 'تکمیل', overdue: 'سررسید گذشته', cancelled: 'لغو شده', pending: 'پرداخت نشده', paid: 'پرداخت شده', partial: 'پرداخت جزئی' }

export default function InstallmentsView() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const user = useAuthStore(s => s.user)
  const [installments, setInstallments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<any>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [showPay, setShowPay] = useState<{ installmentPaymentId: number; maxAmount: number } | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [createForm, setCreateForm] = useState({ customerId: '', totalAmount: 0, downPayment: 0, installmentCount: 2, penaltyPercent: 0, notes: '' })

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputStyle = { backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: tPri }

  const load = async () => {
    const [instRes, custRes] = await Promise.all([window.api.installments.getAll(), window.api.customers.getAll()])
    if (instRes.success && instRes.data) setInstallments(instRes.data)
    if (custRes.success && custRes.data) setCustomers(custRes.data)
  }
  useEffect(() => { load() }, [])

  const loadDetail = async (id: number) => {
    const r = await window.api.installments.getById(id)
    if (r.success && r.data) { setShowDetail(r.data); setDetailData(r.data) }
  }

  const handleCreate = async () => {
    if (!createForm.customerId || createForm.totalAmount <= 0) return
    await window.api.installments.create({
      customerId: Number(createForm.customerId), totalAmount: createForm.totalAmount,
      downPayment: createForm.downPayment, installmentCount: createForm.installmentCount,
      penaltyPercent: createForm.penaltyPercent, notes: createForm.notes, createdBy: user?.name || 'admin',
    })
    setShowCreate(false)
    setCreateForm({ customerId: '', totalAmount: 0, downPayment: 0, installmentCount: 2, penaltyPercent: 0, notes: '' })
    await load()
  }

  const handlePay = async () => {
    if (!showPay || !payAmount) return
    await window.api.installments.pay({ installmentPaymentId: showPay.installmentPaymentId, amount: Number(payAmount) })
    setShowPay(null); setPayAmount('')
    if (showDetail) await loadDetail(showDetail.id)
    await load()
  }

  const activeCount = installments.filter(i => i.status === 'active').length
  const overdueCount = installments.filter(i => i.status === 'overdue').length

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'کل اقساط', value: installments.length, color: '#3b82f6' },
          { label: 'فعال', value: activeCount, color: '#22c55e' },
          { label: 'سررسید گذشته', value: overdueCount, color: '#ef4444' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>+ قسط جدید</button>
      </div>

      {/* Installments List */}
      <div className="space-y-2">
        {installments.map(inst => (
          <div key={inst.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:opacity-90"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            onClick={() => loadDetail(inst.id)}>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: tPri }}>{inst.installmentNumber}</div>
              <div className="text-[10px]" style={{ color: tSec }}>{inst.customerName || 'نامشخص'} | {inst.installmentCount} قسط</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold" style={{ color: tPri }}>{formatPriceFA(inst.totalAmount)}</div>
              <div className="text-[10px]" style={{ color: tSec }}>{formatPriceFA(inst.monthlyAmount)}/ماه</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLORS[inst.status]}20`, color: STATUS_COLORS[inst.status] }}>
              {STATUS_LABELS[inst.status]}
            </span>
          </div>
        ))}
        {installments.length === 0 && <p className="text-sm text-center py-8" style={{ color: tSec }}>هنوز قسطی ثبت نشده</p>}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <Dialog open={true} onClose={() => setShowCreate(false)} title="ثبت قسط جدید" maxWidth="max-w-md"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => setShowCreate(false)}>لغو</DialogButton>
            <DialogButton variant="primary" onClick={handleCreate}>ثبت</DialogButton>
          </>}>
          <div className="space-y-3">
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>مشتری</label>
              <select value={createForm.customerId} onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                <option value="">انتخاب مشتری...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>مبلغ کل</label><input type="number" value={createForm.totalAmount || ''} onChange={(e) => setCreateForm({ ...createForm, totalAmount: Number(e.target.value) })} className="input-field text-sm w-full" style={inputStyle} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>پیش‌پرداخت</label><input type="number" value={createForm.downPayment || ''} onChange={(e) => setCreateForm({ ...createForm, downPayment: Number(e.target.value) })} className="input-field text-sm w-full" style={inputStyle} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>تعداد اقساط</label>
                <select value={createForm.installmentCount} onChange={(e) => setCreateForm({ ...createForm, installmentCount: Number(e.target.value) })} className="input-field text-sm w-full" style={inputStyle}>
                  {[2, 3, 4, 6, 12].map(n => <option key={n} value={n}>{n} قسط</option>)}
                </select></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>جریمه (% ماهانه)</label><input type="number" value={createForm.penaltyPercent || ''} onChange={(e) => setCreateForm({ ...createForm, penaltyPercent: Number(e.target.value) })} className="input-field text-sm w-full" style={inputStyle} placeholder="0" /></div>
            </div>
            {createForm.totalAmount > 0 && createForm.installmentCount > 0 && (
              <div className="p-2 rounded-lg text-xs" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: tSec }}>
                هر قسط: <span className="font-bold" style={{ color: tPri }}>{formatPriceFA(Math.ceil((createForm.totalAmount - createForm.downPayment) / createForm.installmentCount))}</span>
                {createForm.downPayment > 0 && <> | پیش‌پرداخت: <span className="font-bold" style={{ color: tPri }}>{formatPriceFA(createForm.downPayment)}</span></>}
              </div>
            )}
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>یادداشت</label><input value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} className="input-field text-sm w-full" style={inputStyle} /></div>
          </div>
        </Dialog>
      )}

      {/* Detail Dialog */}
      {showDetail && detailData && (
        <Dialog open={true} onClose={() => { setShowDetail(null); setDetailData(null) }} title={detailData.installmentNumber} maxWidth="max-w-lg"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
          footer={<DialogButton variant="ghost" onClick={() => { setShowDetail(null); setDetailData(null) }}>بستن</DialogButton>}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>مشتری</div><div className="font-bold" style={{ color: tPri }}>{detailData.customerName || 'نامشخص'}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>مبلغ کل</div><div className="font-bold" style={{ color: tPri }}>{formatPriceFA(detailData.totalAmount)}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>پیش‌پرداخت</div><div className="font-bold" style={{ color: tPri }}>{formatPriceFA(detailData.downPayment)}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>مبلغ هر قسط</div><div className="font-bold" style={{ color: tPri }}>{formatPriceFA(detailData.monthlyAmount)}</div></div>
            </div>
            <h4 className="text-xs font-bold" style={{ color: tPri }}>برنامه پرداخت</h4>
            <div className="space-y-1">
              {(detailData.payments || []).map((p: any) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg text-xs" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                  <span className="font-bold w-6 text-center" style={{ color: tPri }}>#{p.installmentNumber}</span>
                  <span className="flex-1" style={{ color: tPri }}>{formatPriceFA(p.amount)}</span>
                  <span style={{ color: tSec }}>{formatISOToJalali(p.dueDate)}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLORS[p.status]}20`, color: STATUS_COLORS[p.status] }}>{STATUS_LABELS[p.status]}</span>
                  {p.status !== 'paid' && <button onClick={() => setShowPay({ installmentPaymentId: p.id, maxAmount: p.amount })} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}>پرداخت</button>}
                </div>
              ))}
            </div>
          </div>
        </Dialog>
      )}

      {/* Pay Dialog */}
      {showPay && (
        <Dialog open={true} onClose={() => { setShowPay(null); setPayAmount('') }} title="ثبت پرداخت" maxWidth="max-w-xs"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><circle cx="18" cy="16" r="2"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowPay(null); setPayAmount('') }}>لغو</DialogButton>
            <DialogButton variant="success" onClick={handlePay}>ثبت پرداخت</DialogButton>
          </>}>
          <div className="space-y-3">
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>مبلغ پرداخت (حداکثر: {formatPriceFA(showPay.maxAmount)})</label>
              <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input-field text-sm w-full" style={inputStyle} max={showPay.maxAmount} /></div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
