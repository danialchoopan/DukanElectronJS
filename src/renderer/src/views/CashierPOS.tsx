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
import { fa } from '../i18n'
import { printA4Report } from '../utils/a4Print'
import WebcamScanner from '../components/WebcamScanner'
import ReceiptPrinter from '../components/ReceiptPrinter'
import Notification from '../components/Notification'
import { CameraIcon } from '../components/Icons'
import PopularItems from '../components/PopularItems'
import { formatJalaliDateTime } from '../utils/jalali'
import type { Sale, Customer, Product } from "../../../types"

const primary = '#006194'
const success = '#22c55e'
const error = '#ef4444'
const warning = '#f59e0b'

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
  const [lastCustomer, setLastCustomer] = useState<Customer | null>(null)
  const [storeSettings, setStoreSettings] = useState({ storeName: '', storeAddress: '', storePhone: '', receiptFooter: '' })
  const [fullyPaid, setFullyPaid] = useState(true)
  const [productRefreshKey, setProductRefreshKey] = useState(0)
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.settings.getAll().then((r) => {
      if (r.success && r.data) setStoreSettings({ storeName: r.data.storeName ?? '', storeAddress: r.data.storeAddress ?? '', storePhone: r.data.storePhone ?? '', receiptFooter: r.data.receiptFooter ?? '' })
    })
  }, [])

  const showNotif = useCallback((msg: string) => { setNotification(msg); setTimeout(() => setNotification(''), 3000) }, [])

  useEffect(() => {
    const handler = () => setProductRefreshKey((k) => k + 1)
    window.addEventListener('products:refresh', handler)
    return () => window.removeEventListener('products:refresh', handler)
  }, [])

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

    for (const item of items) {
      const currentProduct = await window.api.products.getById(item.productId)
      if (currentProduct.success && currentProduct.data) {
        const currentStock = currentProduct.data.stock
        if (currentStock < item.quantity) {
          showNotif(`${item.title}: موجودی فعلی ${currentStock} است. نمی‌توان ${item.quantity} عدد فروخت.`)
          setPendingPayment(null)
          return
        }
      }
    }

    const result = await window.api.sales.create({
      userId: user!.id,
      items: items.map((i) => ({ productId: i.productId, productTitle: i.title, quantity: i.quantity, unitPrice: i.unitPrice, purchasePrice: i.purchasePrice })),
      paymentMethod: method,
      customerId: selectedCustomer?.id,
      customerPaid: paidAmt || 0,
    })
    if (result.success && result.data) {
      setLastCustomer(selectedCustomer)
      setSaleComplete(result.data)
      clearCart()
      setSelectedCustomer(null)
      setFullyPaid(true)
      setPendingPayment(null)
      barcodeRef.current?.focus()
    } else { showNotif(`${result.error}`) }
    setPendingPayment(null)
  }, [pendingPayment, items, user, selectedCustomer, lastCustomer, clearCart, showNotif])

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
      if (e.key === 'Escape') { setShowSuspended(false); setShowWebcam(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail
      if (action === 'pos:hold') handleSuspend()
      if (action === 'pos:resume1') handleResume(0)
      if (action === 'pos:resume2') handleResume(1)
      if (action === 'pos:resume3') handleResume(2)
      if (action === 'pos:payCash') handlePaymentComplete('cash')
      if (action === 'pos:payCard') handlePaymentComplete('card')
      if (action === 'pos:payLedger') handlePaymentComplete('ledger')
    }
    window.addEventListener('pos-shortcut', handler)
    return () => window.removeEventListener('pos-shortcut', handler)
  }, [handleSuspend, handleResume, handlePaymentComplete])

  const activeCount = slots.filter((s) => s.items.length > 0).length

  return (
    <div className="h-full flex gap-3 p-3">
      <Notification message={notification} />

      {showWebcam && <WebcamScanner onScan={handleBarcodeScan} onClose={() => setShowWebcam(false)} />}

      {/* Payment Confirmation Modal */}
      {pendingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-8 max-w-sm w-full text-center" style={{ border: `2px solid ${warning}` }}>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: `${warning}20` }}>
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{fa.common.confirm}؟</h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{fa.pos.total}: <span className="font-bold" style={{ color: success }}>{getSubtotal().toLocaleString('fa-IR')} {fa.common.toman}</span></p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{pendingPayment.method === 'cash' ? fa.payment.cash : pendingPayment.method === 'card' ? fa.payment.card : fa.payment.ledger}</p>
            <div className="flex gap-3">
              <button onClick={() => setPendingPayment(null)} className="flex-1 py-3 rounded-xl font-bold text-sm transition-all" style={{ background: `linear-gradient(135deg, ${error}, #dc2626)`, color: '#fff', boxShadow: `0 4px 12px ${error}40` }}>{fa.common.cancel}</button>
              <button onClick={confirmSale} className="flex-1 py-3 rounded-xl font-bold text-sm transition-all" style={{ background: `linear-gradient(135deg, ${success}, #16a34a)`, color: '#fff', boxShadow: `0 4px 12px ${success}40` }}>{fa.common.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Complete Modal */}
      {saleComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-8 max-w-md w-full" style={{ border: `2px solid ${success}` }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${success}, #16a34a)`, boxShadow: `0 4px 16px ${success}40` }}>
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{fa.pos.total}: <span style={{ color: success }}>{saleComplete.total_amount.toLocaleString('fa-IR')} {fa.common.toman}</span></h2>
            </div>
            <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text-secondary)' }}>{fa.receipt.invoice}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{saleComplete.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text-secondary)' }}>{fa.receipt.method}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{saleComplete.paymentMethod === 'cash' ? fa.payment.cash : saleComplete.paymentMethod === 'card' ? fa.payment.card : fa.payment.ledger}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-secondary)' }}>{fa.receipt.date}</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{saleComplete.createdAt?.split('T')[0]}</span>
              </div>
              {saleComplete.items && saleComplete.items.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                  {saleComplete.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-secondary)' }}>{item.productTitle} x{item.quantity}</span>
                      <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.subtotal.toLocaleString('fa-IR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowReceipt(saleComplete); setSaleComplete(null) }} className="flex-1 py-3 rounded-xl font-bold text-sm transition-all" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, color: '#fff', boxShadow: `0 4px 12px ${primary}40` }}>{fa.receipt.print}</button>
              <button
                onClick={() => {
                  if (!saleComplete) return
                  let html = '<h1>فاکتور فروش</h1>'
                  const customerInfo = lastCustomer ? `<div class="header-info"><span>مشتری: ${lastCustomer.name}</span><span>تلفن: ${lastCustomer.phone}</span></div>` : '<div class="header-info"><span>مشتری: ناشناس</span></div>'
                  html += customerInfo
                  html += `<div class="header-info"><span>شماره فاکتور: ${saleComplete.invoiceNumber}</span><span>تاریخ: ${formatJalaliDateTime(saleComplete.createdAt || '')}</span></div>`
                  html += '<table><thead><tr><th>کالا</th><th>تعداد</th><th>قیمت واحد</th><th>جمع</th></tr></thead><tbody>'
                  saleComplete.items?.forEach((item: any) => { html += `<tr><td>${item.productTitle}</td><td>${item.quantity}</td><td>${item.unitPrice.toLocaleString('fa-IR')}</td><td>${item.subtotal.toLocaleString('fa-IR')}</td></tr>` })
                  html += '</tbody></table>'
                  html += `<p><strong>جمع کل: ${saleComplete.total_amount.toLocaleString('fa-IR')} تومان</strong></p>`
                  html += `<p>نوع پرداخت: ${saleComplete.paymentMethod === 'cash' ? 'نقدی' : saleComplete.paymentMethod === 'card' ? 'کارتی' : 'نسیه'}</p>`
                  printA4Report(html, 'فاکتور فروش')
                  setSaleComplete(null)
                }}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, color: '#fff', boxShadow: `0 4px 12px ${primary}40` }}
              >چاپ A4</button>
              <button onClick={() => setSaleComplete(null)} className="flex-1 py-3 rounded-xl font-bold text-sm transition-all" style={{ background: `linear-gradient(135deg, ${success}, #16a34a)`, color: '#fff', boxShadow: `0 4px 12px ${success}40` }}>{fa.common.close}</button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <ReceiptPrinter sale={showReceipt} storeName={storeSettings.storeName} storeAddress={storeSettings.storeAddress} storePhone={storeSettings.storePhone} receiptFooter={storeSettings.receiptFooter} onClose={() => setShowReceipt(null)} />
      )}

      {/* Suspended Invoices Modal */}
      {showSuspended && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{fa.pos.suspendedInvoices} ({activeCount}/3)</h2>
              <button onClick={() => setShowSuspended(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <SuspendedSlots onSelect={handleResume} />
          </div>
        </div>
      )}

      {/* Main Content - Left Panel */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Barcode Scanner Row */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <BarcodeInput ref={barcodeRef} onBarcodeScanned={handleBarcodeScan} onProductSelected={handleProductSelect} />
          </div>
          {showCameraScanner && (
            <button onClick={() => setShowWebcam(true)} className="px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all" style={{ background: `linear-gradient(135deg, ${primary}, #007bb9)`, color: '#fff', boxShadow: `0 4px 12px ${primary}40` }} title={fa.common.webcam}>
              <CameraIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Loose Items & Popular Items */}
        <LooseItemsGrid refreshKey={productRefreshKey} />
        <PopularItems onProductAdd={(p) => {
          if (p.stock <= 0) { showNotif(`${fa.admin.outOfStock}: ${p.title}`); return }
          const ok = addItem({ productId: p.id, title: p.title, unitPrice: p.sale_price, purchasePrice: p.purchase_price, maxStock: p.stock, imageBase64: p.imageBase64 || "" })
          if (ok) showNotif(`${p.title} — ${p.sale_price.toLocaleString('fa-IR')} ${fa.common.toman}`)
          else { showNotif(lastError); clearError() }
        }} refreshKey={productRefreshKey} />

        {/* Cart Table */}
        <div className="card flex-1 overflow-hidden flex flex-col" style={{ padding: 0 }}>
          <CartTable items={items} />
        </div>

        {/* Keyboard Shortcuts */}
        <div className="flex gap-4 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
          <span>F4: {fa.pos.hold}</span>
          <span>F5-F7: {fa.pos.resume}</span>
          <span>Enter: {fa.pos.add}</span>
        </div>
      </div>

      {/* Right Panel - Payment */}
      <div className="w-80 flex flex-col gap-2 shrink-0">
        {/* Subtotal Card */}
        <div className="card">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{fa.pos.subtotal}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${success}20`, color: success }}>{items.length} {fa.pos.items}</span>
          </div>
          <div className="text-3xl font-extrabold mb-3" style={{ color: success }}>{getSubtotal().toLocaleString('fa-IR')} <span className="text-sm font-bold">{fa.common.toman}</span></div>

          <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
            <label className="text-xs font-bold cursor-pointer" style={{ color: 'var(--text-primary)' }}>
              {fa.pos.fullAmount}
            </label>
            <button onClick={() => setFullyPaid(!fullyPaid)}
              className="relative w-12 h-6 rounded-full transition-all duration-200"
              style={{ backgroundColor: fullyPaid ? success : 'var(--bg-tertiary)', boxShadow: fullyPaid ? `0 2px 8px ${success}40` : 'none' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200"
                style={{ left: fullyPaid ? '24px' : '2px' }} />
            </button>
          </div>
        </div>

        {/* Payment Panel */}
        <PaymentPanel
          onPaymentComplete={handlePaymentComplete}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          fullyPaid={fullyPaid}
        />

        {/* Suspended Slots Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => {
            const hasItems = slots[i].items.length > 0
            return (
              <button key={i} onClick={() => hasItems ? handleResume(i) : handleSuspend(i)}
                className="text-[10px] py-2.5 rounded-xl font-bold transition-all duration-200"
                style={{
                  background: hasItems
                    ? `linear-gradient(135deg, ${warning}, #d97706)`
                    : 'var(--bg-tertiary)',
                  color: hasItems ? '#fff' : 'var(--text-muted)',
                  boxShadow: hasItems ? `0 2px 8px ${warning}30` : 'none',
                }}>
                {hasItems ? `${fa.pos.slot} ${i + 1} (${slots[i].items.length})` : `${fa.pos.slot} ${i + 1}`}
              </button>
            )
          })}
        </div>

        {/* View All Slots */}
        <button onClick={() => setShowSuspended(true)}
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}>
          {fa.pos.viewSlots}
        </button>
      </div>
    </div>
  )
}
