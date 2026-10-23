import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToday } from './useToday'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useToday', () => {
  it('starts with the local date key', () => {
    vi.setSystemTime(new Date(2026, 9, 23, 10, 0))
    const { result } = renderHook(() => useToday())
    expect(result.current.todayKey).toBe('2026-10-23')
  })

  it('moves to the new day within 60 s of local midnight (AC-5.4)', () => {
    vi.setSystemTime(new Date(2026, 9, 23, 23, 59, 40))
    const { result } = renderHook(() => useToday())
    expect(result.current.todayKey).toBe('2026-10-23')
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current.todayKey).toBe('2026-10-24')
  })

  it('keeps the same now object while the day is unchanged', () => {
    vi.setSystemTime(new Date(2026, 9, 23, 10, 0))
    const { result } = renderHook(() => useToday())
    const first = result.current.now
    act(() => {
      vi.advanceTimersByTime(90_000)
    })
    expect(result.current.now).toBe(first)
  })

  it('rechecks on visibilitychange (visible) (AC-5.4)', () => {
    vi.setSystemTime(new Date(2026, 9, 23, 22, 0))
    const { result } = renderHook(() => useToday())
    vi.setSystemTime(new Date(2026, 9, 24, 8, 0)) // timers were throttled while hidden
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.todayKey).toBe('2026-10-24')
  })

  it('ignores visibilitychange while hidden; focus rechecks', () => {
    vi.setSystemTime(new Date(2026, 9, 23, 22, 0))
    const { result } = renderHook(() => useToday())
    vi.setSystemTime(new Date(2026, 9, 24, 8, 0))
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.todayKey).toBe('2026-10-23')
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(result.current.todayKey).toBe('2026-10-24')
  })

  it('removes listeners and timer on unmount', () => {
    const remove = vi.spyOn(document, 'removeEventListener')
    const { unmount } = renderHook(() => useToday())
    unmount()
    expect(remove).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    )
    expect(vi.getTimerCount()).toBe(0)
  })
})
