// TEMPORARY typed mock of the spec §3.4 `UseTasks` contract (empty list, no-op actions).
// Slice 1 owns this file; on merge take its version.
import type { StorageStatus } from '@/lib/storage'
import type { DateKey, Task } from '@/lib/tasks'

export interface UseTasks {
  tasks: Task[]
  progress: { done: number; total: number }
  storageStatus: StorageStatus
  add(raw: string): boolean
  toggle(id: string): void
  edit(id: string, raw: string): boolean
  remove(id: string): void
  undo(): void
  pendingUndo: Task | null
}

export function useTasks(todayKey: DateKey): UseTasks {
  void todayKey
  return {
    tasks: [],
    progress: { done: 0, total: 0 },
    storageStatus: 'ok',
    add: () => false,
    toggle: () => {},
    edit: () => false,
    remove: () => {},
    undo: () => {},
    pendingUndo: null,
  }
}
