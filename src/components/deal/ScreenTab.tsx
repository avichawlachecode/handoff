import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  redFlagCounts,
  SCREENER_VERDICT_RULE,
  screenerTiles,
  screenerVerdict,
  type DealInput,
  type ScreenerVerdict,
  type TileStatus,
} from '@/lib/calc'

const VERDICT_COPY: Record<ScreenerVerdict, { tagline: string; classes: string }> = {
  RED: { tagline: 'likely a 10-minute NO', classes: 'border-verdict-red/30 bg-verdict-red/10 text-verdict-red' },
  AMBER: {
    tagline: 'proceed only if these resolve',
    classes: 'border-verdict-amber/30 bg-verdict-amber/10 text-verdict-amber',
  },
  GREEN: {
    tagline: 'worth real diligence',
    classes: 'border-verdict-green/30 bg-verdict-green/10 text-verdict-green',
  },
}

const TILE_CLASSES: Record<TileStatus, string> = {
  green: 'border-verdict-green/30 bg-verdict-green/5',
  amber: 'border-verdict-amber/30 bg-verdict-amber/5',
  red: 'border-verdict-red/30 bg-verdict-red/5',
}
const DOT_CLASSES: Record<TileStatus, string> = {
  green: 'bg-verdict-green',
  amber: 'bg-verdict-amber',
  red: 'bg-verdict-red',
}
const TEXT_CLASSES: Record<TileStatus, string> = {
  green: 'text-verdict-green',
  amber: 'text-verdict-amber',
  red: 'text-verdict-red',
}

export default function ScreenTab({ dealId, deal }: { dealId: string; deal: DealInput }) {
  const verdict = screenerVerdict(deal)
  const { red, amber } = redFlagCounts(deal)
  const tiles = screenerTiles(deal)
  const copy = VERDICT_COPY[verdict]
  const total = red + amber

  return (
    <div className="space-y-6">
      {/* Verdict banner */}
      <div className={cn('rounded-lg border p-6', copy.classes)}>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-bold tracking-tight">{verdict}</span>
          <span className="text-sm font-medium">— {copy.tagline}</span>
        </div>
        <p className="mt-2 text-sm text-foreground/80">
          {total === 0 ? 'No flags fired.' : `${red} red · ${amber} amber ${total === 1 ? 'flag' : 'flags'} fired.`}{' '}
          <span className="text-muted-foreground">Rule: {SCREENER_VERDICT_RULE}.</span>
        </p>
      </div>

      {/* Heat map */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Eight diligence signals</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((tile) => (
            <div key={tile.id} className={cn('rounded-lg border p-4', TILE_CLASSES[tile.status])}>
              <div className="flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', DOT_CLASSES[tile.status])} />
                <h3 className="text-sm font-semibold text-foreground">{tile.label}</h3>
              </div>
              <p className="mt-2 text-sm text-foreground/90">{tile.detail}</p>
              <p className={cn('mt-2 text-xs font-semibold uppercase tracking-wide', TEXT_CLASSES[tile.status])}>
                {tile.status}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{tile.rule}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Link
          to={`/deals/${dealId}?tab=normalize`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Continue to Financial Normalizer →
        </Link>
      </div>
    </div>
  )
}
