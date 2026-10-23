import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Task } from '@/lib/tasks'
import { TaskItem } from './TaskItem'

const task: Task = {
  id: 't1',
  text: 'Buy milk',
  done: false,
  createdAt: 1,
  createdDate: '2026-10-23',
  completedAt: null,
  completedDate: null,
}

function setup(over: Partial<Task> = {}, onEdit = vi.fn(() => true)) {
  const props = { onToggle: vi.fn(), onRemove: vi.fn(), onEdit }
  render(
    <ul>
      <TaskItem
        task={{ ...task, ...over }}
        carriedLabel={null}
        isNew={false}
        {...props}
      />
    </ul>,
  )
  return props
}

async function startEdit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Edit task: Buy milk' }))
  return screen.getByRole('textbox', { name: 'Edit task' })
}

afterEach(() => vi.unstubAllGlobals())

describe('TaskItem', () => {
  it('exposes accessible names (NFR-3)', () => {
    setup()

    expect(
      screen.getByRole('checkbox', { name: 'Mark done: Buy milk' }),
    ).not.toBeChecked()
    expect(
      screen.getByRole('button', { name: 'Edit task: Buy milk' }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Delete task: Buy milk' }),
    ).toBeVisible()
  })

  it('toggles with Tab then Space (AC-2.4)', async () => {
    const user = userEvent.setup()
    const { onToggle } = setup()

    await user.tab()
    expect(screen.getByRole('checkbox')).toHaveFocus()
    await user.keyboard(' ')

    expect(onToggle).toHaveBeenCalledWith('t1')
  })

  it('shows a done task checked and struck through (AC-2.1)', () => {
    setup({ done: true, completedAt: 2, completedDate: '2026-10-23' })

    expect(
      screen.getByRole('checkbox', { name: 'Mark not done: Buy milk' }),
    ).toBeChecked()
    expect(screen.getByText('Buy milk').closest('button')).toHaveClass(
      'line-through',
    )
  })

  it('deletes with no confirmation (AC-3.1)', async () => {
    const user = userEvent.setup()
    const { onRemove } = setup()

    await user.click(
      screen.getByRole('button', { name: 'Delete task: Buy milk' }),
    )

    expect(onRemove).toHaveBeenCalledWith('t1')
  })

  it('opens an editable focused field on click (AC-4.1)', async () => {
    const user = userEvent.setup()
    setup()

    const field = await startEdit(user)

    expect(field).toHaveValue('Buy milk')
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('maxlength', '200')
  })

  it('saves on Enter and returns focus to the text button (AC-4.2)', async () => {
    const user = userEvent.setup()
    const { onEdit } = setup()

    await startEdit(user)
    await user.keyboard(' and eggs{Enter}')

    expect(onEdit).toHaveBeenCalledWith('t1', 'Buy milk and eggs')
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: 'Edit task: Buy milk' }),
    ).toHaveFocus()
  })

  it('saves on blur (AC-4.2)', async () => {
    const user = userEvent.setup()
    const { onEdit } = setup()

    await startEdit(user)
    await user.keyboard('!')
    await user.click(screen.getByRole('checkbox'))

    expect(onEdit).toHaveBeenCalledWith('t1', 'Buy milk!')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('cancels on Escape without saving (AC-4.3)', async () => {
    const user = userEvent.setup()
    const { onEdit } = setup()

    await startEdit(user)
    await user.keyboard('zzz{Escape}')

    expect(onEdit).not.toHaveBeenCalled()
    expect(screen.getByText('Buy milk')).toBeVisible()
  })

  it('keeps the original text when the edit is rejected (AC-4.4)', async () => {
    const user = userEvent.setup()
    const { onEdit } = setup(
      {},
      vi.fn(() => false),
    )

    const field = await startEdit(user)
    await user.clear(field)
    await user.keyboard('{Enter}')

    expect(onEdit).toHaveBeenCalledWith('t1', '')
    expect(screen.getByText('Buy milk')).toBeVisible()
  })

  it('shows the edit counter at the limit (AC-4.5)', async () => {
    const user = userEvent.setup()
    setup({ text: 'a'.repeat(200) })

    await user.click(screen.getByRole('button', { name: /^Edit task: / }))

    expect(screen.getByText('Max 200 characters')).toBeVisible()
  })

  it('hides the keyboard hint on coarse pointers', async () => {
    const user = userEvent.setup()
    setup()
    await startEdit(user)
    expect(screen.queryByText(/Esc to cancel/)).not.toBeInTheDocument()
  })

  it('shows the keyboard hint on fine pointers', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const user = userEvent.setup()
    setup()

    await startEdit(user)

    expect(screen.getByText('Enter to save · Esc to cancel')).toBeVisible()
  })

  it('renders HTML in task text literally (AC-6.4)', () => {
    setup({ text: '<b>hi</b>' })

    expect(screen.getByText('<b>hi</b>')).toBeVisible()
    expect(document.querySelector('b')).toBeNull()
  })
})
