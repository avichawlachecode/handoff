import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import GutCheckTab from './GutCheckTab'
import { demoDeal } from '@/lib/demoDeal'

describe('GutCheckTab (PRD §6.7)', () => {
  it('shows the KILL verdict, kill triggers, questions, and the positioning line', () => {
    render(
      <MemoryRouter>
        <GutCheckTab dealId="demo" deal={demoDeal} />
      </MemoryRouter>,
    )
    expect(screen.getByText('KILL')).toBeInTheDocument()
    expect(screen.getByText('Kill triggers that fired')).toBeInTheDocument()
    expect(screen.getByText('What to ask the seller next')).toBeInTheDocument()
    expect(screen.getByText(/We get paid whether or not you buy/i)).toBeInTheDocument()
  })
})
