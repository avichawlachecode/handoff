import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { logEvent } from '@/lib/events'
import { saveProfile, type PgComfort, type Stage } from '@/lib/profiles'

const INDUSTRIES = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Commercial cleaning',
  'Pest control',
  'Landscaping',
  'B2B services',
  'Other',
]

const STAGES: { value: Stage; label: string; hint: string }[] = [
  { value: 'exploring', label: 'Just exploring', hint: '0–6 months in' },
  { value: 'searching', label: 'Actively searching', hint: '6–18 months in' },
  { value: 'under_loi', label: 'Under LOI or have a live target', hint: 'a deal on the table' },
]

const PG_OPTIONS: { value: PgComfort; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'nervous', label: 'Nervous' },
  { value: 'discuss_spouse', label: 'Need to discuss with spouse' },
]

const inputCls =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

const num = (v: string): number | null => (v.trim() === '' ? null : Number(v))

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [stage, setStage] = useState<Stage | null>(null)
  const [industries, setIndustries] = useState<string[]>([])
  const [maxDriveTime, setMaxDriveTime] = useState('')
  const [targetSdeMin, setTargetSdeMin] = useState('')
  const [targetSdeMax, setTargetSdeMax] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [liquidCash, setLiquidCash] = useState('')
  const [pgComfort, setPgComfort] = useState<PgComfort | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function chooseStage(value: Stage) {
    setStage(value)
    void logEvent('onboarding_stage', { stage: value })
    if (value === 'exploring') {
      // Secondary persona → Starter Track (PRD §6.2 / Task 9).
      void logEvent('starter_routed', { from: 'onboarding' })
      navigate('/starter')
      return
    }
    setStep(2)
  }

  function toggleIndustry(name: string) {
    setIndustries((prev) => (prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]))
  }

  function skip() {
    void logEvent('onboarding_skipped')
    navigate('/deals')
  }

  async function finish() {
    if (!stage) return
    setSaving(true)
    setError(null)
    try {
      await saveProfile({
        stage,
        industries,
        maxDriveTime: num(maxDriveTime),
        targetSdeMin: num(targetSdeMin),
        targetSdeMax: num(targetSdeMax),
        maxPrice: num(maxPrice),
        liquidCash: num(liquidCash),
        pgComfort,
      })
      void logEvent('onboarding_completed', { stage })
      navigate('/deals')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Set up your buy box</h1>
        <button type="button" onClick={skip} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Skip
        </button>
      </div>
      <p className="text-sm text-muted-foreground">Step {step} of 3</p>

      {step === 1 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">Where are you?</h2>
          <div className="space-y-2">
            {STAGES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => chooseStage(s.value)}
                className="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-3 text-left hover:border-primary hover:bg-secondary"
              >
                <span className="text-sm font-medium text-foreground">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <div>
            <h2 className="mb-2 text-base font-semibold text-foreground">Your buy box</h2>
            <p className="mb-2 text-sm text-muted-foreground">Industries you’d consider</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((name) => {
                const on = industries.includes(name)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleIndustry(name)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-sm',
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-foreground hover:bg-secondary',
                    )}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Labeled label="Max drive time (min)">
              <input inputMode="numeric" value={maxDriveTime} onChange={(e) => setMaxDriveTime(e.target.value)} className={inputCls} placeholder="90" />
            </Labeled>
            <Labeled label="Max purchase price ($)">
              <input inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className={inputCls} placeholder="2,000,000" />
            </Labeled>
            <Labeled label="Target SDE min ($)">
              <input inputMode="numeric" value={targetSdeMin} onChange={(e) => setTargetSdeMin(e.target.value)} className={inputCls} placeholder="300,000" />
            </Labeled>
            <Labeled label="Target SDE max ($)">
              <input inputMode="numeric" value={targetSdeMax} onChange={(e) => setTargetSdeMax(e.target.value)} className={inputCls} placeholder="600,000" />
            </Labeled>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Next →
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <h2 className="text-base font-semibold text-foreground">Your capital</h2>
          <Labeled label="Liquid cash available ($)">
            <input inputMode="numeric" value={liquidCash} onChange={(e) => setLiquidCash(e.target.value)} className={inputCls} placeholder="300,000" />
          </Labeled>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Comfort with a personal guarantee</p>
            <div className="space-y-2">
              {PG_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setPgComfort(o.value)}
                  className={cn(
                    'flex w-full items-center rounded-md border px-4 py-2.5 text-left text-sm',
                    pgComfort === o.value
                      ? 'border-primary bg-primary/5 font-medium text-foreground'
                      : 'border-input bg-background text-foreground hover:bg-secondary',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              ← Back
            </button>
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Finish'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
