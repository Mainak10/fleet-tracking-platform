import { describe, expect, it } from 'vitest'
import {
  allocationsService,
  facilitiesService,
  ordersService,
  shiftsService,
} from '@/services'
import { ApiError } from '@/services/client'
import { format } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')

describe('mock API + service layer', () => {
  it('lists seeded facilities', async () => {
    const facilities = await facilitiesService.list()
    expect(facilities).toHaveLength(8)
    expect(facilities.some((f) => f.type === 'hub')).toBe(true)
  })

  it('filters facilities by type via query params', async () => {
    const hubs = await facilitiesService.list({ type: 'hub' })
    expect(hubs).toHaveLength(3)
    expect(hubs.every((f) => f.type === 'hub')).toBe(true)
  })

  it('rejects a double-booked vehicle with a 409', async () => {
    // vehicle-1 is already allocated today in the seed data.
    await expect(
      allocationsService.create({ vehicleId: 'vehicle-1', driverId: 'driver-3', date: today }),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<ApiError>)
  })

  it('completing a delivery increases destination inventory', async () => {
    const before = (await facilitiesService.list()).find((f) => f.id === 'terminal-5')!
    const order = (await ordersService.list()).find((o) => o.destinationId === 'terminal-5')!

    await ordersService.complete(order.id)

    const after = (await facilitiesService.list()).find((f) => f.id === 'terminal-5')!
    expect(after.inventory[order.productId]).toBe(
      before.inventory[order.productId] + order.quantity,
    )
  })

  it('refuses to start a shift without an allocation', async () => {
    await expect(shiftsService.start('driver-6', today)).rejects.toMatchObject({ status: 422 })
  })
})
