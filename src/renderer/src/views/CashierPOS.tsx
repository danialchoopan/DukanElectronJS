import { useState, useCallback, useEffect, useRef } from 'react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import { useSuspendStore } from '../store/suspendStore'
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
import type { Sale, Customer } from "../../../types"
import { fa } from "../i18n"

export default function CashierPOS() {
  const user = useAuthStore((s) => s.user)
  const { items, addItem, clearCart, getSubtotal } = useCartStore()
  const slots = useSuspendStore((s) => s.slots)
  const setSlot = useSuspendStore((s) => s.setSlot)
  const clearSlot = useSuspendStore((s) => s.clearSlot)
  const [notification, setNotification] = useState('')
  const [showWebcam, setShowWebcam] = useState(false)
  const [showSuspended, setShowSuspended] = useState(false)
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null)
  const [saleComplete, setSaleComplete] = useState<Sale | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [storeSettings, setStoreSettings] = useState({ storeName: '', storeAddress: '', storePhone: '', receiptFooter: '' })
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.settings.getAll().then((r) => {
      if (r.success && r.data) {
        setStoreSettings({
          storeName: r.data.storeName ?? '',
          storeAddress: r.data.storeAddress ?? '',
          storePhone: r.data.storePhone ?? '',
          receiptFooter: r.data.receiptFooter ?? '',
        })
      }
    })
  }, [])

  const showNotif = useCallback((msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }, [])

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    const result = await window.api.products.getByBarcode(barcode)
    if (result.success && result.data) {
      const product = result.data
      if (product.stock <= 0) { showNotif(` ${product.title} — ${fa.admin.outOfStock}`); return }
      addItem({ productId: product.id, title: product.title, unitPrice: product.sale_price, purchasePrice: product.purchase_price })
      showNotif(` ${product.title} — ${product.sale_price.toLocaleString('fa-IR')} ${fa.common.toman}`)
    } else {
      showNotif(` ${barcode} — ${fa.common.noData}`)
    }
    setShowWebcam(false)
  }, [addItem, showNotif])

  const handlePaymentComplete = useCallback(async (method: 'cash' | 'card' | 'ledger', customerPaid?: number) => {
    if (items.length === 0) { showNotif(` ${fa.pos.noItems}`); return }
    if (method === 'ledger' && !selectedCustomer) { showNotif(` ${fa.payment.selectCustomer}`); return }

    const result = await window.api.sales.create({
      userId: user!.id,
      items: items.map((i) => ({
        productId: i.productId, productTitle: i.title, quantity: i.quantity,
        unitPrice: i.unitPrice, purchasePrice: i.purchasePrice,
      })),
      paymentMethod: method,
      customerId: selectedCustomer?.id,
      customerPaid: customerPaid || 0,
    })

    if (result.success && result.data) {
      showNotif(`${result.data.invoiceNumber} — ${result.data.total_amount.toLocaleString('fa-IR')} ${fa.common.toman}`)
      setSaleComplete(result.data)
      clearCart()
      setSelectedCustomer(null)
      barcodeRef.current?.focus()
    } else {
      showNotif(` ${result.error}`)
    }
  }, [items, user, selectedCustomer, clearCart, showNotif])

  const handleSuspend = useCallback(async (slotIndex?: number) => {
    if (items.length === 0) { showNotif(` ${fa.pos.nothingToHold}`); return }
    const targetSlot = slotIndex ?? slots.findIndex((s) => s.items.length === 0)
    if (targetSlot === -1 || targetSlot >= 3) { showNotif(` ${fa.pos.allSlotsFull}`); return }
    const result = await window.api.suspend.save(user!.id, targetSlot, items)
    if (result.success && result.data) {
      setSlot(targetSlot, result.data.id, items)
      clearCart()
      showNotif(`${fa.pos.holdInvoice} ${fa.pos.slot} ${targetSlot + 1}`)
      barcodeRef.current?.focus()
    }
  }, [items, user, slots, setSlot, clearCart, showNotif])

  const handleResume = useCallback(async (slotIndex: number) => {
    const slot = slots[slotIndex]
    if (!slot || !slot.id || slot.items.length === 0) { showNotif(` ${fa.pos.emptySlot}`); return }
    const result = await window.api.suspend.load(slot.id)
    if (result.success && result.data) {
      clearCart()
      for (const item of result.data.items) addItem(item)
      clearSlot(slotIndex)
      showNotif(`${fa.pos.resumeFrom} ${fa.pos.slot} ${slotIndex + 1}`)
      barcodeRef.current?.focus()
    }
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

      {showReceipt && (
        <ReceiptPrinter
          sale={showReceipt}
          storeName={storeSettings.storeName}
          storeAddress={storeSettings.storeAddress}
          storePhone={storeSettings.storePhone}
          receiptFooter={storeSettings.receiptFooter}
          onClose={() => setShowReceipt(null)}
        />
      )}

      {saleComplete && !showReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="rounded-2xl p-8 max-w-sm w-full mx-4 text-center border-2" style={{
            backgroundColor: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
            borderColor: '#22c55e',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a' }}>{fa.pos.total}: {saleComplete.total_amount.toLocaleString('fa-IR')} {fa.common.toman}</h2>
            <p className="text-sm mb-1" style={{ color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b' }}>{saleComplete.invoiceNumber}</p>
            <div className="flex gap-2 mt-6">
              <button onClick={() => { setShowReceipt(saleComplete); setSaleComplete(null) }} className="btn-primary flex-1 py-3">
                {fa.receipt.print}
              </button>
              <button onClick={() => setSaleComplete(null)} className="btn-success flex-1 py-3">
                {fa.common.close}
              </button>
            </div>
          </div>
        </div>
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
        <div className="flex gap-2">
          <div className="flex-1">
            <BarcodeInput ref={barcodeRef} onBarcodeScanned={handleBarcodeScan} />
          </div>
          <button onClick={() => setShowWebcam(true)} className="btn-primary px-4" title={fa.common.webcam}>
            <CameraIcon className="w-5 h-5" />
          </button>
        </div>

        <LooseItemsGrid />
        <PopularItems onProductAdd={(p) => {
          addItem({ productId: p.id, title: p.title, unitPrice: p.sale_price, purchasePrice: p.purchase_price })
          showNotif(`${p.title} — ${p.sale_price.toLocaleString('fa-IR')} ${fa.common.toman}`)
        }} />
        <CartTable items={items} />

        <div className="flex gap-3 text-[10px] text-gray-500">
          <span>F4: {fa.pos.hold}</span>
          <span>F5-F7: {fa.pos.resume}</span>
          <span>Enter: {fa.pos.add}</span>
          <span>{fa.common.webcam}</span>
        </div>
      </div>

      <div className="w-80 flex flex-col gap-2">
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">{fa.pos.subtotal}</span>
            <span className="text-2xl font-bold text-green-400">
              {getSubtotal().toLocaleString('fa-IR')} {fa.common.toman}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">{items.length} {fa.pos.items}</div>
        </div>

        <PaymentPanel
          onPaymentComplete={handlePaymentComplete}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
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
