import { useState, useEffect } from 'react'
import type { Expense } from '../../../../types'
import { fa } from '../../i18n'
import { formatJalaliShort, getTodayGregorian } from '../../utils/jalali'
import ShamsiDateInput from '../../components/business/ShamsiDateInput'
import Pagination from '../../components/ui/Pagination'
import { useSortable } from '../../hooks/useSortable'
import { useTheme } from '../../hooks/useTheme'

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    category: '',
    description: '',
    amount: 0,
    date: getTodayGregorian(),
    images: [] as string[],
    imageBase64: '',
  })
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const { isDark } = useTheme()

  const cardBg = isDark ? '#1e293b' : '#ffffff'
  const cardBorder = isDark ? '#334155' : '#e2e8f0'
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  const load = async () => {
    const [e, t] = await Promise.all([
      window.api.expenses.getAll(),
      window.api.expenses.getTotal(),
    ])
    if (e.success && e.data) setExpenses(e.data)
    if (t.success && t.data !== undefined) setTotalExpenses(t.data)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async () => {
    if (!form.category || !form.description || form.amount <= 0) return
    await window.api.expenses.create(form)
    setShowForm(false)
    setForm({ category: '', description: '', amount: 0, date: getTodayGregorian(), images: [], imageBase64: '' })
    load()
  }

  const handleDelete = async (id: number) => {
    await window.api.expenses.delete(id)
    setDeleteId(null)
    load()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        setForm(f => ({ ...f, images: [...(f.images || []), reader.result as string] }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  const categories = Object.values(fa.expense.categories)

  const paged = expenses.slice(page * pageSize, (page + 1) * pageSize)
  const { sorted, sortKey, sortDir, toggleSort } = useSortable(paged)

  return (
    <div className="max-w-7xl mx-auto px-4 h-full p-4 overflow-auto" dir="rtl">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{fa.expense.title}</h2>
          <span className="text-sm" style={{ color: textSecondary }}>
            {fa.expense.totalExpenses}: {totalExpenses.toLocaleString('fa-IR')} {fa.common.toman}
          </span>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-80"
          style={{ backgroundColor: '#3b82f6' }}
        >
          + {fa.expense.add}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border p-4 mb-4" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>{fa.expense.category}</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="input-field text-sm w-full"
                style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }}
              >
                <option value="">...</option>
                {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>{fa.expense.description}</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="input-field text-sm w-full"
                style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }}
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>{fa.expense.amount}</label>
              <input
                type="number"
                value={form.amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: +e.target.value }))}
                className="input-field text-sm w-full"
                style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: cardBorder, color: textPrimary }}
              />
            </div>
            <div>
              <ShamsiDateInput
                value={form.date}
                onChange={(d) => setForm((f) => ({ ...f, date: d }))}
                label={fa.expense.date}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs font-bold block mb-1" style={{ color: textSecondary }}>{fa.expense.image}</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="text-sm"
              style={{ color: textSecondary }}
            />
            {form.images.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative inline-block">
                    <img src={img} alt="" className="w-20 h-20 rounded-lg object-cover" style={{ border: `1px solid ${cardBorder}` }} />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center transition-all hover:opacity-80"
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSubmit} className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-80" style={{ backgroundColor: '#22c55e' }}>{fa.admin.create}</button>
            <button onClick={() => { setShowForm(false); setForm({ category: '', description: '', amount: 0, date: getTodayGregorian(), images: [], imageBase64: '' }) }} className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-80" style={{ backgroundColor: cardBorder, color: textPrimary }}>{fa.expense.cancel}</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[20%]" />
              <col className="w-[30%]" />
              <col className="w-[15%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr style={{ color: textSecondary, borderBottom: `1px solid ${cardBorder}` }}>
                {([
                  { key: 'date' as keyof Expense, label: fa.expense.date },
                  { key: 'category' as keyof Expense, label: fa.expense.category },
                  { key: 'description' as keyof Expense, label: fa.expense.description },
                  { key: 'amount' as keyof Expense, label: fa.expense.amount },
                ]).map(col => (
                  <th key={String(col.key)} className="text-right px-3 py-2.5 font-bold text-xs uppercase tracking-wider cursor-pointer select-none hover:text-blue-500 transition-colors" onClick={() => toggleSort(col.key)} style={{ color: sortKey === col.key ? '#3b82f6' : textSecondary }}>
                    {col.label} <span className="text-[10px] opacity-50">{sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                  </th>
                ))}
                <th className="text-center px-3 py-2.5 font-bold text-xs uppercase tracking-wider" style={{ color: textSecondary, width: 40 }}></th>
                <th className="text-center px-3 py-2.5 font-bold text-xs uppercase tracking-wider" style={{ color: textSecondary, width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ex) => (
                <tr
                  key={ex.id}
                  onClick={() => setSelectedExpense(ex)}
                  className="cursor-pointer transition-colors hover:bg-opacity-5 hover:bg-blue-500"
                  style={{ borderBottom: `1px solid ${cardBorder}` }}
                >
                  <td className="px-3 py-2.5 text-xs" style={{ color: textSecondary }}>{formatJalaliShort(ex.date)}</td>
                  <td className="px-3 py-2.5" style={{ color: textPrimary }}>{ex.category}</td>
                  <td className="px-3 py-2.5 truncate" style={{ color: textPrimary }}>{ex.description}</td>
                  <td className="px-3 py-2.5 font-mono font-bold" style={{ color: '#ef4444' }}>{ex.amount.toLocaleString('fa-IR')}</td>
                  <td className="px-3 py-2.5 text-center">
                    {(ex.images?.length || ex.imageBase64) ? (
                      <svg className="w-4 h-4 mx-auto" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                      </svg>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(ex.id) }}
                      className="text-xs font-bold px-2 py-1 rounded transition-all hover:opacity-70"
                      style={{ color: '#ef4444' }}
                    >
                      {fa.expense.delete}
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8" style={{ color: textSecondary }}>
                    {fa.expense.noData}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 pb-3">
          <Pagination
            total={expenses.length}
            pageSize={pageSize}
            page={page}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(0) }}
          />
        </div>
      </div>

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-xl border p-6 w-80" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
            <p className="text-sm font-bold mb-4" style={{ color: textPrimary }}>{fa.expense.delete}?</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-80" style={{ backgroundColor: '#ef4444' }}>{fa.expense.delete}</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-80" style={{ backgroundColor: cardBorder, color: textPrimary }}>{fa.expense.cancel}</button>
            </div>
          </div>
        </div>
      )}

      {selectedExpense && (
        <DetailModal expense={selectedExpense} onClose={() => setSelectedExpense(null)} isDark={isDark} cardBg={cardBg} cardBorder={cardBorder} textPrimary={textPrimary} textSecondary={textSecondary} />
      )}
    </div>
  )
}

function DetailModal({ expense, onClose, isDark, cardBg, cardBorder, textPrimary, textSecondary }: {
  expense: Expense
  onClose: () => void
  isDark: boolean
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
}) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [imageIndex, setImageIndex] = useState(0)
  const images = expense.images?.length ? expense.images : (expense.imageBase64 ? [expense.imageBase64] : [])
  const image = images[imageIndex] || ''

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image
    link.download = `invoice-${imageIndex + 1}.jpg`
    link.click()
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>${fa.expense.print}</title><style>body{font-family:sans-serif;padding:20px;direction:rtl}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ccc;padding:8px;text-align:right}th{background:#f5f5f5}img{max-width:300px;max-height:300px;object-fit:contain;margin-top:10px}</style></head><body>
      <h2>${fa.expense.title}</h2>
      <table><tr><th>${fa.expense.date}</th><td>${formatJalaliShort(expense.date)}</td></tr>
      <tr><th>${fa.expense.category}</th><td>${expense.category}</td></tr>
      <tr><th>${fa.expense.description}</th><td>${expense.description}</td></tr>
      <tr><th>${fa.expense.amount}</th><td>${expense.amount.toLocaleString('fa-IR')} ${fa.common.toman}</td></tr></table>
      ${images.map(img => `<img src="${img}" />`).join('')}
    </body></html>`)
    win.document.close()
    win.print()
  }

  const fileSize = image ? Math.round((image.length * 3) / 4 / 1024) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="rounded-xl border w-full max-w-3xl max-h-[85vh] overflow-auto" style={{ backgroundColor: cardBg, borderColor: cardBorder }}>
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: cardBorder }}>
          <h3 className="text-lg font-bold" style={{ color: textPrimary }}>{fa.expense.viewDetail}</h3>
          <button onClick={onClose} className="text-sm font-bold px-3 py-1 rounded-lg transition-all hover:opacity-70" style={{ color: textSecondary }}>{fa.expense.cancel}</button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold" style={{ color: textSecondary }}>{fa.expense.date}</span>
              <p className="text-sm" style={{ color: textPrimary }}>{formatJalaliShort(expense.date)}</p>
            </div>
            <div>
              <span className="text-xs font-bold" style={{ color: textSecondary }}>{fa.expense.category}</span>
              <p className="text-sm" style={{ color: textPrimary }}>{expense.category}</p>
            </div>
            <div>
              <span className="text-xs font-bold" style={{ color: textSecondary }}>{fa.expense.description}</span>
              <p className="text-sm" style={{ color: textPrimary }}>{expense.description}</p>
            </div>
            <div>
              <span className="text-xs font-bold" style={{ color: textSecondary }}>{fa.expense.amount}</span>
              <p className="text-sm font-mono font-bold" style={{ color: '#ef4444' }}>{expense.amount.toLocaleString('fa-IR')} {fa.common.toman}</p>
            </div>
          </div>
          <div>
            {images.length > 0 ? (
              <div>
                <div className="relative rounded-lg overflow-hidden border mb-2 flex items-center justify-center" style={{ borderColor: cardBorder, backgroundColor: isDark ? '#0f172a' : '#f8fafc', minHeight: 250, maxHeight: 400 }}>
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageIndex(i => i > 0 ? i - 1 : images.length - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold text-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      >
                        &#8594;
                      </button>
                      <button
                        onClick={() => setImageIndex(i => i < images.length - 1 ? i + 1 : 0)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold text-lg transition-all hover:opacity-80"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      >
                        &#8592;
                      </button>
                    </>
                  )}
                  <img
                    src={image}
                    alt=""
                    style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: 'transform 0.2s', maxWidth: '100%', maxHeight: '380px', objectFit: 'contain' }}
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex justify-center gap-1 mb-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageIndex(idx)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{ backgroundColor: idx === imageIndex ? '#3b82f6' : cardBorder }}
                      />
                    ))}
                  </div>
                )}
                <div className="flex gap-1 flex-wrap">
                  <button onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} className="px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-70" style={{ backgroundColor: cardBorder, color: textPrimary }}>{fa.expense.zoomIn}</button>
                  <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))} className="px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-70" style={{ backgroundColor: cardBorder, color: textPrimary }}>{fa.expense.zoomOut}</button>
                  <button onClick={() => setRotation((r) => r + 90)} className="px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-70" style={{ backgroundColor: cardBorder, color: textPrimary }}>{fa.expense.rotate}</button>
                  <button onClick={handleDownload} className="px-2 py-1 rounded text-xs font-bold transition-all hover:opacity-70" style={{ backgroundColor: cardBorder, color: textPrimary }}>{fa.expense.download}</button>
                </div>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>{fileSize} KB</p>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border p-8" style={{ borderColor: cardBorder, minHeight: 200 }}>
                <span className="text-sm" style={{ color: textSecondary }}>{fa.expense.noImage}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end" style={{ borderColor: cardBorder }}>
          <button onClick={handlePrint} className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-80" style={{ backgroundColor: '#3b82f6' }}>{fa.expense.print}</button>
        </div>
      </div>
    </div>
  )
}