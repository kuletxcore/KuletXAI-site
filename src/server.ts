import handler from '@tanstack/react-start/server-entry'
import { refreshIskStats } from '#/lib/isk-stats.server'
import { machineResponse } from '#/lib/machine.server'

/**
 * Worker entry: the TanStack Start app for requests, plus Whop's scheduled
 * run (the app's `schedule`, hourly), which refreshes the IsekaiZero and Trimz counts.
 *
 * /llms.txt, /llms-full.txt, /llms.json, /robots.txt, /sitemap.xml and /stories/<slug>.md are answered
 * before the router sees them: they are files for crawlers and models, not pages (src/lib/machine.server.ts).
 */
export default {
  fetch: (request: Request, ...rest: unknown[]) =>
    machineResponse(request) ??
    (handler.fetch as unknown as (req: Request, ...args: unknown[]) => Promise<Response>)(request, ...rest),
  async scheduled() {
    const stats = await refreshIskStats()
    if (!stats) throw new Error('isk-stats: IsekaiZero refresh failed')
    console.log('[isk-stats] refreshed', JSON.stringify({ stories: stats.stories, trimz: stats.trimz }))
  },
}
