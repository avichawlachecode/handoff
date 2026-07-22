import { supabase } from './supabase'
import { ensureSession } from './auth'

export type Stage = 'exploring' | 'searching' | 'under_loi'
export type PgComfort = 'yes' | 'nervous' | 'discuss_spouse'

export interface ProfileInput {
  stage: Stage
  industries: string[]
  maxDriveTime: number | null
  targetSdeMin: number | null
  targetSdeMax: number | null
  maxPrice: number | null
  liquidCash: number | null
  pgComfort: PgComfort | null
}

/** Upsert the buy-box profile for the current session (PRD §6.2 → `profiles`). */
export async function saveProfile(p: ProfileInput): Promise<void> {
  const userId = await ensureSession()
  const { data } = await supabase.auth.getSession()
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email: data.session?.user?.email ?? null,
    stage: p.stage,
    industries: p.industries,
    max_drive_time: p.maxDriveTime,
    target_sde_min: p.targetSdeMin,
    target_sde_max: p.targetSdeMax,
    max_price: p.maxPrice,
    liquid_cash: p.liquidCash,
    pg_comfort: p.pgComfort,
  })
  if (error) throw new Error(`Could not save profile: ${error.message}`)
}
