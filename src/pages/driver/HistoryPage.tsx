import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { History, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Card, DataTable, EmptyState, type Column } from '@/components/ui'
import { useOrdersStore, useShiftsStore, useVehiclesStore } from '@/store'
import { useDriverId } from '@/hooks/useDriverId'
import { deliverySummary } from '@/lib/shift'
import type { Shift } from '@/types/domain'

const time = (iso?: string) => (iso ? format(parseISO(iso), 'h:mm a') : '—')

export function HistoryPage() {
  const driverId = useDriverId()
  const shifts = useShiftsStore((s) => s.items)
  const loading = useShiftsStore((s) => s.loading)
  const loaded = useShiftsStore((s) => s.loaded)
  const orders = useOrdersStore((s) => s.items)
  const vehicles = useVehiclesStore((s) => s.items)

  const vehicleReg = (id: string) => vehicles.find((v) => v.id === id)?.registration ?? id

  const rows = useMemo(
    () =>
      shifts
        .filter((s) => s.driverId === driverId && s.status === 'ended')
        .sort((a, b) => b.date.localeCompare(a.date)),
    [shifts, driverId],
  )

  const columns: Column<Shift>[] = [
    {
      key: 'date',
      header: 'Date',
      sortValue: (s) => s.date,
      render: (s) => <span className="font-medium">{format(parseISO(s.date), 'MMM d, yyyy')}</span>,
    },
    { key: 'vehicle', header: 'Vehicle', render: (s) => vehicleReg(s.vehicleId) },
    { key: 'started', header: 'Started', render: (s) => <span className="font-mono text-xs">{time(s.startedAt)}</span> },
    { key: 'ended', header: 'Ended', render: (s) => <span className="font-mono text-xs">{time(s.endedAt)}</span> },
    {
      key: 'outcomes',
      header: 'Deliveries',
      render: (s) => {
        const { total, completed, failed } = deliverySummary(orders, s.orderIds)
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="slate">{total} total</Badge>
            {completed > 0 && <Badge tone="green">{completed} done</Badge>}
            {failed > 0 && <Badge tone="red">{failed} failed</Badge>}
          </div>
        )
      },
    },
  ]

  if (!driverId) {
    return (
      <Shell>
        <Card>
          <EmptyState
            icon={Truck}
            title="No driver selected"
            description="Choose a driver from the persona switcher to view their shift history."
          />
        </Card>
      </Shell>
    )
  }

  return (
    <Shell>
      <Card>
        <DataTable<Shift>
          data={rows}
          columns={columns}
          rowKey={(s) => s.id}
          loading={loading && !loaded}
          empty={{
            icon: History,
            title: 'No past shifts',
            description: 'Completed shifts will appear here once you end one.',
          }}
        />
      </Card>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Driver"
        title="Shift History"
        description="Your completed shifts and their delivery outcomes."
      />
      {children}
    </div>
  )
}
