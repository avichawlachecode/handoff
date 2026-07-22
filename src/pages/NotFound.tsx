import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        That route doesn&apos;t exist yet.{' '}
        <Link to="/" className="font-medium text-primary underline underline-offset-4">
          Go home
        </Link>
        .
      </p>
    </section>
  )
}
