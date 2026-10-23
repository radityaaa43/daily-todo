import type { Task, TasksState } from './tasks'
import { MAX_TEXT } from './tasks'

export const STORAGE_KEY = 'daily-todo:v1'
export type StorageStatus = 'ok' | 'unavailable'

const PROBE_KEY = 'daily-todo:probe'
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/

const emptyState = (): TasksState => ({ version: 1, tasks: [] })

export function isStorageAvailable(): boolean {
  try {
    window.localStorage.setItem(PROBE_KEY, '1')
    window.localStorage.removeItem(PROBE_KEY)
    return true
  } catch {
    return false
  }
}

function isTask(v: unknown): v is Task {
  if (typeof v !== 'object' || v === null) return false
  const t = v as Record<string, unknown>
  if (typeof t.id !== 'string' || typeof t.done !== 'boolean') return false
  if (typeof t.text !== 'string') return false
  const len = t.text.trim().length
  if (len < 1 || len > MAX_TEXT) return false
  if (typeof t.createdAt !== 'number' || !Number.isFinite(t.createdAt))
    return false
  if (typeof t.createdDate !== 'string' || !DATE_KEY_RE.test(t.createdDate))
    return false
  if (t.done) {
    return (
      typeof t.completedAt === 'number' &&
      Number.isFinite(t.completedAt) &&
      typeof t.completedDate === 'string' &&
      DATE_KEY_RE.test(t.completedDate)
    )
  }
  return t.completedAt === null && t.completedDate === null
}

// null when the value is not a valid v1 state
function parseState(raw: string): TasksState | null {
  let v: unknown
  try {
    v = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof v !== 'object' || v === null) return null
  const s = v as Record<string, unknown>
  if (s.version !== 1 || !Array.isArray(s.tasks) || !s.tasks.every(isTask))
    return null
  if (new Set(s.tasks.map((t: Task) => t.id)).size !== s.tasks.length)
    return null
  return { version: 1, tasks: s.tasks }
}

export function loadState(): TasksState {
  let raw: string | null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return emptyState()
  }
  if (raw === null) return emptyState()
  const parsed = parseState(raw)
  if (parsed) return parsed
  try {
    window.localStorage.setItem(`${STORAGE_KEY}:corrupt-${Date.now()}`, raw)
  } catch {
    // keeping the raw copy is best effort
  }
  return emptyState()
}

export function saveState(s: TasksState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    return true
  } catch {
    return false
  }
}

export function subscribe(
  onExternalChange: (s: TasksState) => void,
): () => void {
  const handler = (e: StorageEvent) => {
    // key === null: another tab called localStorage.clear()
    if (e.key !== null && e.key !== STORAGE_KEY) return
    if (e.newValue === null) return onExternalChange(emptyState())
    const parsed = parseState(e.newValue)
    if (parsed) onExternalChange(parsed)
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
