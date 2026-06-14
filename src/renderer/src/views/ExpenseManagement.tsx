import { useState, useEffect } from 'react'
import type { Expense } from '../../../types'
import { fa } from '../i18n'
import { formatJalaliShort, getTodayGregorian } from '../utils/jalali'

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: '', description: '', amount: 0, date: getTodayGregorian() })

  const load = async () => {
    const [e, t] = await Promise.all([window.api.expenses.getAll(), window.api.expenses.getTotal()])
    if (e.success && e.data) setExpenses(e.data)
    if (t.success && t.data !== undefined) setTotalExpenses(t.data)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!form.category || !form.description || form.amount <= 0) return
    await window.api.expenses.create(form)
    setShowForm(false)
    setForm({ category: '', description: '', amount: 0, date: getTodayGregorian() })
    load()
  }

  const defaultCategories = Object.values(fa.expense.categories)

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{fa.expense.title}</h2>
          <span className="text-sm text-gray-400">{fa.expense.totalExpenses}: {totalExpenses.toLocaleString('fa-IR')} {fa.common.toman}</span>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ {fa.expense.addExpense}</button>
      </div>

      {showForm && (
        <div className="card mb-4 grid grid-cols-4 gap-2 items-end">
          <div>
            <label className="text-xs text-gray-400">{fa.expense.category}</label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field text-sm">
              <option value="">...</option>
              {defaultCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-gray-400">{fa.expense.description}</label><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-field text-sm" /></div>
          <div><label className="text-xs text-gray-400">{fa.expense.amount}</label><input type="number" value={form.amount || ''} onChange={(e) => setForm((f) => ({ ...f, amount: +e.target.value }))} className="input-field text-sm" /></div>
          <div><label className="text-xs text-gray-400">{fa.expense.date}</label><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field text-sm" /></div>
          <div className="col-span-4 flex gap-2">
            <button onClick={handleSubmit} className="btn-success text-sm">{fa.admin.create}</button>
            <button onClick={() => setShowForm(false)} className="btn-danger text-sm">{fa.admin.cancel}</button>
          </div>
        </div>
      )}

      <div className="card">
        <table className="w-full text-sm">
          <thead><tr className="text-gray-400 border-b border-gray-700">
            <th className="text-right px-2 py-1">{fa.expense.date}</th>
            <th className="text-right px-2 py-1">{fa.expense.category}</th>
            <th className="text-right px-2 py-1">{fa.expense.description}</th>
            <th className="text-right px-2 py-1">{fa.expense.amount}</th>
            <th className="text-right px-2 py-1"></th>
          </tr></thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-b border-gray-800">
                <td className="px-2 py-1 text-gray-400">{formatJalaliShort(e.date)}</td>
                <td className="px-2 py-1">{e.category}</td>
                <td className="px-2 py-1">{e.description}</td>
                <td className="px-2 py-1 font-bold text-red-400">{e.amount.toLocaleString('fa-IR')}</td>
                <td className="px-2 py-1"><button onClick={async () => { await window.api.expenses.delete(e.id); load() }} className="text-red-400 hover:text-red-300 text-xs">{fa.admin.delete}</button></td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={5} className="text-center py-4 text-gray-500">{fa.expense.noExpenses}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
