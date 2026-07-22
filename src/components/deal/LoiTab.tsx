import { cn } from '@/lib/utils'
import ChecklistCheckbox from './ChecklistCheckbox'
import { useChecklist } from './useChecklist'

const CLAUSES = [
  {
    key: 'exclusivity',
    title: 'Exclusivity (no-shop)',
    risk: 'Without it, the seller keeps shopping your price and can walk the moment a higher bid appears — after you’ve paid for diligence.',
  },
  {
    key: 'contingencies',
    title: 'Contingencies (financing, diligence, lease)',
    risk: 'Without them, you’re obligated to close even if the SBA loan falls through or diligence surfaces a problem — and can forfeit your deposit.',
  },
  {
    key: 'working-capital',
    title: 'Working-capital target',
    risk: 'Without a working-capital peg, the seller can strip cash and receivables before close, leaving you to fund payroll and payables from day one.',
  },
  {
    key: 'key-employee-retention',
    title: 'Key-employee retention',
    risk: 'Without retention and non-compete commitments, the people who actually run the business can leave — and the earnings you underwrote walk out with them.',
  },
  {
    key: 'landlord-consent',
    title: 'Landlord consent to assignment',
    risk: 'Without securing lease assignment early, the landlord can block the transfer or renegotiate terms at the finish line, delaying or killing the close.',
  },
  {
    key: 'sba-seller-note-standby',
    title: 'SBA seller-note full standby',
    risk: 'Without full-standby language, the seller note may not count toward your equity injection and the SBA structure you modeled won’t qualify.',
  },
]

export default function LoiTab({ dealId }: { dealId: string }) {
  const { checked, loaded, error, toggle } = useChecklist(dealId, 'loi')
  const doneCount = CLAUSES.filter((c) => checked[c.key]).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Make sure your LOI carries the protections that keep a first-time buyer out of trouble. Each
          clause prevents a specific failure mode — check it off once your draft includes it.
        </p>
        <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
          {doneCount}/{CLAUSES.length}
        </span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <ul className="space-y-3">
        {CLAUSES.map((clause) => {
          const isChecked = !!checked[clause.key]
          return (
            <li key={clause.key} className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <ChecklistCheckbox
                  checked={isChecked}
                  disabled={!loaded}
                  onToggle={() => toggle(clause.key)}
                  label={clause.title}
                />
                <div>
                  <p className={cn('text-sm font-medium', isChecked ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {clause.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Without it: </span>
                    {clause.risk}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
