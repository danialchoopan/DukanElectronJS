/**
 * CustomerCreditView — credit management, blocking, and scoring.
 *
 * Features:
 *   - Credit limit per customer
 *   - Block/unblock with reason and type tracking
 *   - Credit score visualization
 *   - Credit history audit trail
 *   - Real-time credit check before sales
 *   - Blocked customers dashboard
 *   - Unblock request workflow
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useAuthStore } from '../store/authStore'
import { formatPriceFA } from '../utils/jalali'
import Dialog, { DialogButton } from '../components/ui/Dialog'

const BLOCK_TYPES = { credit: 'حد اعتبار', fraud: 'تقلب', inactive: 'غیرفعال', other: 'سایر' }
const SCORE_COLORS = (score: number) => score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'

export default function CustomerCreditView() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const user = useAuthStore(s => s.user)
  const [credits, setCredits] = useState<any[]>([])
  const [blocked, setBlocked] = useState<any[]>([])
  const [unblockRequests, setUnblockRequests] = useState<any[]>([])
  const [showBlock, setShowBlock] = useState<any>(null)
  const [showLimit, setShowLimit] = useState<any>(null)
  const [showHistory, setShowHistory] = useState<any>(null)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [blockForm, setBlockForm] = useState({ blockType: 'credit', reason: '' })
  const [limitValue, setLimitValue] = useState('')

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputStyle = { backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: tPri }

  const load = async () => {
    const [cRes, bRes, uRes] = await Promise.all([
      window.api.credit.getAll(), window.api.credit.getBlocked(),
      window.api.credit.getUnblockRequests(),
    ])
    if (cRes.success && cRes.data) setCredits(cRes.data)
    if (bRes.success && bRes.data) setBlocked(bRes.data)
    if (uRes.success && uRes.data) setUnblockRequests(uRes.data)
  }
  useEffect(() => { load() }, [])

  const handleBlock = async () => {
    if (!showBlock || !blockForm.reason) return
    await window.api.credit.block(showBlock.customerId, blockForm.blockType, blockForm.reason, user?.name || 'admin')
    setShowBlock(null); setBlockForm({ blockType: 'credit', reason: '' })
    await load()
  }

  const handleUnblock = async (customerId: number) => {
    await window.api.credit.unblock(customerId, 'تأیید شده', user?.name || 'admin')
    await load()
  }

  const handleSetLimit = async () => {
    if (!showLimit) return
    await window.api.credit.setLimit(showLimit.customerId, Number(limitValue), user?.name || 'admin')
    setShowLimit(null); setLimitValue('')
    await load()
  }

  const handleShowHistory = async (customerId: number) => {
    const r = await window.api.credit.getHistory(customerId)
    if (r.success && r.data) { setShowHistory(true); setHistoryData(r.data) }
  }

  const totalBlocked = blocked.length
  const totalUnblockRequests = unblockRequests.length
  const avgScore = credits.length > 0 ? Math.round(credits.reduce((s, c) => s + c.creditScore, 0) / credits.length) : 0

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'کل مشتریان اعتباری', value: credits.length, color: '#3b82f6' },
          { label: 'مسدود شده', value: totalBlocked, color: '#ef4444' },
          { label: 'درخواست رفع مسدودی', value: totalUnblockRequests, color: '#f59e0b' },
          { label: 'میانگین امتیاز', value: `${avgScore}/100`, color: SCORE_COLORS(avgScore) },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Unblock Requests */}
      {unblockRequests.length > 0 && (
        <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <h3 className="text-xs font-bold mb-2" style={{ color: '#f59e0b' }}>درخواست‌های رفع مسدودی ({unblockRequests.length})</h3>
          {unblockRequests.map(c => (
            <div key={c.customerId} className="flex items-center gap-2 py-1 text-xs">
              <span className="font-bold" style={{ color: tPri }}>{c.customerName}</span>
              <span style={{ color: tSec }}>({c.unblockNote})</span>
              <button onClick={() => handleUnblock(c.customerId)} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff' }}>تأیید رفع مسدودی</button>
            </div>
          ))}
        </div>
      )}

      {/* Credits Table */}
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: cardBorder }}>
        <table className="w-full text-xs">
          <thead><tr style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
            <th className="px-3 py-2 text-right" style={{ color: tSec }}>مشتری</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>حد اعتبار</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>بدهی فعلی</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>امتیاز</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>وضعیت</th>
            <th className="px-3 py-2 text-center" style={{ color: tSec }}>عملیات</th>
          </tr></thead>
          <tbody>
            {credits.map(c => (
              <tr key={c.customerId} style={{ borderTop: `1px solid ${cardBorder}` }}>
                <td className="px-3 py-2 font-bold" style={{ color: tPri }}>{c.customerName || '-'}</td>
                <td className="px-3 py-2 text-center font-mono" style={{ color: tPri }}>{c.creditLimit > 0 ? formatPriceFA(c.creditLimit) : '∞'}</td>
                <td className="px-3 py-2 text-center font-mono" style={{ color: c.currentDebt > 0 ? '#ef4444' : '#22c55e' }}>{formatPriceFA(c.currentDebt)}</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-12 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }}>
                      <div className="h-full rounded-full" style={{ width: `${c.creditScore}%`, backgroundColor: SCORE_COLORS(c.creditScore) }} />
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: SCORE_COLORS(c.creditScore) }}>{c.creditScore}</span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  {c.isBlocked ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>مسدود ({c.blockType})</span>
                    : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>فعال</span>}
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex gap-1 justify-center">
                    <button onClick={() => { setShowLimit(c); setLimitValue(String(c.creditLimit)) }} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>حد</button>
                    {!c.isBlocked && <button onClick={() => setShowBlock(c)} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>مسدود</button>}
                    {c.isBlocked && <button onClick={() => handleUnblock(c.customerId)} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>رفع</button>}
                    <button onClick={() => handleShowHistory(c.customerId)} className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(148,163,184,0.15)', color: tSec }}>تاریخچه</button>
                  </div>
                </td>
              </tr>
            ))}
            {credits.length === 0 && <tr><td colSpan={6} className="text-center py-4" style={{ color: tSec }}>هنوز مشتری اعتباری ثبت نشده</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Block Dialog */}
      {showBlock && (
        <Dialog open={true} onClose={() => { setShowBlock(null); setBlockForm({ blockType: 'credit', reason: '' }) }}
          title={`مسدود کردن: ${showBlock.customerName}`} maxWidth="max-w-sm"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowBlock(null); setBlockForm({ blockType: 'credit', reason: '' }) }}>لغو</DialogButton>
            <DialogButton variant="danger" onClick={handleBlock}>مسدود کردن</DialogButton>
          </>}>
          <div className="space-y-3">
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>نوع مسدودی</label>
              <select value={blockForm.blockType} onChange={(e) => setBlockForm({ ...blockForm, blockType: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                {Object.entries(BLOCK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>دلیل *</label>
              <textarea value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} className="input-field text-sm w-full" rows={2} style={inputStyle} /></div>
          </div>
        </Dialog>
      )}

      {/* Set Limit Dialog */}
      {showLimit && (
        <Dialog open={true} onClose={() => { setShowLimit(null); setLimitValue('') }}
          title={`حد اعتبار: ${showLimit.customerName}`} maxWidth="max-w-xs"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowLimit(null); setLimitValue('') }}>لغو</DialogButton>
            <DialogButton variant="primary" onClick={handleSetLimit}>ذخیره</DialogButton>
          </>}>
          <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>حد اعتبار (تومان)</label>
            <input type="number" value={limitValue} onChange={(e) => setLimitValue(e.target.value)} className="input-field text-sm w-full" style={inputStyle} placeholder="0 = بدون محدودیت" /></div>
        </Dialog>
      )}

      {/* History Dialog */}
      {showHistory && (
        <Dialog open={true} onClose={() => { setShowHistory(false); setHistoryData([]) }}
          title="تاریخچه اعتبار" maxWidth="max-w-md"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          footer={<DialogButton variant="ghost" onClick={() => { setShowHistory(false); setHistoryData([]) }}>بستن</DialogButton>}>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {historyData.map(h => (
              <div key={h.id} className="flex justify-between text-xs py-1" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <span style={{ color: tPri }}>{h.action === 'block' ? 'مسدودی' : h.action === 'unblock' ? 'رفع مسدودی' : h.action === 'limit_change' ? 'تغییر حد' : h.action}</span>
                <span style={{ color: tSec }}>{h.reason || h.performedBy}</span>
                <span style={{ color: tSec }}>{h.createdAt?.slice(0, 16)}</span>
              </div>
            ))}
            {historyData.length === 0 && <p className="text-center py-4" style={{ color: tSec }}>تاریخچه‌ای وجود ندارد</p>}
          </div>
        </Dialog>
      )}
    </div>
  )
}
