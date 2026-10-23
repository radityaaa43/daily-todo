import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UNDO_MS } from '@/hooks/useTasks'
import { STORAGE_KEY } from '@/lib/storage'
import App from './App'

// Real hooks over jsdom localStorage: the Today flow end to end.
const texts = (name: string) =>
  within(screen.getByRole('heading', { name }).parentElement!)
    .getAllByRole('listitem')
    .map((li) => li.textContent)

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => vi.useRealTimers())

async function addTasks(
  user: ReturnType<typeof userEvent.setup>,
  ...t: string[]
) {
  const input = screen.getByRole('textbox', { name: 'Add task' })
  for (const text of t) await user.type(input, `${text}{Enter}`)
}

describe('Today flow', () => {
  it('starts empty and adds trimmed tasks in creation order (AC-1.4, AC-1.6, AC-7.1)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    expect(screen.getByText('Nothing planned yet.')).toBeVisible()

    await addTasks(user, '  first  ', 'second')

    expect(texts('To do')).toEqual(['first', 'second'])
    expect(screen.getByText('0 of 2 done')).toBeVisible()
    expect(screen.queryByText('Nothing planned yet.')).toBeNull()
  })

  it('completes and un-completes with ordering and all-done (AC-2.1, AC-2.2, AC-7.2)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await addTasks(user, 'a', 'b')

    await user.click(screen.getByRole('checkbox', { name: 'a' }))
    expect(texts('To do')).toEqual(['b'])
    expect(texts('Done')).toEqual(['a'])
    expect(
      screen.getByRole('checkbox', { name: 'a' }),
    ).toHaveFocus()

    await user.click(screen.getByRole('checkbox', { name: 'b' }))
    expect(screen.getByText('All done for today.')).toBeVisible()
    expect(screen.getByText('2 of 2 done')).toBeVisible()

    await user.click(screen.getByRole('checkbox', { name: 'a' }))
    expect(texts('To do')).toEqual(['a'])
  })

  it('deletes instantly, undoes to the same position, and drops undo after 5 s (AC-3.1..3.4)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await addTasks(user, 'a', 'b', 'c')

    await user.click(screen.getByRole('button', { name: 'Delete task: b' }))
    expect(texts('To do')).toEqual(['a', 'c'])
    expect(screen.getByText('Task deleted')).toBeVisible()
    expect(screen.getByRole('checkbox', { name: 'c' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(texts('To do')).toEqual(['a', 'b', 'c'])
    expect(screen.queryByText('Task deleted')).toBeNull()
    expect(screen.getByRole('checkbox', { name: 'b' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Delete task: b' }))
    act(() => vi.advanceTimersByTime(UNDO_MS))
    expect(screen.queryByText('Task deleted')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
  })

  it('keeps the toast while hovered, then closes 5 s after the pointer leaves (C-6)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await addTasks(user, 'a')

    await user.click(screen.getByRole('button', { name: 'Delete task: a' }))
    await user.hover(screen.getByText('Task deleted'))
    act(() => vi.advanceTimersByTime(UNDO_MS * 2))
    expect(screen.getByText('Task deleted')).toBeVisible()

    await user.unhover(screen.getByText('Task deleted'))
    act(() => vi.advanceTimersByTime(UNDO_MS))
    expect(screen.queryByText('Task deleted')).toBeNull()
  })

  it('keeps the toast while Undo has keyboard focus, then closes 5 s after blur (C-6)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await addTasks(user, 'a')

    await user.click(screen.getByRole('button', { name: 'Delete task: a' }))
    act(() => screen.getByRole('button', { name: 'Undo' }).focus())
    act(() => vi.advanceTimersByTime(UNDO_MS * 2))
    expect(screen.getByText('Task deleted')).toBeVisible()

    act(() => screen.getByRole('button', { name: 'Undo' }).blur())
    act(() => vi.advanceTimersByTime(UNDO_MS))
    expect(screen.queryByText('Task deleted')).toBeNull()
  })

  it('moves focus to the input when the last task is deleted', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await addTasks(user, 'a')

    await user.click(screen.getByRole('button', { name: 'Delete task: a' }))

    expect(screen.getByText('Nothing planned yet.')).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Add task' })).toHaveFocus()
    expect(screen.queryByText(/of \d+ done/)).toBeNull()
  })

  it('edits text and persists it (AC-4.2)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)
    await addTasks(user, 'a')

    await user.click(screen.getByRole('button', { name: 'Edit task: a' }))
    await user.keyboard('bc{Enter}')

    expect(screen.getByRole('button', { name: 'Edit task: abc' })).toBeVisible()
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"text":"abc"')
  })

  it('restores tasks after a reload but not the undo bar (AC-3.4, US-6)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const first = render(<App />)
    await addTasks(user, 'a', 'b')
    await user.click(screen.getByRole('button', { name: 'Delete task: b' }))
    first.unmount()

    render(<App />)

    expect(texts('To do')).toEqual(['a'])
    expect(screen.queryByText('Task deleted')).toBeNull()
  })

  it('shows <b>hi</b> literally (AC-6.4)', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App />)

    await addTasks(user, '<b>hi</b>')

    expect(screen.getByText('<b>hi</b>')).toBeVisible()
  })
})
