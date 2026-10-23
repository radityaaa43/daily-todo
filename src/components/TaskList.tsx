import { useState } from 'react'

import { AllDoneMessage } from '@/components/AllDoneMessage'
import { EmptyState } from '@/components/EmptyState'
import { TaskItem } from '@/components/TaskItem'
import {
  focusNewTaskInput,
  focusTaskCheckbox,
  updateThenFocus,
} from '@/lib/focus'
import { carriedOverLabel, type DateKey, type Task } from '@/lib/tasks'

interface TaskListProps {
  tasks: Task[]
  todayKey: DateKey
  onToggle(id: string): void
  onEdit(id: string, raw: string): boolean
  onRemove(id: string): void
}

const GROUP = 'divide-y divide-border'

export function TaskList({
  tasks,
  todayKey,
  onToggle,
  onEdit,
  onRemove,
}: TaskListProps) {
  // Rows that appeared since the previous tasks list fade in; moving between groups is not "new".
  const [prev, setPrev] = useState(tasks)
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set())
  if (prev !== tasks) {
    const known = new Set(prev.map((t) => t.id))
    setPrev(tasks)
    setFresh(new Set(tasks.filter((t) => !known.has(t.id)).map((t) => t.id)))
  }

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  const toggle = (id: string) =>
    updateThenFocus(
      () => onToggle(id),
      () => focusTaskCheckbox(id),
    )

  // Focus the next row in the same group, else the previous, else the input (design 5.2).
  const remove = (id: string) => {
    const group = open.some((t) => t.id === id) ? open : done
    const i = group.findIndex((t) => t.id === id)
    const neighbour = group[i + 1] ?? group[i - 1]
    updateThenFocus(
      () => onRemove(id),
      () => (neighbour ? focusTaskCheckbox(neighbour.id) : focusNewTaskInput()),
    )
  }

  const rows = (group: Task[]) =>
    group.map((task) => (
      <TaskItem
        key={task.id}
        task={task}
        carriedLabel={carriedOverLabel(task, todayKey)}
        isNew={fresh.has(task.id)}
        onToggle={toggle}
        onEdit={onEdit}
        onRemove={remove}
      />
    ))

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {open.length > 0 && (
            <section>
              <h2 className="sr-only">To do</h2>
              <ul className={GROUP}>{rows(open)}</ul>
            </section>
          )}
          {open.length === 0 && <AllDoneMessage />}
          {done.length > 0 && (
            <section className="border-t border-border first:border-t-0">
              <h2 className="px-4 pt-4 pb-2 text-label text-muted uppercase">
                Done
              </h2>
              <ul className={GROUP}>{rows(done)}</ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
