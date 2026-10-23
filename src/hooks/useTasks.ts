import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  isStorageAvailable,
  loadState,
  saveState,
  subscribe,
} from '../lib/storage'
import type { StorageStatus } from '../lib/storage'
import {
  addTask,
  editTask,
  progress as calcProgress,
  removeTask,
  restoreTask,
  rollover,
  sortTasks,
  toggleTask,
  validateText,
} from '../lib/tasks'
import type { DateKey, Task, TasksState } from '../lib/tasks'

export const UNDO_MS = 5000

export interface UseTasks {
  tasks: Task[]
  progress: { done: number; total: number }
  storageStatus: StorageStatus
  add(raw: string): boolean
  toggle(id: string): void
  edit(id: string, raw: string): boolean
  remove(id: string): void
  undo(): void
  pauseUndo(): void
  resumeUndo(): void
  pendingUndo: Task | null
}

export function useTasks(todayKey: DateKey): UseTasks {
  const [init] = useState(() => {
    const loaded = loadState()
    const state = rollover(loaded, todayKey)
    return { state, dirty: state !== loaded }
  })
  const [state, setState] = useState<TasksState>(init.state)
  const [storageStatus, setStorageStatus] = useState<StorageStatus>(() =>
    isStorageAvailable() ? 'ok' : 'unavailable',
  )
  const [pendingUndo, setPendingUndo] = useState<Task | null>(null)
  // Latest state, readable synchronously so back-to-back actions never see stale state.
  const stateRef = useRef(init.state)
  const pendingRef = useRef<Task | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const persist = useCallback((s: TasksState) => {
    if (!saveState(s)) setStorageStatus('unavailable')
  }, [])

  const commit = useCallback(
    (next: TasksState) => {
      if (next === stateRef.current) return
      stateRef.current = next
      setState(next)
      persist(next)
    },
    [persist],
  )

  const closeUndo = useCallback(() => {
    clearTimeout(timerRef.current)
    pendingRef.current = null
    setPendingUndo(null)
  }, [])

  // Roll over on mount (save what load+rollover dropped) and whenever the day changes.
  useEffect(() => {
    if (init.dirty) persist(stateRef.current)
  }, [init.dirty, persist])

  useEffect(() => {
    commit(rollover(stateRef.current, todayKey))
  }, [todayKey, commit])

  // Another tab wrote: adopt its state (last write wins). Do not write it back.
  useEffect(
    () =>
      subscribe((external) => {
        const next = rollover(external, todayKey)
        stateRef.current = next
        setState(next)
      }),
    [todayKey],
  )

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const add = useCallback(
    (raw: string) => {
      if (!validateText(raw).ok) return false
      commit(addTask(stateRef.current, raw, new Date()))
      return true
    },
    [commit],
  )

  const toggle = useCallback(
    (id: string) => commit(toggleTask(stateRef.current, id, new Date())),
    [commit],
  )

  const edit = useCallback(
    (id: string, raw: string) => {
      if (!validateText(raw).ok) return false
      commit(editTask(stateRef.current, id, raw))
      return true
    },
    [commit],
  )

  const remove = useCallback(
    (id: string) => {
      const { state: next, removed } = removeTask(stateRef.current, id)
      if (!removed) return
      commit(next)
      clearTimeout(timerRef.current)
      pendingRef.current = removed
      setPendingUndo(removed)
      timerRef.current = setTimeout(closeUndo, UNDO_MS)
    },
    [commit, closeUndo],
  )

  const pauseUndo = useCallback(() => clearTimeout(timerRef.current), [])

  const resumeUndo = useCallback(() => {
    if (!pendingRef.current) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(closeUndo, UNDO_MS)
  }, [closeUndo])

  const undo = useCallback(() => {
    const task = pendingRef.current
    if (!task) return
    closeUndo()
    commit(rollover(restoreTask(stateRef.current, task), todayKey))
  }, [commit, closeUndo, todayKey])

  const tasks = useMemo(() => sortTasks(state.tasks), [state.tasks])
  const progress = useMemo(() => calcProgress(state.tasks), [state.tasks])

  return {
    tasks,
    progress,
    storageStatus,
    add,
    toggle,
    edit,
    remove,
    undo,
    pauseUndo,
    resumeUndo,
    pendingUndo,
  }
}
