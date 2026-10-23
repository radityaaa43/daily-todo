import type { CSSProperties } from 'react'

import type { Task } from '@/lib/tasks'

interface UndoBarProps {
  pendingUndo: Task | null
  onUndo(): void
  onPause(): void
  onResume(): void
}

// Hover or focus pauses the 5 s window so keyboard users can reach Undo (WCAG 2.2.1).
// The live region is always mounted so "Task deleted" is announced when it appears.
export function UndoBar({
  pendingUndo,
  onUndo,
  onPause,
  onResume,
}: UndoBarProps) {
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-20 mx-auto max-w-[400px] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
    >
      {pendingUndo && (
        <div
          key={pendingUndo.id}
          onMouseEnter={onPause}
          onMouseLeave={onResume}
          onFocus={onPause}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) onResume()
          }}
          style={{ '--enter-y': '8px' } as CSSProperties}
          className="flex min-h-[52px] animate-enter items-center justify-between rounded-md bg-toast-bg py-2 pr-2 pl-4 text-toast text-toast-text shadow-[var(--shadow-toast)]"
        >
          <span>Task deleted</span>
          <button
            type="button"
            onClick={onUndo}
            className="min-h-11 min-w-11 rounded-sm px-3 font-semibold text-toast-action outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-toast-action"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
