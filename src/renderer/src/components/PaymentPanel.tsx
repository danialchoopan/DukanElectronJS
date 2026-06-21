import { useState, useEffect } from 'react'
import { useCartStore } from '../store/cartStore'
import type { Customer } from '../../../types'
import { fa } from '../i18n'
import { MoneyIcon, BookIcon, SearchIcon, XIcon } from './Icons'

type PaymentMethod = 'cash' | 'card' | 'ledger'

interface Props {
  onPaymentComplete: (method: PaymentMethod, customerPaid?: number) => void
  selectedCustomer: Customer | null
  onSelectCustomer: (c: Customer | null) => void
  fullyPaid: boolean
}

export default function PaymentPanel({ onPaymentComplete, selectedCustomer, onSelectCustomer, fullyPaid }: Props) {
  const totalAmount = useCartStore((s) => s.getSubtotal())
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [paid, setPaid] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [customerQuery, setCustomerQuery] = useState('')

  useEffect(() => {
    if (showCustomerSearch) {
      window.api.customers.search(customerQuery).then((r) => { if (r.success && r.data) setCustomers(r.data.slice(0, 3)) })
    }
  }, [showCustomerSearch, customerQuery])

  const paidAmount = fullyPaid ? totalAmount : (parseFloat(paid) || 0)
  const change = Math.max(0, paidAmount - totalAmount)

  const methods: { key: PaymentMethod; label: string; icon: JSX.Element; color: string }[] = [
    { key: 'cash', label: fa.payment.cash, icon: <MoneyIcon className="w-5 h-5" />, color: 'linear-gradient(135deg, #22c55e, #16a34a)' },
    { key: 'ledger', label: fa.payment.ledger, icon: <BookIcon className="w-5 h-5" />, color: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
  ]

  const quickAmounts = fullyPaid ? [] : [totalAmount, Math.ceil(totalAmount / 1000) * 1000, Math.ceil(totalAmount / 5000) * 5000, Math.ceil(totalAmount / 10000) * 10000].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="card">
      <div className="text-center mb-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{fa.pos.total}</span>
        <div className="text-3xl font-bold text-green-400">{totalAmount.toLocaleString('fa-IR')} {fa.common.toman}</div>
      </div>

      {/* Customer Search - always visible */}
      <div className="mb-3">
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{fa.payment.customer}</label>
        {selectedCustomer ? (
          <div className="flex justify-between items-center rounded-xl p-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{selectedCustomer.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: selectedCustomer.customerType === 'legal' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)', color: selectedCustomer.customerType === 'legal' ? '#a855f7' : '#3b82f6' }}>
                {selectedCustomer.customerType === 'legal' ? 'حقوقی' : 'حقیقی'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${selectedCustomer.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {selectedCustomer.balance.toLocaleString('fa-IR')}
              </span>
              <button onClick={() => onSelectCustomer(null)} className="btn-danger" style={{ padding: '2px 6px', fontSize: '10px', borderRadius: '6px' }}>
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowCustomerSearch(true)} className="w-full text-sm font-medium py-2 rounded-xl flex items-center justify-center gap-2 transition-all" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)' }}>
            <SearchIcon className="w-4 h-4" />
            {fa.payment.selectCustomer}
          </button>
        )}
      </div>

      {showCustomerSearch && (
        <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={customerQuery} onChange={(e) => setCustomerQuery(e.target.value)} className="input-field text-sm pl-8" placeholder={fa.customer.search} autoFocus />
          </div>
          <div className="max-h-32 overflow-auto space-y-1 mt-2">
            {customers.map((c) => (
              <button key={c.id} onClick={() => { onSelectCustomer(c); setShowCustomerSearch(false); setCustomerQuery('') }} className="w-full text-right px-3 py-2 rounded-lg text-sm btn-primary flex justify-between" style={{ padding: '8px 12px' }}>
                <span>{c.name}</span>
                <span className="opacity-70 text-xs">{c.balance.toLocaleString('fa-IR')}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowCustomerSearch(false)} className="btn-danger mt-2 text-xs" style={{ padding: '4px 12px' }}>{fa.admin.cancel}</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        {methods.map((m) => (
          <button key={m.key} onClick={() => { setSelectedMethod(m.key); if (!fullyPaid) setPaid('') }}
            className="btn text-white rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all"
            style={{
              background: selectedMethod === m.key ? m.color : 'var(--bg-tertiary)',
              color: selectedMethod === m.key ? '#ffffff' : 'var(--text-secondary)',
              transform: selectedMethod === m.key ? 'scale(1.05)' : 'scale(1)',
              boxShadow: selectedMethod === m.key ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
            }}>
            {m.icon}
            <span className="text-[10px] font-bold">{m.label}</span>
          </button>
        ))}
      </div>

      {selectedMethod === 'cash' && (
        <div className="space-y-2">
          {!fullyPaid && (
            <>
              <input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} className="input-field text-2xl text-center font-bold py-3" placeholder="0" autoFocus />
              {quickAmounts.length > 0 && (
                <div className="grid grid-cols-4 gap-1.5">
                  {quickAmounts.map((amt) => (
                    <button key={amt} onClick={() => setPaid(String(amt))} className="btn btn-primary text-[10px] py-2 rounded-lg">{amt.toLocaleString('fa-IR')}</button>
                  ))}
                </div>
              )}
            </>
          )}
          {fullyPaid && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{fa.pos.total}:</span>
              <span className="text-lg font-bold text-green-400 mr-2">{totalAmount.toLocaleString('fa-IR')} {fa.common.toman}</span>
            </div>
          )}
          {!fullyPaid && (
            <div className="flex justify-between items-center rounded-xl p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{fa.payment.change}</span>
              <span className={`text-lg font-bold ${change > 0 ? 'text-yellow-400' : ''}`} style={change <= 0 ? { color: 'var(--text-muted)' } : {}}>
                {change.toLocaleString('fa-IR')} {fa.common.toman}
              </span>
            </div>
          )}
          <button onClick={() => onPaymentComplete('cash', paidAmount)} disabled={totalAmount <= 0}
            className="btn btn-success w-full text-lg py-3 disabled:opacity-40">{fa.payment.completeSale}</button>
        </div>
      )}

      {selectedMethod === 'ledger' && (
        <button onClick={() => onPaymentComplete('ledger')} disabled={totalAmount <= 0 || !selectedCustomer}
          className="btn btn-success w-full text-lg py-3 disabled:opacity-40">{fa.payment.addToLedger}</button>
      )}
    </div>
  )
}
