import { useState, useEffect } from 'react'
import { fa } from '../../i18n'

interface AccountNode { account: any; children: AccountNode[] }

export default function ChartOfAccounts() {
  const [tree, setTree] = useState<AccountNode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ code: '', name: '', type: 'asset' as string, parentId: null as number | null, description: '' })
  const [filterType, setFilterType] = useState('all')
  const [allAccounts, setAllAccounts] = useState<any[]>([])

  const isDark = document.documentElement.classList.contains('dark')
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const typeColors: Record<string, { bg: string; fg: string }> = {
    asset: { bg: isDark ? '#0c1e3a' : '#dbeafe', fg: '#3b82f6' },
    liability: { bg: isDark ? '#450a0a' : '#fee2e2', fg: '#ef4444' },
    equity: { bg: isDark ? '#2e1065' : '#f3e8ff', fg: '#a855f7' },
    income: { bg: isDark ? '#052e16' : '#dcfce7', fg: '#22c55e' },
    expense: { bg: isDark ? '#451a03' : '#fef3c7', fg: '#f59e0b' },
  }

  const load = async () => {
    const [treeRes, allRes] = await Promise.all([window.api.accounts.getTree(), window.api.accounts.getAll()])
    if (treeRes.success && treeRes.data) setTree(treeRes.data)
    if (allRes.success && allRes.data) setAllAccounts(allRes.data)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setForm({ code: '', name: '', type: 'asset', parentId: null, description: '' }); setEditingId(null); setShowForm(true) }
  const openEdit = (a: any) => { setForm({ code: a.code, name: a.name, type: a.type, parentId: a.parentId, description: a.description }); setEditingId(a.id); setShowForm(true) }

  const handleSave = async () => {
    if (!form.code || !form.name) return
    if (editingId) {
      await window.api.accounts.update(editingId, form)
    } else {
      await window.api.accounts.create(form)
    }
    setShowForm(false)
    load()
  }

  const handleDelete = async (id: number) => {
    await window.api.accounts.delete(id)
    load()
  }

  const handleToggle = async (id: number) => {
    await window.api.accounts.toggleActive(id)
    load()
  }

  const renderNode = (node: AccountNode, depth: number = 0) => {
    const a = node.account
    const tc = typeColors[a.type] || typeColors.asset
    const matchesFilter = filterType === 'all' || a.type === filterType
    if (!matchesFilter) return null
    return (
      <div key={a.id}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1" style={{ marginLeft: depth * 24, backgroundColor: isDark ? (a.isActive ? 'rgba(59,130,246,0.05)' : 'rgba(100,116,139,0.05)') : (a.isActive ? 'rgba(59,130,246,0.03)' : 'rgba(100,116,139,0.03)'), opacity: a.isActive ? 1 : 0.5 }}>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ backgroundColor: tc.bg, color: tc.fg }}>{a.code}</span>
          <span className="text-sm font-medium flex-1" style={{ color: textPrimary }}>{a.name}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: tc.bg, color: tc.fg }}>{fa.accounting.accounts.types[a.type as keyof typeof fa.accounting.accounts.types]}</span>
          <button onClick={() => openEdit(a)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{fa.accounting.accounts.editAccount}</button>
          <button onClick={() => handleToggle(a.id)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{a.isActive ? fa.accounting.accounts.inactive : fa.accounting.accounts.active}</button>
          {!node.children.length && <button onClick={() => handleDelete(a.id)} className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: isDark ? '#450a0a' : '#fee2e2', color: '#ef4444' }}>{fa.accounting.accounts.delete}</button>}
        </div>
        {node.children.map(child => renderNode(child, depth + 1))}
      </div>
    )
  }

  const types = ['all', 'asset', 'liability', 'equity', 'income', 'expense']

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{fa.accounting.accounts.title}</h3>
        <button onClick={openAdd} className="btn-primary text-sm">+ {fa.accounting.accounts.addAccount}</button>
      </div>

      <div className="flex gap-2 mb-3">
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)} className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: filterType === t ? '#3b82f6' : (isDark ? '#334155' : '#f1f5f9'), color: filterType === t ? '#fff' : textSecondary }}>
            {t === 'all' ? fa.dashboard.all : fa.accounting.accounts.types[t as keyof typeof fa.accounting.accounts.types]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border p-3" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        {tree.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: textSecondary }}>{fa.accounting.accounts.noAccounts}</p>
        ) : tree.map(node => renderNode(node))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4 border-2" style={{ backgroundColor: cardBg, borderColor: '#3b82f6' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4" style={{ color: textPrimary }}>{editingId ? fa.accounting.accounts.editAccount : fa.accounting.accounts.addAccount}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.code}</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-field text-sm" placeholder="1000" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.name}</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.type}</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field text-sm">
                  {['asset', 'liability', 'equity', 'income', 'expense'].map(t => (
                    <option key={t} value={t}>{fa.accounting.accounts.types[t as keyof typeof fa.accounting.accounts.types]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.parent}</label>
                <select value={form.parentId ?? ''} onChange={e => setForm({ ...form, parentId: e.target.value ? Number(e.target.value) : null })} className="input-field text-sm">
                  <option value="">—</option>
                  {allAccounts.filter(a => a.id !== editingId).map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: textSecondary }}>{fa.accounting.accounts.description}</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="btn-primary flex-1 py-2.5">{fa.accounting.accounts.save}</button>
              <button onClick={() => setShowForm(false)} className="btn flex-1 py-2.5" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>{fa.accounting.accounts.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
