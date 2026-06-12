import { useMemo, useState } from 'react'
import { addDays, format } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, Card, Field, Input, Modal, Select } from '@/components/ui'
import {
  useAllocationsStore,
  useDriversStore,
  useUiStore,
  useVehiclesStore,
} from '@/store'
import { ApiError } from '@/services/client'
import { isoDate, todayIso, weekDays } from '@/lib/date'
import { cn } from '@/lib/cn'

interface Prefill {
  vehicleId?: string
  date?: string
}

export function AllocationsPage() {
  const vehicles = useVehiclesStore((s) => s.items)
  const drivers = useDriversStore((s) => s.items)
  const allocations = useAllocationsStore((s) => s.items)
  const removeAllocation = useAllocationsStore((s) => s.remove)
  const addToast = useUiStore((s) => s.addToast)

  const [weekRef, setWeekRef] = useState(new Date())
  const [form, setForm] = useState<Prefill | null>(null)

  const days = useMemo(() => weekDays(weekRef), [weekRef])
  const driverName = (id: string) => drivers.find((d) => d.id === id)?.name ?? id

  const allocationAt = (vehicleId: string, date: string) =>
    allocations.find((a) => a.vehicleId === vehicleId && a.date === date)

  const remove = async (id: string) => {
    try {
      await removeAllocation(id)
      addToast('success', 'Allocation removed.')
    } catch {
      addToast('error', 'Could not remove allocation.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Vehicle Allocation"
        description="Reserve vehicles for drivers by date. A vehicle can only be booked once per day."
        actions={
          <Button onClick={() => setForm({ date: todayIso() })}>
            <Plus className="size-4" /> New Allocation
          </Button>
        }
      />

      <Card>
        <div className="flex items-center justify-between border-b border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setWeekRef((d) => addDays(d, -7))} aria-label="Previous week">
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekRef(new Date())}>
              Today
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekRef((d) => addDays(d, 7))} aria-label="Next week">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <p className="font-mono text-xs text-slate-400">
            {format(days[0], 'MMM d')} – {format(days[6], 'MMM d, yyyy')}
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header row */}
            <div className="grid grid-cols-[160px_repeat(7,1fr)] border-b border-slate-200 dark:border-slate-800">
              <div className="p-3 text-xs font-medium text-slate-400">Vehicle</div>
              {days.map((day) => {
                const isToday = isoDate(day) === todayIso()
                return (
                  <div key={day.toISOString()} className="border-l border-slate-200 p-3 text-center dark:border-slate-800">
                    <p className="eyebrow">{format(day, 'EEE')}</p>
                    <p className={cn('font-mono text-sm', isToday ? 'font-bold text-brand-600 dark:text-brand-400' : 'text-slate-500')}>
                      {format(day, 'd')}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Vehicle rows */}
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="grid grid-cols-[160px_repeat(7,1fr)] border-b border-slate-100 last:border-0 dark:border-slate-800/60"
              >
                <div className="flex flex-col justify-center p-3">
                  <span className="font-mono text-sm font-medium">{vehicle.registration}</span>
                  <span className="text-xs text-slate-400">{vehicle.type}</span>
                </div>
                {days.map((day) => {
                  const date = isoDate(day)
                  const allocation = allocationAt(vehicle.id, date)
                  return (
                    <div
                      key={date}
                      className="border-l border-slate-100 p-1.5 dark:border-slate-800/60"
                    >
                      {allocation ? (
                        <div className="group flex h-full min-h-12 flex-col justify-center rounded-md bg-brand-500/10 px-2 py-1.5 dark:bg-brand-500/15">
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-medium leading-tight text-brand-800 dark:text-brand-200">
                              {driverName(allocation.driverId)}
                            </span>
                            <button
                              onClick={() => remove(allocation.id)}
                              aria-label="Remove allocation"
                              className="shrink-0 rounded text-brand-500/60 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setForm({ vehicleId: vehicle.id, date })}
                          className="grid h-full min-h-12 w-full place-items-center rounded-md text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 dark:text-slate-700 dark:hover:bg-slate-800"
                          aria-label={`Allocate ${vehicle.registration} on ${date}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>

      <AllocationModal prefill={form} onClose={() => setForm(null)} />
    </div>
  )
}

function AllocationModal({ prefill, onClose }: { prefill: Prefill | null; onClose: () => void }) {
  const vehicles = useVehiclesStore((s) => s.items)
  const drivers = useDriversStore((s) => s.items)
  const createAllocation = useAllocationsStore((s) => s.create)
  const addToast = useUiStore((s) => s.addToast)

  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [date, setDate] = useState(todayIso())
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Sync local state when a cell prefill opens the modal.
  const open = !!prefill
  const prefillKey = `${prefill?.vehicleId ?? ''}|${prefill?.date ?? ''}`
  const [lastKey, setLastKey] = useState('')
  if (open && prefillKey !== lastKey) {
    setLastKey(prefillKey)
    setVehicleId(prefill?.vehicleId ?? '')
    setDriverId('')
    setDate(prefill?.date ?? todayIso())
    setError(null)
  }

  const submit = async () => {
    setError(null)
    if (!vehicleId || !driverId || !date) {
      setError('Vehicle, driver, and date are all required.')
      return
    }
    setSubmitting(true)
    try {
      await createAllocation({ vehicleId, driverId, date })
      addToast('success', 'Vehicle allocated.')
      onClose()
    } catch (err) {
      // The 409 double-booking case is surfaced inline here AND as a toast.
      const message =
        err instanceof ApiError ? err.message : 'Could not create allocation.'
      setError(message)
      addToast('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Allocate vehicle"
      description="Reserve a vehicle for a driver on a date."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            Allocate
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
        <Field label="Vehicle" htmlFor="alloc-vehicle" required>
          <Select id="alloc-vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select a vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registration} · {v.type}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Driver" htmlFor="alloc-driver" required>
            <Select id="alloc-driver" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date" htmlFor="alloc-date" required>
            <Input id="alloc-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
