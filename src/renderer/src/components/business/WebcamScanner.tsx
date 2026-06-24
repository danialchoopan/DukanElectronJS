import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { fa } from '../../i18n'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

export default function WebcamScanner({ onScan, onClose }: Props) {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState('')
  const [lastCode, setLastCode] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const startScanner = useCallback(async () => {
    if (!containerRef.current) return
    try {
      setError('')
      const scanner = new Html5Qrcode('webcam-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
        (decodedText) => {
          setLastCode(decodedText)
          onScan(decodedText)
          scanner.stop().catch(() => {})
          setIsActive(false)
        },
        () => {}
      )
      setIsActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'دوربین در دسترس نیست')
    }
  }, [onScan])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      try { scannerRef.current.clear() } catch {}
      scannerRef.current = null
    }
    setIsActive(false)
  }, [])

  useEffect(() => {
    return () => { stopScanner() }
  }, [stopScanner])

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">{fa.common.webcam}</h2>
          <button onClick={() => { stopScanner(); onClose() }} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="rounded-lg overflow-hidden bg-black mb-4" style={{ minHeight: 240 }}>
          <div ref={containerRef}>
            <div id="webcam-reader" />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-3 text-center">{error}</p>}

        {lastCode && (
          <div className="bg-green-900/30 border border-green-600 rounded-lg p-3 mb-3 text-center">
            <p className="text-green-400 text-sm">شناسایی شد:</p>
            <p className="text-white font-bold text-lg">{lastCode}</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isActive ? (
            <button onClick={startScanner} className="btn-success flex-1 py-3 text-lg">
              {fa.common.scanner}
            </button>
          ) : (
            <button onClick={stopScanner} className="btn-danger flex-1 py-3 text-lg">
              {fa.common.stopCamera}
            </button>
          )}
        </div>

        <p className="text-gray-500 text-xs text-center mt-3">
          دوربین را روی بارکد یا QR کد نگه دارید
        </p>
      </div>
    </div>
  )
}
