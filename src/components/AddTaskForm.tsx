import { Plus } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { CharCounter, COUNTER_FROM } from '@/components/CharCounter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isFinePointer, NEW_TASK_ID } from '@/lib/focus'
import { MAX_TEXT } from '@/lib/tasks'

interface AddTaskFormProps {
  onAdd(raw: string): boolean
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [value, setValue] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const empty = value.trim().length === 0

  // Auto-focus only where a hardware keyboard is likely; on phones it opens the keyboard (UX-1).
  useEffect(() => {
    if (isFinePointer()) inputRef.current?.focus()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (empty) return
    if (onAdd(value)) {
      setAnnouncement(`Added: ${value.trim()}`)
      setValue('')
    }
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={submit} className="sticky top-0 z-10 bg-bg py-2">
      <label htmlFor={NEW_TASK_ID} className="sr-only">
        Add task
      </label>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id={NEW_TASK_ID}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={MAX_TEXT}
          placeholder="Add task"
          autoComplete="off"
          enterKeyHint="done"
          aria-describedby={
            value.length >= COUNTER_FROM ? 'new-task-count' : undefined
          }
        />
        <Button
          type="submit"
          aria-label="Add task"
          aria-disabled={empty}
          className="w-12 px-0"
        >
          <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
      <CharCounter id="new-task-count" length={value.length} className="mt-1" />
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </form>
  )
}
