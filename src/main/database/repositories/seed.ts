import { getDatabase } from '../connection'
import { postSaleJournal, postExpenseJournal, postReturnJournal } from './journal'

const products = [
  { title: 'شیر کاله 1 لیتری', category: 'لبنیات', unit: 'number', purchase_price: 28000, sale_price: 32000, stock: 150, minStock: 20 },
  { title: 'ماست چکیده دامک', category: 'لبنیات', unit: 'number', purchase_price: 35000, sale_price: 42000, stock: 80, minStock: 15 },
  { title: 'پنیر سفید 400g', category: 'لبنیات', unit: 'number', purchase_price: 45000, sale_price: 55000, stock: 60, minStock: 10 },
  { title: 'کره چغaders', category: 'لبنیات', unit: 'number', purchase_price: 52000, sale_price: 62000, stock: 40, minStock: 8 },
  { title: 'برنج ایرانی 10kg', category: 'خشکبار', unit: 'number', purchase_price: 280000, sale_price: 340000, stock: 25, minStock: 5 },
  { title: 'روغن لادن 1.5 لیتر', category: 'خشکبار', unit: 'number', purchase_price: 95000, sale_price: 115000, stock: 50, minStock: 10 },
  { title: 'شکر سفید 2kg', category: 'خشکبار', unit: 'number', purchase_price: 42000, sale_price: 52000, stock: 70, minStock: 15 },
  { title: 'چای احمد 500g', category: 'خشکبار', unit: 'number', purchase_price: 120000, sale_price: 145000, stock: 35, minStock: 8 },
  { title: 'رب گوجه 400g', category: 'کنسروجات', unit: 'number', purchase_price: 38000, sale_price: 48000, stock: 90, minStock: 20 },
  { title: 'تن ماهی 180g', category: 'کنسروجات', unit: 'number', purchase_price: 55000, sale_price: 68000, stock: 45, minStock: 10 },
  { title: 'ماکارونی زر', category: 'خشکبار', unit: 'number', purchase_price: 22000, sale_price: 28000, stock: 100, minStock: 20 },
  { title: 'سس کچاپ', category: 'کنسروجات', unit: 'number', purchase_price: 32000, sale_price: 40000, stock: 55, minStock: 12 },
  { title: 'آب معدنی 1.5L', category: 'نوشیدنی', unit: 'number', purchase_price: 8000, sale_price: 12000, stock: 200, minStock: 50 },
  { title: 'دلستر موزی 330ml', category: 'نوشیدنی', unit: 'number', purchase_price: 15000, sale_price: 20000, stock: 80, minStock: 20 },
  { title: 'نوشابه زمزم', category: 'نوشیدنی', unit: 'number', purchase_price: 12000, sale_price: 16000, stock: 120, minStock: 30 },
  { title: 'دستمال کاغذی 6 تایی', category: 'بهداشتی', unit: 'number', purchase_price: 45000, sale_price: 58000, stock: 60, minStock: 15 },
  { title: 'مایع ظرفشویی', category: 'بهداشتی', unit: 'number', purchase_price: 35000, sale_price: 45000, stock: 40, minStock: 10 },
  { title: 'شامپو 400ml', category: 'بهداشتی', unit: 'number', purchase_price: 65000, sale_price: 82000, stock: 30, minStock: 8 },
  { title: 'بیسکوئیت پتی\u200cبور', category: 'تنقلات', unit: 'number', purchase_price: 18000, sale_price: 24000, stock: 100, minStock: 25 },
  { title: 'شکلات رندر', category: 'تنقلات', unit: 'number', purchase_price: 28000, sale_price: 35000, stock: 70, minStock: 15 },
]

const expenseCategories = [
  { category: 'اجاره', min: 5000000, max: 5000000 },
  { category: 'قبوض', min: 500000, max: 1500000 },
  { category: 'حقوق', min: 8000000, max: 12000000 },
  { category: 'لوازم', min: 200000, max: 800000 },
  { category: 'تعمیرات', min: 100000, max: 500000 },
  { category: 'حمل\u200cونقل', min: 50000, max: 300000 },
  { category: 'سایر', min: 30000, max: 200000 },
]

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDateTime(daysBack: number): string {
  const d = new Date(Date.now() - Math.floor(Math.random() * daysBack) * 86400000)
  d.setHours(randInt(8, 20), randInt(0, 59), randInt(0, 59))
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

export function seedDemoData(): boolean {
  const db = getDatabase()

  const existing = db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }
  if (existing.c > 0) return false

  const seedTx = db.transaction(() => {
    const insertProduct = db.prepare(
      'INSERT INTO products (barcode, title, category, unit, purchase_price, sale_price, stock, minStock, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)'
    )
    const productIds: number[] = []
    for (let i = 0; i < products.length; i++) {
      const p = products[i]
      const barcode = `PRD-${String(i + 1).padStart(6, '0')}`
      const r = insertProduct.run(barcode, p.title, p.category, p.unit, p.purchase_price, p.sale_price, p.stock, p.minStock)
      productIds.push(r.lastInsertRowid as number)
    }

    const insertCustomer = db.prepare('INSERT INTO customers (name, phone, address, notes) VALUES (?, ?, ?, ?)')
    const customerIds: number[] = []
    const customerData = [
      { name: 'علی محمدی', phone: '09121234567', address: 'تهران، خیابان ولیعصر', notes: 'مشتری دائمی' },
      { name: 'سارا احمدی', phone: '09351234567', address: 'تهران، خیابان آزادی', notes: '' },
      { name: 'رضا کریمی', phone: '09191234567', address: '', notes: 'مشتری عمده' },
      { name: 'نیلوفر حسینی', phone: '09011234567', address: 'اصفهان', notes: '' },
      { name: 'امیر رضایی', phone: '09221234567', address: 'تهران، منطقه ۵', notes: 'مشتری جدید' },
    ]
    for (const c of customerData) {
      const r = insertCustomer.run(c.name, c.phone, c.address, c.notes)
      customerIds.push(r.lastInsertRowid as number)
    }

    const allProductRows = db.prepare('SELECT id, title, purchase_price, sale_price FROM products WHERE isActive = 1').all() as { id: number; title: string; purchase_price: number; sale_price: number }[]

    const insertSale = db.prepare(
      'INSERT INTO sales (invoiceNumber, userId, customerId, subtotal, total_amount, totalNetProfit, paymentMethod, customerPaid, changeAmount, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)'
    )
    const insertSaleItem = db.prepare(
      'INSERT INTO sale_items (saleId, productId, productTitle, quantity, unitPrice, purchasePrice, subtotal, netProfit, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertLedger = db.prepare(
      'INSERT INTO customer_ledger (customerId, saleId, type, amount, description, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    )
    const updateBalance = db.prepare('UPDATE customers SET balance = balance + ? WHERE id = ?')
    const decrementStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')

    const saleIds: number[] = []
    for (let i = 0; i < 30; i++) {
      const saleDate = randomDateTime(60)
      const dateStr = saleDate.slice(0, 10)
      const numItems = randInt(2, 5)
      const shuffled = [...allProductRows].sort(() => Math.random() - 0.5)
      const selectedProducts = shuffled.slice(0, numItems)

      const methods = ['cash', 'cash', 'cash', 'card', 'card', 'card', 'ledger', 'ledger']
      const paymentMethod = methods[randInt(0, methods.length - 1)] as 'cash' | 'card' | 'ledger'
      const customerId = paymentMethod === 'ledger' ? customerIds[randInt(0, customerIds.length - 1)] : null

      let subtotal = 0
      const itemsForJournal: { purchasePrice: number; quantity: number }[] = []

      for (const p of selectedProducts) {
        const qty = randInt(1, 5)
        const lineSubtotal = p.sale_price * qty
        subtotal += lineSubtotal
        itemsForJournal.push({ purchasePrice: p.purchase_price, quantity: qty })
        decrementStock.run(qty, p.id, qty)
        insertSaleItem.run(null, p.id, p.title, qty, p.sale_price, p.purchase_price, lineSubtotal, 0, saleDate)
      }

      const invoiceDate = dateStr.replace(/-/g, '')
      const invoiceNumber = `INV-${invoiceDate}-${String(i + 1).padStart(4, '0')}`
      const customerPaid = paymentMethod === 'cash' ? subtotal : 0
      const changeAmount = 0

      const saleResult = insertSale.run(invoiceNumber, 1, customerId, subtotal, subtotal, paymentMethod, customerPaid, changeAmount, saleDate)
      const saleId = saleResult.lastInsertRowid as number
      saleIds.push(saleId)

      db.prepare('UPDATE sale_items SET saleId = ? WHERE saleId IS NULL AND createdAt = ?').run(saleId, saleDate)
      db.prepare('UPDATE sales SET totalNetProfit = ? WHERE id = ?').run(
        itemsForJournal.reduce((s, it) => s + (it.purchasePrice * it.quantity), 0),
        saleId
      )

      if (paymentMethod === 'ledger' && customerId) {
        updateBalance.run(-subtotal, customerId)
        insertLedger.run(customerId, saleId, 'sale', subtotal, `خرید فاکتور ${invoiceNumber}`, saleDate)
      }

      postSaleJournal(saleId, dateStr, { items: itemsForJournal, total_amount: subtotal, paymentMethod })
    }

    const insertExpense = db.prepare(
      'INSERT INTO expenses (category, description, amount, date, createdAt) VALUES (?, ?, ?, ?, ?)'
    )
    for (let i = 0; i < 15; i++) {
      const expDate = randomDateTime(60)
      const dateStr = expDate.slice(0, 10)
      const cat = expenseCategories[i % expenseCategories.length]
      const amount = randInt(cat.min, cat.max)
      const r = insertExpense.run(cat.category, `${cat.category} دوره‌ای`, amount, dateStr, expDate)
      const expenseId = r.lastInsertRowid as number
      postExpenseJournal(expenseId, dateStr, amount, cat.category)
    }

    const saleRows = db.prepare('SELECT id, userId, subtotal, total_amount, createdAt FROM sales ORDER BY RANDOM() LIMIT 3').all() as { id: number; userId: number; subtotal: number; total_amount: number; createdAt: string }[]
    const insertReturn = db.prepare(
      'INSERT INTO returns (saleId, userId, productId, quantity, reason, refundAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    for (let i = 0; i < Math.min(3, saleRows.length); i++) {
      const sale = saleRows[i]
      const saleItems = db.prepare('SELECT * FROM sale_items WHERE saleId = ?').all(sale.id) as { productId: number; productTitle: string; quantity: number; unitPrice: number }[]
      if (saleItems.length === 0) continue
      const item = saleItems[0]
      const returnQty = 1
      const refundAmount = item.unitPrice * returnQty
      const returnDate = randomDateTime(30)
      const returnId = (insertReturn.run(sale.id, sale.userId, item.productId, returnQty, 'مرجوعی', refundAmount, 'completed', returnDate).lastInsertRowid as number)

      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(returnQty, item.productId)
      db.prepare('UPDATE sales SET total_amount = total_amount - ?, totalNetProfit = totalNetProfit - ? WHERE id = ?').run(refundAmount, refundAmount, sale.id)

      postReturnJournal(returnId, returnDate.slice(0, 10), refundAmount)
    }
  })

  seedTx()
  return true
}
