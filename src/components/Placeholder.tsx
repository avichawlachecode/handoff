import type { ReactNode } from 'react'

interface PlaceholderProps {
  title: string
  description: string
  /** PRD section this route will implement, e.g. "§6.1". */
  spec?: string
  children?: ReactNode
}

/**
 * Empty route stub for the scaffold. Every PRD §5 route renders one of these
 * until its feature is built in a later phase. No feature logic lives here.
 */
export default function Placeholder({ title, description, spec, children }: PlaceholderProps) {
  return (
    <section className="space-y-3">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
      <p className="pt-6 text-xs uppercase tracking-wide text-muted-foreground/70">
        Scaffold stub{spec ? ` — implements PRD ${spec}` : ''} · not yet built
      </p>
    </section>
  )
}
