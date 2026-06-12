import { useEffect, useMemo, useState } from 'react'
import { Crosshair, RefreshCw, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, EmptyState, Select } from '@/components/ui'
import {
  useDriversStore,
  useFacilitiesStore,
  useOrdersStore,
  usePositionsStore,
  useShiftsStore,
  useVehiclesStore,
} from '@/store'
import { FleetMap, type ActiveVehicle, type FocusRequest } from '@/components/map/FleetMap'

/** Re-derive + interpolate the active set every 30s (the literal requirement). */
const AUTO_REFRESH_MS = 30_000

type StatusFilter = 'all' | 'en_route' | 'arrived'

export function LiveMapPage() {
  const positions = usePositionsStore((s) => s.positions)
  const lastRefreshAt = usePositionsStore((s) => s.lastRefreshAt)
  const facilities = useFacilitiesStore((s) => s.items)
  const vehicles = useVehiclesStore((s) => s.items)
  const drivers = useDriversStore((s) => s.items)
  const orders = useOrdersStore((s) => s.items)
  const shifts = useShiftsStore((s) => s.items)

  const [driverFilter, setDriverFilter] = useState('all')
  const [vehicleFilter, setVehicleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [focus, setFocus] = useState<FocusRequest | null>(null)

  // Run the simulation ticker only while this page is mounted, and poll every
  // 30s so the active set stays in sync even without continuous interaction.
  useEffect(() => {
    const sim = usePositionsStore.getState()
    sim.start()
    const poll = setInterval(() => usePositionsStore.getState().refresh(), AUTO_REFRESH_MS)
    return () => {
      clearInterval(poll)
      sim.stop()
    }
  }, [])

  // Join each live position with its vehicle/driver/order/destination.
  const activeVehicles = useMemo<ActiveVehicle[]>(() => {
    return Object.values(positions).flatMap((position) => {
      const vehicle = vehicles.find((v) => v.id === position.vehicleId)
      if (!vehicle) return []
      const shift = shifts.find((s) => s.status === 'active' && s.vehicleId === vehicle.id)
      const driver = drivers.find((d) => d.id === shift?.driverId)
      const order = orders.find((o) => o.id === position.activeOrderId)
      const destination = facilities.find((f) => f.id === order?.destinationId)
      return [{ position, vehicle, driver, order, destination }]
    })
  }, [positions, vehicles, shifts, drivers, orders, facilities])

  const filtered = useMemo(() => {
    return activeVehicles.filter((v) => {
      if (driverFilter !== 'all' && v.driver?.id !== driverFilter) return false
      if (vehicleFilter !== 'all' && v.vehicle.id !== vehicleFilter) return false
      const arrived = v.position.progress >= 1
      if (statusFilter === 'en_route' && arrived) return false
      if (statusFilter === 'arrived' && !arrived) return false
      return true
    })
  }, [activeVehicles, driverFilter, vehicleFilter, statusFilter])

  const updated = lastRefreshAt
    ? new Date(lastRefreshAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Live Fleet Map"
        description="Real-time positions for vehicles currently on shift, updated every second."
        actions={
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 sm:inline">Updated {updated}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => usePositionsStore.getState().refresh()}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="h-[68vh] min-h-[420px]">
            <FleetMap facilities={facilities} vehicles={filtered} focus={focus} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-1">
                <span className="eyebrow">Driver</span>
                <Select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)}>
                  <option value="all">All drivers</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="eyebrow">Vehicle</span>
                <Select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
                  <option value="all">All vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="eyebrow">Status</span>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  <option value="all">All</option>
                  <option value="en_route">En route</option>
                  <option value="arrived">Arrived</option>
                </Select>
              </label>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <h3 className="font-display text-sm font-semibold tracking-tight">On the road</h3>
              <Badge tone="amber" dot pulse>
                {filtered.length} active
              </Badge>
            </div>

            {filtered.length === 0 ? (
              <div className="p-2">
                <EmptyState
                  icon={Truck}
                  title="No vehicles on the road"
                  description="Start a shift from the Driver view (with assigned deliveries) to see live tracking here."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((v) => {
                  const arrived = v.position.progress >= 1
                  return (
                    <li key={v.vehicle.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {v.vehicle.registration}
                          <span className="text-slate-400"> · {v.driver?.name ?? 'Unassigned'}</span>
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          → {v.destination?.name ?? 'Unknown'} ·{' '}
                          {arrived ? 'Arrived' : `${Math.round(v.position.progress * 100)}%`}
                        </p>
                      </div>
                      <button
                        onClick={() => setFocus({ vehicleId: v.vehicle.id, token: Date.now() })}
                        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        aria-label={`Locate ${v.vehicle.registration}`}
                        title="Locate on map"
                      >
                        <Crosshair className="size-4" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
