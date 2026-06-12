import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Clock, LogOut, MapPin, Play, Truck, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Modal,
  OrderStatusBadge,
  Textarea,
} from '@/components/ui'
import {
  useAllocationsStore,
  useFacilitiesStore,
  useOrdersStore,
  useProductsStore,
  useShiftsStore,
  useUiStore,
  useVehiclesStore,
} from '@/store'
import { useDriverId } from '@/hooks/useDriverId'
import { activeShiftForDriver, allocationForDriver, shiftDeliveries } from '@/lib/shift'
import { todayIso } from '@/lib/date'
import type { Order } from '@/types/domain'

export function ShiftPage() {
  const driverId = useDriverId()
  const today = todayIso()

  const allocations = useAllocationsStore((s) => s.items)
  const shifts = useShiftsStore((s) => s.items)
  const orders = useOrdersStore((s) => s.items)
  const vehicles = useVehiclesStore((s) => s.items)
  const startShift = useShiftsStore((s) => s.start)
  const endShift = useShiftsStore((s) => s.end)
  const addToast = useUiStore((s) => s.addToast)

  const [starting, setStarting] = useState(false)
  const [ending, setEnding] = useState(false)
  const [failing, setFailing] = useState<Order | null>(null)

  const allocation = driverId ? allocationForDriver(allocations, driverId, today) : undefined
  const activeShift = driverId ? activeShiftForDriver(shifts, driverId) : undefined
  const vehicle = vehicles.find((v) => v.id === (activeShift?.vehicleId ?? allocation?.vehicleId))

  // While on shift, deliveries come from the shift; otherwise preview the
  // orders assigned to this driver for today so they know what's queued.
  const deliveries = useMemo<Order[]>(() => {
    if (activeShift) return shiftDeliveries(orders, activeShift.orderIds)
    if (!driverId) return []
    return orders.filter((o) => o.assignedDriverId === driverId && o.deliveryDate === today)
  }, [activeShift, orders, driverId, today])

  const pending = deliveries.filter((o) => o.status === 'in_transit').length

  if (!driverId) {
    return (
      <DriverShell>
        <Card>
          <EmptyState
            icon={Truck}
            title="No driver selected"
            description="Choose a driver from the persona switcher to view their shift."
          />
        </Card>
      </DriverShell>
    )
  }

  const onStart = async () => {
    setStarting(true)
    try {
      await startShift(driverId, today)
      addToast('success', 'Shift started — deliveries are now in transit.')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not start shift.')
    } finally {
      setStarting(false)
    }
  }

  const onEnd = async () => {
    if (!activeShift) return
    setEnding(true)
    try {
      await endShift(activeShift.id)
      addToast('success', 'Shift ended.')
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not end shift.')
    } finally {
      setEnding(false)
    }
  }

  return (
    <DriverShell
      action={
        activeShift ? (
          <Button variant="danger" onClick={onEnd} loading={ending}>
            <LogOut className="size-4" /> End Shift
          </Button>
        ) : (
          <Button onClick={onStart} loading={starting} disabled={!allocation}>
            <Play className="size-4" /> Start Shift
          </Button>
        )
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Today · {format(parseISO(today), 'EEEE, MMM d')}</CardTitle>
          {activeShift ? (
            <Badge tone="green" dot pulse>
              On shift
            </Badge>
          ) : allocation ? (
            <Badge tone="blue" dot>
              Ready to start
            </Badge>
          ) : (
            <Badge tone="slate">No allocation</Badge>
          )}
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-3">
          <Stat icon={Truck} label="Vehicle" value={vehicle ? vehicle.registration : '—'} />
          <Stat
            icon={Clock}
            label="Started"
            value={activeShift ? format(parseISO(activeShift.startedAt), 'h:mm a') : '—'}
          />
          <Stat icon={MapPin} label="Deliveries" value={`${pending} pending · ${deliveries.length} total`} />
        </CardBody>
      </Card>

      {!allocation && !activeShift && (
        <Card>
          <EmptyState
            icon={Truck}
            title="No vehicle allocated for today"
            description="Dispatch hasn't allocated a vehicle to you for today, so a shift can't be started."
          />
        </Card>
      )}

      {deliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deliveries</CardTitle>
            <span className="text-xs text-slate-400">{deliveries.length} stop(s)</span>
          </CardHeader>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {deliveries.map((order) => (
              <DeliveryRow
                key={order.id}
                order={order}
                onComplete={() => completeDelivery(order, addToast)}
                onFail={() => setFailing(order)}
              />
            ))}
          </ul>
        </Card>
      )}

      <FailDeliveryModal order={failing} onClose={() => setFailing(null)} />
    </DriverShell>
  )
}

/** Shared driver header + page scaffold. */
function DriverShell({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Driver"
        title="My Shift"
        description="Start your shift, then complete or report deliveries as you go."
        actions={action}
      />
      {children}
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Truck
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

function DeliveryRow({
  order,
  onComplete,
  onFail,
}: {
  order: Order
  onComplete: () => void
  onFail: () => void
}) {
  const facilities = useFacilitiesStore((s) => s.items)
  const products = useProductsStore((s) => s.items)
  const destination = facilities.find((f) => f.id === order.destinationId)
  const product = products.find((p) => p.id === order.productId)
  const actionable = order.status === 'in_transit'

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{destination?.name ?? order.destinationId}</p>
        <p className="text-xs text-slate-500">
          {product?.name ?? order.productId} · {order.quantity.toLocaleString()} {product?.unit ?? 'units'}
        </p>
        {order.status === 'failed' && order.failureReason && (
          <p className="mt-1 text-xs text-red-500">Reason: {order.failureReason}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <OrderStatusBadge status={order.status} />
        {actionable && (
          <>
            <Button size="sm" variant="secondary" onClick={onComplete}>
              <CheckCircle2 className="size-4" /> Complete
            </Button>
            <Button size="sm" variant="ghost" onClick={onFail}>
              <XCircle className="size-4" /> Fail
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

async function completeDelivery(
  order: Order,
  addToast: (type: 'success' | 'error' | 'info', message: string) => void,
) {
  try {
    await useOrdersStore.getState().complete(order.id)
    addToast('success', 'Delivery completed — destination inventory updated.')
  } catch (err) {
    addToast('error', err instanceof Error ? err.message : 'Could not complete delivery.')
  }
}

const failSchema = z.object({
  reason: z.string().trim().min(4, 'Please give a brief reason'),
})
type FailFormValues = z.input<typeof failSchema>

function FailDeliveryModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const addToast = useUiStore((s) => s.addToast)
  const failOrder = useOrdersStore((s) => s.fail)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FailFormValues>({
    resolver: zodResolver(failSchema),
    defaultValues: { reason: '' },
  })

  const submit = handleSubmit(async ({ reason }) => {
    if (!order) return
    setSubmitting(true)
    try {
      await failOrder(order.id, reason.trim())
      addToast('info', 'Delivery marked as failed.')
      reset()
      onClose()
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not report failure.')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Modal open={!!order} onClose={onClose} title="Report failed delivery" description="Tell dispatch what happened.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Reason" htmlFor="fail-reason" required error={errors.reason?.message}>
          <Textarea
            id="fail-reason"
            rows={3}
            placeholder="e.g. Customer site closed on arrival"
            invalid={!!errors.reason}
            {...register('reason')}
          />
        </Field>
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={submitting}>
            Mark Failed
          </Button>
        </div>
      </form>
    </Modal>
  )
}
