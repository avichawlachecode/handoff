import { Link } from 'react-router-dom'

export default function Thanks() {
  return (
    <section className="mx-auto max-w-lg space-y-4 py-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Thank you</h1>
      <p className="text-sm text-muted-foreground">
        We&apos;ve recorded your interest. This is a class prototype — no payment was taken and nothing
        was charged. Your response helps us learn what a lender-ready package is worth.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Link
          to="/deals"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Back to your deals
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Home
        </Link>
      </div>
    </section>
  )
}
