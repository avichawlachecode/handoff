import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Onboarding from './Onboarding'

describe('Onboarding (PRD §6.2)', () => {
  it('routes "Just exploring" to the Starter Track', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/starter" element={<div>Starter Track Page</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /Just exploring/i }))
    expect(screen.getByText('Starter Track Page')).toBeInTheDocument()
  })

  it('advances to the buy-box step for active searchers', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/onboarding']}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: /Actively searching/i }))
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(screen.getByText('Your buy box')).toBeInTheDocument()
  })
})
