import { create } from 'zustand'

interface PendingPrint {
  html: string
  title: string
  isInvoice: boolean
  onClose?: () => void
}

interface PrintPreviewState {
  pending: PendingPrint | null
  show: (html: string, title: string, isInvoice?: boolean, onClose?: () => void) => void
  clear: () => void
}

export const usePrintPreviewStore = create<PrintPreviewState>((set) => ({
  pending: null,
  show: (html, title, isInvoice = false, onClose) => set({ pending: { html, title, isInvoice, onClose } }),
  clear: () => set({ pending: null }),
}))
