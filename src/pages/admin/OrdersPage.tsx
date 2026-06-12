import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { Package, Plus, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Button,
  Card,
  DataTable,
  Field,
  Input,
  Modal,
  OrderStatusBadge,
  Select,
  type Column,
} from '@/components/ui'
import {
  useDriversStore,
  useFacilitiesStore,
  useOrdersStore,
  useProductsStore,
  useUiStore,
} from '@/store'
import type { Order, OrderStatus } from '@/types/domain'
import { cn } from '@/lib/cn'

const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'created', label: 'Created' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_transit', label: 'In transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

const today = () => format(new Date(), 'yyyy-MM-dd')

export function OrdersPage() {
  const orders = useOrdersStore((s) => s.items)
  const loading = useOrdersStore((s) => s.loading)
  const loaded = useOrdersStore((s) => s.loaded)
  const facilities = useFacilitiesStore((s) => s.items)
  const products = useProductsStore((s) => s.items)
  const drivers = useDriversStore((s) => s.items)

  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [assigning, setAssigning] = useState<Order | null>(null)

  const facilityName = (id: string) => facilities.find((f) => f.id === id)?.name ?? id
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id
  const driverName = (id: string | null) => (id ? (drivers.find((d) => d.id === id)?.name ?? id) : '—')

  const rows = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  )

  const columns: Column<Order>[] = [
    {
      key: 'destination',
      header: 'Destination',
      sortValue: (o) => facilityName(o.destinationId),
      render: (o) => <span className="font-medium">{facilityName(o.destinationId)}</span>,
    },
    { key: 'product', header: 'Product', render: (o) => productName(o.productId) },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'right',
      sortValue: (o) => o.quantity,
      render: (o) => <span className="font-mono text-xs">{o.quantity.toLocaleString()}</span>,
    },
    {
      key: 'deliveryDate',
      header: 'Delivery',
      sortValue: (o) => o.deliveryDate,
      render: (o) => (
        <span className="font-mono text-xs">{format(parseISO(o.deliveryDate), 'MMM d, yyyy')}</span>
      ),
    },
    { key: 'driver', header: 'Driver', render: (o) => driverName(o.assignedDriverId) },
    { key: 'status', header: 'Status', render: (o) => <OrderStatusBadge status={o.status} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Orders"
        description="Create delivery orders and assign them to drivers."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New Order
          </Button>
        }
      />

      <Card>
        <DataTable<Order>
          data={rows}
          columns={columns}
          rowKey={(o) => o.id}
          loading={loading && !loaded}
          searchable
          searchPlaceholder="Search orders…"
          getSearchText={(o) =>
            `${facilityName(o.destinationId)} ${productName(o.productId)} ${driverName(o.assignedDriverId)}`
          }
          empty={{ icon: Package, title: 'No orders', description: 'Create your first delivery order.' }}
          toolbar={STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'primary' : 'secondary'}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
          actions={(o) =>
            o.status === 'created' || o.status === 'assigned' ? (
              <Button variant="ghost" size="sm" onClick={() => setAssigning(o)}>
                <UserPlus className="size-4" />
                {o.assignedDriverId ? 'Reassign' : 'Assign'}
              </Button>
            ) : null
          }
        />
      </Card>

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <AssignModal order={assigning} onClose={() => setAssigning(null)} />
    </div>
  )
}

const orderSchema = z.object({
  destinationId: z.string().min(1, 'Select a destination'),
  productId: z.string().min(1, 'Select a product'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  deliveryDate: z.string().min(1, 'Select a delivery date'),
  assignedDriverId: z.string().optional(),
})
type OrderFormValues = z.input<typeof orderSchema>

function CreateOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const facilities = useFacilitiesStore((s) => s.items)
  const products = useProductsStore((s) => s.items)
  const drivers = useDriversStore((s) => s.items)
  const createOrder = useOrdersStore((s) => s.create)
  const addToast = useUiStore((s) => s.addToast)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { destinationId: '', productId: '', quantity: 1000, deliveryDate: today(), assignedDriverId: '' },
  })

  const submit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      await createOrder({
        destinationId: values.destinationId,
        productId: values.productId,
        quantity: Number(values.quantity),
        deliveryDate: values.deliveryDate,
        assignedDriverId: values.assignedDriverId || null,
      })
      addToast('success', 'Order created.')
      reset()
      onClose()
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not create order.')
    } finally {
      setSubmitting(false)
    }
  })

  const terminals = facilities.filter((f) => f.type === 'terminal')
  const hubs = facilities.filter((f) => f.type === 'hub')

  return (
    <Modal open={open} onClose={onClose} title="New Order" description="Schedule a fuel delivery.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Destination" htmlFor="destinationId" required error={errors.destinationId?.message}>
          <Select id="destinationId" invalid={!!errors.destinationId} {...register('destinationId')}>
            <option value="">Select destination…</option>
            <optgroup label="Terminals">
              {terminals.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Hubs">
              {hubs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Product" htmlFor="productId" required error={errors.productId?.message}>
            <Select id="productId" invalid={!!errors.productId} {...register('productId')}>
              <option value="">Select…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity" htmlFor="quantity" required error={errors.quantity?.message}>
            <Input id="quantity" type="number" min={1} invalid={!!errors.quantity} {...register('quantity')} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Delivery date" htmlFor="deliveryDate" required error={errors.deliveryDate?.message}>
            <Input id="deliveryDate" type="date" invalid={!!errors.deliveryDate} {...register('deliveryDate')} />
          </Field>
          <Field label="Assign driver" htmlFor="assignedDriverId" hint="Optional — assign later from the list.">
            <Select id="assignedDriverId" {...register('assignedDriverId')}>
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create Order
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AssignModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const drivers = useDriversStore((s) => s.items)
  const assign = useOrdersStore((s) => s.assign)
  const addToast = useUiStore((s) => s.addToast)
  const [driverId, setDriverId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!order || !driverId) return
    setSubmitting(true)
    try {
      await assign(order.id, driverId)
      addToast('success', 'Driver assigned.')
      setDriverId('')
      onClose()
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Could not assign driver.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title="Assign driver"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!driverId}>
            Assign
          </Button>
        </>
      }
    >
      <Field label="Driver" htmlFor="assign-driver" required>
        <Select
          id="assign-driver"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          className={cn(order?.assignedDriverId && 'border-brand-400')}
        >
          <option value="">Select a driver…</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
    </Modal>
  )
}
