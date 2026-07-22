import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { gutCheckReport, type DealInput, type GutCheckVerdict } from '@/lib/calc'

const VERDICT_STYLE: Record<GutCheckVerdict, { classes: string; tagline: string; triggersLabel: string }> = {
  KILL: {
    classes: 'border-verdict-red/30 bg-verdict-red/10 text-verdict-red',
    tagline: 'walk away unless these resolve',
    triggersLabel: 'Kill triggers that fired',
  },
  'PROCEED WITH CONDITIONS': {
    classes: 'border-verdict-amber/30 bg-verdict-amber/10 text-verdict-amber',
    tagline: 'proceed only if these resolve',
    triggersLabel: 'Conditions to resolve first',
  },
  GREENLIGHT: {
    classes: 'border-verdict-green/30 bg-verdict-green/10 text-verdict-green',
    tagline: 'worth pursuing',
    triggersLabel: 'Watch items',
  },
}

export default function GutCheckTab({ dealId, deal }: { dealId: string; deal: DealInput }) {
  const report = gutCheckReport(deal)
  const style = VERDICT_STYLE[report.verdict]

  return (
    <div className="space-y-8">
      {/* Verdict */}
      <div className={cn('rounded-lg border p-6', style.classes)}>
        <p className="text-2xl font-bold tracking-tight">{report.verdict}</p>
        <p className="mt-1 text-sm font-medium">— {style.tagline}</p>
      </div>

      {/* Kill triggers */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">{style.triggersLabel}</h2>
        {report.killTriggers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocking triggers fired.</p>
        ) : (
          <ul className="space-y-2">
            {report.killTriggers.map((t, i) => (
              <li key={i} className="flex gap-3 rounded-md border p-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-verdict-red" aria-hidden />
                <p className="text-sm text-foreground">{t}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* What would have to be true */}
      {report.whatWouldFlip.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">What would have to be true</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
            {report.whatWouldFlip.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Questions for the seller */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">What to ask the seller next</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground">
          {report.questionsForSeller.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </section>

      {/* Positioning */}
      <p className="rounded-md border-l-2 border-primary bg-secondary px-4 py-3 text-sm font-medium text-foreground">
        We get paid whether or not you buy. Your broker doesn&apos;t.
      </p>

      <div>
        <Link
          to={`/deals/${dealId}?tab=package`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          See the lender-ready package →
        </Link>
      </div>
    </div>
  )
}
