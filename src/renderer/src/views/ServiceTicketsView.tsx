/**
 * ServiceTicketsView — warranty claims and repair service management.
 *
 * Workflow: received → diagnosing → awaiting_parts → in_repair → completed → returned
 * Features:
 *   - Create service ticket with customer/product/serial number
 *   - Status workflow with history tracking
 *   - Parts management per ticket
 *   - Cost tracking (parts + labor + shipping)
 *   - Warranty tracking with expiry alerts
 *   - Technician assignment
 *   - Service report KPIs
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { formatPriceFA, formatPriceComma } from '../utils/jalali'
import ShamsiDateInput from '../components/business/ShamsiDateInput'
import Dialog, { DialogButton } from '../components/ui/Dialog'

const STATUS_COLORS: Record<string, string> = { received: '#3b82f6', diagnosing: '#f59e0b', awaiting_parts: '#a855f7', in_repair: '#06b6d4', completed: '#22c55e', returned: '#14b8a6', cancelled: '#94a3b8' }
const STATUS_LABELS: Record<string, string> = { received: 'دریافت شده', diagnosing: 'در حال بررسی', awaiting_parts: 'انتظار قطعه', in_repair: 'در حال تعمیر', completed: 'تکمیل', returned: 'برگشت داده شده', cancelled: 'لغو شده' }
const PRIORITY_COLORS: Record<string, string> = { low: '#94a3b8', normal: '#3b82f6', high: '#f59e0b', urgent: '#ef4444' }

export default function ServiceTicketsView() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const user = useAuthStore(s => s.user)
  const [tickets, setTickets] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState<any>(null)
  const [detailData, setDetailData] = useState<any>(null)
  const [report, setReport] = useState<any>(null)
  const [createForm, setCreateForm] = useState({ customerId: '', productId: '', serialNumber: '', priority: 'normal', problemDescription: '', technician: '', estimatedCompletion: '', warrantyClaim: false, warrantyStartDate: '', warrantyEndDate: '' })

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputStyle = { backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: tPri }

  const load = async () => {
    const [tRes, cRes, pRes, rRes] = await Promise.all([
      window.api.service.getAll(filter || undefined),
      window.api.customers.getAll(),
      window.api.products.getAll(),
      window.api.service.getReport(),
    ])
    if (tRes.success && tRes.data) setTickets(tRes.data)
    if (cRes.success && cRes.data) setCustomers(cRes.data)
    if (pRes.success && pRes.data) setAllProducts(pRes.data)
    if (rRes.success && rRes.data) setReport(rRes.data)
  }
  useEffect(() => { load() }, [filter])

  const loadDetail = async (id: number) => {
    const r = await window.api.service.getById(id)
    if (r.success && r.data) { setShowDetail(r.data); setDetailData(r.data) }
  }

  const handleCreate = async () => {
    if (!createForm.problemDescription) return
    await window.api.service.create({
      customerId: createForm.customerId ? Number(createForm.customerId) : undefined,
      productId: createForm.productId ? Number(createForm.productId) : undefined,
      serialNumber: createForm.serialNumber, priority: createForm.priority,
      problemDescription: createForm.problemDescription, technician: createForm.technician,
      estimatedCompletion: createForm.estimatedCompletion, warrantyClaim: createForm.warrantyClaim,
      warrantyStartDate: createForm.warrantyStartDate, warrantyEndDate: createForm.warrantyEndDate,
      userId: user?.id || 1,
    })
    setShowCreate(false)
    setCreateForm({ customerId: '', productId: '', serialNumber: '', priority: 'normal', problemDescription: '', technician: '', estimatedCompletion: '', warrantyClaim: false, warrantyStartDate: '', warrantyEndDate: '' })
    await load()
  }

  const handleStatusChange = async (id: number, newStatus: string) => {
    await window.api.service.updateStatus(id, newStatus, '', user?.name || 'admin')
    if (detailData && detailData.id === id) await loadDetail(id)
    await load()
  }

  const nextStatuses: Record<string, string[]> = {
    received: ['diagnosing', 'cancelled'], diagnosing: ['awaiting_parts', 'in_repair', 'cancelled'],
    awaiting_parts: ['in_repair', 'cancelled'], in_repair: ['completed', 'cancelled'],
    completed: ['returned'], returned: [], cancelled: [],
  }

  if (tickets.length === 0 && !showCreate) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end"><button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>+ تیکت جدید</button></div>
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke={tSec} strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          <p className="text-sm font-bold" style={{ color: tSec }}>تیکت خدماتی وجود ندارد</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Report KPIs */}
      {report && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'کل تیکت‌ها', value: report.total, color: '#3b82f6' },
            { label: 'باز', value: report.open, color: '#f59e0b' },
            { label: 'تکمیل شده', value: report.completed, color: '#22c55e' },
            { label: 'هزینه کل', value: formatPriceFA(report.totalCost), color: '#ef4444' },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
              <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {[['', 'همه'], ['received', 'دریافت شده'], ['diagnosing', 'بررسی'], ['in_repair', 'تعمیر'], ['completed', 'تکمیل'], ['cancelled', 'لغو']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: filter === key ? '#006194' : cardBg, color: filter === key ? '#fff' : tSec, border: `1px solid ${filter === key ? '#006194' : cardBorder}` }}>{label}</button>
        ))}
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>+ تیکت جدید</button>
      </div>

      {/* Tickets List */}
      <div className="space-y-2">
        {tickets.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:opacity-90"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={() => loadDetail(t.id)}>
            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[t.priority] }} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: tPri }}>{t.ticketNumber}</div>
              <div className="text-[10px] truncate" style={{ color: tSec }}>{t.customerName || 'بدون مشتری'} | {t.productTitle || t.problemDescription.slice(0, 40)}</div>
            </div>
            {t.warrantyClaim && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>گارانتی</span>}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status] }}>{STATUS_LABELS[t.status]}</span>
          </div>
        ))}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <Dialog open={true} onClose={() => setShowCreate(false)} title="تیکت خدمات جدید" maxWidth="max-w-lg"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => setShowCreate(false)}>لغو</DialogButton>
            <DialogButton variant="primary" onClick={handleCreate} disabled={!createForm.problemDescription}>ایجاد</DialogButton>
          </>}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>مشتری</label>
                <select value={createForm.customerId} onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                  <option value="">انتخاب...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>کالا</label>
                <select value={createForm.productId} onChange={(e) => setCreateForm({ ...createForm, productId: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                  <option value="">انتخاب...</option>{allProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>شماره سریال</label><input value={createForm.serialNumber} onChange={(e) => setCreateForm({ ...createForm, serialNumber: e.target.value })} className="input-field text-sm w-full" style={inputStyle} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>اولویت</label>
                <select value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                  <option value="low">کم</option><option value="normal">عادی</option><option value="high">زیاد</option><option value="urgent">فوری</option>
                </select></div>
            </div>
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>توضیح مشکل *</label>
              <textarea value={createForm.problemDescription} onChange={(e) => setCreateForm({ ...createForm, problemDescription: e.target.value })} className="input-field text-sm w-full" rows={3} style={inputStyle} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>تکنسین</label><input value={createForm.technician} onChange={(e) => setCreateForm({ ...createForm, technician: e.target.value })} className="input-field text-sm w-full" style={inputStyle} /></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>تاریخ تقریبی تکمیل</label><ShamsiDateInput value={createForm.estimatedCompletion} onChange={(v) => setCreateForm({ ...createForm, estimatedCompletion: v })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={createForm.warrantyClaim} onChange={(e) => setCreateForm({ ...createForm, warrantyClaim: e.target.checked })} style={{ accentColor: '#3b82f6' }} />
              <label className="text-xs font-bold" style={{ color: tSec }}>ادعای گارانتی</label>
            </div>
            {createForm.warrantyClaim && (
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>شروع گارانتی</label><ShamsiDateInput value={createForm.warrantyStartDate} onChange={(v) => setCreateForm({ ...createForm, warrantyStartDate: v })} /></div>
                <div><label className="text-[10px] font-bold block mb-1" style={{ color: tSec }}>پایان گارانتی</label><ShamsiDateInput value={createForm.warrantyEndDate} onChange={(v) => setCreateForm({ ...createForm, warrantyEndDate: v })} /></div>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Detail Dialog */}
      {showDetail && detailData && (
        <Dialog open={true} onClose={() => { setShowDetail(null); setDetailData(null) }} title={detailData.ticketNumber} maxWidth="max-w-lg"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>}
          footer={<DialogButton variant="ghost" onClick={() => { setShowDetail(null); setDetailData(null) }}>بستن</DialogButton>}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>مشتری</div><div className="font-bold" style={{ color: tPri }}>{detailData.customerName || '-'}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>وضعیت</div><div className="font-bold" style={{ color: STATUS_COLORS[detailData.status] }}>{STATUS_LABELS[detailData.status]}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>تکنسین</div><div className="font-bold" style={{ color: tPri }}>{detailData.technician || '-'}</div></div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}><div style={{ color: tSec }}>هزینه کل</div><div className="font-bold" style={{ color: '#ef4444' }}>{formatPriceFA(detailData.totalCost)}</div></div>
            </div>
            {/* Status Actions */}
            {(nextStatuses[detailData.status] || []).length > 0 && (
              <div className="flex gap-2">
                {nextStatuses[detailData.status].map(s => (
                  <button key={s} onClick={() => handleStatusChange(detailData.id, s)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
                    style={{ background: s === 'cancelled' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
            {/* Parts */}
            {(detailData.parts || []).length > 0 && (
              <div><h4 className="text-xs font-bold mb-1" style={{ color: tPri }}>قطعات</h4>
                {detailData.parts.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-xs py-1" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <span style={{ color: tPri }}>{p.partName} × {p.quantity}</span>
                    <span style={{ color: '#ef4444' }}>{formatPriceComma(p.quantity * p.unitCost)}</span>
                  </div>
                ))}
              </div>
            )}
            {/* History */}
            {(detailData.history || []).length > 0 && (
              <div><h4 className="text-xs font-bold mb-1" style={{ color: tPri }}>تاریخچه</h4>
                {detailData.history.map((h: any) => (
                  <div key={h.id} className="flex justify-between text-xs py-1" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                    <span style={{ color: tSec }}>{h.changedBy}</span>
                    <span style={{ color: tPri }}>{STATUS_LABELS[h.fromStatus] || '-'} → {STATUS_LABELS[h.toStatus]}</span>
                    <span style={{ color: tSec }}>{h.note || ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Dialog>
      )}
    </div>
  )
}
