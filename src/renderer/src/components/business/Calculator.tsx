/**
 * Calculator — floating professional calculator with history, memory, and currency conversion.
 *
 * Features:
 *   - Basic arithmetic: +, -, ×, ÷
 *   - Scientific: %, √, x², 1/x, ±
 *   - Memory: M+, M-, MR, MC
 *   - Currency conversion: USD, EUR, IRR (static rates)
 *   - Calculation history with timestamps
 *   - Keyboard shortcuts (0-9, +, -, *, /, Enter, Escape, Backspace)
 *   - Copy result to clipboard
 *   - Floating/dockable window mode
 *   - Global shortcut Ctrl+M to toggle
 *
 * All calculations are client-side — no external API calls.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface HistoryEntry {
  expression: string
  result: string
  timestamp: string
}

const MEMORY_CLEAR = 0

// Static exchange rates (IRR is base)
const RATES: Record<string, number> = { IRR: 1, USD: 42000, EUR: 46000 }

function formatNumber(n: number): string {
  if (!isFinite(n)) return 'خطا'
  if (Number.isInteger(n)) return n.toLocaleString('fa-IR')
  const fixed = n.toFixed(10).replace(/\.?0+$/, '')
  const parts = fixed.split('.')
  parts[0] = Number(parts[0]).toLocaleString('fa-IR')
  return parts.join('.')
}

export default function Calculator({ onClose, docked = false }: { onClose?: () => void; docked?: boolean }) {
  const theme = useSettingsStore((s: any) => s.theme)
  const isDark = theme === 'dark'
  const [display, setDisplay] = useState('0')
  const [prevValue, setPrevValue] = useState<number | null>(null)
  const [operator, setOperator] = useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [memory, setMemory] = useState(MEMORY_CLEAR)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currencyMode, setCurrencyMode] = useState(false)
  const [currencyFrom, setCurrencyFrom] = useState('IRR')
  const [currencyTo, setCurrencyTo] = useState('USD')
  const [expression, setExpression] = useState('')
  const displayRef = useRef<HTMLDivElement>(null)

  const tPri = isDark ? '#f1f5f9' : '#0f172a'
  const tSec = isDark ? '#94a3b8' : '#64748b'
  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'

  const calculate = useCallback((a: number, op: string, b: number): number => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : NaN
      default: return b
    }
  }, [])

  const inputDigit = useCallback((digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display === '0' ? digit : display + digit)
    }
  }, [display, waitingForOperand])

  const inputDot = useCallback(() => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
    } else if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }, [display, waitingForOperand])

  const handleOperator = useCallback((nextOp: string) => {
    const inputValue = parseFloat(display)
    if (prevValue !== null && operator && !waitingForOperand) {
      const result = calculate(prevValue, operator, inputValue)
      setDisplay(formatNumber(result))
      setPrevValue(result)
      setExpression(`${result} ${nextOp}`)
    } else {
      setPrevValue(inputValue)
      setExpression(`${inputValue} ${nextOp}`)
    }
    setOperator(nextOp)
    setWaitingForOperand(true)
  }, [display, prevValue, operator, waitingForOperand, calculate])

  const handleEquals = useCallback(() => {
    if (prevValue === null || !operator) return
    const inputValue = parseFloat(display)
    const result = calculate(prevValue, operator, inputValue)
    const expr = `${prevValue} ${operator} ${inputValue} = ${result}`
    setHistory([{ expression: expr, result: formatNumber(result), timestamp: new Date().toLocaleTimeString('fa-IR') }, ...history])
    setDisplay(formatNumber(result))
    setPrevValue(null)
    setOperator(null)
    setWaitingForOperand(true)
    setExpression('')
  }, [display, prevValue, operator, calculate, history])

  const handleClear = useCallback(() => {
    setDisplay('0')
    setPrevValue(null)
    setOperator(null)
    setWaitingForOperand(false)
    setExpression('')
  }, [])

  const handleClearEntry = useCallback(() => {
    setDisplay('0')
    setWaitingForOperand(false)
  }, [])

  const handleBackspace = useCallback(() => {
    if (waitingForOperand) return
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0')
  }, [display, waitingForOperand])

  const handlePercent = useCallback(() => {
    const value = parseFloat(display)
    const result = prevValue !== null ? prevValue * value / 100 : value / 100
    setDisplay(formatNumber(result))
  }, [display, prevValue])

  const handleSqrt = useCallback(() => {
    const value = parseFloat(display)
    const result = Math.sqrt(value)
    setDisplay(formatNumber(result))
    setHistory([{ expression: `√(${value}) = ${result}`, result: formatNumber(result), timestamp: new Date().toLocaleTimeString('fa-IR') }, ...history])
  }, [display, history])

  const handleSquare = useCallback(() => {
    const value = parseFloat(display)
    const result = value * value
    setDisplay(formatNumber(result))
    setHistory([{ expression: `${value}² = ${result}`, result: formatNumber(result), timestamp: new Date().toLocaleTimeString('fa-IR') }, ...history])
  }, [display, history])

  const handleInverse = useCallback(() => {
    const value = parseFloat(display)
    const result = 1 / value
    setDisplay(formatNumber(result))
  }, [display])

  const handleNegate = useCallback(() => {
    setDisplay(formatNumber(-parseFloat(display)))
  }, [display])

  const handleMemory = useCallback((op: string) => {
    const value = parseFloat(display)
    switch (op) {
      case 'M+': setMemory(memory + value); break
      case 'M-': setMemory(memory - value); break
      case 'MR': setDisplay(formatNumber(memory)); setWaitingForOperand(true); break
      case 'MC': setMemory(MEMORY_CLEAR); break
    }
  }, [display, memory])

  const handleCurrencyConvert = useCallback(() => {
    const value = parseFloat(display)
    const fromRate = RATES[currencyFrom]
    const toRate = RATES[currencyTo]
    const inIRR = value * fromRate
    const result = inIRR / toRate
    const expr = `${value.toLocaleString('fa-IR')} ${currencyFrom} = ${result.toLocaleString('fa-IR')} ${currencyTo}`
    setHistory([{ expression: expr, result: formatNumber(result), timestamp: new Date().toLocaleTimeString('fa-IR') }, ...history])
    setDisplay(formatNumber(result))
  }, [display, currencyFrom, currencyTo, history])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(display).catch(() => {})
  }, [display])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') inputDigit(e.key)
      else if (e.key === '.') inputDot()
      else if (e.key === '+') handleOperator('+')
      else if (e.key === '-') handleOperator('-')
      else if (e.key === '*') handleOperator('×')
      else if (e.key === '/') { e.preventDefault(); handleOperator('÷') }
      else if (e.key === 'Enter' || e.key === '=') handleEquals()
      else if (e.key === 'Escape') handleClear()
      else if (e.key === 'Backspace') handleBackspace()
      else if (e.key === '%') handlePercent()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [inputDigit, inputDot, handleOperator, handleEquals, handleClear, handleBackspace, handlePercent])

  const CalcButton = ({ label, onClick, className = '', span = 1, style = {} }: { label: string; onClick: () => void; className?: string; span?: number; style?: any }) => (
    <button onClick={onClick}
      className={`${className} rounded-xl font-bold text-sm transition-all active:scale-95`}
      style={{ gridColumn: `span ${span}`, padding: '12px', backgroundColor: cardBg, color: tPri, border: `1px solid ${cardBorder}`, ...style }}>
      {label}
    </button>
  )

  return (
    <div className={`${docked ? '' : 'fixed bottom-4 right-4 z-50 shadow-2xl'} rounded-2xl border overflow-hidden`}
      style={{ width: docked ? '100%' : 320, backgroundColor: cardBg, borderColor: cardBorder }}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${cardBorder}` }}>
        <span className="text-xs font-bold" style={{ color: tSec }}>ماشین حساب</span>
        <div className="flex gap-1">
          <button onClick={() => setCurrencyMode(!currencyMode)} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: currencyMode ? '#006194' : 'transparent', color: currencyMode ? '#fff' : tSec, border: `1px solid ${currencyMode ? '#006194' : cardBorder}` }}>ارز</button>
          <button onClick={() => setShowHistory(!showHistory)} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: showHistory ? '#006194' : 'transparent', color: showHistory ? '#fff' : tSec, border: `1px solid ${showHistory ? '#006194' : cardBorder}` }}>تاریخچه</button>
          {onClose && <button onClick={onClose} className="px-2 py-0.5 rounded text-[10px]" style={{ color: '#ef4444' }}>×</button>}
        </div>
      </div>

      {/* Currency conversion bar */}
      {currencyMode && (
        <div className="flex items-center gap-1 px-2 py-1.5" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${cardBorder}` }}>
          <select value={currencyFrom} onChange={(e) => setCurrencyFrom(e.target.value)} className="px-1 py-0.5 rounded text-[10px] font-bold outline-none" style={{ backgroundColor: cardBg, color: tPri, border: `1px solid ${cardBorder}` }}>
            {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ color: tSec, fontSize: 10 }}>→</span>
          <select value={currencyTo} onChange={(e) => setCurrencyTo(e.target.value)} className="px-1 py-0.5 rounded text-[10px] font-bold outline-none" style={{ backgroundColor: cardBg, color: tPri, border: `1px solid ${cardBorder}` }}>
            {Object.keys(RATES).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleCurrencyConvert} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: '#006194', color: '#fff' }}>تبدیل</button>
        </div>
      )}

      {/* Display */}
      <div className="px-3 py-2 text-right" style={{ borderBottom: `1px solid ${cardBorder}` }}>
        {expression && <div className="text-[10px]" style={{ color: tSec }}>{expression}</div>}
        {memory !== MEMORY_CLEAR && <div className="text-[10px]" style={{ color: '#f59e0b' }}>M: {formatNumber(memory)}</div>}
        <div ref={displayRef} className="text-2xl font-mono font-bold truncate" style={{ color: tPri, direction: 'ltr', textAlign: 'right' }}>{display}</div>
      </div>

      {/* History panel */}
      {showHistory && (
        <div className="max-h-40 overflow-y-auto px-2 py-1" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          {history.length === 0 && <p className="text-[10px] text-center py-2" style={{ color: tSec }}>تاریخچه‌ای وجود ندارد</p>}
          {history.map((h, i) => (
            <div key={i} className="flex justify-between text-[10px] py-0.5 cursor-pointer hover:bg-blue-500/5 rounded" onClick={() => { setDisplay(h.result); setWaitingForOperand(true) }}>
              <span style={{ color: tPri }}>{h.expression}</span>
              <span style={{ color: tSec }}>{h.timestamp}</span>
            </div>
          ))}
          {history.length > 0 && (
            <button onClick={() => { const text = history.map(h => `${h.expression} (${h.timestamp})`).join('\n'); navigator.clipboard.writeText(text) }}
              className="text-[10px] mt-1 px-2 py-0.5 rounded" style={{ color: '#3b82f6' }}>کپی همه</button>
          )}
        </div>
      )}

      {/* Memory buttons */}
      <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
        {['MC', 'MR', 'M-', 'M+'].map(m => (
          <button key={m} onClick={() => handleMemory(m)} className="py-1 rounded text-[10px] font-bold"
            style={{ backgroundColor: memory !== MEMORY_CLEAR && m === 'MR' ? 'rgba(245,158,11,0.2)' : 'transparent', color: '#f59e0b', border: `1px solid ${cardBorder}` }}>{m}</button>
        ))}
      </div>

      {/* Main buttons */}
      <div className="grid grid-cols-4 gap-1 px-2 pb-2">
        <CalcButton label="C" onClick={handleClear} style={{ color: '#ef4444' }} />
        <CalcButton label="CE" onClick={handleClearEntry} style={{ color: '#ef4444' }} />
        <CalcButton label="%" onClick={handlePercent} style={{ color: '#006194' }} />
        <CalcButton label="÷" onClick={() => handleOperator('÷')} style={{ color: '#006194', background: 'rgba(0,97,148,0.1)' }} />

        <CalcButton label="7" onClick={() => inputDigit('7')} />
        <CalcButton label="8" onClick={() => inputDigit('8')} />
        <CalcButton label="9" onClick={() => inputDigit('9')} />
        <CalcButton label="×" onClick={() => handleOperator('×')} style={{ color: '#006194', background: 'rgba(0,97,148,0.1)' }} />

        <CalcButton label="4" onClick={() => inputDigit('4')} />
        <CalcButton label="5" onClick={() => inputDigit('5')} />
        <CalcButton label="6" onClick={() => inputDigit('6')} />
        <CalcButton label="-" onClick={() => handleOperator('-')} style={{ color: '#006194', background: 'rgba(0,97,148,0.1)' }} />

        <CalcButton label="1" onClick={() => inputDigit('1')} />
        <CalcButton label="2" onClick={() => inputDigit('2')} />
        <CalcButton label="3" onClick={() => inputDigit('3')} />
        <CalcButton label="+" onClick={() => handleOperator('+')} style={{ color: '#006194', background: 'rgba(0,97,148,0.1)' }} />

        <CalcButton label="±" onClick={handleNegate} style={{ color: '#a855f7' }} />
        <CalcButton label="0" onClick={() => inputDigit('0')} />
        <CalcButton label="." onClick={inputDot} />
        <CalcButton label="=" onClick={handleEquals} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff' }} />
      </div>

      {/* Scientific row */}
      <div className="grid grid-cols-3 gap-1 px-2 pb-2">
        <CalcButton label="x²" onClick={handleSquare} style={{ color: '#a855f7', fontSize: 11 }} />
        <CalcButton label="√" onClick={handleSqrt} style={{ color: '#a855f7', fontSize: 11 }} />
        <CalcButton label="1/x" onClick={handleInverse} style={{ color: '#a855f7', fontSize: 11 }} />
      </div>

      {/* Copy button */}
      <div className="px-2 pb-2">
        <button onClick={handleCopy} className="w-full py-1 rounded-lg text-[10px] font-bold"
          style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)', color: '#3b82f6', border: `1px solid rgba(59,130,246,0.3)` }}>
          کپی نتیجه
        </button>
      </div>
    </div>
  )
}
