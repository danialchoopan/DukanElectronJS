import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import { fa } from '../i18n'

interface Props {
  onBarcodeScanned: (barcode: string) => void
}

const BarcodeInput = forwardRef<HTMLInputElement, Props>(({ onBarcodeScanned }, ref) => {
  const [value, setValue] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(ref, () => inputRef.current!)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && value.trim()) { onBarcodeScanned(value.trim()); setValue(''); setSearchResults([]); setShowDropdown(false) }
      if (e.key === 'Escape') { setSearchResults([]); setShowDropdown(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [value, onBarcodeScanned])

  const handleInput = async (query: string) => {
    setValue(query)
    if (query.length >= 2) {
      const result = await window.api.products.search(query)
      if (result.success && result.data) { setSearchResults(result.data.slice(0, 8)); setShowDropdown(true) }
    } else { setSearchResults([]); setShowDropdown(false) }
  }

  const selectProduct = (product: any) => {
    onBarcodeScanned(product.barcode || product.title)
    setValue(''); setSearchResults([]); setShowDropdown(false); inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <input ref={inputRef} type="text" value={value} onChange={(e) => handleInput(e.target.value)}
        className="input-field text-lg" placeholder={fa.pos.scanOrSearch} autoFocus />
      {showDropdown && searchResults.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-xl shadow-lg max-h-60 overflow-auto"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {searchResults.map((p) => (
            <button key={p.id} onClick={() => selectProduct(p)}
              className="w-full text-right px-4 py-2.5 flex justify-between text-sm hover:opacity-80 transition-all"
              style={{ borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-primary)' }}>{p.title}</span>
              <span style={{ color: 'var(--text-muted)' }}>{p.sale_price.toLocaleString('fa-IR')} {fa.common.toman}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
BarcodeInput.displayName = 'BarcodeInput'
export default BarcodeInput
