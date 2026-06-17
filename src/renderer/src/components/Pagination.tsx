interface Props {
  total: number
  pageSize: number
  page: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZES = [10, 20, 50]

export default function Pagination({ total, pageSize, page, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>تعداد در هر صفحه:</span>
        <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="input-field text-sm w-20" style={{ padding: '4px 8px' }}>
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{total} آیتم</span>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button onClick={() => onPageChange(0)} disabled={page === 0} className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>اول</button>
          <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>قبلی</button>
          <span className="text-sm font-bold px-2" style={{ color: 'var(--text-primary)' }}>{page + 1} / {totalPages}</span>
          <button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>بعدی</button>
          <button onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} className="btn btn-primary text-sm disabled:opacity-40" style={{ padding: '6px 10px', fontSize: '11px' }}>آخر</button>
        </div>
      )}
    </div>
  )
}
