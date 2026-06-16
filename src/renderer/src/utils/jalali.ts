const PERSIAN_EPOCH = 1948321

function div(a: number, b: number): number {
  return Math.floor(a / b)
}

function mod(a: number, b: number): number {
  return a - Math.floor(a / b) * b
}

export function gregorianToJalali(gY: number, gM: number, gD: number): [number, number, number] {
  const gy = gY - 1600
  const gm = gM - 1
  const gd = gD - 1
  const gDayNo = 365 * gy + div(gy + 3, 4) - div(gy + 99, 100) + div(gy + 399, 400)
  const gDaysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let totalGDays = gDayNo + gd
  for (let i = 0; i < gm; i++) totalGDays += gDaysInMonth[i]
  if (gm > 1 && mod(gy, 4) === 0 && (mod(gy, 100) !== 0 || mod(gy, 400) === 0)) totalGDays++
  const jDayNo = totalGDays - PERSIAN_EPOCH
  const jNp = div(jDayNo, 1029983)
  const jDaysRem = mod(jDayNo, 1029983)
  let jy: number
  if (jDaysRem === 1029982) {
    jy = 979 + 33 * jNp + 32
  } else {
    const r = div(jDaysRem, 366)
    const xx = mod(jDaysRem, 366)
    jy = 979 + 33 * jNp + 4 * r + (xx >= 365 ? 4 : div(xx, 91) + 1)
  }
  const jRem = mod(jDayNo, 1029983) === 1029982 ? 365 : mod(jDayNo, 366) >= 365 ? mod(jDayNo, 366) - 365 : mod(jDayNo, 366)
  const jMonthDays = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]
  let jm = 1
  while (jm < 13 && jRem >= jMonthDays[jm]) {
    jm++
  }
  const jd = jRem - jMonthDays.slice(0, jm).reduce((a, b) => a + b, 0) + 1
  return [jy, jm, jd]
}

export function jalaliToGregorian(jY: number, jM: number, jD: number): Date {
  const jy = jY - 979
  const jm = jM - 1
  const jd = jD - 1
  let jDayNo = 365 * jy + div(jy, 33) * 8 + div(mod(jy, 33) + 3, 4)
  const jMonthDays = [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]
  for (let i = 0; i < jm; i++) jDayNo += jMonthDays[i]
  jDayNo += jd
  const gDayNo = jDayNo + 79
  let gy = 1600 + 400 * div(gDayNo, 146097)
  let rem = mod(gDayNo, 146097)
  let leap = true
  if (rem >= 36525) {
    rem--
    gy += 100 * div(rem, 36524)
    rem = mod(rem, 36524)
    if (rem >= 365) { rem++ } else { leap = false }
  }
  gy += 4 * div(rem, 1461)
  rem = mod(rem, 1461)
  if (rem >= 366) {
    leap = false
    rem--
    gy += div(rem, 365)
    rem = mod(rem, 365)
  }
  let gd = rem + 1
  const gMonthDays = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 1
  while (gm < 13 && gd > gMonthDays[gm]) {
    gd -= gMonthDays[gm]
    gm++
  }
  return new Date(gy, gm - 1, gd)
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
  if (dateStr.includes('T')) {
    const timePart = dateStr.split('T')[1]
    if (timePart) {
      const h = timePart.split(':')[0]
      const mi = timePart.split(':')[1]
      if (h) hours = h.padStart(2, '0')
      if (mi) mins = mi.padStart(2, '0')
    }
  }
  return `${jd} ${jMonths[jm - 1]} ${jy} — ${hours}:${mins}`
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
