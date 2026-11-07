import handler from '@tanstack/react-start/server-entry'
import { refreshIskStats } from '#/lib/isk-stats.server'

/**
 * Worker entry: the TanStack Start app for requests, plus Whop's scheduled
 * run (the app's `schedule`, hourly), which refreshes the IsekaiZero counts.
 */
export default {
  fetch: handler.fetch,
  async scheduled() {
    const stats = await refreshIskStats()
    if (!stats) throw new Error('isk-stats: IsekaiZero refresh failed')
    console.log('[isk-stats] refreshed', JSON.stringify(stats.stories))
  },
}
