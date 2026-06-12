import { beforeEach, describe, expect, it } from 'vitest'
import { format } from 'date-fns'
import {
  useAllocationsStore,
  useFacilitiesStore,
  useOrdersStore,
  useShiftsStore,
} from '@/store'
import type { ApiError } from '@/services/client'

const today = format(new Date(), 'yyyy-MM-dd')

const dieselAt = (facilityId: string) =>
  useFacilitiesStore.getState().items.find((f) => f.id === facilityId)!.inventory.diesel

describe('reactive loop: allocate → start shift → deliver → inventory updates', () => {
  beforeEach(async () => {
    // Load the stores the UI subscribes to from the (freshly reset) mock API.
    await Promise.all([
      useFacilitiesStore.getState().fetchAll(),
      useOrdersStore.getState().fetchAll(),
      useShiftsStore.getState().fetchAll(),
      useAllocationsStore.getState().fetchAll(),
    ])
  })

  it('increments the destination terminal inventory when a delivery completes', async () => {
    // driver-2 (Maria Garcia) has an allocation today and order-3 → terminal-1
    // (4000 diesel), but has not started a shift yet.
    const before = dieselAt('terminal-1')

    // Start the shift: the day's orders flip to in_transit server-side.
    await useShiftsStore.getState().start('driver-2', today)
    await useOrdersStore.getState().fetchAll()
    expect(useOrdersStore.getState().items.find((o) => o.id === 'order-3')!.status).toBe('in_transit')

    // Complete the delivery; the destination terminal receives the fuel.
    await useOrdersStore.getState().complete('order-3')
    await useFacilitiesStore.getState().fetchAll()

    expect(useOrdersStore.getState().items.find((o) => o.id === 'order-3')!.status).toBe('completed')
    expect(dieselAt('terminal-1')).toBe(before + 4000)
  })

  it('rejects starting a shift for a driver with no allocation today', async () => {
    // driver-6 (Sara Okoro) has no allocation today.
    await expect(useShiftsStore.getState().start('driver-6', today)).rejects.toMatchObject({
      status: 422,
    })
  })
})

describe('double-booking prevention at the store layer', () => {
  beforeEach(async () => {
    await useAllocationsStore.getState().fetchAll()
  })

  it('rejects allocating an already-booked vehicle/date with a 409', async () => {
    // vehicle-1 is already allocated to driver-1 today in the seed data.
    await expect(
      useAllocationsStore.getState().create({
        vehicleId: 'vehicle-1',
        driverId: 'driver-3',
        date: today,
      }),
    ).rejects.toMatchObject({ status: 409 } satisfies Partial<ApiError>)
  })
})
