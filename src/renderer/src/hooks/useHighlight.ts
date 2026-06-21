import { useEffect, useCallback, useRef } from 'react'

export function useHighlight(highlightId?: string | null, onDone?: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const highlight = useCallback((id: string) => {
    const el = document.querySelector(`[data-highlight-id="${id}"]`)
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    setTimeout(() => {
      el.classList.add('highlight-active')
      timerRef.current = setTimeout(() => {
        el.classList.remove('highlight-active')
        onDone?.()
      }, 2000)
    }, 300)
  }, [onDone])

  useEffect(() => {
    if (highlightId) highlight(highlightId)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [highlightId, highlight])

  return { highlight }
}
