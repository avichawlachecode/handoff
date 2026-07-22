import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ChecklistCheckbox({
  checked,
  disabled,
  onToggle,
  label,
}: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border disabled:opacity-50',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background',
      )}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  )
}
