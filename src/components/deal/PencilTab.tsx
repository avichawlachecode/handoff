import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { formatMoney, formatSignedMoney } from '@/lib/format'
import {
  CLOSING_COSTS,
  DEFAULT_ASSUMPTIONS,
  dscrAtPrice,
  pencilCheck,
  WORKING_CAPITAL,
  type Assumptions,
  type DealInput,
} from '@/lib/calc'
import { DEMO_BUYER_LIQUID_CASH } from '@/lib/demoDeal'

const CHART_POINTS = 48

interface SliderConfig {
  key: keyof Assumptions
  label: string
  min: number
  max: number
  step: number
  display: (v: number) => string
}

const SLIDERS: SliderConfig[] = [
  { key: 'interestRate', label: 'Interest rate', min: 0.06, max: 0.16, step: 0.0025, display: (v) => `${(v * 100).toFixed(2)}%` },
  { key: 'termYears', label: 'Term', min: 5, max: 25, step: 1, display: (v) => `${v} yrs` },
  { key: 'buyerSalary', label: 'Buyer salary', min: 0, max: 300_000, step: 5_000, display: formatMoney },
  { key: 'annualCapex', label: 'Annual capex', min: 0, max: 200_000, step: 5_000, display: formatMoney },
  { key: 'requiredDscr', label: 'Required DSCR', min: 1, max: 2, step: 0.05, display: (v) => `${v.toFixed(2)}×` },
  { key: 'maxMultiple', label: 'Max multiple', min: 2, max: 5, step: 0.1, display: (v) => `${v.toFixed(1)}×` },
]

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-sm text-foreground">{label}</label>
        <span className="text-sm font-semibold tabular-nums text-foreground">{display(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-primary"
      />
    </div>
  )
}

function UsesSourcesRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={cn('flex justify-between py-1.5', bold && 'border-t font-semibold')}>
      <span className={cn('text-foreground/80', bold && 'text-foreground')}>{label}</span>
      <span className="tabular-nums text-foreground">{formatMoney(value)}</span>
    </div>
  )
}

export default function PencilTab({ dealId, deal }: { dealId: string; deal: DealInput }) {
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS)
  const [liquidCash, setLiquidCash] = useState<number>(DEMO_BUYER_LIQUID_CASH)

  const p = useMemo(() => pencilCheck(deal, assumptions, liquidCash), [deal, assumptions, liquidCash])
  const dscrAtAsk = useMemo(() => dscrAtPrice(deal, assumptions, deal.askingPrice), [deal, assumptions])

  const curve = useMemo(() => {
    const lo = Math.max(0, Math.min(p.pencilPrice, deal.askingPrice) * 0.6)
    const hi = Math.max(deal.askingPrice, p.pencilPrice) * 1.15
    const step = (hi - lo) / (CHART_POINTS - 1)
    return Array.from({ length: CHART_POINTS }, (_, i) => {
      const price = lo + step * i
      return { price, dscr: Number(dscrAtPrice(deal, assumptions, price).toFixed(3)) }
    })
  }, [deal, assumptions, p.pencilPrice])

  const setAssumption = (key: keyof Assumptions) => (v: number) =>
    setAssumptions((a) => ({ ...a, [key]: v }))

  const binds = p.bindingConstraint
  const thinCushion = p.residualLiquidity < 50_000

  return (
    <div className="space-y-8">
      {/* Block 1 — headline */}
      <div className="rounded-lg bg-primary px-6 py-5 text-primary-foreground">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Asking</p>
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">{formatMoney(p.askingPrice)}</p>
          </div>
          <div className="hidden text-2xl text-primary-foreground/50 sm:block">·</div>
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Pencils at</p>
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">{formatMoney(p.pencilPrice)}</p>
          </div>
          <div className="hidden text-2xl text-primary-foreground/50 sm:block">·</div>
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Gap</p>
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">{formatSignedMoney(-Math.abs(p.gap))}</p>
          </div>
        </div>
      </div>

      {/* Block 2 — the two constraints */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Why — lenders apply both constraints</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ConstraintCard
            title="Debt service constraint"
            detail={`At ${assumptions.requiredDscr.toFixed(2)}× DSCR the deal supports`}
            price={p.dscrMaxPrice}
            binding={binds === 'dscr'}
          />
          <ConstraintCard
            title="Multiple constraint"
            detail={`At ${assumptions.maxMultiple.toFixed(1)}× normalized SDE the deal supports`}
            price={p.multipleMaxPrice}
            binding={binds === 'multiple'}
          />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The <span className="font-medium text-foreground">{binds === 'multiple' ? 'multiple' : 'debt-service'}</span>{' '}
          constraint binds — the pencil price is the lower of the two.
        </p>
      </div>

      {/* Block 3 — sources & uses */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Sources &amp; uses at the pencil price</h2>
        <div className="grid grid-cols-1 gap-6 rounded-lg border p-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Uses</p>
            <UsesSourcesRow label="Purchase price" value={p.pencilPrice} />
            <UsesSourcesRow label="Working capital" value={WORKING_CAPITAL} />
            <UsesSourcesRow label="Closing costs & fees" value={CLOSING_COSTS} />
            <UsesSourcesRow label="Total project cost" value={p.totalProjectCost} bold />
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Sources</p>
            <UsesSourcesRow label="SBA 7(a) loan" value={p.sbaLoan} />
            <UsesSourcesRow label="Buyer cash injection" value={p.minBuyerCash} />
            <UsesSourcesRow label="Seller note (full standby)" value={p.maxSellerNoteCredit} />
            <UsesSourcesRow label="Total" value={p.totalProjectCost} bold />
          </div>
        </div>
      </div>

      {/* Block 4 — the cash reality */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">The cash reality</h2>
        <div className="space-y-2 rounded-lg border p-6">
          <CashRow label="Minimum equity injection (10% of project cost)" value={p.equityInjection} />
          <CashRow label="Max a full-standby seller note may cover (50%)" value={p.maxSellerNoteCredit} />
          <CashRow label="Minimum cash from you" value={p.minBuyerCash} strong />
          <div className="my-2 border-t" />
          <CashRow label="Lender-typical injection (20%)" value={p.lenderTypicalInjection} />
          <div className="flex items-center justify-between">
            <label className="text-sm text-foreground" htmlFor="liquidCash">
              Your stated liquidity
            </label>
            <span className="text-sm font-semibold tabular-nums text-foreground">{formatMoney(liquidCash)}</span>
          </div>
          <input
            id="liquidCash"
            type="range"
            min={0}
            max={1_000_000}
            step={10_000}
            value={liquidCash}
            aria-label="Your stated liquidity"
            onChange={(e) => setLiquidCash(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <CashRow label="Residual after a typical injection" value={p.residualLiquidity} strong />
          <div
            className={cn(
              'mt-3 rounded-md border p-3 text-sm',
              thinCushion
                ? 'border-verdict-amber/40 bg-verdict-amber/5 text-verdict-amber'
                : 'border-verdict-green/40 bg-verdict-green/5 text-verdict-green',
            )}
          >
            {thinCushion
              ? '⚠️ At a lender-typical injection this leaves almost no operating cushion. Most lenders will want to see reserves.'
              : 'This leaves an operating cushion after a lender-typical injection.'}
          </div>
        </div>
      </div>

      {/* Block 5 — DSCR sensitivity */}
      <div>
        <h2 className="mb-1 text-sm font-medium text-muted-foreground">DSCR vs. purchase price</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Threshold {assumptions.requiredDscr.toFixed(2)}×; the ask sits at {dscrAtAsk.toFixed(2)}×.
        </p>
        <div className="h-72 w-full rounded-lg border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="price"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}×`} domain={[0, 'auto']} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(2)}×`, 'DSCR']}
                labelFormatter={(v: number) => formatMoney(v)}
              />
              <ReferenceLine
                y={assumptions.requiredDscr}
                stroke="hsl(var(--verdict-red))"
                strokeDasharray="4 4"
                label={{ value: `${assumptions.requiredDscr.toFixed(2)}×`, position: 'right', fontSize: 11 }}
              />
              <Line type="monotone" dataKey="dscr" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <ReferenceDot x={deal.askingPrice} y={dscrAtAsk} r={5} fill="hsl(var(--verdict-red))" stroke="white" />
              <ReferenceDot x={p.pencilPrice} y={dscrAtPrice(deal, assumptions, p.pencilPrice)} r={5} fill="hsl(var(--verdict-green))" stroke="white" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="text-verdict-red">●</span> ask · <span className="text-verdict-green">●</span> pencil price
        </p>
      </div>

      {/* Block 6 — adjustable assumptions */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Adjustable assumptions — everything recalculates live</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-6 sm:grid-cols-2">
          {SLIDERS.map((s) => (
            <Slider
              key={s.key}
              label={s.label}
              value={assumptions[s.key]}
              min={s.min}
              max={s.max}
              step={s.step}
              display={s.display}
              onChange={setAssumption(s.key)}
            />
          ))}
        </div>
      </div>

      <div>
        <Link
          to={`/deals/${dealId}?tab=package`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Get the lender-ready package →
        </Link>
      </div>
    </div>
  )
}

function ConstraintCard({
  title,
  detail,
  price,
  binding,
}: {
  title: string
  detail: string
  price: number
  binding: boolean
}) {
  return (
    <div className={cn('rounded-lg border p-4', binding ? 'border-primary bg-primary/5' : 'bg-card')}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {binding && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            Binds
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatMoney(price)}</p>
    </div>
  )
}

function CashRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-sm', strong ? 'font-medium text-foreground' : 'text-foreground/80')}>{label}</span>
      <span className={cn('tabular-nums', strong ? 'text-base font-semibold text-foreground' : 'text-sm text-foreground')}>
        {formatMoney(value)}
      </span>
    </div>
  )
}
