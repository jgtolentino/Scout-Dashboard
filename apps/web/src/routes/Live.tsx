import { useEffect } from 'react'
import { initPostHog, posthog } from '@/lib/posthog'

export default function Page() {
  useEffect(() => { initPostHog(); posthog.capture('page_view', { route: location.pathname }) }, [])
  return <div className="p-6">TODO: Implement page content for {location.pathname}</div>
}
