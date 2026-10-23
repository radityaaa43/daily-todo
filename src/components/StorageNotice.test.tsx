import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StorageNotice } from './StorageNotice'

describe('StorageNotice', () => {
  it('reads the exact AC-6.3 copy in a status region', () => {
    render(<StorageNotice />)

    expect(screen.getByRole('status')).toHaveTextContent(
      "Your tasks can't be saved on this device and will be lost when you close this tab.",
    )
  })
})
