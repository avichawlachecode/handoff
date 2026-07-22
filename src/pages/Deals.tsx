import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatMoney } from '@/lib/format'
import { logEvent } from '@/lib/events'
import { listDeals, loadDemoDeal, type DealSummary } from '@/lib/deals'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; deals: DealSummary[] }

export default function Deals() {
  const navigate = useNavigate()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listDeals()
      .then((deals) => active && setState({ status: 'ready', deals }))
      .catch(
        (err) =>
          active &&
          setState({ status: 'error', message: err instanceof Error ? err.message : 'Could not load deals.' }),
      )
    return () => {
      active = false
    }
  }, [])

  async function loadDemo() {
    void logEvent('cta_load_demo', { source: 'deals' })
    setDemoLoading(true)
    setDemoError(null)
    try {
      const id = await loadDemoDeal()
      navigate(`/deals/${id}?tab=screen`)
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Could not load the demo deal.')
      setDemoLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Deals</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadDemo}
            disabled={demoLoading}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
          >
            {demoLoading ? 'Loading…' : 'Load demo deal'}
          </button>
          <Link
            to="/deals/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add deal
          </Link>
        </div>
      </div>

      {demoError && <p className="text-sm text-destructive">{demoError}</p>}

      {state.status === 'loading' && <p className="text-sm text-muted-foreground">Loading deals…</p>}

      {state.status === 'error' && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {state.status === 'ready' && state.deals.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No deals yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Load the demo deal to see the full analysis, or add your own.
          </p>
        </div>
      )}

      {state.status === 'ready' && state.deals.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Business</th>
                <th className="px-4 py-2 text-right font-medium">Asking</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {state.deals.map((d) => (
                <tr key={d.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 text-foreground">{d.businessName}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatMoney(d.askingPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/deals/${d.id}?tab=screen`} className="font-medium text-primary hover:underline">
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
