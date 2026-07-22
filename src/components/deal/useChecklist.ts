import { useCallback, useEffect, useState } from 'react'
import { logEvent } from '@/lib/events'
import { loadChecklist, setChecklistItem, type ChecklistName } from '@/lib/checklist'

/** Loads a deal's checklist and persists optimistic toggles (reverting on error). */
export function useChecklist(dealId: string, list: ChecklistName) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadChecklist(dealId, list).then((map) => {
      if (active) {
        setChecked(map)
        setLoaded(true)
      }
    })
    return () => {
      active = false
    }
  }, [dealId, list])

  const toggle = useCallback(
    async (key: string) => {
      const next = !checked[key]
      setChecked((prev) => ({ ...prev, [key]: next }))
      setError(null)
      void logEvent('checklist_item_toggled', { dealId, list, item: key, checked: next })
      try {
        await setChecklistItem(dealId, list, key, next)
      } catch (err) {
        setChecked((prev) => ({ ...prev, [key]: !next }))
        setError(err instanceof Error ? err.message : 'Could not save. Try again.')
      }
    },
    [checked, dealId, list],
  )

  return { checked, loaded, error, toggle }
}
