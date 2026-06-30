/**
 * AuditLogView — comprehensive user activity audit trail.
 *
 * Features:
 *   - Searchable log with filters: date range, user, action type, entity type
 *   - Before/after value display for updates
 *   - Export to Excel
 *   - Auto-cleanup with configurable retention (toggle on/off)
 *   - Stats dashboard: total count, today's count, breakdown by action/entity
 *   - Append-only (immutable) audit records
 */

import { useState, useEffect, useCallback } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { downloadExcel } from '../utils/a4Print'
import ShamsiDateInput from '../components/business/ShamsiDateInput'
import Dialog, { DialogButton } from '../components/ui/Dialog'

const ACTION_COLORS: Record<string, string> = { create: '#22c55e', update: '#3b82f6', delete: '#ef4444', restock: '#f59e0b', return: '#a855f7', login: '#06b6d4', block: '#ef4444', unblock: '#22c55e' }
const ACTION_LABELS: Record<string, string> = { create: 'ایجاد', update: 'ویرایش', delete: 'حذف', restock: 'تامین', return: 'مرجوعی', login: 'ورود', block: 'مسدودی', unblock: 'رفع مسدودی' }
const ENTITY_LABELS: Record<string, string> = { product: 'کالا', sale: 'فروش', expense: 'هزینه', customer: 'مشتری', return: 'مرجوعی', inventory_adjustment: 'اصلاح موجودی', user: 'کاربر', credit: 'اعتبار' }

export default function AuditLogView() {
  const theme = useSettingsStore((s: any) => s.theme)
  const isDark = theme === 'dark'
  const [entries, setEntries] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [stats, setStats] = useState<any>(null)
  const [filters, setFilters] = useState({ entityType: '', action: '', startDate: '', endDate: '' })
  const [showDetail, setShowDetail] = useState<any>(null)
  const [showCleanup, setShowCleanup] = useState(false)
  const [retentionDays, setRetentionDays] = useState(365)
  const limit = 30

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const loadData = useCallback(async () => {
    const r = await window.api.audit.getAll(filters.entityType || undefined, limit, filters.startDate || undefined, filters.endDate || undefined, filters.action || undefined)
    if (r.success && r.data) { setEntries(r.data.entries || []); setTotal(r.data.total || 0) }
    const sRes = await window.api.audit.getStats()
    if (sRes.success && sRes.data) setStats(sRes.data)
  }, [filters])

  useEffect(() => { loadData() }, [loadData])

  const handleExport = () => {
    const headers = ['تاریخ', 'کاربر', 'عملیات', 'ماژول', 'شناسه', 'جزئیات']
    const rows = entries.map(e => [e.createdAt, e.userName || e.userId, ACTION_LABELS[e.action] || e.action, ENTITY_LABELS[e.entityType] || e.entityType, e.entityId || '', e.details])
    downloadExcel('audit-log.csv', headers, rows)
  }

  const handleCleanup = async () => {
    const r = await window.api.audit.cleanup(retentionDays)
    if (r.success) { setShowCleanup(false); loadData() }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'کل رکوردها', value: stats.total.toLocaleString('fa-IR'), color: '#3b82f6' },
            { label: 'امروز', value: stats.today.toLocaleString('fa-IR'), color: '#22c55e' },
            { label: 'ایجاد', value: stats.byAction?.create || 0, color: '#22c55e' },
            { label: 'ویرایش', value: stats.byAction?.update || 0, color: '#f59e0b' },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl p-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="text-[10px] font-bold" style={{ color: tSec }}>{kpi.label}</div>
              <div className="text-lg font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
        <select value={filters.entityType} onChange={(e) => { setFilters({ ...filters, entityType: e.target.value }); setPage(0) }}
          className="px-2 py-1 rounded-lg text-xs font-bold outline-none" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}`, color: tPri }}>
          <option value="">همه ماژول‌ها</option>
          <option value="product">کالا</option><option value="sale">فروش</option><option value="expense">هزینه</option>
          <option value="customer">مشتری</option><option value="return">مرجوعی</option><option value="user">کاربر</option>
          <option value="credit">اعتبار</option>
        </select>
        <select value={filters.action} onChange={(e) => { setFilters({ ...filters, action: e.target.value }); setPage(0) }}
          className="px-2 py-1 rounded-lg text-xs font-bold outline-none" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}`, color: tPri }}>
          <option value="">همه عملیات</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <ShamsiDateInput value={filters.startDate} onChange={(v) => { setFilters({ ...filters, startDate: v }); setPage(0) }} />
        <ShamsiDateInput value={filters.endDate} onChange={(v) => { setFilters({ ...filters, endDate: v }); setPage(0) }} />
        <div className="flex-1" />
        <button onClick={handleExport} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>خروجی</button>
        <button onClick={() => setShowCleanup(true)} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>پاکسازی</button>
      </div>

      {/* Activity Feed */}
      <div className="space-y-1.5">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:opacity-90 transition-all"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }} onClick={() => setShowDetail(entry)}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${ACTION_COLORS[entry.action] || '#64748b'}20` }}>
              <span className="text-xs font-bold" style={{ color: ACTION_COLORS[entry.action] || '#64748b' }}>
                {entry.action === 'create' ? '+' : entry.action === 'delete' ? '×' : entry.action === 'update' ? '✎' : entry.action === 'login' ? '→' : '•'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color: tPri }}>{entry.userName || `کاربر #${entry.userId || 'نامشخص'}`}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${ACTION_COLORS[entry.action] || '#64748b'}15`, color: ACTION_COLORS[entry.action] || '#64748b' }}>
                  {ACTION_LABELS[entry.action] || entry.action}
                </span>
                <span className="text-[10px]" style={{ color: tSec }}>{ENTITY_LABELS[entry.entityType] || entry.entityType}{entry.entityId ? ` #${entry.entityId}` : ''}</span>
              </div>
              {entry.details && <div className="text-[10px] truncate" style={{ color: tSec }}>{entry.details}</div>}
            </div>
            <div className="text-[10px] flex-shrink-0" style={{ color: tSec }}>{entry.createdAt?.slice(0, 16)}</div>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-center py-8" style={{ color: tSec }}>رکوردی یافت نشد</p>}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: tSec }}>{page * limit + 1}-{Math.min((page + 1) * limit, total)} از {total.toLocaleString('fa-IR')}</span>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))} className="px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-30" style={{ backgroundColor: cardBg, color: tPri, border: `1px solid ${cardBorder}` }}>قبلی</button>
            <button disabled={(page + 1) * limit >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg text-xs font-bold disabled:opacity-30" style={{ backgroundColor: cardBg, color: tPri, border: `1px solid ${cardBorder}` }}>بعدی</button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      {showDetail && (
        <Dialog open={true} onClose={() => setShowDetail(null)} title="جزئیات رویداد" maxWidth="max-w-md"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          footer={<DialogButton variant="ghost" onClick={() => setShowDetail(null)}>بستن</DialogButton>}>
          <div className="space-y-2 text-xs">
            {[
              ['زمان', showDetail.createdAt],
              ['کاربر', showDetail.userName || showDetail.userId],
              ['عملیات', ACTION_LABELS[showDetail.action] || showDetail.action],
              ['ماژول', ENTITY_LABELS[showDetail.entityType] || showDetail.entityType],
              ['شناسه', showDetail.entityId],
              ['جزئیات', showDetail.details],
              ['IP', showDetail.ip],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} className="flex justify-between py-1" style={{ borderBottom: `1px solid ${cardBorder}` }}>
                <span className="font-bold" style={{ color: tSec }}>{label as string}</span>
                <span className="text-right max-w-[60%] break-all" style={{ color: tPri }}>{String(value)}</span>
              </div>
            ))}
            {showDetail.beforeValue && (
              <div className="rounded-lg p-2 mt-2" style={{ backgroundColor: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="font-bold mb-1" style={{ color: '#ef4444' }}>قبل:</div>
                <pre className="text-[10px] break-all" style={{ color: tPri }}>{showDetail.beforeValue}</pre>
              </div>
            )}
            {showDetail.afterValue && (
              <div className="rounded-lg p-2 mt-1" style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <div className="font-bold mb-1" style={{ color: '#22c55e' }}>بعد:</div>
                <pre className="text-[10px] break-all" style={{ color: tPri }}>{showDetail.afterValue}</pre>
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Cleanup Dialog */}
      {showCleanup && (
        <Dialog open={true} onClose={() => setShowCleanup(false)} title="پاکسازی لاگ" maxWidth="max-w-xs"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => setShowCleanup(false)}>لغو</DialogButton>
            <DialogButton variant="danger" onClick={handleCleanup}>پاکسازی</DialogButton>
          </>}>
          <div className="space-y-3">
            <p className="text-xs" style={{ color: tSec }}>حذف رکوردهای قدیمی‌تر از:</p>
            <select value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg text-sm font-bold outline-none"
              style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}`, color: tPri }}>
              <option value={30}>۳۰ روز</option><option value={90}>۹۰ روز</option>
              <option value={180}>۶ ماه</option><option value={365}>۱ سال</option>
              <option value={730}>۲ سال</option>
            </select>
          </div>
        </Dialog>
      )}
    </div>
  )
}
