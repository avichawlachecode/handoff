import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface Stage {
  key: string
  label: string
  /** Deal Room tab this stage links to, when built. */
  tab?: string
  /** Non-tab link (Source points back to the pipeline). */
  href?: string
  built: boolean
  /** Roadmap tooltip for unbuilt (v2) stages. */
  roadmap?: string
}

const STAGES: Stage[] = [
  { key: 'source', label: 'Source', built: true, href: '/deals' },
  { key: 'screen', label: 'Screen', built: true, tab: 'screen' },
  { key: 'normalize', label: 'Normalize', built: true, tab: 'normalize' },
  { key: 'pencil', label: 'Pencil', built: true, tab: 'pencil' },
  { key: 'verify', label: 'Verify', built: true, tab: 'verify' },
  {
    key: 'loi',
    label: 'LOI',
    built: false,
    roadmap: 'LOI protection pack — buyer-protective clauses in plain English. On the v2 roadmap.',
  },
  {
    key: 'close',
    label: 'Close',
    built: false,
    roadmap: 'Managed closing checklist — stakeholder sequencing and timeline. On the v2 roadmap.',
  },
]

// The five Deal Room tabs collapse onto the seven journey stages.
const TAB_TO_STAGE: Record<string, string> = {
  screen: 'screen',
  normalize: 'normalize',
  pencil: 'pencil',
  gutcheck: 'pencil',
  verify: 'verify',
  package: 'pencil',
}

export default function DealJourney({ dealId, activeTab }: { dealId: string; activeTab: string }) {
  const currentKey = TAB_TO_STAGE[activeTab] ?? 'screen'

  return (
    <nav aria-label="Deal journey" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1">
        {STAGES.map((stage, i) => {
          const isCurrent = stage.built && stage.key === currentKey
          const stepCircle = (
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums',
                isCurrent
                  ? 'border-primary-foreground/50'
                  : stage.built
                    ? 'border-primary/40 text-muted-foreground'
                    : 'border-muted-foreground/30 text-muted-foreground/60',
              )}
            >
              {i + 1}
            </span>
          )
          const inner = (
            <>
              {stepCircle}
              <span>{stage.label}</span>
              {!stage.built && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  v2
                </span>
              )}
            </>
          )
          const base = 'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-sm'

          return (
            <li key={stage.key} className="flex items-center">
              {stage.built ? (
                <Link
                  to={stage.tab ? `/deals/${dealId}?tab=${stage.tab}` : (stage.href ?? '/deals')}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    base,
                    isCurrent
                      ? 'bg-primary font-semibold text-primary-foreground'
                      : 'text-foreground hover:bg-secondary',
                  )}
                >
                  {inner}
                </Link>
              ) : (
                <span
                  title={stage.roadmap}
                  aria-disabled="true"
                  className={cn(base, 'cursor-default text-muted-foreground/60')}
                >
                  {inner}
                </span>
              )}

              {i < STAGES.length - 1 && <span className="mx-1 h-px w-5 shrink-0 bg-border" aria-hidden />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
