/**
 * CrossSellRules — CRUD interface for mandatory/recommended product rules.
 *
 * Features:
 *   - List all rules with status, type, priority
 *   - Create/edit rules with trigger conditions
 *   - Add/remove products to rules
 *   - Toggle active/inactive
 *   - Visual rule builder
 */

import { useState, useEffect } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import Dialog, { DialogButton } from '../components/ui/Dialog'

interface Rule { id: number; name: string; triggerType: string; triggerValue: string; triggerCondition: string; triggerThreshold: number; ruleType: string; priority: number; isActive: boolean; createdBy: string; createdAt: string; updatedAt: string }
interface RuleItem { id: number; ruleId: number; productId: number; productName: string; quantity: number; discountPercent: number }

const TRIGGER_TYPES = { product: 'محصول خاص', category: 'دسته‌بندی', price: 'مبلغ سبد', quantity: 'تعداد اقلام' }
const RULE_TYPES = { mandatory: 'اجباری', optional: 'اختیاری', recommended: 'پیشنهادی' }
const RULE_COLORS: Record<string, string> = { mandatory: '#ef4444', optional: '#f59e0b', recommended: '#3b82f6' }

export default function CrossSellRulesView() {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'
  const [rules, setRules] = useState<Rule[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editRule, setEditRule] = useState<Rule | null>(null)
  const [showItems, setShowItems] = useState<Rule | null>(null)
  const [ruleItems, setRuleItems] = useState<RuleItem[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', triggerType: 'product', triggerValue: '', triggerCondition: '>=', triggerThreshold: 0, ruleType: 'mandatory', priority: 0 })
  const [newItemProductId, setNewItemProductId] = useState('')
  const [newItemQty, setNewItemQty] = useState(1)

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'

  const load = async () => {
    const [rulesRes, prodRes] = await Promise.all([window.api.crossSell.getAll(), window.api.products.getAll()])
    if (rulesRes.success && rulesRes.data) setRules(rulesRes.data)
    if (prodRes.success && prodRes.data) setAllProducts(prodRes.data)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!form.name) return
    if (editRule) {
      await window.api.crossSell.update(editRule.id, form)
    } else {
      await window.api.crossSell.create(form)
    }
    setShowForm(false); setEditRule(null)
    setForm({ name: '', triggerType: 'product', triggerValue: '', triggerCondition: '>=', triggerThreshold: 0, ruleType: 'mandatory', priority: 0 })
    await load()
  }

  const handleDelete = async (id: number) => {
    await window.api.crossSell.delete(id)
    await load()
  }

  const handleToggleActive = async (rule: Rule) => {
    await window.api.crossSell.update(rule.id, { isActive: !rule.isActive })
    await load()
  }

  const handleAddItem = async () => {
    if (!showItems || !newItemProductId) return
    await window.api.crossSell.addItem({ ruleId: showItems.id, productId: Number(newItemProductId), quantity: newItemQty })
    setNewItemProductId(''); setNewItemQty(1)
    const r = await window.api.crossSell.getById(showItems.id)
    if (r.success && r.data) setRuleItems(r.data.items || [])
  }

  const handleRemoveItem = async (itemId: number) => {
    await window.api.crossSell.removeItem(itemId)
    if (showItems) {
      const r = await window.api.crossSell.getById(showItems.id)
      if (r.success && r.data) setRuleItems(r.data.items || [])
    }
  }

  const inputStyle = { backgroundColor: inputBg, border: `1px solid ${cardBorder}`, color: tPri }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: tPri }}>قوانین فروش مکمل</h2>
        <button onClick={() => { setEditRule(null); setForm({ name: '', triggerType: 'product', triggerValue: '', triggerCondition: '>=', triggerThreshold: 0, ruleType: 'mandatory', priority: 0 }); setShowForm(true) }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>+ قانون جدید</button>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map(rule => (
          <div key={rule.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}`, opacity: rule.isActive ? 1 : 0.6 }}>
            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: RULE_COLORS[rule.ruleType] }} />
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm" style={{ color: tPri }}>{rule.name}</div>
              <div className="text-[10px]" style={{ color: tSec }}>
                {TRIGGER_TYPES[rule.triggerType as keyof typeof TRIGGER_TYPES]} | {RULE_TYPES[rule.ruleType as keyof typeof RULE_TYPES]} | اولویت: {rule.priority}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleToggleActive(rule)} className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: rule.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: rule.isActive ? '#22c55e' : '#ef4444' }}>{rule.isActive ? 'فعال' : 'غیرفعال'}</button>
              <button onClick={async () => { setEditRule(rule); setForm({ name: rule.name, triggerType: rule.triggerType, triggerValue: rule.triggerValue, triggerCondition: rule.triggerCondition, triggerThreshold: rule.triggerThreshold, ruleType: rule.ruleType, priority: rule.priority }); setShowForm(true) }} className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: tSec }}>ویرایش</button>
              <button onClick={async () => { const r = await window.api.crossSell.getById(rule.id); if (r.success && r.data) { setShowItems(rule); setRuleItems(r.data.items || []) } }} className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>کالاها</button>
              <button onClick={() => handleDelete(rule.id)} className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>حذف</button>
            </div>
          </div>
        ))}
        {rules.length === 0 && <p className="text-sm text-center py-8" style={{ color: tSec }}>هنوز قانونی تعریف نشده</p>}
      </div>

      {/* Create/Edit Dialog */}
      {showForm && (
        <Dialog open={true} onClose={() => { setShowForm(false); setEditRule(null) }} title={editRule ? 'ویرایش قانون' : 'قانون جدید'} maxWidth="max-w-md"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
          footer={<>
            <DialogButton variant="ghost" onClick={() => { setShowForm(false); setEditRule(null) }}>لغو</DialogButton>
            <DialogButton variant="primary" onClick={handleSubmit}>{editRule ? 'ذخیره' : 'ایجاد'}</DialogButton>
          </>}>
          <div className="space-y-3">
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>نام قانون</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field text-sm w-full" style={inputStyle} /></div>
            <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>نوع فعال‌ساز</label>
              <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                {Object.entries(TRIGGER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            {form.triggerType === 'product' && <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>شناسه محصول</label><input value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: e.target.value })} className="input-field text-sm w-full" style={inputStyle} /></div>}
            {form.triggerType === 'category' && <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>نام دسته‌بندی</label><input value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: e.target.value })} className="input-field text-sm w-full" style={inputStyle} /></div>}
            {(form.triggerType === 'price' || form.triggerType === 'quantity') && (
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>شرط</label>
                  <select value={form.triggerCondition} onChange={(e) => setForm({ ...form, triggerCondition: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                    <option value=">=">بیشتر یا مساوی</option><option value="<=">کمتر یا مساوی</option>
                  </select></div>
                <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>آستانه</label><input type="number" value={form.triggerThreshold} onChange={(e) => setForm({ ...form, triggerThreshold: Number(e.target.value) })} className="input-field text-sm w-full" style={inputStyle} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>نوع قانون</label>
                <select value={form.ruleType} onChange={(e) => setForm({ ...form, ruleType: e.target.value })} className="input-field text-sm w-full" style={inputStyle}>
                  {Object.entries(RULE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div><label className="text-xs font-bold block mb-1" style={{ color: tSec }}>اولویت</label><input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="input-field text-sm w-full" style={inputStyle} /></div>
            </div>
          </div>
        </Dialog>
      )}

      {/* Items Dialog */}
      {showItems && (
        <Dialog open={true} onClose={() => { setShowItems(null); setRuleItems([]) }} title={`کالاهای قانون: ${showItems.name}`} maxWidth="max-w-lg"
          icon={<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>}
          footer={<DialogButton variant="ghost" onClick={() => { setShowItems(null); setRuleItems([]) }}>بستن</DialogButton>}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <select value={newItemProductId} onChange={(e) => setNewItemProductId(e.target.value)} className="input-field text-xs flex-1" style={inputStyle}>
                <option value="">انتخاب کالا...</option>
                {allProducts.map(p => <option key={p.id} value={p.id}>{p.title} ({p.barcode})</option>)}
              </select>
              <input type="number" value={newItemQty} onChange={(e) => setNewItemQty(Number(e.target.value))} className="input-field text-xs w-16" style={inputStyle} placeholder="تعداد" min={1} />
              <button onClick={handleAddItem} disabled={!newItemProductId} className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>+</button>
            </div>
            {ruleItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${cardBorder}` }}>
                <span className="flex-1 text-xs font-bold" style={{ color: tPri }}>{item.productName}</span>
                <span className="text-xs" style={{ color: tSec }}>×{item.quantity}</span>
                <button onClick={() => handleRemoveItem(item.id)} className="text-[10px] px-2 py-0.5 rounded" style={{ color: '#ef4444' }}>حذف</button>
              </div>
            ))}
            {ruleItems.length === 0 && <p className="text-xs text-center" style={{ color: tSec }}>کالایی اضافه نشده</p>}
          </div>
        </Dialog>
      )}
    </div>
  )
}
