import { http, HttpResponse, delay, type RequestHandler } from 'msw'
import { getDb, genId, type Db } from './db'
import { findAllocationConflict } from '@/lib/allocations'
import { applyDelivery } from '@/lib/inventory'
import type { Driver, Facility, Order, Product, Shift, Vehicle } from '@/types/domain'

const API = '/api'

/** Simulate realistic, slightly variable network latency. */
async function networkDelay() {
  await delay(120 + Math.random() * 280)
}

/** Apply each query-string param as an equality filter over a collection. */
function applyFilters<T>(items: T[], url: URL): T[] {
  let result = items
  for (const [key, value] of url.searchParams) {
    result = result.filter(
      (item) => String((item as Record<string, unknown>)[key]) === value,
    )
  }
  return result
}

interface CrudConfig<T extends { id: string }> {
  resource: string
  idPrefix: string
  select: (db: Db) => T[]
  /** Defaults merged into a newly created record before the body. */
  defaults?: (body: Partial<T>) => Partial<T>
}

/**
 * Build standard REST handlers (list/create/update/delete) for a collection.
 * The five master-data entities all use this; only orders/allocations/shifts
 * need bespoke logic on top.
 */
function makeCrudHandlers<T extends { id: string }>(
  cfg: CrudConfig<T>,
): RequestHandler[] {
  const base = `${API}/${cfg.resource}`
  return [
    http.get(base, async ({ request }) => {
      await networkDelay()
      const items = applyFilters(cfg.select(getDb()), new URL(request.url))
      return HttpResponse.json(items)
    }),

    http.post(base, async ({ request }) => {
      await networkDelay()
      const body = (await request.json()) as Partial<T>
      const record = {
        ...(cfg.defaults?.(body) ?? {}),
        ...body,
        id: genId(cfg.idPrefix),
      } as T
      cfg.select(getDb()).push(record)
      return HttpResponse.json(record, { status: 201 })
    }),

    http.put(`${base}/:id`, async ({ request, params }) => {
      await networkDelay()
      const coll = cfg.select(getDb())
      const idx = coll.findIndex((item) => item.id === params.id)
      if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      const body = (await request.json()) as Partial<T>
      coll[idx] = { ...coll[idx], ...body, id: coll[idx].id }
      return HttpResponse.json(coll[idx])
    }),

    http.delete(`${base}/:id`, async ({ params }) => {
      await networkDelay()
      const coll = cfg.select(getDb())
      const idx = coll.findIndex((item) => item.id === params.id)
      if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
      const [removed] = coll.splice(idx, 1)
      return HttpResponse.json(removed)
    }),
  ]
}

const masterDataHandlers: RequestHandler[] = [
  ...makeCrudHandlers<Facility>({
    resource: 'facilities',
    idPrefix: 'facility',
    select: (db) => db.facilities,
    defaults: () => ({ inventory: {} }),
  }),
  ...makeCrudHandlers<Product>({ resource: 'products', idPrefix: 'product', select: (db) => db.products }),
  ...makeCrudHandlers<Driver>({ resource: 'drivers', idPrefix: 'driver', select: (db) => db.drivers }),
  ...makeCrudHandlers<Vehicle>({ resource: 'vehicles', idPrefix: 'vehicle', select: (db) => db.vehicles }),
]

const orderHandlers: RequestHandler[] = [
  http.get(`${API}/orders`, async ({ request }) => {
    await networkDelay()
    return HttpResponse.json(applyFilters(getDb().orders, new URL(request.url)))
  }),

  http.post(`${API}/orders`, async ({ request }) => {
    await networkDelay()
    const body = (await request.json()) as Partial<Order>
    const order: Order = {
      id: genId('order'),
      destinationId: body.destinationId!,
      productId: body.productId!,
      quantity: body.quantity!,
      deliveryDate: body.deliveryDate!,
      assignedDriverId: body.assignedDriverId ?? null,
      status: body.assignedDriverId ? 'assigned' : 'created',
    }
    getDb().orders.push(order)
    return HttpResponse.json(order, { status: 201 })
  }),

  // Assign (or reassign) a driver to an order.
  http.post(`${API}/orders/:id/assign`, async ({ request, params }) => {
    await networkDelay()
    const { driverId } = (await request.json()) as { driverId: string }
    const order = getDb().orders.find((o) => o.id === params.id)
    if (!order) return HttpResponse.json({ message: 'Order not found' }, { status: 404 })
    order.assignedDriverId = driverId
    if (order.status === 'created') order.status = 'assigned'
    return HttpResponse.json(order)
  }),

  // Mark a delivery completed: increments the destination's inventory.
  http.post(`${API}/orders/:id/complete`, async ({ params }) => {
    await networkDelay()
    const db = getDb()
    const order = db.orders.find((o) => o.id === params.id)
    if (!order) return HttpResponse.json({ message: 'Order not found' }, { status: 404 })
    const facility = db.facilities.find((f) => f.id === order.destinationId)
    if (facility) {
      facility.inventory = applyDelivery(facility.inventory, order.productId, order.quantity)
    }
    order.status = 'completed'
    return HttpResponse.json(order)
  }),

  // Mark a delivery failed with a reason.
  http.post(`${API}/orders/:id/fail`, async ({ request, params }) => {
    await networkDelay()
    const { reason } = (await request.json()) as { reason: string }
    const order = getDb().orders.find((o) => o.id === params.id)
    if (!order) return HttpResponse.json({ message: 'Order not found' }, { status: 404 })
    order.status = 'failed'
    order.failureReason = reason
    return HttpResponse.json(order)
  }),
]

const allocationHandlers: RequestHandler[] = [
  http.get(`${API}/allocations`, async ({ request }) => {
    await networkDelay()
    return HttpResponse.json(applyFilters(getDb().allocations, new URL(request.url)))
  }),

  // Create an allocation, rejecting double-bookings with a 409.
  http.post(`${API}/allocations`, async ({ request }) => {
    await networkDelay()
    const body = (await request.json()) as { vehicleId: string; driverId: string; date: string }
    const conflict = findAllocationConflict(getDb().allocations, body.vehicleId, body.date)
    if (conflict) {
      return HttpResponse.json(
        { message: 'This vehicle is already allocated on the selected date.' },
        { status: 409 },
      )
    }
    const allocation = { id: genId('alloc'), ...body }
    getDb().allocations.push(allocation)
    return HttpResponse.json(allocation, { status: 201 })
  }),

  http.delete(`${API}/allocations/:id`, async ({ params }) => {
    await networkDelay()
    const coll = getDb().allocations
    const idx = coll.findIndex((a) => a.id === params.id)
    if (idx === -1) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    const [removed] = coll.splice(idx, 1)
    return HttpResponse.json(removed)
  }),
]

const shiftHandlers: RequestHandler[] = [
  http.get(`${API}/shifts`, async ({ request }) => {
    await networkDelay()
    return HttpResponse.json(applyFilters(getDb().shifts, new URL(request.url)))
  }),

  // Start a shift. Requires an allocation for (driver, date); gathers that
  // day's assigned orders as deliveries and moves them to `in_transit`.
  http.post(`${API}/shifts`, async ({ request }) => {
    await networkDelay()
    const { driverId, date } = (await request.json()) as { driverId: string; date: string }
    const db = getDb()
    const allocation = db.allocations.find((a) => a.driverId === driverId && a.date === date)
    if (!allocation) {
      return HttpResponse.json(
        { message: 'No vehicle allocated to this driver for the selected date.' },
        { status: 422 },
      )
    }
    const dayOrders = db.orders.filter(
      (o) => o.assignedDriverId === driverId && o.deliveryDate === date,
    )
    dayOrders.forEach((o) => {
      if (o.status === 'assigned') o.status = 'in_transit'
    })
    const shift: Shift = {
      id: genId('shift'),
      driverId,
      vehicleId: allocation.vehicleId,
      date,
      status: 'active',
      startedAt: new Date().toISOString(),
      orderIds: dayOrders.map((o) => o.id),
    }
    db.shifts.push(shift)
    return HttpResponse.json(shift, { status: 201 })
  }),

  http.post(`${API}/shifts/:id/end`, async ({ params }) => {
    await networkDelay()
    const shift = getDb().shifts.find((s) => s.id === params.id)
    if (!shift) return HttpResponse.json({ message: 'Shift not found' }, { status: 404 })
    shift.status = 'ended'
    shift.endedAt = new Date().toISOString()
    return HttpResponse.json(shift)
  }),
]

export const handlers: RequestHandler[] = [
  ...masterDataHandlers,
  ...orderHandlers,
  ...allocationHandlers,
  ...shiftHandlers,
]
