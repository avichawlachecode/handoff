import { supabase } from './supabase'

const SESSION_KEY = 'handoff_session_id'

/** Stable per-browser id for grouping events, independent of auth. */
function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)
    localStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return 'no-storage'
  }
}

/**
 * Record an analytics event (PRD §7 `events`). Best-effort and fire-and-forget:
 * failures are swallowed so instrumentation never affects the UX. Task 10
 * builds on this helper for full instrumentation and the /admin view.
 */
export async function logEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession()
    await supabase.from('events').insert({
      session_id: getSessionId(),
      user_id: data.session?.user?.id ?? null,
      event_name: eventName,
      properties,
    })
  } catch {
    // Analytics is best-effort; never surface to the user.
  }
}
