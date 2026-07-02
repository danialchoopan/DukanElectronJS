import { useTheme } from '../../hooks/useTheme'

interface Column<T> {
  key: keyof T
  label: string
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface Props<T> {
  columns: Column<T>[]
  sortKey: keyof T | null
  sortDir: 'asc' | 'desc' | null
  onSort: (key: keyof T) => void
}

export function SortableTableHeader<T>({ columns, sortKey, sortDir, onSort }: Props<T>) {
  const { isDark } = useTheme()
  const headerBg = isDark ? '#0f172a' : '#f8fafc'
  const textSecondary = isDark ? '#94a3b8' : '#64748b'

  return (
    <tr style={{ backgroundColor: headerBg }}>
      {columns.map(col => (
        <th key={String(col.key)}
          className={`px-3 py-2 cursor-pointer select-none transition-all hover:bg-blue-500/10 ${col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'}`}
          style={{ color: textSecondary, width: col.width }}
          onClick={() => onSort(col.key)}>
          <span className="inline-flex items-center gap-1">
            {col.label}
            <span className="text-[10px] opacity-50" style={{ color: sortKey === col.key ? '#3b82f6' : undefined }}>
              {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
            </span>
          </span>
        </th>
      ))}
    </tr>
  )
}
