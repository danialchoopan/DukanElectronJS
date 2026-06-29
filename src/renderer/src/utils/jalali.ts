/**
 * Jalali (Shamsi/Persian) calendar utilities.
 *
 * All date functions in the app use this module for:
 *   - Converting Gregorian dates to Jalali for display
 *   - Formatting date strings in Jalali (dd MMMM yyyy or dd/mm/yyyy)
 *   - Parsing date inputs from the ShamsiDateInput component
 *
 * The jalaali-js library handles the Gregorian↔Jalali conversion math.
 * Iranian month names are used for the long format (formatJalali, formatJalaliDateTime).
 *
 * Key exports:
 *   - gregorianToJalali / jalaliToGregorian: raw conversion
 *   - formatJalali: "۱۵ خرداد ۱۴۰۵"
 *   - formatJalaliShort: "15/03/1405"
 *   - formatJalaliDateTime: "۱۵ خرداد ۱۴۰۵ — 14:30"
 *   - formatDateNow / formatDateTimeNow: current date/time in Jalali
 *   - getTodayJalali / getTodayGregorian: today's date string
 *   - formatISOToJalali / formatISOToJalaliShort: ISO string → Jalali
 */

import jalaali from 'jalaali-js'

export function gregorianToJalali(gY: number, gM: number, gD: number): [number, number, number] {
  const j = jalaali.toJalaali(gY, gM, gD)
  return [j.jy, j.jm, j.jd]
}

export function jalaliToGregorian(jY: number, jM: number, jD: number): Date {
  const g = jalaali.toGregorian(jY, jM, jD)
  return new Date(g.gy, g.gm - 1, g.gd)
}

function parseDateSafe(dateStr: string): { y: number; m: number; d: number } {
  if (!dateStr) {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
  }
  const parts = dateStr.split('-')
  return { y: parseInt(parts[0]), m: parseInt(parts[1]), d: parseInt(parts[2]) }
}

const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

export function formatJalali(dateStr: string): string {
  if (!dateStr) return ''
  const { y, m, d } = parseDateSafe(dateStr)
  const [jy, jm, jd] = gregorianToJalali(y, m, d)
  return `${jd} ${jMonths[jm - 1]} ${jy}`
}

export function formatJalaliShort(dateStr: string): string {
  if (!dateStr) return ''
  const { y, m, d } = parseDateSafe(dateStr)
  const [jy, jm, jd] = gregorianToJalali(y, m, d)
  return `${jd}/${jm}/${jy}`
}

export function formatJalaliDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const { y, m, d } = parseDateSafe(dateStr)
  const [jy, jm, jd] = gregorianToJalali(y, m, d)
  let hours = '00', mins = '00'
  const timeSeparator = dateStr.includes('T') ? 'T' : ' '
  if (dateStr.includes(timeSeparator)) {
    const timePart = dateStr.split(timeSeparator)[1]
    if (timePart) {
      const parts = timePart.split(':')
      if (parts[0]) hours = parts[0].padStart(2, '0')
      if (parts[1]) mins = parts[1].padStart(2, '0')
    }
  }
  const timeStr = (hours !== '00' || mins !== '00') ? ` — ${hours}:${mins}` : ''
  return `${jd} ${jMonths[jm - 1]} ${jy}${timeStr}`
}

export function getTodayJalali(): string {
  const now = new Date()
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`
}

export function getTodayGregorian(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDateNow(): string {
  const now = new Date()
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  return `${jd} ${jMonths[jm - 1]} ${jy}`
}

export function formatDateTimeNow(): string {
  const now = new Date()
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${jd} ${jMonths[jm - 1]} ${jy} — ${h}:${m}`
}

export function formatISOToJalali(isoStr: string): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${jd} ${jMonths[jm - 1]} ${jy}`
}

export function formatISOToJalaliShort(isoStr: string): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
  return `${jd}/${jm}/${jy}`
}

/**
 * Format a number with comma separators for readability.
 * Example: 10000000 → "10,000,000"
 */
export function formatNumberComma(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * Format a price in Iranian style with Farsi labels.
 * Uses هزار (thousand), میلیون (million), میلیارد (billion).
 * Example: 10000000 → "۱۰ میلیون", 2500000 → "۲.۵ میلیون", 150000 → "۱۵۰ هزار"
 */
export function formatPriceFA(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} میلیارد`
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} میلیون`
  }
  if (abs >= 1_000) {
    const v = abs / 1_000
    return `${sign}${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} هزار`
  }
  return `${sign}${abs.toLocaleString('fa-IR')}`
}

/**
 * Format a short price with comma separators + Farsi label.
 * Example: 10000000 → "۱۰,۰۰۰,۰۰۰"
 */
export function formatPriceComma(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} میلیارد`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1).replace('.0', '')} میلیون`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)} هزار`
  return `${sign}${abs.toLocaleString('fa-IR')}`
}
