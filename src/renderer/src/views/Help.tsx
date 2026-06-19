import { useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useShortcutsStore, actionLabels, type ShortcutAction } from '../store/shortcutsStore'

type Section = {
  title: string
  icon: string
  items: string[]
}

export default function Help() {
  const theme = useSettingsStore((s) => s.theme)
  const isDark = theme === 'dark'
  const { shortcuts } = useShortcutsStore()
  const [searchQuery, setSearchQuery] = useState('')

  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const subColor = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const inputBg = isDark ? '#0f172a' : '#f8fafc'

  const sections: Section[] = [
    {
      title: 'فروش (POS)',
      icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
      items: [
        'اسکن بارکد با اسکنر USB یا دوربین',
        'جستجوی نامی با تایپ حداقل ۲ حرف',
        'افزودن کالاهای فله‌ای از دکمه‌های سریع',
        'پرداخت نقدی با محاسبه پول خرد',
        'پرداخت کارتی با ورود دستی مبلغ',
        'پرداخت نسیه با انتخاب مشتری',
        'نگه‌داشتن فاکتور (حداکثر ۳ فاکتور)',
        'بازیابی فاکتورهای نگه‌داشته شده',
      ],
    },
    {
      title: 'داشبورد',
      icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
      items: [
        'مشاهده آمار کل فروش',
        'عملکرد صندوک‌دارها',
        'پرفروش‌ترین کالاها',
        'لیست فروش‌ها با جزئیات',
        'فیلتر تاریخ شمسی',
      ],
    },
    {
      title: 'آخرین فروش\u200cها',
      icon: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
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
      icon: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
      items: [
        'اسکن بارکد با دوربین',
        'تایپ دستی بارکد',
        'اگر بارکد موجود باشد \u2192 فرم ویرایش',
        'اگر جدید باشد \u2192 فرم ایجاد',
        'لیست تمام کالاها با امکان ویرایش',
      ],
    },
    {
      title: 'انبارداری',
      icon: 'M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z',
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
      icon: 'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
      items: [
        'ثبت هزینه\u200cها با دسته\u200cبندی',
        'مشاهده سود و زیان',
        'تفکیک فروش بر اساس نوع پرداخت',
        'تفکیک هزینه\u200cها بر اساس دسته',
        'حاشیه سود',
        'چاپ گزارش مالی',
      ],
    },
    {
      title: 'مشتریان',
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
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
      icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
      items: [
        'مدیریت کاربران (ایجاد/حذف)',
        'تنظیمات فروشگاه (نام، آدرس، تلفن)',
        'گرد کردن خودکار (خاموش/۵۰۰/۱۰۰۰)',
        'تنظیمات ظاهر (زبان، تم، رنگ نوار بالا، اندازه متن)',
        'تنظیم میانبرهای کلیدی',
      ],
    },
  ]

  const shortcutGroups = [
    { title: 'ناوبری', actions: ['navigate:pos', 'navigate:dashboard', 'navigate:inventory', 'navigate:accounting', 'navigate:sales', 'navigate:categories', 'navigate:customers', 'navigate:admin', 'navigate:help'] as ShortcutAction[] },
    { title: 'عملیات فروش', actions: ['pos:hold', 'pos:resume1', 'pos:resume2', 'pos:resume3', 'pos:payCash', 'pos:payCard', 'pos:payLedger', 'pos:search'] as ShortcutAction[] },
    { title: 'عمومی', actions: ['global:fullscreen', 'global:toggleTheme'] as ShortcutAction[] },
  ]

  const filteredSections = searchQuery
    ? sections.filter(s =>
        s.title.includes(searchQuery) ||
        s.items.some(i => i.includes(searchQuery))
      )
    : sections

  const filteredShortcuts = searchQuery
    ? shortcutGroups.map(g => ({
        ...g,
        actions: g.actions.filter(a => actionLabels[a].includes(searchQuery))
      })).filter(g => g.actions.length > 0)
    : shortcutGroups

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: textColor }}>راهنمای استفاده</h2>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در راهنما..."
            className="px-4 py-2 rounded-xl text-sm outline-none w-64"
            style={{ background: inputBg, border: `1px solid ${cardBorder}`, color: textColor }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSections.map((section) => (
          <div key={section.title} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#6366f1' }}>
                <path d={section.icon} />
              </svg>
              <h3 className="font-bold" style={{ color: textColor }}>{section.title}</h3>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: subColor }}>
                  <span style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }}>&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {filteredShortcuts.map((group) => (
          <div key={group.title} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#10b981' }}>
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
              </svg>
              <h3 className="font-bold" style={{ color: textColor }}>میانبرها: {group.title}</h3>
            </div>
            <div className="space-y-1.5">
              {group.actions.map((action) => (
                <div key={action} className="flex items-center justify-between py-1.5 text-sm">
                  <span style={{ color: subColor }}>{actionLabels[action]}</span>
                  <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold"
                    style={{ backgroundColor: inputBg, color: textColor, border: `1px solid ${cardBorder}` }}>
                    {shortcuts[action]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
