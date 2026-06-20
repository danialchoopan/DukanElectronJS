import { useState, useMemo } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export function useSortable<T extends Record<string, any>>(data: T[], defaultKey?: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey || null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDir === 'asc' ? aStr.localeCompare(bStr, 'fa') : bStr.localeCompare(aStr, 'fa')
    })
  }, [data, sortKey, sortDir])

  const toggleSort = (key: keyof T) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null) }
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const getSortIcon = (key: keyof T) => {
    if (sortKey !== key) return '↕'
    return sortDir === 'asc' ? '↑' : '↓'
  }

  return { sorted, sortKey, sortDir, toggleSort, getSortIcon }
}
