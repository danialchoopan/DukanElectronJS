export function gregorianToJalali(gY: number, gM: number, gD: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  let gy = gY - 1600
  let gm = gM - 1
  let gd = gD - 1
  let g_day_no = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400)
  for (let i = 0; i < gm; i++) g_day_no += g_d_m[i]
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) g_day_no++
  g_day_no += gd
  let j_day_no = g_day_no - 79
  const j_np = Math.floor(j_day_no / 12053)
  j_day_no %= 12053
  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461)
  j_day_no %= 1461
  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 366) / 365)
    j_day_no = (j_day_no - 366) % 365
  }
  let jm: number, jd: number
  if (j_day_no < 186) {
    jm = 1 + Math.floor(j_day_no / 31)
    jd = 1 + (j_day_no % 31)
  } else {
    jm = 7 + Math.floor((j_day_no - 186) / 30)
    jd = 1 + ((j_day_no - 186) % 30)
  }
  return [jy, jm, jd]
}

export function jalaliToGregorian(jY: number, jM: number, jD: number): Date {
  const jy = jY - 979
  const jm = jM - 1
  const jd = jD - 1
  let j_day_no = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4)
  for (let i = 0; i < jm; i++) j_day_no += [0, 31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30][i]
  j_day_no += jd
  let g_day_no = j_day_no + 79
  let gy = 1600 + 400 * Math.floor(g_day_no / 146097)
  g_day_no = g_day_no % 146097
  let leap = true
  if (g_day_no >= 36525) {
    g_day_no--
    gy += 100 * Math.floor(g_day_no / 36524)
    g_day_no %= 36524
    if (g_day_no >= 365) g_day_no++
    else leap = false
  }
  gy += 4 * Math.floor(g_day_no / 1461)
  g_day_no %= 1461
  if (g_day_no >= 366) {
    leap = false
    g_day_no--
    gy += Math.floor(g_day_no / 365)
    g_day_no %= 365
  }
  let gd = g_day_no + 1
  const gm = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let i = 1
  while (gd > gm[i]) { gd -= gm[i]; i++ }
  return new Date(gy, i - 1, gd)
}

function parseDateSafe(dateStr: string): { y: number; m: number; d: number } {
  if (!dateStr) {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }
  }
  const parts = dateStr.split('-')
  return {
    y: parseInt(parts[0]),
    m: parseInt(parts[1]),
    d: parseInt(parts[2]),
  }
}

export function formatJalali(dateStr: string): string {
  if (!dateStr) return ''
  const { y, m, d } = parseDateSafe(dateStr)
  const [jy, jm, jd] = gregorianToJalali(y, m, d)
  const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
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
  const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
  let hours = '00', mins = '00'
  if (dateStr.includes('T')) {
    const timePart = dateStr.split('T')[1]
    if (timePart) {
      const h = timePart.split(':')[0]
      const m = timePart.split(':')[1]
      if (h) hours = h.padStart(2, '0')
      if (m) mins = m.padStart(2, '0')
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
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
