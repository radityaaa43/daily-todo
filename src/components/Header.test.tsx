import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Header } from './Header'

const friday = new Date(2026, 9, 23, 9, 30)

describe('Header', () => {
  it('shows the title and today in the device locale (AC-5.6)', () => {
    render(
      <Header now={friday} progress={{ done: 0, total: 0 }} locale="en-GB" />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Today' }),
    ).toBeVisible()
    const date = screen.getByText(/Friday,? 23 Oct/)
    expect(date.tagName).toBe('TIME')
    expect(date).toHaveAttribute('datetime', '2026-10-23')
  })

  it('follows the locale word order', () => {
    render(
      <Header now={friday} progress={{ done: 0, total: 0 }} locale="de-DE" />,
    )

    expect(screen.getByText(/Freitag,? 23\. Okt/)).toBeVisible()
  })

  it('shows "2 of 5 done" for 5 tasks with 2 done (AC-2.3)', () => {
    render(<Header now={friday} progress={{ done: 2, total: 5 }} />)

    expect(screen.getByText('2 of 5 done')).toBeVisible()
  })

  it('hides progress when there are no tasks (AC-7.3)', () => {
    render(<Header now={friday} progress={{ done: 0, total: 0 }} />)

    expect(screen.queryByText(/done/)).not.toBeInTheDocument()
  })
})
