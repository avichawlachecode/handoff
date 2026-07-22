import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div>Home</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Layout (app shell)', () => {
  it('renders the top navigation', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: 'Handoff' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Deals' })).toBeInTheDocument()
  })

  it('renders the persistent footer disclaimer on every page', () => {
    renderLayout()
    expect(
      screen.getByText(
        /Decision support only\. Not legal, accounting, or lending advice\. All documents require attorney review\. Not affiliated with the SBA\./,
      ),
    ).toBeInTheDocument()
  })
})
