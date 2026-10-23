import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AddTaskForm } from './AddTaskForm'

function setup(onAdd = vi.fn(() => true)) {
  render(<AddTaskForm onAdd={onAdd} />)
  return { onAdd, input: screen.getByRole('textbox', { name: 'Add task' }) }
}

describe('AddTaskForm', () => {
  it('shows the "Add task" placeholder (AC-1.1)', () => {
    const { input } = setup()

    expect(input).toHaveAttribute('placeholder', 'Add task')
  })

  it('adds on Enter, clears the input and keeps focus (AC-1.2)', async () => {
    const user = userEvent.setup()
    const { onAdd, input } = setup()

    await user.type(input, 'Buy milk{Enter}')

    expect(onAdd).toHaveBeenCalledWith('Buy milk')
    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
  })

  it('adds with the Add button and keeps focus in the input (AC-1.2)', async () => {
    const user = userEvent.setup()
    const { onAdd, input } = setup()

    await user.type(input, 'Call dentist')
    await user.click(screen.getByRole('button', { name: 'Add task' }))

    expect(onAdd).toHaveBeenCalledWith('Call dentist')
    expect(input).toHaveFocus()
  })

  it('does nothing for empty or spaces-only text (AC-1.3)', async () => {
    const user = userEvent.setup()
    const { onAdd, input } = setup()
    const add = screen.getByRole('button', { name: 'Add task' })

    expect(add).toHaveAttribute('aria-disabled', 'true')
    await user.click(add)
    await user.type(input, '   {Enter}')

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('keeps the text when add is rejected', async () => {
    const user = userEvent.setup()
    const { input } = setup(vi.fn(() => false))

    await user.type(input, 'x{Enter}')

    expect(input).toHaveValue('x')
  })

  it('limits input to 200 characters and shows the counter from 180 (AC-1.5)', async () => {
    const user = userEvent.setup()
    const { input } = setup()
    expect(input).toHaveAttribute('maxlength', '200')

    await user.click(input)
    await user.paste('a'.repeat(179))
    expect(screen.queryByText(/\/ 200/)).not.toBeInTheDocument()

    await user.paste('a')
    expect(screen.getByText('180 / 200')).toBeVisible()

    await user.paste('a'.repeat(20))
    expect(input).toHaveValue('a'.repeat(200))
    expect(screen.getByText('Max 200 characters')).toBeVisible()
  })
})
