import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  STORAGE_KEY,
  isStorageAvailable,
  loadState,
  saveState,
  subscribe,
} from './storage'
import type { TasksState } from './tasks'

const sample: TasksState = {
  version: 1,
  tasks: [
    {
      id: 'a',
      text: 'Buy milk',
      done: false,
      createdAt: 1000,
      createdDate: '2026-10-22',
      completedAt: null,
      completedDate: null,
    },
    {
      id: 'b',
      text: 'Call mum',
      done: true,
      createdAt: 2000,
      createdDate: '2026-10-23',
      completedAt: 3000,
      completedDate: '2026-10-23',
    },
  ],
}

const corruptKeys = () =>
  Object.keys(localStorage).filter((k) =>
    k.startsWith(`${STORAGE_KEY}:corrupt-`),
  )

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('loadState / saveState', () => {
  it('empty state when nothing stored', () => {
    expect(loadState()).toEqual({ version: 1, tasks: [] })
    expect(corruptKeys()).toHaveLength(0)
  })

  it('round-trips every field (AC-6.1)', () => {
    expect(saveState(sample)).toBe(true)
    expect(loadState()).toEqual(sample)
  })

  it.each([
    ['invalid JSON', '{not json'],
    ['wrong version', JSON.stringify({ version: 2, tasks: [] })],
    ['tasks not an array', JSON.stringify({ version: 1, tasks: {} })],
    ['null', 'null'],
    ['bad task shape', JSON.stringify({ version: 1, tasks: [{ id: 1 }] })],
    [
      'done without completion fields',
      JSON.stringify({
        version: 1,
        tasks: [{ ...sample.tasks[0], done: true }],
      }),
    ],
    [
      'empty text',
      JSON.stringify({
        version: 1,
        tasks: [{ ...sample.tasks[0], text: ' ' }],
      }),
    ],
    [
      'duplicate ids',
      JSON.stringify({ version: 1, tasks: [sample.tasks[0], sample.tasks[0]] }),
    ],
  ])('corrupt (%s) → empty state, raw copy kept, no throw', (_name, raw) => {
    localStorage.setItem(STORAGE_KEY, raw)
    vi.spyOn(Date, 'now').mockReturnValue(1234)
    expect(loadState()).toEqual({ version: 1, tasks: [] })
    expect(localStorage.getItem(`${STORAGE_KEY}:corrupt-1234`)).toBe(raw)
  })

  it('getItem throwing → empty state, no throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(loadState()).toEqual({ version: 1, tasks: [] })
  })

  it('saveState returns false when setItem throws (AC-6.3)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(saveState(sample)).toBe(false)
  })
})

describe('isStorageAvailable', () => {
  it('true normally, false when setItem throws', () => {
    expect(isStorageAvailable()).toBe(true)
    expect(localStorage.length).toBe(0)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(isStorageAvailable()).toBe(false)
  })
})

describe('subscribe', () => {
  const fire = (init: StorageEventInit) =>
    window.dispatchEvent(new StorageEvent('storage', init))

  it('delivers state written by another tab; stops after unsubscribe', () => {
    const cb = vi.fn()
    const off = subscribe(cb)
    fire({ key: STORAGE_KEY, newValue: JSON.stringify(sample) })
    expect(cb).toHaveBeenCalledWith(sample)
    off()
    fire({ key: STORAGE_KEY, newValue: JSON.stringify(sample) })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys and invalid payloads; empty state when removed/cleared', () => {
    const cb = vi.fn()
    const off = subscribe(cb)
    fire({ key: 'other', newValue: JSON.stringify(sample) })
    fire({ key: STORAGE_KEY, newValue: '{bad' })
    expect(cb).not.toHaveBeenCalled()
    fire({ key: STORAGE_KEY, newValue: null })
    fire({ key: null, newValue: null })
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenLastCalledWith({ version: 1, tasks: [] })
    off()
  })
})
