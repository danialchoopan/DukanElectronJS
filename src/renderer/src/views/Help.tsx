import { useSettingsStore } from '../store/settingsStore'
import { useShortcutsStore, SHORTCUT_CATEGORIES } from '../store/shortcutsStore'

export default function Help() {
  const theme = useSettingsStore((s) => s.theme)
  const { shortcuts } = useShortcutsStore()
  const isDark = theme === 'dark'

  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const sections = [
    {
      title: 'فروش (POS)',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>,
      items: ['اسکن بارکد با اسکنر USB یا دوربین', 'جستجوی نامی با تایپ حداقل ۲ حرف', 'افزودن کالاهای فله‌ای از دکمه‌های سریع', 'پرداخت نقدی با محاسبه پول خرد', 'پرداخت کارتی با ورود دستی مبلغ', 'پرداخت بدهی با انتخاب مشتری', 'نگه‌داشتن فاکتور حداکثر ۳ فاکتور', 'بازیابی فاکتور با کلیدهای F5/F6/F7'],
    },
    {
      title: 'حسابداری',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
      items: ['دفتر حسابها با ساختار سلسله‌مراتبی', 'سند حسابداری دوطرفه خودکار', 'تراز آزمایشی و صورت سود و زیان', 'ترازنامه و گزارش مطالبات مشتریان', 'ثبت هزینه‌ها با تصویر رسید'],
    },
    {
      title: 'انبارداری',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>,
      items: ['مشاهده موجودی با نمودار دسته‌بندی', 'هشدار کم‌موجودی و تمام‌شده', 'تامین مجدد کالاها', 'گزارش ارزش‌گذاری و کالاهای کندفروش', 'تاریخچه تغییرات با جزئیات فارسی', 'چاپ گزارش موجودی'],
    },
    {
      title: 'مشتریان',
      icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
      items: ['ایجاد و مدیریت پروفایل مشتریان', 'شارژ حساب و پرداخت بدهی', 'مشاهده تاریخچه کامل حساب', 'گزارش مانده حساب مشتریان'],
    },
  ]

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12" y2="17" />
        </svg>
        <h2 className="text-xl font-bold" style={{ color: textColor }}>راهنمای استفاده</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: textColor }}>
              {section.icon}
              {section.title}
            </h3>
            <ul className="space-y-1.5">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: textSecondary }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: '#3b82f6' }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden mb-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="px-4 py-3 font-bold flex items-center gap-2" style={{ borderBottom: `1px solid ${cardBorder}`, color: textColor }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2" /><line x1="6" y1="8" x2="6" y2="8" /><line x1="10" y1="8" x2="10" y2="8" /><line x1="14" y1="8" x2="14" y2="8" /><line x1="18" y1="8" x2="18" y2="8" /><line x1="8" y1="12" x2="8" y2="12" /><line x1="12" y1="12" x2="12" y2="12" /><line x1="16" y1="12" x2="16" y2="12" /><line x1="7" y1="16" x2="17" y2="16" />
          </svg>
          میانبرهای کلیدی
          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full" style={{ backgroundColor: isDark ? '#334155' : '#f1f5f9', color: textSecondary }}>
            قابل سفارشی‌سازی در تنظیمات
          </span>
        </div>

        {SHORTCUT_CATEGORIES.map((cat) => {
          const catShortcuts = shortcuts.filter(s => s.category === cat.key)
          if (catShortcuts.length === 0) return null
          return (
            <div key={cat.key}>
              <div className="px-4 py-2 text-xs font-bold" style={{ color: textSecondary, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
                {cat.label}
              </div>
              <div className="divide-y" style={{ borderColor: cardBorder }}>
                {catShortcuts.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm" style={{ color: textColor }}>{s.label}</span>
                    <kbd className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
                      style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9', color: isDark ? '#94a3b8' : '#475569', border: `1px solid ${cardBorder}`, minWidth: 60, textAlign: 'center' }}>
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl p-4 border" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: textColor }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          نکات مفید
        </h3>
        <ul className="space-y-1.5 text-sm" style={{ color: textSecondary }}>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> برای بازگشت به صفحه قبل ESC را فشار دهید</li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> کلید Enter در فرم‌ها عمل ذخیره را انجام می‌دهد</li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> در صفحه فروش، با تایپ نام کالا جستجو کنید</li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> میانبرها را می‌توانید در بخش مدیریت سفارشی کنید</li>
          <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span> برای چاپ گزارش، دکمه چاپ گزارش را کلیک کنید</li>
        </ul>
      </div>
    </div>
  )
}
