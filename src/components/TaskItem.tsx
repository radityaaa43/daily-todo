import { X } from 'lucide-react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'

import { CharCounter, COUNTER_FROM } from '@/components/CharCounter'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { isFinePointer } from '@/lib/focus'
import { MAX_TEXT, type Task } from '@/lib/tasks'
import { cn } from '@/lib/utils'

interface TaskItemProps {
  task: Task
  carriedLabel: string | null
  isNew: boolean
  onToggle(id: string): void
  onEdit(id: string, raw: string): boolean
  onRemove(id: string): void
}

export function TaskItem({
  task,
  carriedLabel,
  isNew,
  onToggle,
  onEdit,
  onRemove,
}: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.text)
  const textRef = useRef<HTMLButtonElement>(null)
  // Set once an edit is saved or cancelled, so the blur fired by unmounting the field is ignored.
  const finished = useRef(false)
  const carriedId = `carried-${task.id}`
  const countId = `count-${task.id}`

  const startEdit = () => {
    finished.current = false
    setDraft(task.text)
    setEditing(true)
  }

  const finish = (save: boolean, refocus: boolean) => {
    if (finished.current) return
    finished.current = true
    // An invalid (empty) draft is dropped and the original text stays (AC-4.4).
    if (save) onEdit(task.id, draft)
    flushSync(() => setEditing(false))
    if (refocus) textRef.current?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      finish(true, true)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      finish(false, true)
    }
  }

  return (
    <li
      data-task-id={task.id}
      className={cn(
        'grid min-h-14 grid-cols-[44px_minmax(0,1fr)_44px] items-start px-1 py-1 hover:bg-[color-mix(in_srgb,var(--text)_3%,transparent)]',
        isNew && 'animate-enter',
      )}
    >
      <span className="flex size-11 items-center justify-center">
        <Checkbox
          checked={task.done}
          onCheckedChange={() => onToggle(task.id)}
          aria-label={`${task.done ? 'Mark not done' : 'Mark done'}: ${task.text}`}
          aria-describedby={carriedLabel ? carriedId : undefined}
          className="relative after:absolute after:-inset-[11px] after:content-['']"
        />
      </span>
      <div className="min-w-0">
        {editing ? (
          <>
            <input
              type="text"
              aria-label="Edit task"
              aria-describedby={
                draft.length >= COUNTER_FROM ? countId : undefined
              }
              value={draft}
              maxLength={MAX_TEXT}
              autoFocus
              onFocus={(e) => {
                const end = e.currentTarget.value.length
                e.currentTarget.setSelectionRange(end, end)
              }}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => finish(true, false)}
              className="my-0.5 min-h-10 w-full min-w-0 rounded-sm border-2 border-primary bg-surface px-2 py-1.5 text-body text-text outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            <CharCounter id={countId} length={draft.length} />
            {isFinePointer() && (
              <p className="text-meta text-muted">
                Enter to save · Esc to cancel
              </p>
            )}
          </>
        ) : (
          <button
            ref={textRef}
            type="button"
            aria-label={`Edit task: ${task.text}`}
            onClick={startEdit}
            className={cn(
              'min-h-11 w-full cursor-text rounded-sm py-2 text-left text-body wrap-anywhere outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              task.done
                ? 'text-subtle line-through decoration-[1.5px]'
                : 'text-text',
            )}
          >
            <span>{task.text}</span>
          </button>
        )}
        {carriedLabel && (
          <span
            id={carriedId}
            className="mt-1 inline-block rounded-full bg-carried-bg px-2 py-0.5 text-meta text-carried"
          >
            {carriedLabel}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete task: ${task.text}`}
        onClick={() => onRemove(task.id)}
      >
        <X className="size-[18px]" strokeWidth={2} aria-hidden="true" />
      </Button>
    </li>
  )
}
