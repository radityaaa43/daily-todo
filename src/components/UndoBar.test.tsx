import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { Task } from '@/lib/tasks'
import { UndoBar } from './UndoBar'

const task: Task = {
  id: 't1',
  text: 'x',
  done: false,
  createdAt: 1,
  createdDate: '2026-10-23',
  completedAt: null,
  completedDate: null,
}

const noop = { onUndo: vi.fn(), onPause: vi.fn(), onResume: vi.fn() }

describe('UndoBar', () => {
  it('keeps an empty live region when nothing is pending', () => {
    render(<UndoBar pendingUndo={null} {...noop} />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('shows "Task deleted" and Undo inside the live region (AC-3.2)', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(<UndoBar pendingUndo={task} {...noop} onUndo={onUndo} />)

    expect(screen.getByRole('status')).toHaveTextContent('Task deleted')
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(onUndo).toHaveBeenCalledOnce()
  })

  it('pauses on hover and resumes on leave (C-6)', async () => {
    const user = userEvent.setup()
    const onPause = vi.fn()
    const onResume = vi.fn()
    render(
      <UndoBar
        pendingUndo={task}
        {...noop}
        onPause={onPause}
        onResume={onResume}
      />,
    )

    await user.hover(screen.getByText('Task deleted'))
    expect(onPause).toHaveBeenCalledOnce()
    await user.unhover(screen.getByText('Task deleted'))
    expect(onResume).toHaveBeenCalledOnce()
  })

  it('pauses on focus and resumes only when focus leaves the toast (C-6)', async () => {
    const user = userEvent.setup()
    const onPause = vi.fn()
    const onResume = vi.fn()
    render(
      <>
        <UndoBar
          pendingUndo={task}
          {...noop}
          onPause={onPause}
          onResume={onResume}
        />
        <button type="button">outside</button>
      </>,
    )

    await user.tab()
    expect(screen.getByRole('button', { name: 'Undo' })).toHaveFocus()
    expect(onPause).toHaveBeenCalledOnce()
    expect(onResume).not.toHaveBeenCalled()
    await user.tab()
    expect(onResume).toHaveBeenCalledOnce()
  })
})
