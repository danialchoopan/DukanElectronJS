import { useState, useRef, useEffect } from 'react'
import { gregorianToJalali, jalaliToGregorian } from '../../utils/jalali'

interface Props {
  value: string
  onChange: (gregorianDate: string) => void
  label?: string
}

const jMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
const jDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const jMonthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]

function getJalaliFromGregorian(dateStr: string): { jy: number; jm: number; jd: number } {
  if (!dateStr) {
    const d = new Date()
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate())
    return { jy, jm, jd }
  }
  const parts = dateStr.split('-')
  const [jy, jm, jd] = gregorianToJalali(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]))
  return { jy, jm, jd }
}

function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm === 12 && jy % 4 === 3) return 30
  return jMonthDays[jm - 1]
}

function getFirstDayOfWeek(jy: number, jm: number): number {
  const gDate = jalaliToGregorian(jy, jm, 1)
  return (gDate.getDay() + 1) % 7
}

type ViewMode = 'days' | 'months' | 'years'

export default function ShamsiDateInput({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false)
  const { jy, jm, jd } = getJalaliFromGregorian(value)
  const [viewMonth, setViewMonth] = useState(jm)
  const [viewYear, setViewYear] = useState(jy)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const yearGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (viewMode === 'years' && yearGridRef.current) {
      const btn = yearGridRef.current.querySelector(`[data-year="${today.jy}"]`)
      if (btn) btn.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [viewMode])

  const displayStr = value ? `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}` : ''
  const today = getJalaliFromGregorian('')
  const daysInMonth = getDaysInJalaliMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth)

  const handleDayClick = (day: number) => {
    const gDate = jalaliToGregorian(viewYear, viewMonth, day)
    const y = gDate.getFullYear()
    const m = String(gDate.getMonth() + 1).padStart(2, '0')
    const d = String(gDate.getDate()).padStart(2, '0')
    onChange(`${y}-${m}-${d}`)
    setOpen(false); setViewMode('days')
  }

  const handleMonthClick = (month: number) => { setViewMonth(month); setViewMode('days') }
  const handleYearClick = (year: number) => { setViewYear(year); setViewMode('months') }
  const yearRange = Array.from({ length: 201 }, (_, i) => 1300 + i)

  return (
    <div className="relative">
      {label && <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</label>}
      <button onClick={() => { setOpen(!open); setViewMode('days') }}
        className="input-field text-sm text-left w-36 cursor-pointer" style={{ fontFamily: 'monospace' }}>
        {displayStr || '----/--/--'}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 rounded-xl shadow-2xl border-2 p-3" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', width: '300px' }}>
          <div className="flex items-center justify-between mb-2">
            {viewMode === 'days' && (
              <>
                <button onClick={() => { if (viewMonth === 1) { setViewMonth(12); setViewYear(viewYear - 1) } else { setViewMonth(viewMonth - 1) } }} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>›</button>
                <div className="flex items-center gap-3">
                  <button onClick={() => setViewMode('months')} className="text-sm font-bold px-2 py-1 rounded-lg" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}>{jMonths[viewMonth - 1]}</button>
                  <button onClick={() => setViewMode('years')} className="text-sm font-bold px-2 py-1 rounded-lg" style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-tertiary)' }}>{viewYear}</button>
                </div>
                <button onClick={() => { if (viewMonth === 12) { setViewMonth(1); setViewYear(viewYear + 1) } else { setViewMonth(viewMonth + 1) } }} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>‹</button>
              </>
            )}
            {viewMode === 'months' && (
              <><button onClick={() => setViewMode('days')} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: '#3b82f6' }}>← بازگشت</button>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{viewYear}</span><div className="w-16" /></>
            )}
            {viewMode === 'years' && (
              <><button onClick={() => setViewMode('months')} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color: '#3b82f6' }}>← بازگشت</button>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>انتخاب سال</span><div className="w-16" /></>
            )}
          </div>
          {viewMode === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-0.5 mb-1">{jDays.map((d) => <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>)}</div>
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1; const isToday = viewYear === today.jy && viewMonth === today.jm && day === today.jd; const isSelected = value && viewYear === jy && viewMonth === jm && day === jd
                  return <button key={day} onClick={() => handleDayClick(day)} className="w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center transition-all" style={{ backgroundColor: isSelected ? '#3b82f6' : isToday ? 'rgba(59,130,246,0.15)' : 'transparent', color: isSelected ? '#ffffff' : isToday ? '#3b82f6' : 'var(--text-primary)' }}>{day}</button>
                })}
              </div>
            </>
          )}
          {viewMode === 'months' && (
            <div className="grid grid-cols-3 gap-2">{jMonths.map((m, i) => {
              const isCurrent = viewYear === today.jy && (i + 1) === today.jm; const isViewed = (i + 1) === viewMonth
              return <button key={m} onClick={() => handleMonthClick(i + 1)} className="py-3 rounded-xl text-sm font-bold transition-all text-center" style={{ background: isViewed ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : isCurrent ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)', color: isViewed ? '#ffffff' : isCurrent ? '#3b82f6' : 'var(--text-primary)' }}>{m}</button>
            })}</div>
          )}
          {viewMode === 'years' && (
            <div ref={yearGridRef} className="grid grid-cols-5 gap-1.5 max-h-[300px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>{yearRange.map((y) => {
              const isCurrent = y === today.jy; const isViewed = y === viewYear
              return <button key={y} data-year={y} onClick={() => handleYearClick(y)} className="py-2 rounded-lg text-xs font-bold transition-all text-center" style={{ background: isViewed ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : isCurrent ? 'rgba(59,130,246,0.1)' : 'var(--bg-tertiary)', color: isViewed ? '#ffffff' : isCurrent ? '#3b82f6' : 'var(--text-primary)' }}>{y}</button>
            })}</div>
          )}
          {viewMode === 'days' && (
            <div className="flex justify-center mt-2 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
              <button onClick={() => { setViewMonth(today.jm); setViewYear(today.jy); handleDayClick(today.jd) }} className="text-xs font-bold px-3 py-1 rounded-lg" style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)' }}>امروز</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
