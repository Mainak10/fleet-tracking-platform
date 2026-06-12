import { addDays, format, startOfWeek } from 'date-fns'

/** ISO calendar date (yyyy-MM-dd) for a Date. */
export const isoDate = (d: Date) => format(d, 'yyyy-MM-dd')

export const todayIso = () => isoDate(new Date())

/** The seven dates of the week containing `ref`, starting Monday. */
export function weekDays(ref: Date): Date[] {
  const start = startOfWeek(ref, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}
