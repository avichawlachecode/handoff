import { Link, NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/deals', label: 'Deals' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/starter', label: 'Starter' },
]

/** Persistent footer disclaimer — required on every page (CLAUDE.md / PRD §11). */
const DISCLAIMER =
  'Decision support only. Not legal, accounting, or lending advice. All documents require attorney review. Not affiliated with the SBA.'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-primary">
            Handoff
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t bg-secondary">
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <p className="text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </footer>
    </div>
  )
}
