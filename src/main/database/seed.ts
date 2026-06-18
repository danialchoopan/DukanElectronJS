import { getDatabase, hashPin } from './connection'
import { createCategory } from './repositories/categories'

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

  const dairy = createCategory('لبنیات')
  createCategory('شیر', dairy.id); createCategory('ماست', dairy.id); createCategory('پنیر', dairy.id); createCategory('خامه', dairy.id); createCategory('بستنی', dairy.id)
  createCategory('نان و نانوا')
  createCategory('خشکبار')
  createCategory('روغن و چربی')
  createCategory('کنسروجات')
  createCategory('ماکارونی')
  createCategory('نوشیدنی')
  createCategory('تنقلات')
  createCategory('شیرینی')
  createCategory('بهداشتی')
  createCategory('شوینده')
  createCategory('پروتئین')
  createCategory('میوه')
  createCategory('سبزیجات')

  const insertProduct = db.prepare('INSERT INTO products (barcode, title, category, unit, purchase_price, sale_price, stock, minStock, isLoose) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  const products = [
    ['6260123456789', 'شیر کاله ۱ لیتری', 'شیر', 'number', 28000, 32000, 50, 10, 0],
    ['6260123456790', 'ماست چکیده میهن', 'ماست', 'number', 18000, 22000, 40, 8, 0],
    ['6260123456791', 'پنیر پیتزا کاله', 'پنیر', 'number', 35000, 42000, 25, 5, 0],
    ['6260123456792', 'خامه صادقی', 'خامه', 'number', 22000, 28000, 12, 3, 0],
    ['6260123456793', 'بستنی وانیلی', 'بستنی', 'number', 15000, 22000, 15, 3, 0],
    ['6260123456794', 'نان سنگک', 'نان و نانوا', 'number', 8000, 12000, 30, 5, 1],
    ['6260123456795', 'نان بربری', 'نان و نانوا', 'number', 6000, 10000, 40, 5, 1],
    ['6260123456796', 'نان تافتون', 'نان و نانوا', 'number', 5000, 8000, 50, 5, 1],
    ['6260123456797', 'برنج ایرانی', 'خشکبار', 'number', 85000, 98000, 20, 5, 0],
    ['6260123456798', 'شکر سفید', 'خشکبار', 'number', 45000, 52000, 25, 5, 0],
    ['6260123456799', 'روغن لادن', 'روغن و چربی', 'number', 120000, 135000, 15, 3, 0],
    ['6260123456800', 'رب گوجه رعنا', 'کنسروجات', 'number', 32000, 38000, 20, 5, 0],
    ['6260123456801', 'ماکارونی زر', 'ماکارونی', 'number', 15000, 18000, 35, 5, 0],
    ['6260123456802', 'چای احمد', 'نوشیدنی', 'number', 65000, 78000, 12, 3, 0],
    ['6260123456803', 'نسکافه', 'نوشیدنی', 'number', 95000, 110000, 8, 2, 0],
    ['6260123456804', 'آب معدنی', 'نوشیدنی', 'number', 5000, 8000, 60, 10, 0],
    ['6260123456805', 'دلستر فوکا', 'نوشیدنی', 'number', 12000, 15000, 24, 5, 0],
    ['6260123456806', 'پفک نمکی', 'تنقلات', 'number', 18000, 22000, 20, 4, 0],
    ['6260123456807', 'چیپس سیب‌زمینی', 'تنقلات', 'number', 15000, 19000, 25, 5, 0],
    ['6260123456808', 'بیسکوییت', 'تنقلات', 'number', 12000, 15000, 30, 5, 0],
    ['6260123456809', 'شکلات تابلیون', 'شیرینی', 'number', 28000, 35000, 15, 3, 0],
    ['6260123456810', 'خمیر دندان', 'بهداشتی', 'number', 35000, 42000, 12, 3, 0],
    ['6260123456811', 'صابون', 'بهداشتی', 'number', 12000, 18000, 20, 5, 0],
    ['6260123456812', 'شامپو', 'بهداشتی', 'number', 55000, 68000, 10, 3, 0],
    ['6260123456813', 'مایع ظرفشویی', 'شوینده', 'number', 42000, 52000, 15, 3, 0],
    ['6260123456814', 'پودر لباسشویی', 'شوینده', 'number', 78000, 92000, 8, 2, 0],
    ['6260123456815', 'تخم مرغ شانه‌ای', 'پروتئین', 'number', 65000, 78000, 15, 3, 0],
    ['6260123456816', 'مرغ منجمد', 'پروتئین', 'number', 95000, 115000, 10, 2, 0],
    ['6260123456817', 'سوسیس', 'پروتئین', 'number', 42000, 52000, 12, 3, 0],
    ['6260123456818', 'سیب سبز', 'میوه', 'weight', 35000, 45000, 40, 8, 1],
    ['6260123456819', 'موز', 'میوه', 'weight', 55000, 68000, 30, 5, 1],
    ['6260123456820', 'گوجه فرنگی', 'سبزیجات', 'weight', 20000, 28000, 30, 5, 1],
  ]

  db.transaction(() => { for (const p of products) insertProduct.run(...p) })()

  db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('احمد محمدی', '09121234567')
  db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('فاطمه رضایی', '09351234567')
  db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)').run('رضا عباسی', '09191234567')

  const today = new Date().toISOString().split('T')[0]
  db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('اجاره', 'اجاره ماهانه', 15000000, today)
  db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('قبوض', 'قبض برق', 2500000, today)
  db.prepare('INSERT INTO expenses (category, description, amount, date) VALUES (?, ?, ?, ?)').run('حقوق', 'حقوق محمد', 8000000, today)

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('isSetupComplete', 'true')").run()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('storeName', 'فروشگاه نمونه')").run()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', 'dark')").run()

  console.log('[SEED] Done: 4 users, 35 products, 15 categories, 3 customers, 3 expenses')
}
