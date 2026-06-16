import { useState, useRef, useEffect } from 'react'

interface Props {
  length?: 4 | 6
  onSubmit: (pin: string) => void
  error?: string
  showToggle?: boolean
}

export default function PinPad({ length = 4, onSubmit, error, showToggle = false }: Props) {
  const [pin, setPin] = useState('')
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, length)
    setPin(val)
    if (val.length === length) {
      setTimeout(() => onSubmit(val), 200)
    }
  }

  const handleClick = () => {
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col items-center gap-5" onClick={handleClick}>
      {showToggle && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setVisible(!visible) }}
          className="text-xs px-3 py-1 rounded-lg self-end"
          style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-tertiary)' }}
        >
          {visible ? '●●●' : '●●●'}
        </button>
      )}

      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-150 ${
              i < pin.length
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-gray-600 bg-gray-800 text-gray-600'
            }`}
          >
            {i < pin.length ? (visible ? pin[i] : '●') : ''}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={pin}
        onChange={handleChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        tabIndex={-1}
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}
