import { useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'

interface DialogProps {
  open: boolean
  onClose?: () => void
  title?: string
  subtitle?: string
  icon?: JSX.Element
  maxWidth?: string
  children: React.ReactNode
  footer?: React.ReactNode
  closeOnBackdrop?: boolean
  className?: string
}

export default function Dialog({ open, onClose, title, subtitle, icon, maxWidth = 'max-w-md', children, footer, closeOnBackdrop = true, className = '' }: DialogProps) {
  const theme = useSettingsStore(s => s.theme)
  const isDark = theme === 'dark'

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className={`w-full ${maxWidth} max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col ${className}`}
        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
        onClick={e => e.stopPropagation()}
      >
        {(title || icon) && (
          <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${cardBorder}` }}>
            {icon && (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #006194, #007bb9)' }}>
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {title && <h3 className="text-base font-extrabold" style={{ color: textPrimary }}>{title}</h3>}
              {subtitle && <p className="text-xs" style={{ color: textSecondary }}>{subtitle}</p>}
            </div>
            {onClose && (
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-black/5">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 shrink-0" style={{ borderTop: `1px solid ${cardBorder}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* Helper components for consistent dialog content */
export function DialogField({ label, children }: { label: string; children: React.ReactNode }) {
  const isDark = document.documentElement.classList.contains('dark')
  const textSecondary = isDark ? '#94a3b8' : '#64748b'
  return (
    <div className="mb-3">
      <label className="text-xs font-bold block mb-1.5" style={{ color: textSecondary }}>{label}</label>
      {children}
    </div>
  )
}

export function DialogInput({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  const isDark = document.documentElement.classList.contains('dark')
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputBorder = isDark ? '#334155' : '#e2e8f0'
  const inputColor = isDark ? '#f1f5f9' : '#0f172a'
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
      className="w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all outline-none focus:ring-2"
      style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputColor }} />
  )
}

export function DialogTextarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const isDark = document.documentElement.classList.contains('dark')
  const inputBg = isDark ? '#0f172a' : '#f8fafc'
  const inputBorder = isDark ? '#334155' : '#e2e8f0'
  const inputColor = isDark ? '#f1f5f9' : '#0f172a'
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2.5 rounded-xl text-sm font-bold transition-all outline-none focus:ring-2 resize-none"
      style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: inputColor }} />
  )
}

export function DialogButton({ children, onClick, variant = 'primary', disabled, className = '' }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'danger' | 'ghost' | 'success'; disabled?: boolean; className?: string }) {
  const isDark = document.documentElement.classList.contains('dark')
  const styles: Record<string, string> = {
    primary: 'linear-gradient(135deg, #006194, #007bb9)',
    danger: 'linear-gradient(135deg, #ef4444, #dc2626)',
    success: 'linear-gradient(135deg, #22c55e, #16a34a)',
    ghost: isDark ? '#334155' : '#f1f5f9',
  }
  const textColors: Record<string, string> = {
    primary: '#fff',
    danger: '#fff',
    success: '#fff',
    ghost: isDark ? '#94a3b8' : '#64748b',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${className}`}
      style={{ background: styles[variant], color: textColors[variant], boxShadow: variant !== 'ghost' ? `0 4px 12px ${styles[variant]}40` : 'none' }}>
      {children}
    </button>
  )
}
