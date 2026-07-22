import { cn } from '@/lib/utils'
import ChecklistCheckbox from './ChecklistCheckbox'
import { useChecklist } from './useChecklist'

type Owner = 'buyer' | 'lender' | 'attorney' | 'seller' | 'landlord'

interface Task {
  key: string
  task: string
  owner: Owner
  day: number
}

// Sequenced by target day (PRD §4 stretch #11).
const TASKS: Task[] = [
  { key: 'loi-executed', task: 'Signed LOI executed', owner: 'buyer', day: 0 },
  { key: 'engage-attorney', task: 'Engage transaction attorney', owner: 'buyer', day: 2 },
  { key: 'sba-application', task: 'Open SBA 7(a) loan application', owner: 'lender', day: 3 },
  { key: 'diligence-list', task: 'Diligence request list sent', owner: 'attorney', day: 5 },
  { key: 'verify-financials', task: 'Financials & tax returns verified', owner: 'buyer', day: 14 },
  { key: 'lease-consent-request', task: 'Lease assignment / landlord consent requested', owner: 'attorney', day: 14 },
  { key: 'purchase-agreement', task: 'Purchase agreement drafted', owner: 'attorney', day: 21 },
  { key: 'sba-credit-approval', task: 'SBA credit approval', owner: 'lender', day: 30 },
  { key: 'key-employee-agreements', task: 'Key-employee agreements signed', owner: 'seller', day: 35 },
  { key: 'working-capital-peg', task: 'Working-capital peg finalized', owner: 'buyer', day: 40 },
  { key: 'landlord-consent-executed', task: 'Landlord consent executed', owner: 'landlord', day: 45 },
  { key: 'closing-funding', task: 'Closing / funding', owner: 'lender', day: 60 },
]

export default function ClosingTab({ dealId }: { dealId: string }) {
  const { checked, loaded, error, toggle } = useChecklist(dealId, 'closing')
  const doneCount = TASKS.filter((t) => checked[t.key]).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-2xl text-sm text-muted-foreground">
          A sequenced path from signed LOI to funding. Owners and target days keep everyone moving — check
          tasks off as they land.
        </p>
        <span className="shrink-0 text-sm font-medium tabular-nums text-muted-foreground">
          {doneCount}/{TASKS.length}
        </span>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-8 py-2 pl-3" />
              <th className="py-2 pr-3 font-medium">Task</th>
              <th className="py-2 pr-3 font-medium">Owner</th>
              <th className="py-2 pr-3 text-right font-medium">Target day</th>
            </tr>
          </thead>
          <tbody>
            {TASKS.map((t) => {
              const isChecked = !!checked[t.key]
              return (
                <tr key={t.key} className="border-b last:border-b-0">
                  <td className="py-3 pl-3">
                    <ChecklistCheckbox
                      checked={isChecked}
                      disabled={!loaded}
                      onToggle={() => toggle(t.key)}
                      label={t.task}
                    />
                  </td>
                  <td className={cn('py-3 pr-3', isChecked ? 'text-muted-foreground line-through' : 'text-foreground')}>
                    {t.task}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-foreground">
                      {t.owner}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums text-muted-foreground">Day {t.day}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
