import { describe, expect, it } from 'vitest'
import {
  MAX_TEXT,
  addTask,
  carriedOverLabel,
  editTask,
  progress,
  removeTask,
  restoreTask,
  rollover,
  sortTasks,
  toggleTask,
  validateText,
} from './tasks'
import type { Task, TasksState } from './tasks'

const empty: TasksState = { version: 1, tasks: [] }
const at = (day: number, h = 9) => new Date(2026, 9, day, h)

function task(over: Partial<Task> & { id: string }): Task {
  return {
    text: over.id,
    done: false,
    createdAt: 0,
    createdDate: '2026-10-23',
    completedAt: null,
    completedDate: null,
    ...over,
  }
}

describe('validateText', () => {
  it('rejects empty and whitespace (AC-1.3, AC-4.4)', () => {
    expect(validateText('')).toEqual({ ok: false, reason: 'empty' })
    expect(validateText('   ')).toEqual({ ok: false, reason: 'empty' })
  })
  it('trims (AC-1.4)', () => {
    expect(validateText(' Buy milk ')).toEqual({ ok: true, text: 'Buy milk' })
  })
  it('rejects > 200 chars after trim (AC-1.5, AC-4.5)', () => {
    expect(validateText('a'.repeat(MAX_TEXT + 1))).toEqual({
      ok: false,
      reason: 'too_long',
    })
    expect(validateText(` ${'a'.repeat(MAX_TEXT)} `).ok).toBe(true)
  })
})

describe('addTask / editTask', () => {
  it('adds a trimmed unfinished task', () => {
    const s = addTask(empty, ' Buy milk ', at(23))
    expect(s.tasks).toHaveLength(1)
    expect(s.tasks[0]).toMatchObject({
      text: 'Buy milk',
      done: false,
      createdAt: at(23).getTime(),
      createdDate: '2026-10-23',
      completedAt: null,
      completedDate: null,
    })
    expect(s.tasks[0].id).toBeTruthy()
  })
  it('is a no-op (same reference) when invalid', () => {
    expect(addTask(empty, '  ', at(23))).toBe(empty)
  })
  it('gives unique ids', () => {
    const s = addTask(addTask(empty, 'a', at(23)), 'b', at(23))
    expect(s.tasks[0].id).not.toBe(s.tasks[1].id)
  })
  it('edits text; no-op when invalid or unchanged', () => {
    const s = addTask(empty, 'a', at(23))
    const id = s.tasks[0].id
    expect(editTask(s, id, ' b ').tasks[0].text).toBe('b')
    expect(editTask(s, id, '')).toBe(s)
    expect(editTask(s, id, ' a ')).toBe(s)
    expect(editTask(s, 'missing', 'x')).toBe(s)
  })
})

describe('toggleTask', () => {
  it('sets then clears completion fields', () => {
    const s = addTask(empty, 'a', at(23))
    const id = s.tasks[0].id
    const done = toggleTask(s, id, at(23, 12))
    expect(done.tasks[0]).toMatchObject({
      done: true,
      completedAt: at(23, 12).getTime(),
      completedDate: '2026-10-23',
    })
    expect(toggleTask(done, id, at(23, 13)).tasks[0]).toMatchObject({
      done: false,
      completedAt: null,
      completedDate: null,
    })
  })
  it('is a no-op for unknown id', () => {
    expect(toggleTask(empty, 'x', at(23))).toBe(empty)
  })
})

describe('sortTasks', () => {
  it('unfinished by createdAt, then done by completedAt (D-9, AC-1.6, AC-2.1)', () => {
    const tasks = [
      task({
        id: 'd2',
        done: true,
        createdAt: 1,
        completedAt: 20,
        completedDate: '2026-10-23',
      }),
      task({ id: 'u2', createdAt: 5 }),
      task({
        id: 'd1',
        done: true,
        createdAt: 9,
        completedAt: 10,
        completedDate: '2026-10-23',
      }),
      task({ id: 'u1', createdAt: 2 }),
    ]
    expect(sortTasks(tasks).map((t) => t.id)).toEqual(['u1', 'u2', 'd1', 'd2'])
  })
  it('does not mutate input', () => {
    const tasks = [
      task({ id: 'b', createdAt: 2 }),
      task({ id: 'a', createdAt: 1 }),
    ]
    sortTasks(tasks)
    expect(tasks.map((t) => t.id)).toEqual(['b', 'a'])
  })
  it('un-complete returns task to its creation-order slot (AC-2.2)', () => {
    let s = empty
    for (const [i, name] of ['a', 'b', 'c'].entries())
      s = addTask(s, name, new Date(2026, 9, 23, 9, i))
    const b = s.tasks[1].id
    s = toggleTask(s, b, at(23, 12))
    expect(sortTasks(s.tasks).map((t) => t.text)).toEqual(['a', 'c', 'b'])
    s = toggleTask(s, b, at(23, 13))
    expect(sortTasks(s.tasks).map((t) => t.text)).toEqual(['a', 'b', 'c'])
  })
})

describe('progress', () => {
  it('2 of 5 (AC-2.3)', () => {
    const tasks = [1, 2, 3, 4, 5].map((n) =>
      n <= 2
        ? task({
            id: String(n),
            done: true,
            completedAt: n,
            completedDate: '2026-10-23',
          })
        : task({ id: String(n) }),
    )
    expect(progress(tasks)).toEqual({ done: 2, total: 5 })
    expect(progress([])).toEqual({ done: 0, total: 0 })
  })
})

describe('rollover', () => {
  const doneOn = (id: string, d: string) =>
    task({
      id,
      done: true,
      completedAt: 1,
      completedDate: d,
      createdDate: '2026-10-01',
    })

  it('keeps unfinished, drops done yesterday (AC-5.1)', () => {
    const s: TasksState = {
      version: 1,
      tasks: [
        doneOn('A', '2026-10-22'),
        task({ id: 'B', createdDate: '2026-10-22' }),
      ],
    }
    expect(rollover(s, '2026-10-23').tasks.map((t) => t.id)).toEqual(['B'])
  })
  it('after several skipped days keeps all unfinished, drops all earlier-done (AC-5.3)', () => {
    const s: TasksState = {
      version: 1,
      tasks: [
        doneOn('A', '2026-10-18'),
        doneOn('B', '2026-10-20'),
        task({ id: 'C', createdDate: '2026-10-18' }),
        task({ id: 'D', createdDate: '2026-10-19' }),
      ],
    }
    expect(rollover(s, '2026-10-23').tasks.map((t) => t.id)).toEqual(['C', 'D'])
  })
  it('keeps tasks done today (AC-5.5), incl. carried-over ones', () => {
    const s: TasksState = {
      version: 1,
      tasks: [{ ...doneOn('A', '2026-10-23'), createdDate: '2026-10-20' }],
    }
    expect(rollover(s, '2026-10-23')).toBe(s)
  })
  it('returns same reference when nothing dropped; clock going backwards drops nothing', () => {
    const s: TasksState = {
      version: 1,
      tasks: [doneOn('A', '2026-10-22'), task({ id: 'B' })],
    }
    expect(rollover(s, '2026-10-22')).toBe(s)
    expect(rollover(s, '2026-10-01')).toBe(s)
  })
})

describe('carriedOverLabel', () => {
  const t = (createdDate: string, done = false) =>
    task({
      id: 'x',
      createdDate,
      done,
      completedAt: done ? 1 : null,
      completedDate: done ? '2026-10-23' : null,
    })
  it('describes age (AC-5.2)', () => {
    expect(carriedOverLabel(t('2026-10-22'), '2026-10-23')).toBe(
      'from yesterday',
    )
    expect(carriedOverLabel(t('2026-10-20'), '2026-10-23')).toBe(
      'from 3 days ago',
    )
  })
  it('null for today, future (clock back) or done', () => {
    expect(carriedOverLabel(t('2026-10-23'), '2026-10-23')).toBeNull()
    expect(carriedOverLabel(t('2026-10-24'), '2026-10-23')).toBeNull()
    expect(carriedOverLabel(t('2026-10-20', true), '2026-10-23')).toBeNull()
  })
})

describe('removeTask / restoreTask', () => {
  it('restores same text, state and position (AC-3.3)', () => {
    let s = empty
    for (const [i, name] of ['a', 'b', 'c'].entries())
      s = addTask(s, name, new Date(2026, 9, 23, 9, i))
    s = toggleTask(s, s.tasks[0].id, at(23, 12))
    const before = sortTasks(s.tasks)
    const target = s.tasks[1]
    const { state, removed } = removeTask(s, target.id)
    expect(removed).toBe(target)
    expect(state.tasks).toHaveLength(2)
    const restored = restoreTask(state, removed!)
    expect(sortTasks(restored.tasks)).toEqual(before)
  })
  it('remove unknown id → null, same state; restore existing id → no-op', () => {
    const s = addTask(empty, 'a', at(23))
    expect(removeTask(s, 'nope')).toEqual({ state: s, removed: null })
    expect(restoreTask(s, s.tasks[0])).toBe(s)
  })
})
