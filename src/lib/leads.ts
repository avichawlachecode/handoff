import { supabase } from './supabase'

export interface LeadResult {
  ok: boolean
  error?: string
}

/** Capture a waitlist / early-access email (PRD §6.1 → `leads`). Anyone,
 * including guests, may insert; nobody reads back via the anon/authed key. */
export async function captureLead(email: string, source: string): Promise<LeadResult> {
  const trimmed = email.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: 'Enter a valid email address.' }
  }
  const { error } = await supabase.from('leads').insert({ email: trimmed, source })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
