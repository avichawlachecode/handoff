import { supabase } from './supabase'

/** Load the checked state for a deal's verification items. Best-effort: returns
 * an empty map if Supabase is unreachable, so the checklist still renders. */
export async function loadVerification(dealId: string): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('verification_items')
      .select('item_key, checked')
      .eq('deal_id', dealId)
    if (error) return {}
    const map: Record<string, boolean> = {}
    for (const row of data ?? []) map[row.item_key] = !!row.checked
    return map
  } catch {
    return {}
  }
}

/** Persist a single checklist item (upsert on deal_id + item_key). Throws on
 * failure so the caller can surface it and revert the optimistic toggle. */
export async function setVerificationItem(
  dealId: string,
  itemKey: string,
  checked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('verification_items')
    .upsert(
      { deal_id: dealId, item_key: itemKey, checked, updated_at: new Date().toISOString() },
      { onConflict: 'deal_id,item_key' },
    )
  if (error) throw new Error(error.message)
}
