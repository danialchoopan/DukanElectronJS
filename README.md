# صندوق فروشگاه — SuperMarket POS

سیستم صندوق فروشگاهی حرفه‌ای برای فروشگاه‌های ایرانی — کاملاً آفلاین، رابط کاربری فارسی، تقویم شمسی

---

## لینک‌های سریع

| سند | توضیحات |
|------|----------|
| **[SETUP.md](SETUP.md)** | نصب، راه‌اندازی، و راهنمای کامل استفاده |
| **[TECHNICAL.md](TECHNICAL.md)** | معماری، دیتابیس، IPC، مدیریت state |

---

## شروع سریع

```bash
cd broapp
npm install --ignore-scripts
npx electron-rebuild -f -w better-sqlite3
npm run start
```

> اولین بار که اجرا می‌کنید، صفحه راه‌اندازی اولیه نمایش داده می‌شود.

---

## قابلیت‌ها

- صفحه انتخاب کاربر — شبکه‌ای از کاربران با نام و نقش، کلیک کنید و PIN وارد کنید
- راهنمای راه‌اندازی اولیه — تنظیم نام فروشگاه، زبان، تم، رمز مدیر و گرد کردن
- پشتیبان‌گیری و بازیابی — ذخیره و بازیابی کامل اطلاعات فروشگاه
- پشتیبانی فارسی و انگلیسی — زبان قابل تغییر از نوار بالا
- حالت تاریک و روشن — تم رنگارنگ با دکمه‌های گرادیانت
- فونت Vazirmatn — فونت حرفه‌ای فارسی (آفلاین)
- فروش (POS) — اسکن بارکد، جستجو، سبد خرید، پرداخت نقدی/کارتی/نسیه
- اسکنر دوربین — اسکن بارکد و QR کد با دوربین موبایل/لپتاپ
- نگه‌داشتن فاکتور — ۳ شماره مستقل (F4/F5/F6/F7)
- چاپ فاکتور — نمایش رسید فقط اگر مشتری بخواهد (اختیاری)
- افزودن کالا — منوی جداگانه با اسکنر بارکد/دوربین/دستی
- انبارداری — مدیریت موجودی، هشدار کم‌موجودی، ریستاک، چاپ گزارش
- حسابداری — ثبت هزینه‌ها، سود و زیان، تاریخ شمسی، چاپ گزارش
- تاریخ شمسی — تمام تاریخ‌ها و فیلترها با تقویم ایرانی
- داشبورد — درآمد، فاکتور، تفکیک پرداخت، عملکرد صندوک‌دار
- تاریخچه فروش — منوی جداگانه با فیلتر تاریخ و نوع پرداخت
- حساب نسیه مشتریان — شارژ، پرداخت بدهی، تاریخچه
- محاسبه سود خالص — به ازای هر فاکتور و خط آیتم
- بازگشت کالا — ثبت بازگشت و نمایش با رنگ زرد در لیست
- سفارشی‌سازی ظاهر — رنگ نوار بالا، اندازه متن، کنتراست بالا
- راهنمای کامل — صفحه راهنما در نوار بالا

---

## فناوری‌ها

Electron 33 · React 18 · TypeScript 5 · Vite 6 · Zustand 5 · better-sqlite3 11 · Tailwind CSS 3 · html5-qrcode · Vazirmatn (Local) · i18n (FA/EN) · Dark/Light Mode · electron-builder 25

---

# SuperMarket POS

Professional POS system for Iranian supermarkets — fully offline, Farsi UI, Shamsi calendar

---

## Quick Links

| Document | Description |
|----------|-------------|
| **[SETUP.md](SETUP.md)** | Installation, setup, and complete usage guide |
| **[TECHNICAL.md](TECHNICAL.md)** | Architecture, database, IPC, state management |

---

## Quick Start

```bash
cd broapp
npm install --ignore-scripts
npx electron-rebuild -f -w better-sqlite3
npm run start
```

> First time you run it, the initial setup wizard will appear.

---

## Features

- User selection screen — grid of users with name and role, click to select and enter PIN
- Initial setup wizard — set store name, language, theme, admin PIN, and rounding
- Backup & Restore — save and restore all store data
- Farsi and English support — switchable from the top nav bar
- Dark and Light themes — colorful themes with gradient buttons
- Vazirmatn Font — professional Farsi font (offline)
- POS Checkout — barcode scan, search, cart, cash/card/ledger payment
- Camera Scanner — scan barcodes and QR codes with phone/laptop camera
- Hold/Resume invoices — 3 independent slots (F4/F5/F6/F7)
- Receipt printing — show receipt only if customer wants (optional)
- Add Product — dedicated page with barcode scanner/camera/manual entry
- Inventory Management — stock tracking, low stock alerts, restock, report printing
- Accounting — expense tracking, profit/loss, Shamsi dates, report printing
- Shamsi Calendar — all dates and filters use Iranian calendar
- Dashboard — revenue, invoices, payment breakdown, cashier performance
- Sales History — separate page with date and payment method filtering
- Customer Ledger — charge, pay debt, account history
- Net Profit calculation — automatic per invoice and line item
- Product Returns — track returns with yellow highlight in sales list
- UI Customization — nav bar color, font size, high contrast mode
- Help Page — comprehensive usage guide in the top nav

---

## Tech Stack

Electron 33 · React 18 · TypeScript 5 · Vite 6 · Zustand 5 · better-sqlite3 11 · Tailwind CSS 3 · html5-qrcode · Vazirmatn (Local) · i18n (FA/EN) · Dark/Light Mode · electron-builder 25
