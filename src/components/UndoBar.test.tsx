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

describe('UndoBar', () => {
  it('keeps an empty live region when nothing is pending', () => {
    render(<UndoBar pendingUndo={null} onUndo={vi.fn()} />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('shows "Task deleted" and Undo inside the live region (AC-3.2)', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(<UndoBar pendingUndo={task} onUndo={onUndo} />)

    expect(screen.getByRole('status')).toHaveTextContent('Task deleted')
    await user.click(screen.getByRole('button', { name: 'Undo' }))

    expect(onUndo).toHaveBeenCalledOnce()
  })
})
