import { daysBetween, toDateKey } from './date'

export type DateKey = string

export interface Task {
  id: string
  text: string
  done: boolean
  createdAt: number
  createdDate: DateKey
  completedAt: number | null
  completedDate: DateKey | null
}

export interface TasksState {
  version: 1
  tasks: Task[]
}

export const MAX_TEXT = 200

export type TextCheck =
  { ok: true; text: string } | { ok: false; reason: 'empty' | 'too_long' }

export function validateText(raw: string): TextCheck {
  const text = raw.trim()
  if (text.length === 0) return { ok: false, reason: 'empty' }
  if (text.length > MAX_TEXT) return { ok: false, reason: 'too_long' }
  return { ok: true, text }
}

// crypto.randomUUID is missing in insecure contexts (http over LAN)
function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  )
}

export function addTask(s: TasksState, raw: string, now: Date): TasksState {
  const check = validateText(raw)
  if (!check.ok) return s
  const task: Task = {
    id: newId(),
    text: check.text,
    done: false,
    createdAt: now.getTime(),
    createdDate: toDateKey(now),
    completedAt: null,
    completedDate: null,
  }
  return { ...s, tasks: [...s.tasks, task] }
}

export function toggleTask(s: TasksState, id: string, now: Date): TasksState {
  if (!s.tasks.some((t) => t.id === id)) return s
  return {
    ...s,
    tasks: s.tasks.map((t) => {
      if (t.id !== id) return t
      return t.done
        ? { ...t, done: false, completedAt: null, completedDate: null }
        : {
            ...t,
            done: true,
            completedAt: now.getTime(),
            completedDate: toDateKey(now),
          }
    }),
  }
}

export function editTask(s: TasksState, id: string, raw: string): TasksState {
  const check = validateText(raw)
  if (!check.ok) return s
  const current = s.tasks.find((t) => t.id === id)
  if (!current || current.text === check.text) return s
  return {
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, text: check.text } : t)),
  }
}

export function removeTask(
  s: TasksState,
  id: string,
): { state: TasksState; removed: Task | null } {
  const removed = s.tasks.find((t) => t.id === id) ?? null
  if (!removed) return { state: s, removed: null }
  return { state: { ...s, tasks: s.tasks.filter((t) => t.id !== id) }, removed }
}

// Position is not stored: createdAt/completedAt on the task restore it via sortTasks.
export function restoreTask(s: TasksState, task: Task): TasksState {
  if (s.tasks.some((t) => t.id === task.id)) return s
  return { ...s, tasks: [...s.tasks, task] }
}

export function rollover(s: TasksState, today: DateKey): TasksState {
  const kept = s.tasks.filter(
    (t) => !(t.done && t.completedDate !== null && t.completedDate < today),
  )
  return kept.length === s.tasks.length ? s : { ...s, tasks: kept }
}

export function sortTasks(tasks: Task[]): Task[] {
  const open = tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.createdAt - b.createdAt)
  const done = tasks
    .filter((t) => t.done)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
  return [...open, ...done]
}

export function progress(tasks: Task[]): { done: number; total: number } {
  return { done: tasks.filter((t) => t.done).length, total: tasks.length }
}

export function carriedOverLabel(task: Task, today: DateKey): string | null {
  if (task.done || task.createdDate >= today) return null
  const n = daysBetween(task.createdDate, today)
  return n === 1 ? 'from yesterday' : `from ${n} days ago`
}
