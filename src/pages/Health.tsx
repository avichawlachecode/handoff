import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Temporary connectivity check. Hits Supabase once on mount and shows the
// result. No styling — this is a debug route, remove once wiring is verified.
export default function Health() {
  const [status, setStatus] = useState('Checking Supabase…')

  useEffect(() => {
    let active = true
    ;(async () => {
      const { error } = await supabase.from('deals').select('id').limit(1)
      if (!active) return
      setStatus(error ? error.message : 'Supabase connected')
    })()
    return () => {
      active = false
    }
  }, [])

  return <p>{status}</p>
}
