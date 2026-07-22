import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ScreenTab from './ScreenTab'
import { demoDeal } from '@/lib/demoDeal'

describe('ScreenTab (screener heat map)', () => {
  it('renders the RED verdict, the eight tiles, and the continue link', () => {
    render(
      <MemoryRouter>
        <ScreenTab dealId="demo" deal={demoDeal} />
      </MemoryRouter>,
    )
    expect(screen.getByText('RED')).toBeInTheDocument()
    // A couple of the named §6.4 tiles.
    expect(screen.getByRole('heading', { name: 'Customer concentration' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Price vs. normalized earnings' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Continue to Financial Normalizer/i }),
    ).toBeInTheDocument()
  })
})
