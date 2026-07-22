import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, formatSignedMoney } from '@/lib/format'
import {
  claimedSDE,
  normalizeAddBacks,
  normalizedSDE,
  redFlags,
  sdeDelta,
  type AddBackVerdict,
  type DealInput,
  type FlagSeverity,
} from '@/lib/calc'

interface LedgerRow {
  id: string
  description: string
  amount: number
  verdict: AddBackVerdict
  rationale: string
  lenderNote: string
}

function buildLedger(deal: DealInput): LedgerRow[] {
  const rows: LedgerRow[] = normalizeAddBacks(deal).map((r, i) => ({
    id: `ab-${i}`,
    description: r.description,
    amount: r.amount,
    verdict: r.verdict,
    rationale: r.rationale,
    lenderNote: r.lenderNote,
  }))

  // The non-recurring adjustment ($117k in the demo) is not an add-back row; it
  // shows in the ledger as a disallowed line so the delta ties out (PRD §6.5).
  if (deal.nonRecurringAdjustment > 0) {
    rows.push({
      id: 'non-recurring',
      description: 'Non-recurring adjustment (excluded from run-rate)',
      amount: deal.nonRecurringAdjustment,
      verdict: 'Disallowed',
      rationale: 'Non-repeatable — excluded from the run-rate earnings a lender underwrites.',
      lenderNote:
        'A lender will ask for the one-off job or event that produced this margin and confirm it will not repeat.',
    })
  }
  return rows
}

const DOT: Record<FlagSeverity, string> = {
  red: 'bg-verdict-red',
  amber: 'bg-verdict-amber',
}

export default function NormalizeTab({ dealId, deal }: { dealId: string; deal: DealInput }) {
  const claimed = claimedSDE(deal)
  const normalized = normalizedSDE(deal)
  const delta = sdeDelta(deal)
  const ledger = buildLedger(deal)
  const flags = redFlags(deal)
  const totalRemoved = ledger
    .filter((r) => r.verdict === 'Disallowed')
    .reduce((sum, r) => sum + r.amount, 0)

  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <div className="space-y-8">
      {/* Claimed vs normalized */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Seller-claimed SDE</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{formatMoney(claimed)}</p>
          </div>
          <ArrowRight className="hidden h-6 w-6 shrink-0 text-muted-foreground sm:block" aria-hidden />
          <div>
            <p className="text-sm text-muted-foreground">Bank-normalized SDE</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">{formatMoney(normalized)}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-verdict-red">{formatSignedMoney(delta)}</p>
          </div>
        </div>
      </div>

      {/* Add-back ledger */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Add-back ledger</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="w-8 py-2 pl-3" />
                <th className="py-2 pr-3 font-medium">Add-back</th>
                <th className="py-2 pr-3 text-right font-medium">Amount</th>
                <th className="py-2 pr-3 font-medium">Verdict</th>
                <th className="py-2 pr-3 font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => {
                const isOpen = expanded.has(row.id)
                const allowed = row.verdict === 'Allowed'
                return (
                  <Fragment key={row.id}>
                    <tr className="border-b last:border-b-0 align-top">
                      <td className="py-3 pl-3">
                        <button
                          type="button"
                          onClick={() => toggle(row.id)}
                          aria-expanded={isOpen}
                          aria-label={`Toggle lender note for ${row.description}`}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="py-3 pr-3 text-foreground">{row.description}</td>
                      <td className="py-3 pr-3 text-right tabular-nums text-foreground">{formatMoney(row.amount)}</td>
                      <td className="py-3 pr-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            allowed
                              ? 'bg-verdict-green/10 text-verdict-green'
                              : 'bg-verdict-red/10 text-verdict-red',
                          )}
                        >
                          {allowed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {row.verdict}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">{row.rationale}</td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b last:border-b-0 bg-secondary/30">
                        <td />
                        <td colSpan={4} className="py-3 pr-3 text-sm text-foreground/80">
                          <span className="font-medium text-foreground">What a lender will ask for: </span>
                          {row.lenderNote}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-secondary/50">
                <td />
                <td className="py-3 pr-3 font-medium text-foreground">Total removed</td>
                <td className="py-3 pr-3 text-right font-semibold tabular-nums text-verdict-red">
                  {formatSignedMoney(-totalRemoved)}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Red flags */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Red flags</h2>
        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No red flags fired.</p>
        ) : (
          <ul className="space-y-2">
            {flags.map((flag) => (
              <li key={flag.id} className="flex gap-3 rounded-md border p-3">
                <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', DOT[flag.severity])} aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">{flag.label}</p>
                  <p className="text-sm text-foreground/90">{flag.detail}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Rule: {flag.rule}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <Link
          to={`/deals/${dealId}?tab=pencil`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          See what this pencils at →
        </Link>
      </div>
    </div>
  )
}
