import { AddTaskForm } from '@/components/AddTaskForm'
import { Header } from '@/components/Header'
import { StorageNotice } from '@/components/StorageNotice'
import { TaskList } from '@/components/TaskList'
import { UndoBar } from '@/components/UndoBar'
import { useTasks } from '@/hooks/useTasks'
import { useToday } from '@/hooks/useToday'
import { focusTaskCheckbox, updateThenFocus } from '@/lib/focus'

export default function App() {
  const { todayKey, now } = useToday()
  const {
    tasks,
    progress,
    storageStatus,
    add,
    toggle,
    edit,
    remove,
    undo,
    pendingUndo,
  } = useTasks(todayKey)

  const restore = () => {
    if (pendingUndo) {
      const { id } = pendingUndo
      updateThenFocus(undo, () => focusTaskCheckbox(id))
    }
  }

  return (
    <div className="min-h-dvh px-4 pt-6 pb-24 sm:pt-12">
      <div className="mx-auto w-full max-w-[560px] min-w-0">
        <Header now={now} progress={progress} />
        <main className="mt-4 flex flex-col gap-2">
          {storageStatus === 'unavailable' && <StorageNotice />}
          <AddTaskForm onAdd={add} />
          <TaskList
            tasks={tasks}
            todayKey={todayKey}
            onToggle={toggle}
            onEdit={edit}
            onRemove={remove}
          />
        </main>
      </div>
      <UndoBar pendingUndo={pendingUndo} onUndo={restore} />
    </div>
  )
}
