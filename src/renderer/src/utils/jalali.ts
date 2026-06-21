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
  const timeStr = hours !== '00' || mins !== '00' ? ` — ${hours}:${mins}` : ''
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
