import { flushSync } from 'react-dom'

export const NEW_TASK_ID = 'new-task'

export function isFinePointer(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches
  )
}

export function focusTaskCheckbox(id: string): void {
  document
    .querySelector<HTMLElement>(
      `[data-task-id="${CSS.escape(id)}"] [role="checkbox"]`,
    )
    ?.focus()
}

export function focusNewTaskInput(): void {
  document.getElementById(NEW_TASK_ID)?.focus()
}

// Rows move or vanish when state changes, so focus is set after a synchronous re-render (design 5.2).
export function updateThenFocus(update: () => void, focus: () => void): void {
  flushSync(update)
  focus()
}
