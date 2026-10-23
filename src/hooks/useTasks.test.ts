import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEY, saveState } from '../lib/storage'
import type { Task, TasksState } from '../lib/tasks'
import { UNDO_MS, useTasks } from './useTasks'

const TODAY = '2026-10-23'

function mk(over: Partial<Task> & { id: string }): Task {
  return {
    text: over.id,
    done: false,
    createdAt: 0,
    createdDate: '2026-10-22',
    completedAt: null,
    completedDate: null,
    ...over,
  }
}
const stored = (): TasksState => JSON.parse(localStorage.getItem(STORAGE_KEY)!)

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 9, 23, 10, 0))
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useTasks basics', () => {
  it('add / toggle / edit persist and report validity', () => {
    const { result } = renderHook(() => useTasks(TODAY))
    expect(result.current.tasks).toEqual([])
    let ok = true
    act(() => {
      ok = result.current.add('  ')
    })
    expect(ok).toBe(false)
    act(() => {
      ok = result.current.add(' Buy milk ')
    })
    expect(ok).toBe(true)
    expect(result.current.tasks[0].text).toBe('Buy milk')
    expect(stored().tasks[0].text).toBe('Buy milk')

    const id = result.current.tasks[0].id
    act(() => result.current.toggle(id))
    expect(result.current.progress).toEqual({ done: 1, total: 1 })
    expect(stored().tasks[0].done).toBe(true)

    act(() => {
      ok = result.current.edit(id, '')
    })
    expect(ok).toBe(false)
    act(() => {
      ok = result.current.edit(id, 'x'.repeat(201))
    })
    expect(ok).toBe(false)
    act(() => {
      ok = result.current.edit(id, 'Buy oat milk')
    })
    expect(ok).toBe(true)
    expect(result.current.tasks[0].text).toBe('Buy oat milk')
  })

  it('handles back-to-back adds in one batch', () => {
    const { result } = renderHook(() => useTasks(TODAY))
    act(() => {
      result.current.add('a')
      result.current.add('b')
    })
    expect(result.current.tasks.map((t) => t.text)).toEqual(['a', 'b'])
  })

  it('returns tasks sorted: unfinished first', () => {
    const { result } = renderHook(() => useTasks(TODAY))
    act(() => {
      result.current.add('a')
    })
    vi.advanceTimersByTime(10)
    act(() => {
      result.current.add('b')
    })
    act(() => result.current.toggle(result.current.tasks[0].id))
    expect(result.current.tasks.map((t) => t.text)).toEqual(['b', 'a'])
  })
})

describe('undo window (AC-3.2, AC-3.3, AC-3.4)', () => {
  function setup() {
    const hook = renderHook(() => useTasks(TODAY))
    act(() => {
      hook.result.current.add('a')
    })
    vi.advanceTimersByTime(10)
    act(() => {
      hook.result.current.add('b')
    })
    return hook
  }

  it('remove saves immediately and opens the window; undo restores in place', () => {
    const { result } = setup()
    const [a, b] = result.current.tasks
    act(() => result.current.remove(a.id))
    expect(result.current.pendingUndo).toEqual(a)
    expect(result.current.tasks).toEqual([b])
    expect(stored().tasks).toHaveLength(1)
    act(() => result.current.undo())
    expect(result.current.pendingUndo).toBeNull()
    expect(result.current.tasks).toEqual([a, b])
    expect(stored().tasks).toHaveLength(2)
  })

  it('window closes after 5000 ms; undo is then a no-op', () => {
    const { result } = setup()
    const [a] = result.current.tasks
    act(() => result.current.remove(a.id))
    act(() => {
      vi.advanceTimersByTime(UNDO_MS - 1)
    })
    expect(result.current.pendingUndo).not.toBeNull()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(UNDO_MS).toBe(5000)
    expect(result.current.pendingUndo).toBeNull()
    act(() => result.current.undo())
    expect(result.current.tasks).toHaveLength(1)
  })

  it('deleting another task ends the previous window; only the latest can be undone', () => {
    const { result } = setup()
    const [a, b] = result.current.tasks
    act(() => result.current.remove(a.id))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    act(() => result.current.remove(b.id))
    expect(result.current.pendingUndo).toEqual(b)
    // old timer must not close the new window
    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(result.current.pendingUndo).toEqual(b)
    act(() => result.current.undo())
    expect(result.current.tasks).toEqual([b])
  })

  it('timer is cleared on unmount', () => {
    const { result, unmount } = setup()
    act(() => result.current.remove(result.current.tasks[0].id))
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('rollover (AC-5.1, AC-5.4)', () => {
  const seed = (): TasksState => ({
    version: 1,
    tasks: [
      mk({ id: 'A', done: true, completedAt: 1, completedDate: '2026-10-22' }),
      mk({ id: 'B' }),
    ],
  })

  it('applies on load and saves', () => {
    saveState(seed())
    const { result } = renderHook(() => useTasks(TODAY))
    expect(result.current.tasks.map((t) => t.id)).toEqual(['B'])
    expect(stored().tasks.map((t) => t.id)).toEqual(['B'])
  })

  it('applies when todayKey changes and saves', () => {
    saveState({
      version: 1,
      tasks: [
        mk({ id: 'A', done: true, completedAt: 1, completedDate: TODAY }),
        mk({ id: 'B' }),
      ],
    })
    const { result, rerender } = renderHook(({ day }) => useTasks(day), {
      initialProps: { day: TODAY },
    })
    expect(result.current.tasks).toHaveLength(2)
    rerender({ day: '2026-10-24' })
    expect(result.current.tasks.map((t) => t.id)).toEqual(['B'])
    expect(stored().tasks.map((t) => t.id)).toEqual(['B'])
  })
})

describe('storage failures and other tabs', () => {
  it('unavailable storage → status flag, app keeps working in memory (AC-6.3)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const { result } = renderHook(() => useTasks(TODAY))
    expect(result.current.storageStatus).toBe('unavailable')
    let ok = false
    act(() => {
      ok = result.current.add('a')
    })
    expect(ok).toBe(true)
    expect(result.current.tasks.map((t) => t.text)).toEqual(['a'])
  })

  it('status flips to unavailable when a save fails later', () => {
    const { result } = renderHook(() => useTasks(TODAY))
    expect(result.current.storageStatus).toBe('ok')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    act(() => {
      result.current.add('a')
    })
    expect(result.current.storageStatus).toBe('unavailable')
    expect(result.current.tasks).toHaveLength(1)
  })

  it('storage event from another tab replaces state', () => {
    const { result } = renderHook(() => useTasks(TODAY))
    act(() => {
      result.current.add('mine')
    })
    const external: TasksState = {
      version: 1,
      tasks: [mk({ id: 'X', text: 'theirs' })],
    }
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: STORAGE_KEY,
          newValue: JSON.stringify(external),
        }),
      )
    })
    expect(result.current.tasks.map((t) => t.text)).toEqual(['theirs'])
  })
})
