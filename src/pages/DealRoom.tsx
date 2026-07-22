import { Link, useParams, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

/** Deal Room tabs (PRD §5). Content for each is built in later phases. */
const TABS = [
  { key: 'screen', label: 'Screener' },
  { key: 'normalize', label: 'Normalize' },
  { key: 'pencil', label: 'Pencil Check' },
  { key: 'gutcheck', label: 'Gut Check' },
  { key: 'package', label: 'Package' },
] as const

const DEFAULT_TAB = 'screen'

export default function DealRoom() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const activeTab = TABS.some((t) => t.key === requested) ? requested : DEFAULT_TAB
  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? ''

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Deal Room</h1>
        <p className="text-sm text-muted-foreground">
          Deal <span className="font-medium text-foreground">{id}</span>
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b" aria-label="Deal Room tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            to={`?tab=${tab.key}`}
            aria-current={activeTab === tab.key ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-primary',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-2">
        <h2 className="text-lg font-medium text-foreground">{activeLabel}</h2>
        <p className="text-sm text-muted-foreground">
          This tab is a scaffold stub — its feature is built in a later phase.
        </p>
        <p className="pt-4 text-xs uppercase tracking-wide text-muted-foreground/70">
          Scaffold stub · not yet built
        </p>
      </div>
    </section>
  )
}
