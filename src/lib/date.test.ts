import { describe, expect, it } from 'vitest'
import { getDay } from 'date-fns'
import { isoDate, weekDays } from './date'

describe('isoDate', () => {
  it('formats a Date as yyyy-MM-dd', () => {
    expect(isoDate(new Date(2026, 5, 12))).toBe('2026-06-12')
  })
})

describe('weekDays', () => {
  it('returns seven consecutive dates starting on Monday', () => {
    // 2026-06-12 is a Friday; its week (Mon-start) runs 2026-06-08 .. 2026-06-14.
    const days = weekDays(new Date(2026, 5, 12))
    expect(days).toHaveLength(7)
    expect(getDay(days[0])).toBe(1) // Monday
    expect(isoDate(days[0])).toBe('2026-06-08')
    expect(isoDate(days[6])).toBe('2026-06-14')
  })
})
