import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UseTasks } from '@/hooks/useTasks'
import App from './App.tsx'

const state: Pick<UseTasks, 'progress' | 'storageStatus'> = {
  progress: { done: 0, total: 0 },
  storageStatus: 'ok',
}

vi.mock('@/hooks/useToday', () => ({
  useToday: () => ({ todayKey: '2026-10-23', now: new Date(2026, 9, 23) }),
}))
vi.mock('@/hooks/useTasks', () => ({ useTasks: () => state }))

describe('App', () => {
  beforeEach(() => {
    state.progress = { done: 0, total: 0 }
    state.storageStatus = 'ok'
  })

  it('renders the shell: title, date, no progress, no notice', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Today' })).toBeVisible()
    expect(screen.getByText(/23/)).toBeVisible()
    expect(screen.queryByText(/done/)).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows progress from useTasks (AC-2.3)', () => {
    state.progress = { done: 2, total: 5 }
    render(<App />)

    expect(screen.getByText('2 of 5 done')).toBeVisible()
  })

  it('shows the storage notice only when storage is unavailable (AC-6.3)', () => {
    state.storageStatus = 'unavailable'
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent(
      "Your tasks can't be saved on this device and will be lost when you close this tab.",
    )
  })
})
