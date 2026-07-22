import { supabase } from './supabase'

export type ChecklistName = 'loi' | 'closing'

/** Load checked state for one of a deal's checklists. Best-effort: returns an
 * empty map if Supabase is unreachable, so the checklist still renders. */
export async function loadChecklist(
  dealId: string,
  list: ChecklistName,
): Promise<Record<string, boolean>> {
  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('item_key, checked')
      .eq('deal_id', dealId)
      .eq('list', list)
    if (error) return {}
    const map: Record<string, boolean> = {}
    for (const row of data ?? []) map[row.item_key] = !!row.checked
    return map
  } catch {
    return {}
  }
}

/** Persist a single checklist item (upsert on deal_id + list + item_key). */
export async function setChecklistItem(
  dealId: string,
  list: ChecklistName,
  itemKey: string,
  checked: boolean,
): Promise<void> {
  const { error } = await supabase.from('checklist_items').upsert(
    { deal_id: dealId, list, item_key: itemKey, checked, updated_at: new Date().toISOString() },
    { onConflict: 'deal_id,list,item_key' },
  )
  if (error) throw new Error(error.message)
}
