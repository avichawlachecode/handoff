import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AddBackCategory, DealInput, ReasonForSale } from '@/lib/calc'
import { demoDeal } from '@/lib/demoDeal'
import { saveScreenerDeal } from '@/lib/deals'

const REASONS: { value: ReasonForSale; label: string }[] = [
  { value: 'retiring', label: 'Retiring' },
  { value: 'health', label: 'Health' },
  { value: 'relocating', label: 'Relocating' },
  { value: 'other venture', label: 'Other venture' },
  { value: 'declining', label: 'Declining' },
  { value: 'undisclosed', label: 'Undisclosed' },
]

const CATEGORIES: AddBackCategory[] = [
  'Personal expense',
  'One-time event',
  'Non-operating',
  'Owner perk',
  'Growth investment',
  'Other',
]

interface AddBackRow {
  key: string
  description: string
  amount: string
  category: AddBackCategory
}

interface FormState {
  businessName: string
  industry: string
  location: string
  askingPrice: string
  revenueTtm: string
  yearsInBusiness: string
  reasonForSale: ReasonForSale | ''
  reportedNetIncome: string
  ownerComp: string
  interestExpense: string
  depreciationAmort: string
  nonRecurringAdjustment: string
  topCustomerPct: string
  top5CustomerPct: string
  claimedContracts: string
  verifiedContracts: string
  largestYoyChangePct: string
}

const EMPTY_FORM: FormState = {
  businessName: '',
  industry: '',
  location: '',
  askingPrice: '',
  revenueTtm: '',
  yearsInBusiness: '',
  reasonForSale: '',
  reportedNetIncome: '',
  ownerComp: '',
  interestExpense: '',
  depreciationAmort: '',
  nonRecurringAdjustment: '',
  topCustomerPct: '',
  top5CustomerPct: '',
  claimedContracts: '',
  verifiedContracts: '',
  largestYoyChangePct: '',
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

const newRow = (): AddBackRow => ({ key: uid(), description: '', amount: '', category: 'Other' })

const isNumeric = (v: string) => v.trim() !== '' && Number.isFinite(Number(v))
const toNum = (v: string) => (v.trim() === '' ? 0 : Number(v))

// The numeric fields that must be present and parseable (PRD §6.3 acceptance).
const REQUIRED_NUMERIC: (keyof FormState)[] = [
  'askingPrice',
  'revenueTtm',
  'yearsInBusiness',
  'reportedNetIncome',
  'ownerComp',
  'interestExpense',
  'depreciationAmort',
  'topCustomerPct',
  'top5CustomerPct',
  'claimedContracts',
  'verifiedContracts',
  'largestYoyChangePct',
]

function validate(form: FormState, rows: AddBackRow[]): Record<string, string> {
  const errors: Record<string, string> = {}
  if (form.businessName.trim() === '') errors.businessName = 'Required.'
  if (form.reasonForSale === '') errors.reasonForSale = 'Select a reason.'
  for (const field of REQUIRED_NUMERIC) {
    if (!isNumeric(form[field])) errors[field] = 'Enter a number.'
  }
  if (form.nonRecurringAdjustment.trim() !== '' && !isNumeric(form.nonRecurringAdjustment)) {
    errors.nonRecurringAdjustment = 'Enter a number.'
  }
  for (const row of rows) {
    const touched = row.description.trim() !== '' || row.amount.trim() !== ''
    if (!touched) continue
    if (row.description.trim() === '') errors[`ab_desc_${row.key}`] = 'Describe the add-back.'
    if (!isNumeric(row.amount)) errors[`ab_amt_${row.key}`] = 'Enter an amount.'
  }
  return errors
}

function toDealInput(form: FormState, rows: AddBackRow[]): DealInput {
  return {
    businessName: form.businessName.trim(),
    industry: form.industry.trim(),
    location: form.location.trim(),
    askingPrice: toNum(form.askingPrice),
    revenueTtm: toNum(form.revenueTtm),
    yearsInBusiness: toNum(form.yearsInBusiness),
    reasonForSale: (form.reasonForSale || 'undisclosed') as ReasonForSale,
    reportedNetIncome: toNum(form.reportedNetIncome),
    ownerComp: toNum(form.ownerComp),
    interestExpense: toNum(form.interestExpense),
    depreciationAmort: toNum(form.depreciationAmort),
    addBacks: rows
      .filter((r) => r.description.trim() !== '' || r.amount.trim() !== '')
      .map((r) => ({ description: r.description.trim(), amount: toNum(r.amount), category: r.category })),
    nonRecurringAdjustment: toNum(form.nonRecurringAdjustment),
    topCustomerPct: toNum(form.topCustomerPct),
    top5CustomerPct: toNum(form.top5CustomerPct),
    claimedContracts: toNum(form.claimedContracts),
    verifiedContracts: toNum(form.verifiedContracts),
    largestYoyChangePct: toNum(form.largestYoyChangePct),
  }
}

// --- small presentational helpers -------------------------------------------

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'

function FormCard({
  letter,
  title,
  description,
  children,
}: {
  letter: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">
          <span className="text-muted-foreground">{letter} · </span>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function TextInput({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      className={cn(inputCls, invalid && 'border-destructive focus:ring-destructive', className)}
    />
  )
}

function AmountInput({
  prefix,
  suffix,
  invalid,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { prefix?: string; suffix?: string; invalid?: boolean }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {prefix}
        </span>
      )}
      <input
        inputMode="decimal"
        {...rest}
        className={cn(
          inputCls,
          'text-right tabular-nums',
          prefix && 'pl-7',
          suffix && 'pr-8',
          invalid && 'border-destructive focus:ring-destructive',
          className,
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  )
}

function SelectInput({ invalid, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...rest}
      className={cn(inputCls, invalid && 'border-destructive focus:ring-destructive', className)}
    />
  )
}

// --- page -------------------------------------------------------------------

export default function NewDeal() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [rows, setRows] = useState<AddBackRow[]>([newRow()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const updateRow = (key: string, patch: Partial<AddBackRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const addRow = () => setRows((rs) => [...rs, newRow()])
  const removeRow = (key: string) =>
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs))

  function loadDemo() {
    setForm({
      businessName: demoDeal.businessName,
      industry: demoDeal.industry,
      location: demoDeal.location,
      askingPrice: String(demoDeal.askingPrice),
      revenueTtm: String(demoDeal.revenueTtm),
      yearsInBusiness: String(demoDeal.yearsInBusiness),
      reasonForSale: demoDeal.reasonForSale,
      reportedNetIncome: String(demoDeal.reportedNetIncome),
      ownerComp: String(demoDeal.ownerComp),
      interestExpense: String(demoDeal.interestExpense),
      depreciationAmort: String(demoDeal.depreciationAmort),
      nonRecurringAdjustment: String(demoDeal.nonRecurringAdjustment),
      topCustomerPct: String(demoDeal.topCustomerPct),
      top5CustomerPct: String(demoDeal.top5CustomerPct),
      claimedContracts: String(demoDeal.claimedContracts),
      verifiedContracts: String(demoDeal.verifiedContracts),
      largestYoyChangePct: String(demoDeal.largestYoyChangePct),
    })
    setRows(
      demoDeal.addBacks.map((ab) => ({
        key: uid(),
        description: ab.description,
        amount: String(ab.amount),
        category: ab.category,
      })),
    )
    setErrors({})
    setSubmitError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate(form, rows)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const dealId = await saveScreenerDeal(toDealInput(form, rows))
      navigate(`/deals/${dealId}?tab=screen`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong saving the deal.')
      setSubmitting(false)
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            10-Minute NO Screener
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Enter what the seller gave you. We normalize it and tell you fast whether this deal is
            worth real diligence — in under ten minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDemo}
          className="inline-flex shrink-0 items-center justify-center rounded-md border border-primary bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-secondary"
        >
          Load demo deal
        </button>
      </div>

      <FormCard letter="A" title="The listing">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Business name" htmlFor="businessName" error={errors.businessName} className="sm:col-span-2">
            <TextInput
              id="businessName"
              value={form.businessName}
              onChange={set('businessName')}
              invalid={!!errors.businessName}
              placeholder="Keystone Air & Heat"
            />
          </Field>
          <Field label="Industry" htmlFor="industry">
            <TextInput id="industry" value={form.industry} onChange={set('industry')} placeholder="HVAC" />
          </Field>
          <Field label="Location" htmlFor="location">
            <TextInput id="location" value={form.location} onChange={set('location')} placeholder="Bucks County, PA" />
          </Field>
          <Field label="Asking price" htmlFor="askingPrice" error={errors.askingPrice}>
            <AmountInput id="askingPrice" prefix="$" value={form.askingPrice} onChange={set('askingPrice')} invalid={!!errors.askingPrice} placeholder="1,950,000" />
          </Field>
          <Field label="Revenue (TTM)" htmlFor="revenueTtm" error={errors.revenueTtm}>
            <AmountInput id="revenueTtm" prefix="$" value={form.revenueTtm} onChange={set('revenueTtm')} invalid={!!errors.revenueTtm} placeholder="2,400,000" />
          </Field>
          <Field label="Years in business" htmlFor="yearsInBusiness" error={errors.yearsInBusiness}>
            <AmountInput id="yearsInBusiness" inputMode="numeric" value={form.yearsInBusiness} onChange={set('yearsInBusiness')} invalid={!!errors.yearsInBusiness} placeholder="18" />
          </Field>
          <Field label="Reason for sale" htmlFor="reasonForSale" error={errors.reasonForSale}>
            <SelectInput id="reasonForSale" value={form.reasonForSale} onChange={set('reasonForSale')} invalid={!!errors.reasonForSale}>
              <option value="" disabled>
                Select…
              </option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </FormCard>

      <FormCard letter="B" title="Reported earnings" description="Straight off the seller's P&L or tax return.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Reported net income" htmlFor="reportedNetIncome" error={errors.reportedNetIncome}>
            <AmountInput id="reportedNetIncome" prefix="$" value={form.reportedNetIncome} onChange={set('reportedNetIncome')} invalid={!!errors.reportedNetIncome} placeholder="205,000" />
          </Field>
          <Field label="Owner compensation" htmlFor="ownerComp" error={errors.ownerComp}>
            <AmountInput id="ownerComp" prefix="$" value={form.ownerComp} onChange={set('ownerComp')} invalid={!!errors.ownerComp} placeholder="180,000" />
          </Field>
          <Field label="Interest expense" htmlFor="interestExpense" error={errors.interestExpense}>
            <AmountInput id="interestExpense" prefix="$" value={form.interestExpense} onChange={set('interestExpense')} invalid={!!errors.interestExpense} placeholder="22,000" />
          </Field>
          <Field label="Depreciation & amortization" htmlFor="depreciationAmort" error={errors.depreciationAmort}>
            <AmountInput id="depreciationAmort" prefix="$" value={form.depreciationAmort} onChange={set('depreciationAmort')} invalid={!!errors.depreciationAmort} placeholder="95,000" />
          </Field>
          <Field
            label="Non-recurring adjustment (optional)"
            htmlFor="nonRecurringAdjustment"
            error={errors.nonRecurringAdjustment}
            hint="One-off item excluded from run-rate (e.g. a new-construction job margin). Not an add-back."
            className="sm:col-span-2"
          >
            <AmountInput id="nonRecurringAdjustment" prefix="$" value={form.nonRecurringAdjustment} onChange={set('nonRecurringAdjustment')} invalid={!!errors.nonRecurringAdjustment} placeholder="0" />
          </Field>
        </div>
      </FormCard>

      <FormCard
        letter="C"
        title="Add-backs"
        description="What the seller wants added back to earnings. One row each — we'll rule on every one."
      >
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_11rem_auto] sm:items-start">
              <div className="space-y-1.5">
                <TextInput
                  aria-label="Add-back description"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                  invalid={!!errors[`ab_desc_${row.key}`]}
                  placeholder="Owner's personal vehicle & travel"
                />
                {errors[`ab_desc_${row.key}`] && (
                  <p className="text-xs text-destructive">{errors[`ab_desc_${row.key}`]}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <AmountInput
                  aria-label="Add-back amount"
                  prefix="$"
                  value={row.amount}
                  onChange={(e) => updateRow(row.key, { amount: e.target.value })}
                  invalid={!!errors[`ab_amt_${row.key}`]}
                  placeholder="30,000"
                />
                {errors[`ab_amt_${row.key}`] && (
                  <p className="text-xs text-destructive">{errors[`ab_amt_${row.key}`]}</p>
                )}
              </div>
              <SelectInput
                aria-label="Add-back category"
                value={row.category}
                onChange={(e) => updateRow(row.key, { category: e.target.value as AddBackCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
              <button
                type="button"
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1}
                aria-label="Remove add-back"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          <Plus className="h-4 w-4" /> Add another
        </button>
      </FormCard>

      <FormCard letter="D" title="Concentration & recurring revenue">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Top customer (% of revenue)" htmlFor="topCustomerPct" error={errors.topCustomerPct}>
            <AmountInput id="topCustomerPct" suffix="%" value={form.topCustomerPct} onChange={set('topCustomerPct')} invalid={!!errors.topCustomerPct} placeholder="24" />
          </Field>
          <Field label="Top 5 customers (% of revenue)" htmlFor="top5CustomerPct" error={errors.top5CustomerPct}>
            <AmountInput id="top5CustomerPct" suffix="%" value={form.top5CustomerPct} onChange={set('top5CustomerPct')} invalid={!!errors.top5CustomerPct} placeholder="51" />
          </Field>
          <Field label="Seller-claimed recurring contracts" htmlFor="claimedContracts" error={errors.claimedContracts}>
            <AmountInput id="claimedContracts" inputMode="numeric" value={form.claimedContracts} onChange={set('claimedContracts')} invalid={!!errors.claimedContracts} placeholder="1,100" />
          </Field>
          <Field label="Contracts actually provided" htmlFor="verifiedContracts" error={errors.verifiedContracts}>
            <AmountInput id="verifiedContracts" inputMode="numeric" value={form.verifiedContracts} onChange={set('verifiedContracts')} invalid={!!errors.verifiedContracts} placeholder="640" />
          </Field>
          <Field label="Largest single-year revenue change (%)" htmlFor="largestYoyChangePct" error={errors.largestYoyChangePct} className="sm:col-span-2">
            <AmountInput id="largestYoyChangePct" suffix="%" value={form.largestYoyChangePct} onChange={set('largestYoyChangePct')} invalid={!!errors.largestYoyChangePct} placeholder="34" />
          </Field>
        </div>
      </FormCard>

      {hasErrors && (
        <p className="text-sm text-destructive">Please fix the highlighted fields before continuing.</p>
      )}
      {submitError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? 'Running…' : 'Run screener →'}
        </button>
        <p className="text-xs text-muted-foreground">Nothing is shared. This runs deterministic rules — no AI.</p>
      </div>
    </form>
  )
}
