import { useMemo, useState } from 'react'
import { AlertTriangle, Warehouse } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, DataTable, type Column } from '@/components/ui'
import { useFacilitiesStore, useProductsStore } from '@/store'
import { isLowStock, stockLevel } from '@/lib/inventory'
import type { Facility, FacilityType, Product } from '@/types/domain'
import { cn } from '@/lib/cn'

type TypeFilter = 'all' | FacilityType

export function InventoryPage() {
  const facilities = useFacilitiesStore((s) => s.items)
  const loading = useFacilitiesStore((s) => s.loading)
  const loaded = useFacilitiesStore((s) => s.loaded)
  const products = useProductsStore((s) => s.items)

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [lowOnly, setLowOnly] = useState(false)

  const lowStockCount = useMemo(
    () =>
      facilities.reduce(
        (total, f) =>
          total +
          products.filter((p) => {
            const qty = f.inventory[p.id]
            return qty !== undefined && isLowStock(qty, p.lowStockThreshold)
          }).length,
        0,
      ),
    [facilities, products],
  )

  const rows = useMemo(() => {
    let result = facilities
    if (typeFilter !== 'all') result = result.filter((f) => f.type === typeFilter)
    if (lowOnly) {
      result = result.filter((f) =>
        products.some((p) => {
          const qty = f.inventory[p.id]
          return qty !== undefined && isLowStock(qty, p.lowStockThreshold)
        }),
      )
    }
    return result
  }, [facilities, products, typeFilter, lowOnly])

  const columns: Column<Facility>[] = [
    {
      key: 'name',
      header: 'Facility',
      sortValue: (f) => f.name,
      render: (f) => (
        <div>
          <div className="font-medium">{f.name}</div>
          <div className="font-mono text-xs text-slate-400">{f.address}</div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (f) => (
        <Badge tone={f.type === 'hub' ? 'amber' : 'slate'}>{f.type === 'hub' ? 'Hub' : 'Terminal'}</Badge>
      ),
    },
    ...products.map<Column<Facility>>((p) => ({
      key: `product-${p.id}`,
      header: p.name,
      align: 'right',
      sortValue: (f) => f.inventory[p.id] ?? -1,
      render: (f) => <InventoryCell facility={f} product={p} />,
    })),
  ]

  const hubs = facilities.filter((f) => f.type === 'hub').length
  const terminals = facilities.length - hubs

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Inventory Dashboard"
        description="Fuel on hand across every hub and terminal, with low-stock alerts."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Hubs" value={hubs} />
        <Stat label="Terminals" value={terminals} />
        <Stat label="Products" value={products.length} />
        <Stat label="Low-stock alerts" value={lowStockCount} tone={lowStockCount > 0 ? 'alert' : 'ok'} />
      </div>

      <Card>
        <DataTable<Facility>
          data={rows}
          columns={columns}
          rowKey={(f) => f.id}
          loading={loading && !loaded}
          searchable
          searchPlaceholder="Search facilities…"
          getSearchText={(f) => `${f.name} ${f.address}`}
          empty={{ icon: Warehouse, title: 'No facilities match', description: 'Adjust your filters.' }}
          toolbar={
            <>
              {(['all', 'hub', 'terminal'] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={typeFilter === t ? 'primary' : 'secondary'}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All' : t === 'hub' ? 'Hubs' : 'Terminals'}
                </Button>
              ))}
              <Button
                size="sm"
                variant={lowOnly ? 'primary' : 'secondary'}
                onClick={() => setLowOnly((v) => !v)}
              >
                <AlertTriangle className="size-4" /> Low stock
              </Button>
            </>
          }
        />
      </Card>
    </div>
  )
}

function InventoryCell({ facility, product }: { facility: Facility; product: Product }) {
  const { quantity, level } = stockLevel(facility, product)
  if (level === 'unknown') return <span className="font-mono text-xs text-slate-300 dark:text-slate-600">—</span>

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs font-medium',
        level === 'low'
          ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
          : 'text-slate-600 dark:text-slate-300',
      )}
    >
      {level === 'low' && <AlertTriangle className="size-3" />}
      {quantity.toLocaleString()}
    </span>
  )
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'alert' | 'ok' }) {
  return (
    <Card className="p-4">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          'mt-1 font-display text-3xl font-bold tabular-nums',
          tone === 'alert' && 'text-red-600 dark:text-red-400',
          tone === 'ok' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </p>
    </Card>
  )
}
