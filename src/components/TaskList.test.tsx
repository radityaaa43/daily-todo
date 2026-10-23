import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Task } from '@/lib/tasks'
import { TaskList } from './TaskList'

const make = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  text: id,
  done: false,
  createdAt: 1,
  createdDate: '2026-10-23',
  completedAt: null,
  completedDate: null,
  ...over,
})
const done = (id: string): Task =>
  make(id, { done: true, completedAt: 2, completedDate: '2026-10-23' })

function setup(tasks: Task[], todayKey = '2026-10-23') {
  render(
    <TaskList
      tasks={tasks}
      todayKey={todayKey}
      onToggle={vi.fn()}
      onEdit={vi.fn(() => true)}
      onRemove={vi.fn()}
    />,
  )
}

describe('TaskList', () => {
  it('shows the empty state when there are no tasks (AC-7.1)', () => {
    setup([])

    expect(screen.getByText('Nothing planned yet.')).toBeVisible()
    expect(screen.getByText('Add your first task for today.')).toBeVisible()
  })

  it('lists unfinished tasks above a "Done" group (AC-2.1)', () => {
    setup([make('a'), make('b'), done('c')])

    const todo = screen.getByRole('heading', { name: 'To do' }).parentElement!
    const doneGroup = screen.getByRole('heading', {
      name: 'Done',
    }).parentElement!
    expect(within(todo).getAllByRole('listitem')).toHaveLength(2)
    expect(within(doneGroup).getAllByRole('listitem')).toHaveLength(1)
    expect(screen.queryByText('All done for today.')).not.toBeInTheDocument()
  })

  it('shows "All done for today." above the done tasks (AC-7.2)', () => {
    setup([done('a'), done('b')])

    const message = screen.getByText('All done for today.')
    const heading = screen.getByRole('heading', { name: 'Done' })
    expect(message).toBeVisible()
    expect(
      message.compareDocumentPosition(heading) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'To do' })).toBeNull()
  })

  it('marks carried-over tasks (AC-5.2)', () => {
    setup([
      make('a', { createdDate: '2026-10-22' }),
      make('b', { createdDate: '2026-10-20' }),
      make('c'),
    ])

    expect(screen.getByText('from yesterday')).toBeVisible()
    expect(screen.getByText('from 3 days ago')).toBeVisible()
    expect(screen.getAllByText(/^from /)).toHaveLength(2)
  })

  it('renders 100 tasks within 1 s (NFR-1)', () => {
    const tasks = Array.from({ length: 100 }, (_, i) => make(`t${i}`))
    const start = performance.now()
    setup(tasks)

    expect(screen.getAllByRole('listitem')).toHaveLength(100)
    expect(performance.now() - start).toBeLessThan(1000)
  })
})
