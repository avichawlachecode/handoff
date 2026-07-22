import { supabase } from './supabase'

/** Hard-coded admin identity (PRD §12 Task 10). Must match the RLS migration. */
export const ADMIN_EMAIL = 'avi.chawlache@gmail.com'

export interface FreeTextResponse {
  createdAt: string
  variant?: string
  choice?: string
  amount: number | null
  reason: string | null
}

export interface AdminData {
  eventCounts: { name: string; count: number }[]
  totalEvents: number
  freeText: FreeTextResponse[]
  leadCount: number
}

/** Aggregate events and leads for the admin dashboard. Requires an admin session. */
export async function loadAdminData(): Promise<AdminData> {
  const { data: events, error } = await supabase
    .from('events')
    .select('event_name, properties, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)
  if (error) throw new Error(error.message)

  const counts = new Map<string, number>()
  const freeText: FreeTextResponse[] = []

  for (const e of events ?? []) {
    counts.set(e.event_name, (counts.get(e.event_name) ?? 0) + 1)
    const props = (e.properties ?? {}) as Record<string, unknown>
    if (e.event_name === 'paywall_response' && (props.reason != null || props.amount != null)) {
      freeText.push({
        createdAt: e.created_at,
        variant: props.variant as string | undefined,
        choice: props.choice as string | undefined,
        amount: (props.amount as number | null) ?? null,
        reason: (props.reason as string | null) ?? null,
      })
    }
  }

  const eventCounts = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)

  const { count: leadCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })

  return { eventCounts, totalEvents: (events ?? []).length, freeText, leadCount: leadCount ?? 0 }
}
