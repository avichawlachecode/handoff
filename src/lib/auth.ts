import { supabase } from './supabase'

/**
 * Ensure there is a Supabase session so RLS writes (which require
 * user_id = auth.uid()) succeed. Guests get an anonymous session — the PRD's
 * "Continue as guest" path. Anonymous users carry the `authenticated` role, so
 * the Task 3 policies apply unchanged.
 *
 * Requires "Anonymous sign-ins" enabled in the Supabase project's Auth settings;
 * otherwise signInAnonymously() returns an error surfaced to the caller.
 */
export async function ensureSession(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session.user.id

  const { data: anon, error } = await supabase.auth.signInAnonymously()
  if (error || !anon.user) {
    throw new Error(
      `Could not start a session: ${error?.message ?? 'unknown error'}. ` +
        'Enable "Anonymous sign-ins" in Supabase Auth settings, or sign in.',
    )
  }
  return anon.user.id
}
