import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Input } from './inputs'
import { EmptyState, type EmptyStateProps } from './EmptyState'
import { SkeletonRows } from './Skeleton'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  /** Value used for sorting; enables the sort control on this column. */
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right' | 'center'
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  /** Text a row is matched against when searching. Defaults to all values. */
  getSearchText?: (row: T) => string
  /** Extra filter controls rendered in the toolbar. */
  toolbar?: ReactNode
  empty?: EmptyStateProps
  onRowClick?: (row: T) => void
  /** Trailing actions column rendered per row. */
  actions?: (row: T) => ReactNode
}

type SortDir = 'asc' | 'desc'

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' } as const

export function DataTable<T>({
  data,
  columns,
  rowKey,
  loading,
  searchable,
  searchPlaceholder = 'Search…',
  getSearchText,
  toolbar,
  empty,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo(() => {
    const searchText =
      getSearchText ??
      ((row: T) =>
        Object.values(row as Record<string, unknown>)
          .map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)))
          .join(' '))

    let result = data
    const q = query.trim().toLowerCase()
    if (q) result = result.filter((row) => searchText(row).toLowerCase().includes(q))

    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey)
      if (col?.sortValue) {
        const sv = col.sortValue
        result = [...result].sort((a, b) => {
          const av = sv(a)
          const bv = sv(b)
          const cmp = av < bv ? -1 : av > bv ? 1 : 0
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
    }
    return result
  }, [data, query, sortKey, sortDir, columns, getSearchText])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="flex flex-col">
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
          {searchable && (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-9"
                aria-label="Search"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {loading ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <EmptyState
          title={empty?.title ?? 'No results'}
          description={empty?.description ?? (query ? 'Try a different search.' : undefined)}
          action={empty?.action}
          icon={empty?.icon}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-2.5 font-medium text-slate-500 dark:text-slate-400',
                      alignClass[col.align ?? 'left'],
                    )}
                  >
                    {col.sortValue ? (
                      <button
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 transition hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        {col.header}
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowDown className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
                {actions && <th className="px-4 py-2.5 text-right" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-slate-100 last:border-0 dark:border-slate-800/60',
                    onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3 text-slate-700 dark:text-slate-200', alignClass[col.align ?? 'left'], col.className)}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
