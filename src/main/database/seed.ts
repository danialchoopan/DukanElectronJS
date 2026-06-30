import { getDatabase, hashPin } from './connection'
import { createCategory } from './repositories/categories'
import { postSaleJournal, postExpenseJournal, postReturnJournal } from './repositories/journal'
import { createPeriod } from './repositories/periods'
import { createAuditEntry } from './repositories/audit'

export function seedDatabase(): void {
  const db = getDatabase()

  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (userCount.c > 1) return

  console.log('[SEED] Seeding database...')

  const insertUser = db.prepare('INSERT INTO users (name, pin_code, role) VALUES (?, ?, ?)')
  insertUser.run('علی', hashPin('1234'), 'admin')
  insertUser.run('محمد', hashPin('1111'), 'cashier')
  insertUser.run('زهرا', hashPin('2222'), 'cashier')
  insertUser.run('حسن', hashPin('3333'), 'cashier')
  createAuditEntry(1, 'create', 'user', 1, 'ایجاد ۴ کاربر پیش‌فرض')

  const dairy = createCategory('لبنیات')
  createCategory('شیر', dairy.id); createCategory('ماست', dairy.id); createCategory('پنیر', dairy.id); createCategory('خامه', dairy.id); createCategory('بستنی', dairy.id)
  const bread = createCategory('نان و نانوا')
  createCategory('نان سنگک', bread.id); createCategory('نان بربری', bread.id); createCategory('نان لواش', bread.id)
  const dry = createCategory('خشکبار')
  createCategory('برنج', dry.id); createCategory('حبوبات', dry.id); createCategory('آجیل', dry.id); createCategory('ادویه‌جات', dry.id)
  createCategory('روغن و چربی')
  const can = createCategory('کنسروجات')
  createCategory('تن ماهی', can.id); createCategory('رب گوجه', can.id); createCategory('سس', can.id)
  const drink = createCategory('نوشیدنی')
  createCategory('آب معدنی', drink.id); createCategory('نوشابه', drink.id); createCategory('دلستر', drink.id)
  const snack = createCategory('تنقلات')
  createCategory('چیپس', snack.id); createCategory('پفک', snack.id); createCategory('بیسکوییت', snack.id); createCategory('شکلات', snack.id)
  const hygiene = createCategory('بهداشتی')
  createCategory('شامپو', hygiene.id); createCategory('صابون', hygiene.id); createCategory('خمیردندان', hygiene.id)
  createCategory('شوینده')
  const protein = createCategory('پروتئین')
  createCategory('گوشت قرمز', protein.id); createCategory('مرغ', protein.id); createCategory('تخم‌مرغ', protein.id)
  createCategory('میوه')
  createCategory('سبزیجات')
  const sweet = createCategory('شیرینی')
  createCategory('کیک', sweet.id); createCategory('شیرینی خشک', sweet.id)
  createCategory('ماکارونی')
  createAuditEntry(1, 'create', 'category', null, 'ایجاد دسته‌بندی‌ها')

  const insertProduct = db.prepare('INSERT INTO products (barcode, title, category, subcategory, unit, purchase_price, sale_price, stock, minStock, isLoose, isSellable, has_expiry, expiry_date, expiry_alert_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)')
  const today = new Date()
  const expiryDate = (daysOffset: number) => { const d = new Date(today); d.setDate(d.getDate() + daysOffset); return d.toISOString().slice(0, 10) }
  const products: [string, string, string, string, string, number, number, number, number, number, number, string, number][] = [
    ['6260123456789', 'شیر کاله ۱ لیتری', 'شیر', '', 'number', 28000, 32000, 50, 10, 0, 1, expiryDate(5), 7],
    ['6260123456790', 'ماست چکیده میهن', 'ماست', '', 'number', 18000, 22000, 40, 8, 0, 1, expiryDate(12), 7],
    ['6260123456791', 'پنیر پیتزا کاله', 'پنیر', '', 'number', 35000, 42000, 25, 5, 0, 1, expiryDate(20), 14],
    ['6260123456792', 'خامه صادقی', 'خامه', '', 'number', 22000, 28000, 12, 3, 0, 1, expiryDate(3), 5],
    ['6260123456793', 'بستنی وانیلی', 'بستنی', '', 'number', 15000, 22000, 15, 3, 0, 1, expiryDate(25), 14],
    ['6260123456794', 'نان سنگک', 'نان سنگک', '', 'number', 8000, 12000, 30, 5, 1, 0, expiryDate(-2), 3],
    ['6260123456795', 'نان بربری', 'نان بربری', '', 'number', 6000, 10000, 40, 5, 1, 0, expiryDate(1), 3],
    ['6260123456796', 'نان تافتون', 'نان لواش', '', 'number', 5000, 8000, 50, 5, 1, 0, expiryDate(0), 3],
    ['6260123456797', 'برنج ایرانی', 'برنج', '', 'number', 85000, 98000, 20, 5, 0, 0, expiryDate(180), 30],
    ['6260123456798', 'شکر سفید', 'خشکبار', '', 'number', 45000, 52000, 25, 5, 0, 0, expiryDate(365), 30],
    ['6260123456799', 'روغن لادن', 'روغن و چربی', '', 'number', 120000, 135000, 15, 3, 0, 0, expiryDate(365), 30],
    ['6260123456800', 'رب گوجه رعنا', 'رب گوجه', '', 'number', 32000, 38000, 20, 5, 0, 1, expiryDate(120), 30],
    ['6260123456801', 'ماکارونی زر', 'ماکارونی', '', 'number', 15000, 18000, 35, 5, 0, 0, expiryDate(365), 30],
    ['6260123456802', 'چای احمد', 'نوشیدنی', '', 'number', 65000, 78000, 12, 3, 0, 0, expiryDate(365), 30],
    ['6260123456803', 'نسکافه', 'نوشیدنی', '', 'number', 95000, 110000, 8, 2, 0, 0, expiryDate(365), 30],
    ['6260123456804', 'آب معدنی', 'آب معدنی', '', 'number', 5000, 8000, 60, 10, 0, 0, expiryDate(180), 30],
    ['6260123456805', 'دلستر فوکا', 'دلستر', '', 'number', 12000, 15000, 24, 5, 0, 0, expiryDate(90), 30],
    ['6260123456806', 'پفک نمکی', 'پفک', '', 'number', 18000, 22000, 20, 4, 0, 0, expiryDate(60), 14],
    ['6260123456807', 'چیپس سیب‌زمینی', 'چیپس', '', 'number', 15000, 19000, 25, 5, 0, 0, expiryDate(45), 14],
    ['6260123456808', 'بیسکوییت', 'بیسکوییت', '', 'number', 12000, 15000, 30, 5, 0, 0, expiryDate(90), 14],
    ['6260123456809', 'شکلات تابلیون', 'شکلات', '', 'number', 28000, 35000, 15, 3, 0, 0, expiryDate(90), 14],
    ['6260123456810', 'خمیر دندان', 'خمیردندان', '', 'number', 35000, 42000, 12, 3, 0, 0, expiryDate(730), 30],
    ['6260123456811', 'صابون', 'صابون', '', 'number', 12000, 18000, 20, 5, 0, 0, expiryDate(730), 30],
    ['6260123456812', 'شامپو', 'شامپو', '', 'number', 55000, 68000, 10, 3, 0, 0, expiryDate(730), 30],
    ['6260123456813', 'مایع ظرفشویی', 'شوینده', '', 'number', 42000, 52000, 15, 3, 0, 0, expiryDate(730), 30],
    ['6260123456814', 'پودر لباسشویی', 'شوینده', '', 'number', 78000, 92000, 8, 2, 0, 0, expiryDate(730), 30],
    ['6260123456815', 'تخم مرغ شانه‌ای', 'تخم‌مرغ', '', 'number', 65000, 78000, 15, 3, 0, 1, expiryDate(14), 7],
    ['6260123456816', 'مرغ منجمد', 'مرغ', '', 'number', 95000, 115000, 10, 2, 0, 1, expiryDate(90), 14],
    ['6260123456817', 'سوسیس', 'پروتئین', '', 'number', 42000, 52000, 12, 3, 0, 1, expiryDate(10), 7],
    ['6260123456818', 'سیب سبز', 'میوه', '', 'weight', 35000, 45000, 40, 8, 1, 1, expiryDate(7), 3],
    ['6260123456819', 'موز', 'میوه', '', 'weight', 55000, 68000, 30, 5, 1, 1, expiryDate(5), 3],
    ['6260123456820', 'گوجه فرنگی', 'سبزیجات', '', 'weight', 20000, 28000, 30, 5, 1, 1, expiryDate(4), 3],
  ]

  db.transaction(() => { for (const p of products) insertProduct.run(...p) })()
  createAuditEntry(1, 'create', 'product', null, `ایجاد ${products.length} محصول`)

  const insertCustomer = db.prepare('INSERT INTO customers (name, phone, address, notes, customerType, description) VALUES (?, ?, ?, ?, ?, ?)')
  const customerData = [
    { name: 'احمد محمدی', phone: '09121234567', address: 'تهران، خیابان ولیعصر، پلاک ۳۴', notes: 'مشتری دائمی', customerType: 'real', description: 'خریدار عمده لبنیات و نوشیدنی' },
    { name: 'فاطمه رضایی', phone: '09351234567', address: 'تهران، خیابان انقلاب، کوچه شیرزاد', notes: '', customerType: 'real', description: '' },
    { name: 'رضا عباسی', phone: '09191234567', address: 'شیراز، خیابان سعدی', notes: 'مشتری عمده', customerType: 'legal', description: 'شرکت تجاری عباسی و شرکا' },
    { name: 'شرکت تجارت ساحل', phone: '02112345678', address: 'تهران، خیابان شریعتی، بالاتر از میرداماد', notes: 'خرید عمده', customerType: 'legal', description: 'واردکننده مواد غذایی' },
    { name: 'زهرا کریمی', phone: '09123456789', address: 'اصفهان، چهارباغ عباسی', notes: '', customerType: 'real', description: '' },
    { name: 'حسین رحمانی', phone: '09155443322', address: 'تهران، شهرک غرب', notes: 'خرید هفتگی', customerType: 'real', description: 'دارای فروشگاه زنجیره‌ای' },
    { name: 'فروشگاه رفاه شعبه ۲', phone: '02187654321', address: 'تهران، میدان ونک', notes: 'مشتری تجاری', customerType: 'legal', description: 'سفارشات هفتگی کالاهای اساسی' },
    { name: 'مریم صادقی', phone: '09188776655', address: 'مشهد، بلوار وکیل‌آباد', notes: '', customerType: 'real', description: '' },
  ]
  const custIds: number[] = []
  for (const c of customerData) {
    const r = insertCustomer.run(c.name, c.phone, c.address, c.notes, c.customerType, c.description)
    custIds.push(r.lastInsertRowid as number)
  }
  createAuditEntry(1, 'create', 'customer', null, `ایجاد ${customerData.length} مشتری`)

  const existingExpCat = db.prepare('SELECT COUNT(*) as c FROM expenses').get() as { c: number }
  if (existingExpCat.c === 0) {
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('اجاره', 'اجاره ماهانه فروشگاه', 15000000, getDateDaysAgo(30))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('قبوض', 'قبض برق مهر ماه', 1850000, getDateDaysAgo(25))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('قبوض', 'قبض آب', 450000, getDateDaysAgo(25))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('حقوق', 'حقوق علی (مدیر)', 12000000, getDateDaysAgo(20))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('حقوق', 'حقوق محمد', 8000000, getDateDaysAgo(20))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('حقوق', 'حقوق زهرا', 8000000, getDateDaysAgo(20))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('حقوق', 'حقوق حسن', 8000000, getDateDaysAgo(20))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('لوازم', 'خرید کیسه فریزر و نایلون', 350000, getDateDaysAgo(15))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('تعمیرات', 'تعمیر یخچال فروشگاهی', 1200000, getDateDaysAgo(10))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('حمل‌ونقل', 'کرایه حمل بار', 250000, getDateDaysAgo(8))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('سایر', 'خرید لوازم التحریر', 85000, getDateDaysAgo(5))
    db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('اجاره', 'اجاره ماهانه فروشگاه', 15000000, getDateDaysAgo(0))
    const allExp = db.prepare('SELECT id, amount, category, date FROM expenses').all() as { id: number; amount: number; category: string; date: string }[]
    for (const e of allExp) {
      postExpenseJournal(e.id, e.date, e.amount, e.category)
    }
  }
  createAuditEntry(1, 'create', 'expense', null, 'ایجاد ۱۲ هزینه با سند حسابداری')

  function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function randomDateTime(daysBack: number): string {
    const d = new Date()
    d.setDate(d.getDate() - randInt(1, daysBack))
    d.setHours(randInt(8, 20), randInt(0, 59), randInt(0, 59))
    return d.toISOString().slice(0, 19).replace('T', ' ')
  }

  function getDateDaysAgo(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() - days)
    d.setHours(randInt(8, 20), randInt(0, 59), randInt(0, 59))
    return d.toISOString().slice(0, 19).replace('T', ' ')
  }

  const existingSaleCount = db.prepare('SELECT COUNT(*) as c FROM sales').get() as { c: number }
  if (existingSaleCount.c === 0) {
    const insertSale = db.prepare('INSERT INTO sales (invoiceNumber, userId, customerId, subtotal, total_amount, totalNetProfit, paymentMethod, customerPaid, changeAmount, createdAt, saleType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const insertSaleItem = db.prepare('INSERT INTO sale_items (saleId, productId, productTitle, quantity, unitPrice, purchasePrice, subtotal, netProfit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')

    const userIds = db.prepare('SELECT id FROM users').all() as { id: number }[]
    const allProducts = db.prepare('SELECT id, title, purchase_price, sale_price FROM products WHERE isActive = 1').all() as { id: number; title: string; purchase_price: number; sale_price: number }[]

    const methods: string[] = ['cash', 'card', 'ledger']
    const saleIds: number[] = []

    const salesTx = db.transaction(() => {
      for (let day = 0; day < 45; day++) {
        const numSales = randInt(1, 3)
        for (let s = 0; s < numSales; s++) {
          const saleDate = randomDateTime(day + 1)
          const userId = userIds[randInt(0, userIds.length - 1)].id
          const paymentMethod = methods[randInt(0, methods.length - 1)]
          const customerId = paymentMethod === 'ledger' ? custIds[randInt(0, custIds.length - 1)] : (Math.random() > 0.3 ? custIds[randInt(0, custIds.length - 1)] : null)

          const numItems = randInt(2, 5)
          const pickedItems: { id: number; title: string; purchase_price: number; sale_price: number; qty: number }[] = []
          const usedIds = new Set<number>()
          for (let i = 0; i < numItems && i < allProducts.length; i++) {
            let idx: number
            do { idx = randInt(0, allProducts.length - 1) } while (usedIds.has(allProducts[idx].id))
            usedIds.add(allProducts[idx].id)
            pickedItems.push({ ...allProducts[idx], qty: randInt(1, 3) })
          }

          let subtotal = 0
          let totalCogs = 0
          const journalItems: { purchasePrice: number; quantity: number }[] = []
          for (const item of pickedItems) {
            const lineTotal = item.sale_price * item.qty
            subtotal += lineTotal
            totalCogs += item.purchase_price * item.qty
            journalItems.push({ purchasePrice: item.purchase_price, quantity: item.qty })
          }
          const netProfit = subtotal - totalCogs
          const invoiceNum = `INV-${saleDate.replace(/[-: ]/g, '').slice(0, 14)}-${s}`
          const saleType = Math.random() > 0.3 ? 'in-person' : 'online'

          const r = insertSale.run(invoiceNum, userId, customerId, subtotal, subtotal, netProfit, paymentMethod, paymentMethod === 'ledger' ? 0 : subtotal, 0, saleDate, saleType)
          const saleId = r.lastInsertRowid as number
          saleIds.push(saleId)

          for (const item of pickedItems) {
            insertSaleItem.run(saleId, item.id, item.title, item.qty, item.sale_price, item.purchase_price, item.sale_price * item.qty, (item.sale_price - item.purchase_price) * item.qty)
          }

          if (paymentMethod === 'ledger' && customerId) {
            db.prepare('UPDATE customers SET balance = balance - ? WHERE id = ?').run(subtotal, customerId)
            db.prepare("INSERT INTO customer_ledger (customerId, saleId, type, amount, description, createdAt) VALUES (?, ?, 'sale', ?, ?, ?)").run(customerId, saleId, subtotal, `فاکتور ${invoiceNum}`, saleDate)
          }

          postSaleJournal(saleId, saleDate, {
            items: journalItems,
            total_amount: subtotal,
            paymentMethod,
          })
        }
      }
    })
    salesTx()
    createAuditEntry(1, 'create', 'sale', null, `ایجاد ${saleIds.length} فاکتور فروش با سند حسابداری`)

    if (saleIds.length >= 3) {
      const insertReturn = db.prepare('INSERT INTO returns (saleId, userId, productId, quantity, reason, refundAmount, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      for (let i = 0; i < 3; i++) {
        const randomSale = db.prepare('SELECT id, userId, createdAt FROM sales ORDER BY RANDOM() LIMIT 1').get() as { id: number; userId: number; createdAt: string } | undefined
        if (!randomSale) continue
        const saleItems = db.prepare('SELECT * FROM sale_items WHERE saleId = ?').all(randomSale.id) as { id: number; productId: number; productTitle: string; quantity: number; unitPrice: number; purchasePrice: number }[]
        if (saleItems.length === 0) continue
        const item = saleItems[0]
        const returnQty = Math.min(1, item.quantity)
        const refundAmount = item.unitPrice * returnQty
        const returnDate = randomDateTime(15)
        const retId = insertReturn.run(randomSale.id, randomSale.userId, item.productId, returnQty, 'خرید اشتباهی', refundAmount, 'completed', returnDate).lastInsertRowid as number
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(returnQty, item.productId)
        db.prepare('UPDATE sales SET total_amount = total_amount - ?, totalNetProfit = totalNetProfit - ? WHERE id = ?').run(refundAmount, refundAmount, randomSale.id)
        postReturnJournal(retId as number, returnDate, refundAmount)
      }
      createAuditEntry(1, 'create', 'return', null, 'ایجاد ۳ مرجوعی با سند حسابداری')
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

  const existingPeriods = db.prepare('SELECT COUNT(*) as c FROM fiscal_periods').get() as { c: number }
  if (existingPeriods.c === 0) {
    for (let i = 0; i < 12; i++) {
      const start = `${year}-${String(i + 1).padStart(2, '0')}-01`
      const end = new Date(year, i + 1, 0).toISOString().slice(0, 10)
      createPeriod(monthNames[i] + ' ' + year, start, end)
    }
    createAuditEntry(1, 'create', 'fiscal_period', null, 'ایجاد ۱۲ دوره مالی ماهانه')
  }

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('isSetupComplete', 'true')").run()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('storeName', 'فروشگاه نمونه')").run()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', 'dark')").run()

  // Seed suppliers and purchases
  const existingSuppliers = (db.prepare('SELECT COUNT(*) as c FROM suppliers').get() as { c: number }).c
  if (existingSuppliers === 0) {
    const suppliers = [
      { name: 'شرکت پخش البرز', phone: '02188881111', company: 'پخش البرز' },
      { name: 'عمده فروشی رضا', phone: '02177772222', company: 'رضا عمده' },
      { name: 'ترخیص کاری نوین', phone: '02166663333', company: 'نوین ترخیص' },
      { name: 'پخش مواد غذایی سعادت', phone: '02155554444', company: 'سعادت' },
      { name: 'تکنوسان', phone: '02199995555', company: 'تکنوسان' },
    ]
    const insertSupplier = db.prepare('INSERT INTO suppliers (name, phone, company) VALUES (?, ?, ?)')
    const insertLedger = db.prepare('INSERT INTO supplier_ledger (supplierId, type, amount, description, createdAt) VALUES (?, ?, ?, ?, ?)')
    const insertPurchase = db.prepare('INSERT INTO purchases (invoiceNumber, supplierId, subtotal, taxAmount, discountAmount, totalAmount, paidAmount, paymentMethod, status, purchaseDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const insertPurchaseItem = db.prepare('INSERT INTO purchase_items (purchaseId, productId, productTitle, quantity, unitCost, subtotal) VALUES (?, ?, ?, ?, ?, ?)')

    const allProducts = db.prepare('SELECT id, title, purchase_price FROM products WHERE isActive = 1').all() as any[]

    db.transaction(() => {
      for (let i = 0; i < suppliers.length; i++) {
        const s = suppliers[i]
        const r = insertSupplier.run(s.name, s.phone, s.company)
        const supId = r.lastInsertRowid as number

        // Create 1-3 purchases per supplier
        const purchaseCount = 1 + Math.floor(Math.random() * 3)
        for (let j = 0; j < purchaseCount; j++) {
          const items = allProducts.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3))
          let subtotal = 0
          const purchaseItems: any[] = []
          for (const p of items) {
            const qty = 10 + Math.floor(Math.random() * 90)
            const cost = p.purchase_price * (0.85 + Math.random() * 0.3)
            const sub = qty * cost
            subtotal += sub
            purchaseItems.push({ productId: p.id, title: p.title, qty, cost, sub })
          }
          const tax = Math.round(subtotal * 0.09)
          const discount = Math.round(subtotal * (Math.random() * 0.05))
          const total = subtotal + tax - discount
          const paid = j === 0 ? total : 0 // first purchase paid, rest credit
          const daysAgo = Math.floor(Math.random() * 30)
          const purchaseDate = getDateDaysAgo(daysAgo)
          const invNum = `PUR-${purchaseDate.slice(0, 10).replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}-${String(j + 1).padStart(2, '0')}`

          const pR = insertPurchase.run(invNum, supId, Math.round(subtotal), tax, discount, Math.round(total), paid, paid >= total ? 'cash' : 'credit', 'received', purchaseDate)
          const pId = pR.lastInsertRowid as number

          for (const pi of purchaseItems) {
            insertPurchaseItem.run(pId, pi.productId, pi.title, pi.qty, Math.round(pi.cost), Math.round(pi.sub))
          }

          // Update stock
          for (const pi of purchaseItems) {
            db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(pi.qty, pi.productId)
          }

          // Ledger entries
          if (total - paid > 0) {
            insertLedger.run(supId, 'purchase', Math.round(total - paid), `خرید فاکتور ${invNum}`, purchaseDate)
          }
          if (paid > 0) {
            insertLedger.run(supId, 'payment', -paid, `پرداخت فاکتور ${invNum}`, purchaseDate)
          }
        }
      }
    })()
    createAuditEntry(1, 'create', 'supplier', null, 'ایجاد ۵ تأمین‌کننده نمونه با خریدها')
  }

  // ═══ Seed: New Features ════════════════════════════════
  const existingProducts = db.prepare('SELECT COUNT(*) as c FROM products WHERE isActive = 1').get() as any
  const existingCustomers = db.prepare('SELECT COUNT(*) as c FROM customers WHERE isActive = 1').get() as any

  // Seed Cross-Sell Rules
  const existingRules = (db.prepare('SELECT COUNT(*) as c FROM cross_sell_rules').get() as { c: number }).c
  if (existingRules === 0 && existingProducts.c > 0) {
    const rule1 = db.prepare("INSERT INTO cross_sell_rules (name, triggerType, triggerValue, ruleType, priority, createdBy) VALUES (?, ?, ?, ?, ?, 'admin')").run('لبنیات + نان', 'category', 'لبنیات', 'recommended', 1)
    const rule2 = db.prepare("INSERT INTO cross_sell_rules (name, triggerType, triggerValue, ruleType, priority, createdBy) VALUES (?, ?, ?, ?, ?, 'admin')").run('آب معدنی + میان‌وعده', 'category', 'نوشیدنی', 'optional', 2)
    db.prepare("INSERT INTO cross_sell_rules (name, triggerType, triggerValue, triggerCondition, triggerThreshold, ruleType, priority, createdBy) VALUES (?, ?, '', '>=', ?, ?, ?, 'admin')").run('خرید بالای ۲۰۰ هزار', 'price', 200000, 'mandatory', 0)

    // Add items to rules
    const insertRuleItem = db.prepare('INSERT INTO cross_sell_rule_items (ruleId, productId, quantity, discountPercent) VALUES (?, ?, ?, ?)')
    const allProdRows = db.prepare('SELECT id, category FROM products WHERE isActive = 1').all() as { id: number; category: string }[]
    const nanProducts = allProdRows.filter(p => p.category === 'نان سنگک' || p.category === 'نان بربری' || p.category === 'نان لواش')
    if (nanProducts.length > 0) {
      insertRuleItem.run(rule1.lastInsertRowid, nanProducts[0].id, 1, 10)
    }
    const drinkProducts = allProdRows.filter(p => p.category === 'پفک' || p.category === 'چیپس' || p.category === 'شکلات')
    if (drinkProducts.length > 0) {
      insertRuleItem.run(rule2.lastInsertRowid, drinkProducts[0].id, 1, 0)
    }
    createAuditEntry(1, 'create', 'cross_sell_rule', null, 'ایجاد ۳ قانون فروش مکمل')
  }

  // Seed Installments
  const existingInstallments = (db.prepare('SELECT COUNT(*) as c FROM installments').get() as { c: number }).c
  if (existingInstallments === 0 && existingCustomers.c > 0) {
    const custIds = db.prepare('SELECT id FROM customers WHERE isActive = 1').all() as { id: number }[]
    if (custIds.length >= 2) {
      // Create 2 installment plans
      const inst1 = db.prepare("INSERT INTO installments (installmentNumber, customerId, totalAmount, downPayment, installmentCount, monthlyAmount, status, startDate, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin')").run(
        'INS-202606-0001', custIds[0].id, 1200000, 200000, 4, 250000, 'active', getDateDaysAgo(30))
      const inst2 = db.prepare("INSERT INTO installments (installmentNumber, customerId, totalAmount, downPayment, installmentCount, monthlyAmount, status, startDate, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin')").run(
        'INS-202606-0002', custIds[1].id, 800000, 0, 3, 266667, 'active', getDateDaysAgo(15))

      // Payment schedules — dates progress from past (paid) to future (pending)
      const insertPay = db.prepare('INSERT INTO installment_payments (installmentId, installmentNumber, amount, dueDate, paidDate, status) VALUES (?, ?, ?, ?, ?, ?)')
      // Inst 1: 4 payments, 2 paid (first already due, second early)
      insertPay.run(inst1.lastInsertRowid, 1, 250000, getDateDaysAgo(15), getDateDaysAgo(14), 'paid')
      insertPay.run(inst1.lastInsertRowid, 2, 250000, getDateDaysAgo(-15), getDateDaysAgo(-14), 'paid')
      insertPay.run(inst1.lastInsertRowid, 3, 250000, getDateDaysAgo(-45), null, 'pending')
      insertPay.run(inst1.lastInsertRowid, 4, 250000, getDateDaysAgo(-75), null, 'pending')
      // Inst 2: 3 payments, 1 overdue (past due date)
      insertPay.run(inst2.lastInsertRowid, 1, 266667, getDateDaysAgo(15), null, 'overdue')
      insertPay.run(inst2.lastInsertRowid, 2, 266667, getDateDaysAgo(-15), null, 'pending')
      insertPay.run(inst2.lastInsertRowid, 3, 266667, getDateDaysAgo(-45), null, 'pending')
      createAuditEntry(1, 'create', 'installment', null, 'ایجاد ۲ طرح اقساطی نمونه')
    }
  }

  // Seed Proformas
  const existingProformas = (db.prepare('SELECT COUNT(*) as c FROM proformas').get() as { c: number }).c
  if (existingProformas === 0 && existingCustomers.c > 0 && existingProducts.c > 0) {
    const custIds = db.prepare('SELECT id FROM customers WHERE isActive = 1').all() as { id: number }[]
    const prods = db.prepare('SELECT id, title, sale_price FROM products WHERE isActive = 1').all() as { id: number; title: string; sale_price: number }[]

    if (custIds.length > 0 && prods.length > 0) {
      const pf1 = db.prepare("INSERT INTO proformas (proformaNumber, customerId, userId, subtotal, totalAmount, taxRate, status, validUntil, notes) VALUES (?, ?, 1, ?, ?, 9, 'draft', ?, ?)").run(
        'PR-202606-0001', custIds[0].id, prods[0].sale_price * 3, Math.round(prods[0].sale_price * 3 * 1.09), getDateDaysAgo(-30), 'پیش‌فاکتور صادرات')
      const pf2 = db.prepare("INSERT INTO proformas (proformaNumber, customerId, userId, subtotal, totalAmount, taxRate, status, validUntil, notes) VALUES (?, ?, 1, ?, ?, 9, 'sent', ?, ?)").run(
        'PR-202606-0002', custIds[0].id, prods[1].sale_price * 2, Math.round(prods[1].sale_price * 2 * 1.09), getDateDaysAgo(-10), 'پیش‌فاکتور فروش عمده')

      const insertPfItem = db.prepare('INSERT INTO proforma_items (proformaId, productId, productTitle, quantity, unitPrice, subtotal) VALUES (?, ?, ?, ?, ?, ?)')
      insertPfItem.run(pf1.lastInsertRowid, prods[0].id, prods[0].title, 3, prods[0].sale_price, prods[0].sale_price * 3)
      insertPfItem.run(pf2.lastInsertRowid, prods[1].id, prods[1].title, 2, prods[1].sale_price, prods[1].sale_price * 2)
      createAuditEntry(1, 'create', 'proforma', null, 'ایجاد ۲ پیش‌فاکتور نمونه')
    }
  }

  // Seed Service Tickets
  const existingTickets = (db.prepare('SELECT COUNT(*) as c FROM service_tickets').get() as { c: number }).c
  if (existingTickets === 0 && existingProducts.c > 0) {
    const prods = db.prepare('SELECT id, title FROM products WHERE isActive = 1').all() as { id: number; title: string }[]
    const custIds = db.prepare('SELECT id FROM customers WHERE isActive = 1').all() as { id: number }[]
    if (prods.length >= 2 && custIds.length >= 1) {
      db.prepare("INSERT INTO service_tickets (ticketNumber, customerId, productId, serialNumber, warrantyClaim, warrantyStartDate, warrantyEndDate, status, priority, problemDescription, diagnosis, technician, partsCost, laborCost, totalCost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        'SRV-202606-0001', custIds[0].id, prods[0].id, 'SN-12345', 1, getDateDaysAgo(365), getDateDaysAgo(-180), 'in_repair', 'high', 'خرابی دستگاه - روشن نمی‌شود', 'خرابی برد الکترونیکی', 'محمد تکنسین', 150000, 80000, 230000)
      db.prepare("INSERT INTO service_tickets (ticketNumber, customerId, productId, serialNumber, status, priority, problemDescription, diagnosis) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(
        'SRV-202606-0002', custIds[0].id, prods[1].id, 'SN-67890', 'completed', 'normal', 'تعمیر صفحه نمایش', 'تعویض ال‌سی‌دی انجام شد')
      createAuditEntry(1, 'create', 'service_ticket', null, 'ایجاد ۲ تیکت خدماتی نمونه')
    }
  }

  // Seed Customer Credit
  const existingCredit = (db.prepare('SELECT COUNT(*) as c FROM customer_credit').get() as { c: number }).c
  if (existingCredit === 0 && existingCustomers.c > 0) {
    const custIds = db.prepare('SELECT id FROM customers WHERE isActive = 1').all() as { id: number }[]
    for (let i = 0; i < Math.min(3, custIds.length); i++) {
      const creditLimit = (i + 1) * 5000000
      db.prepare('INSERT INTO customer_credit (customerId, creditLimit, currentDebt, creditScore) VALUES (?, ?, ?, ?)').run(
        custIds[i].id, creditLimit, Math.floor(Math.random() * creditLimit * 0.3), 50 + Math.floor(Math.random() * 50))
    }
    createAuditEntry(1, 'create', 'credit', null, 'ایجاد رکوردهای اعتباری نمونه')
  }

  // Seed Audit Log entries
  const existingAudit = (db.prepare('SELECT COUNT(*) as c FROM audit_log').get() as { c: number }).c
  if (existingAudit === 0) {
    createAuditEntry(1, 'login', 'user', 1, 'ورود مدیر سیستم')
    createAuditEntry(1, 'create', 'product', null, 'ایجاد محصولات نمونه')
    createAuditEntry(1, 'create', 'sale', null, 'ایجاد فاکتورهای فروش')
    createAuditEntry(1, 'create', 'supplier', null, 'ایجاد تأمین‌کنندگان')
    createAuditEntry(1, 'create', 'customer', null, 'ایجاد مشتریان')
  }

  // Seed Inventory Adjustments
  const existingAdj = (db.prepare('SELECT COUNT(*) as c FROM inventory_adjustments').get() as { c: number }).c
  if (existingAdj === 0 && existingProducts.c > 0) {
    const prods = db.prepare('SELECT id, stock FROM products WHERE isActive = 1').all() as { id: number; stock: number }[]
    if (prods.length > 0) {
      db.prepare('INSERT INTO inventory_adjustments (productId, previousStock, newStock, adjustmentQty, reason, adjustmentType, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        prods[0].id, prods[0].stock + 10, prods[0].stock + 10, 10, 'شمارش فیزیکی - مغایرت', 'reconciliation', 'admin')
      db.prepare('INSERT INTO inventory_adjustments (productId, previousStock, newStock, adjustmentQty, reason, adjustmentType, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        prods[1].id, prods[1].stock, prods[1].stock - 5, -5, 'ضایعات - آسیب بسته‌بندی', 'damage', 'admin')
      createAuditEntry(1, 'create', 'inventory_adjustment', null, 'ایجاد ۲ اصلاح موجودی نمونه')
    }
  }

  console.log('[SEED] Done: 4 users, 32 products, 15+ categories, 8 customers, ~60 sales, 12 expenses, 3 returns, 12 fiscal periods, 5 suppliers, 3 cross-sell rules, 2 installments, 2 proformas, 2 service tickets, 3 credit records, audit entries, inventory adjustments')
}
