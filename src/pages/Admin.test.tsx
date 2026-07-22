import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Admin from './Admin'

describe('Admin (PRD §12 Task 10)', () => {
  it('gates behind an admin sign-in when there is no admin session', async () => {
    render(
      <MemoryRouter>
        <Admin />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Admin' })).toBeInTheDocument()
    // With no admin session, the auth check resolves to the sign-in form.
    expect(await screen.findByRole('button', { name: /Sign in/i })).toBeInTheDocument()
  })
})
