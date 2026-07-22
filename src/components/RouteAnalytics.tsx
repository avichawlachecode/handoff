import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logEvent } from '@/lib/events'

/** Logs a page_view on every route change (PRD §12 Task 10). Renders nothing. */
export default function RouteAnalytics() {
  const location = useLocation()
  useEffect(() => {
    void logEvent('page_view', { path: location.pathname, search: location.search })
  }, [location.pathname, location.search])
  return null
}
