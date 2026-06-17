import { useState, useCallback, useEffect, useRef } from 'react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useSuspendStore } from '../store/suspendStore'
import { useSettingsStore } from '../store/settingsStore'
import BarcodeInput from '../components/BarcodeInput'
import CartTable from '../components/CartTable'
import PaymentPanel from '../components/PaymentPanel'
import LooseItemsGrid from '../components/LooseItemsGrid'
import SuspendedSlots from '../components/SuspendedSlots'
import WebcamScanner from '../components/WebcamScanner'
import ReceiptPrinter from '../components/ReceiptPrinter'
import Notification from '../components/Notification'
import { CameraIcon } from '../components/Icons'
import PopularItems from '../components/PopularItems'
import type { Sale, Customer, Product } from "../../../types"
import { fa } from "../i18n"

export default function CashierPOS() {
  const user = useAuthStore((s) => s.user)
  const { items, addItem, clearCart, getSubtotal, lastError, clearError } = useCartStore()
  const slots = useSuspendStore((s) => s.slots)
  const setSlot = useSuspendStore((s) => s.setSlot)
  const clearSlot = useSuspendStore((s) => s.clearSlot)
  const { showCameraScanner } = useSettingsStore()
  const [notification, setNotification] = useState('')
  const [showWebcam, setShowWebcam] = useState(false)
  const [showSuspended, setShowSuspended] = useState(false)
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null)
  const [saleComplete, setSaleComplete] = useState<Sale | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [storeSettings, setStoreSettings] = useState({ storeName: '', storeAddress: '', storePhone: '', receiptFooter: '' })
  const [fullyPaid, setFullyPaid] = useState(true)
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.settings.getAll().then((r) => {
      if (r.success && r.data) setStoreSettings({ storeName: r.data.storeName ?? '', storeAddress: r.data.storeAddress ?? '', storePhone: r.data.storePhone ?? '', receiptFooter: r.data.receiptFooter ?? '' })
    })
  }, [])

  const showNotif = useCallback((msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }, [])

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    const result = await window.api.products.getByBarcode(barcode)
    if (result.success && result.data) {
      const product = result.data
      if (product.stock <= 0) { showNotif(`${fa.admin.outOfStock}: ${product.title}`); return }
      const ok = addItem({ productId: product.id, title: product.title, unitPrice: product.sale_price, purchasePrice: product.purchase_price, maxStock: product.stock, imageBase64: product.imageBase64 || "" })
      if (!ok) { showNotif(lastError); clearError(); return }
      showNotif(`${product.title} — ${product.sale_price.toLocaleString('fa-IR')} ${fa.common.toman}`)
    } else { showNotif(`${barcode} — ${fa.common.noData}`) }
    setShowWebcam(false)
  }, [addItem, showNotif, lastError, clearError])

  const handleProductSelect = useCallback((product: Product) => {
    if (product.stock <= 0) { showNotif(`${fa.admin.outOfStock}: ${product.title}`); return }
    const ok = addItem({ productId: product.id, title: product.title, unitPrice: product.sale_price, purchasePrice: product.purchase_price, maxStock: product.stock, imageBase64: product.imageBase64 || "" })
    if (!ok) { showNotif(lastError); clearError(); return }
    showNotif(`${product.title} — ${product.sale_price.toLocaleString('fa-IR')} ${fa.common.toman}`)
  }, [addItem, showNotif, lastError, clearError])

  const [pendingPayment, setPendingPayment] = useState<{ method: 'cash' | 'card' | 'ledger'; customerPaid?: number } | null>(null)

  const handlePaymentComplete = useCallback(async (method: 'cash' | 'card' | 'ledger', customerPaid?: number) => {
    if (items.length === 0) { showNotif(fa.pos.noItems); return }
    const total = getSubtotal()
    const paidAmt = fullyPaid ? total : (customerPaid || 0)
    setPendingPayment({ method, customerPaid: paidAmt })
  }, [items, fullyPaid, getSubtotal, showNotif])

  const confirmSale = useCallback(async () => {
    if (!pendingPayment || items.length === 0) return
    const { method, customerPaid: paidAmt } = pendingPayment
    const result = await window.api.sales.create({
      userId: user!.id,
      items: items.map((i) => ({ productId: i.productId, productTitle: i.title, quantity: i.quantity, unitPrice: i.unitPrice, purchasePrice: i.purchasePrice })),
      paymentMethod: method,
      customerId: selectedCustomer?.id,
      customerPaid: paidAmt || 0,
    })
    if (result.success && result.data) {
      setSaleComplete(result.data)
      clearCart()
      setSelectedCustomer(null)
      setFullyPaid(true)
      setPendingPayment(null)
      barcodeRef.current?.focus()
    } else { showNotif(`${result.error}`) }
    setPendingPayment(null)
  }, [pendingPayment, items, user, selectedCustomer, clearCart, showNotif])

  const handleSuspend = useCallback(async (slotIndex?: number) => {
    if (items.length === 0) { showNotif(fa.pos.nothingToHold); return }
    const targetSlot = slotIndex ?? slots.findIndex((s) => s.items.length === 0)
    if (targetSlot === -1 || targetSlot >= 3) { showNotif(fa.pos.allSlotsFull); return }
    const result = await window.api.suspend.save(user!.id, targetSlot, items)
    if (result.success && result.data) { setSlot(targetSlot, result.data.id, items); clearCart(); showNotif(`${fa.pos.holdInvoice} ${fa.pos.slot} ${targetSlot + 1}`); barcodeRef.current?.focus() }
  }, [items, user, slots, setSlot, clearCart, showNotif])

  const handleResume = useCallback(async (slotIndex: number) => {
    const slot = slots[slotIndex]
    if (!slot || !slot.id || slot.items.length === 0) { showNotif(fa.pos.emptySlot); return }
    const result = await window.api.suspend.load(slot.id)
    if (result.success && result.data) { clearCart(); for (const item of result.data.items) addItem(item); clearSlot(slotIndex); showNotif(`${fa.pos.resumeFrom} ${fa.pos.slot} ${slotIndex + 1}`); barcodeRef.current?.focus() }
  }, [slots, clearCart, addItem, clearSlot, showNotif])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F4') { e.preventDefault(); handleSuspend() }
      if (e.key === 'F5') { e.preventDefault(); handleResume(0) }
      if (e.key === 'F6') { e.preventDefault(); handleResume(1) }
      if (e.key === 'F7') { e.preventDefault(); handleResume(2) }
      if (e.key === 'Escape') { setShowSuspended(false); setShowWebcam(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSuspend, handleResume])

  const activeCount = slots.filter((s) => s.items.length > 0).length

  return (
    <div className="h-full flex gap-3 p-3">
      <Notification message={notification} />

      {showWebcam && <WebcamScanner onScan={handleBarcodeScan} onClose={() => setShowWebcam(false)} />}

      {pendingPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="card p-6 max-w-sm w-full text-center" style={{ border: '2px solid #f59e0b' }}>
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(245,158,11,0.15)' }}>
              <svg className="w-7 h-7 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{fa.common.confirm}؟</h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{fa.pos.total}: {getSubtotal().toLocaleString('fa-IR')} {fa.common.toman}</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{pendingPayment.method === 'cash' ? fa.payment.cash : pendingPayment.method === 'card' ? fa.payment.card : fa.payment.ledger}</p>
            <div className="flex gap-2">
              <button onClick={() => setPendingPayment(null)} className="btn btn-danger flex-1 py-2.5">{fa.common.cancel}</button>
              <button onClick={confirmSale} className="btn btn-success flex-1 py-2.5">{fa.common.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {saleComplete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="card p-6 max-w-md w-full" style={{ border: '2px solid #22c55e' }}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{fa.pos.total}: {saleComplete.total_amount.toLocaleString('fa-IR')} {fa.common.toman}</h2>
            </div>
            <div className="rounded-xl p-3 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{fa.receipt.invoice}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{saleComplete.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{fa.receipt.method}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{saleComplete.paymentMethod === 'cash' ? fa.payment.cash : saleComplete.paymentMethod === 'card' ? fa.payment.card : fa.payment.ledger}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{fa.receipt.date}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{saleComplete.createdAt?.split('T')[0]}</span>
              </div>
              {saleComplete.items && saleComplete.items.length > 0 && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {saleComplete.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.productTitle} x{item.quantity}</span>
                      <span style={{ color: 'var(--text-primary)' }}>{item.subtotal.toLocaleString('fa-IR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowReceipt(saleComplete); setSaleComplete(null) }} className="btn btn-primary flex-1 py-2.5">{fa.receipt.print}</button>
              <button onClick={() => setSaleComplete(null)} className="btn btn-success flex-1 py-2.5">{fa.common.close}</button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <ReceiptPrinter sale={showReceipt} storeName={storeSettings.storeName} storeAddress={storeSettings.storeAddress} storePhone={storeSettings.storePhone} receiptFooter={storeSettings.receiptFooter} onClose={() => setShowReceipt(null)} />
      )}

      {showSuspended && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center">
          <div className="card p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{fa.pos.suspendedInvoices} ({activeCount}/3)</h2>
              <button onClick={() => setShowSuspended(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <SuspendedSlots onSelect={handleResume} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <BarcodeInput ref={barcodeRef} onBarcodeScanned={handleBarcodeScan} onProductSelected={handleProductSelect} />
          </div>
          {showCameraScanner && (
            <button onClick={() => setShowWebcam(true)} className="btn btn-primary px-4" title={fa.common.webcam}>
              <CameraIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        <LooseItemsGrid />
        <PopularItems onProductAdd={(p) => {
          const ok = addItem({ productId: p.id, title: p.title, unitPrice: p.sale_price, purchasePrice: p.purchase_price, maxStock: p.stock, imageBase64: p.imageBase64 || "" })
          if (ok) showNotif(`${p.title} — ${p.sale_price.toLocaleString('fa-IR')} ${fa.common.toman}`)
          else { showNotif(lastError); clearError() }
        }} />
        <CartTable items={items} />

        <div className="flex gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>F4: {fa.pos.hold}</span>
          <span>F5-F7: {fa.pos.resume}</span>
          <span>Enter: {fa.pos.add}</span>
        </div>
      </div>

      <div className="w-80 flex flex-col gap-2">
        <div className="card">
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{fa.pos.subtotal}</span>
            <span className="text-2xl font-bold text-green-400">{getSubtotal().toLocaleString('fa-IR')} {fa.common.toman}</span>
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{items.length} {fa.pos.items}</div>

          <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <label className="text-xs font-bold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
              {fa.pos.fullAmount}
            </label>
            <button onClick={() => setFullyPaid(!fullyPaid)}
              className="relative w-12 h-6 rounded-full transition-all duration-200"
              style={{ backgroundColor: fullyPaid ? '#22c55e' : 'var(--bg-tertiary)', boxShadow: fullyPaid ? '0 2px 8px rgba(34,197,94,0.3)' : 'none' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200"
                style={{ left: fullyPaid ? '24px' : '2px' }} />
            </button>
          </div>
        </div>

        <PaymentPanel
          onPaymentComplete={handlePaymentComplete}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          fullyPaid={fullyPaid}
        />

        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <button key={i} onClick={() => items.length > 0 ? handleSuspend(i) : handleResume(i)}
              className={`text-[10px] py-2 rounded font-bold ${slots[i].items.length > 0 ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-400'}`}>
              {slots[i].items.length > 0 ? `${fa.pos.slot} ${i + 1} (${slots[i].items.length})` : `${fa.pos.slot} ${i + 1}`}
            </button>
          ))}
        </div>

        <button onClick={() => setShowSuspended(true)} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded text-sm">
          {fa.pos.viewSlots}
        </button>
      </div>
    </div>
  )
}
