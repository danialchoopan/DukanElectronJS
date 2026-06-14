# راهنمای نصب و استفاده — SuperMarket POS

---

## نصب و اجرا

### پیش‌نیازها

| ابزار | نسخه | دلیل |
|-------|-------|------|
| Node.js | >= 18.x | اجرای جاوااسکریپت |
| npm | >= 9.x | مدیریت پکیج‌ها |
| Python 3 | هر نسخه | کامپایل better-sqlite3 |
| ابزارهای C++ Build | لازم | کامپایل better-sqlite3 |

```bash
npm install -g windows-build-tools  # PowerShell به صورت Administrator
```

### مراحل نصب

```bash
cd broapp
npm install --ignore-scripts
npx electron-rebuild -f -w better-sqlite3
npm run start
```

---

## راه‌اندازی اولیه

اولین بار برنامه را اجرا کنید — صفحه راه‌اندازی ۳ مرحله‌ای نمایش داده می‌شود:

### مرحله ۱ — اطلاعات فروشگاه
- زبان: فارسی یا English
- ظاهر: حالت تاریک یا روشن
- نام فروشگاه (الزامی)
- آدرس و تلفن فروشگاه
- دکمه "بازیابی پشتیبان" — اگر فایل پشتیبان دارید، اینجا وارد کنید

### مرحله ۲ — حساب مدیر
- نام مدیر
- رمز مدیر (۴ رقم، قابل مشاهده، با تأیید)

### مرحله ۳ — تنظیمات مالی
- گرد کردن خودکار: خاموش / ۵۰۰ / ۱۰۰۰ تومان

---

## ورود به سیستم

صفحه اول **انتخاب کاربر** است:
1. روی نام کاربر مورد نظر کلیک کنید (شبکه‌ای از کاربران با نام و نقش)
2. PIN ۴ رقمی را وارد کنید
3. برای تغییر کاربر، دکمه بازگشت را بزنید

---

## صفحه فروش (POS)

### افزودن کالا
- اسکنر USB: بارکد را اسکن کنید — کالا فوراً اضافه می‌شود
- دوربین: دکمه دوربین را بزنید، دوربین را روی بارکد بگیرید
- تایپ: شماره بارکد را تایپ کنید + Enter
- جستجو: ۲ حرف از نام تایپ کنید → لیست نمایش داده می‌شود
- فله‌ای: دکمه‌های سریع زیر نوار جستجو
- پرفروش‌ها: لیست کالاهای پرفروش در پایین صفحه

### پرداخت
- نقدی: مبلغ پرداختی مشتری → پول خرد خودکار
- کارتی: مبلغ کارت را دستی وارد کنید
- نسیه: مشتری را انتخاب کنید → از حساب کم می‌شود

### نگه‌داشتن فاکتور
- F4: نگه‌داشتن در شماره بعدی
- F5/F6/F7: بازیابی از شماره ۱/۲/۳

---

## افزودن کالا (منوی جداگانه)

از نوار بالا روی "افزودن کالا" کلیک کنید:
1. اسکنر دوربین: دکمه دوربین → بارکد را اسکن کنید
2. تایپ دستی: شماره بارکد را تایپ کنید + Enter
3. اگر بارکد وجود دارد → فرم ویرایش باز می‌شود
4. اگر جدید است → فرم ایجاد باز می‌شود

---

## انبارداری

از نوار بالا روی "انبارداری" کلیک کنید:
- مشاهده تمام کالاها با سطح موجودی
- هشدار کم‌موجودی (قرمز/زرد/سبز)
- ریستاک هر کالا با کلیک
- فیلتر بر اساس دسته‌بندی و وضعیت موجودی
- چاپ گزارش موجودی

---

## حسابداری

### تب هزینه‌ها
- افزودن هزینه با دسته‌بندی (اجاره، قبوض، حقوق، لوازم، تعمیرات، حمل‌ونقل، سایر)
- فیلتر تاریخ شمسی

### تب سود و زیان
- درآمد کل فروش + هزینه‌های کل + سود خالص
- حاشیه سود درصدی
- تفکیک فروش و هزینه‌ها
- چاپ گزارش مالی

---

## پشتیبان‌گیری و بازیابی

از پنل مدیریت → تنظیمات → پشتیبان‌گیری:
- ذخیره پشتیبان: فایل JSON با تمام اطلاعات (کالاها، فاکتورها، مشتریان، تنظیمات)
- بازیابی پشتیبان: انتخاب فایل JSON و جایگزینی تمام اطلاعات

---

## میانبرهای کلیدی

| کلید | عملکرد |
|-------|--------|
| F1 | رفتن به فروش |
| F2 | افزودن کالا / جستجو |
| F3 | داشبورد |
| F4 | نگه‌داشتن فاکتور |
| F5/F6/F7 | بازیابی فاکتور |
| Enter | ارسال بارکد |
| Escape | بستن پنجره‌ها |
| F11 | تمام‌صفحه |

---

## عیب‌یابی

- خطای better-sqlite3: npx electron-rebuild -f -w better-sqlite3
- دوربین کار نمی‌کند: تنظیمات ویندوز → حریم خصوصی → دوربین
- پنجره سفید: ۵ ثانیه صبر کنید → Ctrl+R

---

# Setup & Usage Guide — SuperMarket POS

---

## Installation & Run

### Prerequisites

| Tool | Version | Reason |
|------|---------|--------|
| Node.js | >= 18.x | JavaScript runtime |
| npm | >= 9.x | Package manager |
| Python 3 | Any | Compile better-sqlite3 |
| C++ Build Tools | Required | Compile better-sqlite3 |

```bash
npm install -g windows-build-tools  # Run PowerShell as Administrator
```

### Install Steps

```bash
cd broapp
npm install --ignore-scripts
npx electron-rebuild -f -w better-sqlite3
npm run start
```

---

## Initial Setup

Run the app for the first time — a 3-step setup wizard appears:

### Step 1 — Store Information
- Language: Farsi or English
- Theme: Dark or Light
- Store Name (required)
- Store Address & Phone
- "Restore Backup" button — import a backup file here if you have one

### Step 2 — Admin Account
- Admin Name
- Admin PIN (4 digits, visible, with confirmation)

### Step 3 — Financial Settings
- Auto-Rounding: Off / 500 / 1000 Toman

---

## Login

The first screen is **User Selection**:
1. Click on the user you want (grid of users with name and role)
2. Enter the 4-digit PIN
3. Use the back button to switch users

---

## POS Checkout Screen

### Adding Products
- USB Scanner: scan the barcode — product is added instantly
- Camera: click the camera button, hold the camera over the barcode
- Manual: type the barcode number + Enter
- Search: type 2 letters of the name → list appears
- Loose Items: quick-add buttons below the search bar
- Popular Items: list of top-selling products at the bottom

### Payment
- Cash: enter customer's payment amount → automatic change calculation
- Bank Card: enter the card amount manually
- Ledger: select customer → deducted from their account

### Hold/Resume Invoices
- F4: hold to next slot
- F5/F6/F7: resume from slot 1/2/3

---

## Add Product (Separate Page)

Click "Add Product" in the top nav:
1. Camera Scanner: click camera button → scan barcode
2. Manual Entry: type barcode + Enter
3. If barcode exists → edit form opens
4. If new → create form opens

---

## Inventory Management

Click "Inventory" in the top nav:
- View all products with stock levels
- Low stock alerts (red/yellow/green)
- Restock any product
- Filter by category and stock status
- Print inventory report

---

## Accounting

### Expenses Tab
- Add expenses with categories (rent, utilities, salary, supplies, maintenance, transport, other)
- Shamsi date filtering

### Profit & Loss Tab
- Total sales revenue + total expenses + net profit
- Profit margin percentage
- Payment method breakdown
- Expense category breakdown
- Print financial report

---

## Backup & Restore

From Admin Panel → Settings → Backup:
- Save Backup: JSON file with all data (products, sales, customers, settings)
- Restore Backup: select JSON file and replace all data

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F1 | Go to POS |
| F2 | Add Product / Search |
| F3 | Dashboard |
| F4 | Hold Invoice |
| F5/F6/F7 | Resume Invoice |
| Enter | Submit Barcode |
| Escape | Close Dialogs |
| F11 | Full Screen |

---

## Troubleshooting

- better-sqlite3 error: npx electron-rebuild -f -w better-sqlite3
- Camera not working: Windows Settings → Privacy → Camera
- White window: wait 5 seconds → Ctrl+R
