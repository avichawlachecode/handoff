import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { loadDeal, type LoadedDeal } from '@/lib/deals'
import ScreenTab from '@/components/deal/ScreenTab'
import NormalizeTab from '@/components/deal/NormalizeTab'
import PencilTab from '@/components/deal/PencilTab'
import GutCheckTab from '@/components/deal/GutCheckTab'
import PackageTab from '@/components/deal/PackageTab'

/** Deal Room tabs (PRD §5). Only Screen is built so far; the rest are stubs. */
const TABS = [
  { key: 'screen', label: 'Screener' },
  { key: 'normalize', label: 'Normalize' },
  { key: 'pencil', label: 'Pencil Check' },
  { key: 'gutcheck', label: 'Gut Check' },
  { key: 'package', label: 'Package' },
] as const

const DEFAULT_TAB = 'screen'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; deal: LoadedDeal | null }

export default function DealRoom() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const activeTab = TABS.some((t) => t.key === requested) ? (requested as string) : DEFAULT_TAB

  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!id) return
    let active = true
    setState({ status: 'loading' })
    loadDeal(id)
      .then((deal) => active && setState({ status: 'ready', deal }))
      .catch(
        (err) =>
          active &&
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load the deal.',
          }),
      )
    return () => {
      active = false
    }
  }, [id])

  const title = state.status === 'ready' && state.deal ? state.deal.businessName : 'Deal Room'

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">Deal {id}</p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b" aria-label="Deal Room tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            to={`/deals/${id}?tab=${tab.key}`}
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

      {state.status === 'loading' && <p className="text-sm text-muted-foreground">Loading deal…</p>}

      {state.status === 'error' && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {state.status === 'ready' && !state.deal && (
        <p className="text-sm text-muted-foreground">
          Deal not found — it may not exist or you may not have access.
        </p>
      )}

      {state.status === 'ready' && state.deal && (
        <>
          {activeTab === 'screen' ? (
            <ScreenTab dealId={state.deal.id} deal={state.deal.input} />
          ) : activeTab === 'normalize' ? (
            <NormalizeTab dealId={state.deal.id} deal={state.deal.input} />
          ) : activeTab === 'pencil' ? (
            <PencilTab dealId={state.deal.id} deal={state.deal.input} />
          ) : activeTab === 'gutcheck' ? (
            <GutCheckTab dealId={state.deal.id} deal={state.deal.input} />
          ) : (
            <PackageTab dealId={state.deal.id} />
          )}
        </>
      )}
    </section>
  )
}
