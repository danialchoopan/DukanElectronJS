import { useState, useEffect } from 'react'
import type { Customer, CustomerLedgerEntry } from '../../../types'
import { fa } from '../i18n'
import { formatJalaliDateTime } from '../utils/jalali'

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showCharge, setShowCharge] = useState(false)
  const [chargeAmount, setChargeAmount] = useState('')
  const [form, setForm] = useState({ name: '', phone: '' })

  const load = async () => {
    const r = search ? await window.api.customers.search(search) : await window.api.customers.getAll()
    if (r.success && r.data) setCustomers(r.data)
  }
  useEffect(() => { load() }, [search])

  const loadLedger = async (c: Customer) => {
    setSelectedCustomer(c)
    const r = await window.api.customers.getLedger(c.id)
    if (r.success && r.data) setLedger(r.data)
  }

  const handleCreate = async () => {
    if (!form.name) return
    await window.api.customers.create(form)
    setShowForm(false); setForm({ name: '', phone: '' }); load()
  }

  const handleCharge = async () => {
    if (!selectedCustomer || !chargeAmount) return
    const amt = parseFloat(chargeAmount)
    if (amt > 0) {
      await window.api.customers.charge(selectedCustomer.id, amt)
      setChargeAmount('')
      setShowCharge(false)
      loadLedger(selectedCustomer)
      load()
    }
  }

  const handlePay = async () => {
    if (!selectedCustomer || !chargeAmount) return
    const amt = parseFloat(chargeAmount)
    if (amt > 0) {
      await window.api.customers.pay(selectedCustomer.id, amt)
      setChargeAmount('')
      setShowCharge(false)
      loadLedger(selectedCustomer)
      load()
    }
  }

  const totalDebt = customers.reduce((s, c) => s + (c.balance < 0 ? Math.abs(c.balance) : 0), 0)

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">{fa.customer.title}</h2>
          <span className="text-sm text-gray-400">{fa.customer.totalDebt}: {totalDebt.toLocaleString('fa-IR')} {fa.common.toman}</span>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ {fa.customer.addCustomer}</button>
      </div>

      <div className="flex gap-2 mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={fa.customer.search} className="input-field flex-1" />
      </div>

      {showForm && (
        <div className="card mb-4 grid grid-cols-3 gap-2 items-end">
          <div><label className="text-xs text-gray-400">{fa.admin.name} *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field text-sm" /></div>
          <div><label className="text-xs text-gray-400">{fa.customer.phone}</label><input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field text-sm" /></div>
          <div className="flex gap-2"><button onClick={handleCreate} className="btn-success text-sm">{fa.admin.create}</button><button onClick={() => setShowForm(false)} className="btn-danger text-sm">{fa.admin.cancel}</button></div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <table className="w-full text-sm">
            <thead><tr className="text-gray-400 border-b border-gray-700">
              <th className="text-right px-2 py-1">{fa.admin.name}</th>
              <th className="text-right px-2 py-1">{fa.customer.phone}</th>
              <th className="text-right px-2 py-1">{fa.customer.balance}</th>
              <th className="text-right px-2 py-1"></th>
            </tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className={`border-b border-gray-800 cursor-pointer hover:bg-gray-800 ${selectedCustomer?.id === c.id ? 'bg-blue-900/30' : ''}`} onClick={() => loadLedger(c)}>
                  <td className="px-2 py-1">{c.name}</td>
                  <td className="px-2 py-1 text-gray-400">{c.phone || '-'}</td>
                  <td className={`px-2 py-1 font-bold ${c.balance < 0 ? 'text-red-400' : c.balance > 0 ? 'text-green-400' : ''}`}>{c.balance.toLocaleString('fa-IR')}</td>
                  <td className="px-2 py-1">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); setShowCharge(true) }} className="text-blue-400 text-xs">{fa.customer.charge}</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={4} className="text-center py-4 text-gray-500">{fa.customer.noCustomers}</td></tr>}
            </tbody>
          </table>
        </div>

        {selectedCustomer && (
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-300">{fa.customer.ledger}: {selectedCustomer.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => { setShowCharge(true) }} className="btn-success text-xs">+ {fa.customer.charge}</button>
                <button onClick={() => { setShowCharge(true) }} className="btn-primary text-xs">{fa.customer.payDebt}</button>
              </div>
            </div>

            {showCharge && (
              <div className="bg-gray-700 rounded p-3 mb-3">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">{fa.customer.chargeAmount}</label>
                    <input type="number" value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} className="input-field text-sm" placeholder="مبلغ" />
                  </div>
                  <button onClick={handleCharge} className="btn-success text-sm">{fa.customer.charge}</button>
                  <button onClick={handlePay} className="btn-primary text-sm">{fa.customer.payDebt}</button>
                  <button onClick={() => setShowCharge(false)} className="btn-danger text-sm">{fa.admin.cancel}</button>
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-auto">
              {ledger.map((e) => (
                <div key={e.id} className="flex justify-between items-center py-1.5 border-b border-gray-700 text-sm">
                  <div>
                    <span className={`font-bold ${e.type === 'charge' ? 'text-green-400' : e.type === 'sale' ? 'text-red-400' : 'text-blue-400'}`}>
                      {e.type === 'charge' ? '+' : e.type === 'sale' ? '-' : '+'}
                    </span>
                    <span className="mr-2">{e.description}</span>
                  </div>
                  <div className="text-xs text-gray-400">{e.amount.toLocaleString('fa-IR')} · {formatJalaliDateTime(e.createdAt)}</div>
                </div>
              ))}
              {ledger.length === 0 && <p className="text-gray-500 text-sm text-center py-4">{fa.dashboard.noData}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
