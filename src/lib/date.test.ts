import { describe, expect, it } from 'vitest'
import { daysBetween, formatHeaderDate, toDateKey } from './date'

describe('toDateKey', () => {
  it('zero-pads local date', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(toDateKey(new Date(2026, 9, 23, 0, 0))).toBe('2026-10-23')
  })
})

describe('daysBetween', () => {
  it('counts calendar days', () => {
    expect(daysBetween('2026-10-22', '2026-10-23')).toBe(1)
    expect(daysBetween('2026-10-20', '2026-10-23')).toBe(3)
    expect(daysBetween('2026-10-23', '2026-10-23')).toBe(0)
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3)
  })

  it('is exact across DST changes', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2) // EU spring forward
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2) // EU fall back
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2) // US spring forward
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2) // US fall back
  })
})

describe('formatHeaderDate', () => {
  it('formats weekday, day and short month (AC-5.6)', () => {
    expect(formatHeaderDate(new Date(2026, 9, 23), 'en-GB')).toBe(
      'Friday 23 Oct',
    )
  })
})
