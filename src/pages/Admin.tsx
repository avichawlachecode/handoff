import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatMoney } from '@/lib/format'
import { ADMIN_EMAIL, loadAdminData, type AdminData } from '@/lib/admin'

type View =
  | { s: 'checking' }
  | { s: 'need_auth'; error?: string }
  | { s: 'loading' }
  | { s: 'ready'; data: AdminData }
  | { s: 'error'; message: string }

export default function Admin() {
  const [view, setView] = useState<View>({ s: 'checking' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  async function checkAndLoad() {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user?.email !== ADMIN_EMAIL) {
      setView({ s: 'need_auth' })
      return
    }
    setView({ s: 'loading' })
    try {
      setView({ s: 'ready', data: await loadAdminData() })
    } catch (err) {
      setView({ s: 'error', message: err instanceof Error ? err.message : 'Failed to load data.' })
    }
  }

  useEffect(() => {
    void checkAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    setSigningIn(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setSigningIn(false)
    if (error) {
      setView({ s: 'need_auth', error: error.message })
      return
    }
    if (data.user?.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut()
      setView({ s: 'need_auth', error: 'That account is not the admin.' })
      return
    }
    void checkAndLoad()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin</h1>

      {view.s === 'checking' && <p className="text-sm text-muted-foreground">Checking…</p>}

      {view.s === 'need_auth' && (
        <form onSubmit={signIn} className="max-w-sm space-y-3 rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Sign in with the admin account.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin email"
            aria-label="Admin email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            aria-label="Admin password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={signingIn}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {signingIn ? 'Signing in…' : 'Sign in'}
          </button>
          {view.error && <p className="text-sm text-destructive">{view.error}</p>}
        </form>
      )}

      {view.s === 'loading' && <p className="text-sm text-muted-foreground">Loading…</p>}

      {view.s === 'error' && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {view.message}
        </div>
      )}

      {view.s === 'ready' && <Dashboard data={view.data} />}
    </div>
  )
}

function Dashboard({ data }: { data: AdminData }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-6">
        <Stat label="Total events" value={data.totalEvents} />
        <Stat label="Leads captured" value={data.leadCount} />
        <Stat label="Paywall free-text" value={data.freeText.length} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Events by type</h2>
        {data.eventCounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Event</th>
                  <th className="px-4 py-2 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {data.eventCounts.map((row) => (
                  <tr key={row.name} className="border-b last:border-b-0">
                    <td className="px-4 py-2 font-mono text-foreground">{row.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-foreground">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Paywall free-text responses</h2>
        {data.freeText.length === 0 ? (
          <p className="text-sm text-muted-foreground">No free-text responses yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Variant</th>
                  <th className="px-4 py-2 font-medium">Choice</th>
                  <th className="px-4 py-2 text-right font-medium">Would pay</th>
                  <th className="px-4 py-2 font-medium">What&apos;s missing</th>
                </tr>
              </thead>
              <tbody>
                {data.freeText.map((r, i) => (
                  <tr key={i} className="border-b align-top last:border-b-0">
                    <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-foreground">{r.variant ?? '—'}</td>
                    <td className="px-4 py-2 text-foreground">{r.choice ?? '—'}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-foreground">
                      {r.amount != null ? formatMoney(r.amount) : '—'}
                    </td>
                    <td className="px-4 py-2 text-foreground">{r.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border px-5 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value.toLocaleString('en-US')}</p>
    </div>
  )
}
