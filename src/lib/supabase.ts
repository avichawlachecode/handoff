import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when both Supabase env vars are set. Callers can branch on this. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  // Warn instead of throwing so the client-side demo deal and early phases still
  // boot without a backend. Copy .env.example to .env and fill in real values.
  console.warn(
    '[handoff] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — Supabase ' +
      'calls will fail until you copy .env.example to .env. See docs/PRD.md §7.',
  )
}

// Fall back to the default local-dev URL so createClient() does not throw on an
// empty string at import time. The anon key is safe to expose in the browser.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'anon-key-not-set',
)
