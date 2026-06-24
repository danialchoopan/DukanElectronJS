import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import type { Product } from '../../../../types'
import { fa } from '../../i18n'

interface Props {
  onBarcodeScanned: (barcode: string) => void
  onProductSelected?: (product: Product) => void
}

const BarcodeInput = forwardRef<HTMLInputElement, Props>(({ onBarcodeScanned, onProductSelected }, ref) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  useImperativeHandle(ref, () => inputRef.current!, [])
  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (selectedIndex >= 0 && results[selectedIndex]) {
      const item = dropdownRef.current?.children[selectedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 1) { setResults([]); setShowDropdown(false); return }
    const r = await window.api.products.search(q)
    if (r.success && r.data) { setResults(r.data.filter((p) => p.title)); setShowDropdown(r.data.filter((p) => p.title).length > 0); setSelectedIndex(-1) }
  }, [])

  const handleInput = (val: string) => {
    setQuery(val); setSelectedIndex(-1)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => doSearch(val), 200)
  }

  const selectAndClose = (product: Product) => {
    if (onProductSelected) {
      onProductSelected(product)
    } else {
      onBarcodeScanned(product.barcode || product.title)
    }
    setQuery(''); setResults([]); setShowDropdown(false); setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && results[selectedIndex]) { selectAndClose(results[selectedIndex]) }
      else if (query.trim()) { onBarcodeScanned(query.trim()); setShowDropdown(false) }
    }
    else if (e.key === 'Escape') { setShowDropdown(false) }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <input ref={inputRef} type="text" value={query} onChange={(e) => handleInput(e.target.value)} onKeyDown={handleKeyDown} className="input-field text-lg" placeholder={fa.pos.scanOrSearch} autoFocus />
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl shadow-2xl max-h-64 overflow-auto" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          {results.map((p, i) => (
            <button key={p.id} onClick={() => selectAndClose(p)} onMouseEnter={() => setSelectedIndex(i)}
              className="w-full text-right px-4 py-2.5 flex justify-between items-center text-sm transition-colors"
              style={{ backgroundColor: i === selectedIndex ? 'var(--bg-tertiary)' : 'transparent', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div className="font-medium">{p.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.barcode || 'بدون بارکد'} | {p.category || 'بدون دسته'}</div>
              </div>
              <div className="text-left">
                <div className="font-bold text-green-500">{p.sale_price.toLocaleString('fa-IR')} T</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{fa.admin.stock}: {p.stock}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

BarcodeInput.displayName = 'BarcodeInput'
export default BarcodeInput
