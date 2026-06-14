import { useSettingsStore } from '../store/settingsStore'

export default function Help() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'

  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const subColor = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const sections = [
    {
      title: 'فروش (POS)',
      items: [
        'اسکن بارکد با اسکنر USB یا دوربین',
        'جستجوی نامی با تایپ حداقل ۲ حرف',
        'افزودن کالاهای فله‌ای از دکمه‌های سریع',
        'پرداخت نقدی با محاسبه پول خرد',
        'پرداخت کارتی با ورود دستی مبلغ',
        'پرداخت نسیه با انتخاب مشتری',
        'نگه‌داشتن فاکتور با F4 (حداکثر ۳ فاکتور)',
        'بازیابی فاکتور با F5/F6/F7',
      ],
    },
    {
      title: 'داشبورد',
      items: [
        'مشاهده آمار کل فروش',
        'عملکرد صندوک‌دارها',
        'پرفروش‌ترین کالاها',
        'لیست فروش‌ها با جزئیات',
        'فیلتر تاریخ شمسی',
      ],
    },
    {
      title: 'آخرین فروش‌ها',
      items: [
        'جستجوی زنده بر اساس نام مشتری یا شماره فاکتور',
        'فیلتر بر اساس نوع پرداخت (نقدی/کارتی/نسیه)',
        'فیلتر وضعیت (عادی/بازگشتی)',
        'مشاهده جزئیات فاکتور با کلیک',
        'چاپ مجدد فاکتور',
        'بازگشت کالا',
      ],
    },
    {
      title: 'افزودن کالا',
      items: [
        'اسکن بارکد با دوربین',
        'تایپ دستی بارکد',
        'اگر بارکد موجود باشد → فرم ویرایش',
        'اگر جدید باشد → فرم ایجاد',
        'لیست تمام کالاها با امکان ویرایش',
      ],
    },
    {
      title: 'انبارداری',
      items: [
        'مشاهده موجودی تمام کالاها',
        'هشدار کم‌موجودی',
        'ریستاک کالاها',
        'فیلتر بر اساس دسته‌بندی و وضعیت موجودی',
        'چاپ گزارش موجودی',
        'ارزش کل خرید و فروش',
      ],
    },
    {
      title: 'حسابداری',
      items: [
        'ثبت هزینه‌ها با دسته‌بندی',
        'مشاهده سود و زیان',
        'تفکیک فروش بر اساس نوع پرداخت',
        'تفکیک هزینه‌ها بر اساس دسته',
        'حاشیه سود',
        'چاپ گزارش مالی',
      ],
    },
    {
      title: 'مشتریان',
      items: [
        'ایجاد مشتری جدید',
        'شارژ حساب مشتری',
        'پرداخت بدهی مشتری',
        'مشاهده تاریخچه حساب',
        'استفاده در پرداخت نسیه',
      ],
    },
    {
      title: 'مدیریت',
      items: [
        'مدیریت کاربران (ایجاد/حذف)',
        'تنظیمات فروشگاه (نام، آدرس، تلفن)',
        'گرد کردن خودکار (خاموش/۵۰۰/۱۰۰۰)',
        'تنظیمات ظاهر (زبان، تم، رنگ نوار بالا، اندازه متن)',
      ],
    },
  ]

  return (
    <div className="h-full p-4 overflow-auto">
      <h2 className="text-xl font-bold mb-4" style={{ color: textColor }}>راهنمای استفاده</h2>

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <h3 className="font-bold mb-3" style={{ color: textColor }}>
              {section.title}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: subColor }}>
                  <span style={{ color: '#6366f1' }}>&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <h3 className="font-bold mb-3" style={{ color: textColor }}>میانبرهای کلیدی</h3>
          <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: subColor }}>
            <div className="flex justify-between"><span>F1</span><span>فروش</span></div>
            <div className="flex justify-between"><span>F2</span><span>جستجو</span></div>
            <div className="flex justify-between"><span>F3</span><span>داشبورد</span></div>
            <div className="flex justify-between"><span>F4</span><span>نگه‌داشتن فاکتور</span></div>
            <div className="flex justify-between"><span>F5/F6/F7</span><span>بازیابی فاکتور</span></div>
            <div className="flex justify-between"><span>F11</span><span>تمام‌صفحه</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
