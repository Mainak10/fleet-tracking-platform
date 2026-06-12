import { useEffect, useMemo } from 'react'
import { Navigation, Send, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge, Button, Card, EmptyState } from '@/components/ui'
import {
  useDriversStore,
  useFacilitiesStore,
  useOrdersStore,
  usePositionsStore,
  useShiftsStore,
  useUiStore,
  useVehiclesStore,
} from '@/store'
import { useDriverId } from '@/hooks/useDriverId'
import { activeShiftForDriver } from '@/lib/shift'
import { FleetMap, type ActiveVehicle } from '@/components/map/FleetMap'

const AUTO_REFRESH_MS = 30_000

export function DriverMapPage() {
  const driverId = useDriverId()
  const positions = usePositionsStore((s) => s.positions)
  const facilities = useFacilitiesStore((s) => s.items)
  const vehicles = useVehiclesStore((s) => s.items)
  const drivers = useDriversStore((s) => s.items)
  const orders = useOrdersStore((s) => s.items)
  const shifts = useShiftsStore((s) => s.items)
  const addToast = useUiStore((s) => s.addToast)

  // Drive the simulation while this map is open, same as the admin map.
  useEffect(() => {
    const sim = usePositionsStore.getState()
    sim.start()
    const poll = setInterval(() => usePositionsStore.getState().refresh(), AUTO_REFRESH_MS)
    return () => {
      clearInterval(poll)
      sim.stop()
    }
  }, [])

  const shift = driverId ? activeShiftForDriver(shifts, driverId) : undefined
  const vehicle = vehicles.find((v) => v.id === shift?.vehicleId)
  const position = vehicle ? positions[vehicle.id] : undefined

  const me = useMemo<ActiveVehicle[]>(() => {
    if (!vehicle || !position) return []
    const driver = drivers.find((d) => d.id === driverId)
    const order = orders.find((o) => o.id === position.activeOrderId)
    const destination = facilities.find((f) => f.id === order?.destinationId)
    return [{ position, vehicle, driver, order, destination }]
  }, [vehicle, position, drivers, driverId, orders, facilities])

  const onGps = () => {
    if (!vehicle) return
    usePositionsStore.getState().sendGpsUpdate(vehicle.id)
    addToast('success', 'GPS location sent.')
  }

  const active = me[0]
  const arrived = active ? active.position.progress >= 1 : false

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Driver"
        title="Live Map"
        description="Your current location and destination, updated in real time."
        actions={
          <Button onClick={onGps} disabled={!active}>
            <Send className="size-4" /> Send GPS Update
          </Button>
        }
      />

      {!active ? (
        <Card>
          <EmptyState
            icon={Truck}
            title="You're not on the road"
            description={
              driverId
                ? 'Start your shift with assigned deliveries to begin live tracking.'
                : 'Choose a driver from the persona switcher to view their map.'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="overflow-hidden lg:col-span-2">
            <div className="h-[60vh] min-h-[380px]">
              <FleetMap
                facilities={facilities}
                vehicles={me}
                focus={{ vehicleId: active.vehicle.id, token: 0 }}
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="size-5 text-brand-500" />
                <span className="font-display text-sm font-semibold">{active.vehicle.registration}</span>
              </div>
              <Badge tone={arrived ? 'green' : 'amber'} dot pulse={!arrived}>
                {arrived ? 'Arrived' : 'En route'}
              </Badge>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Heading to" value={active.destination?.name ?? '—'} />
              <Row
                label="Progress"
                value={arrived ? 'Arrived' : `${Math.round(active.position.progress * 100)}%`}
              />
              <Row
                label="Last update"
                value={new Date(active.position.updatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              />
            </dl>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
                style={{ width: `${Math.round(active.position.progress * 100)}%` }}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  )
}
