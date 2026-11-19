import handler from '@tanstack/react-start/server-entry'
import { refreshIskStats } from '#/lib/isk-stats.server'
import { machineResponse } from '#/lib/machine.server'

/**
 * Worker entry: the TanStack Start app for requests, plus Whop's scheduled
 * run (the app's `schedule`, hourly), which refreshes the IsekaiZero and Trimz counts.
 */
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    // /llms.txt, /llms-full.txt, /llms.json and /stories/<slug>.md are files for models, answered before the router
    const res = machineResponse(request) ?? await (handler.fetch as (r: Request, e: unknown, c: unknown) => Promise<Response>)(request, env, ctx)
    // Safe headers for SSR responses (static assets get theirs from public/_headers).
    // No CSP here: the app uses inline head scripts, so a strict policy would break it.
    // No X-Frame-Options either: on Whop the whole app is rendered inside whop.com's iframe.
    const headers = new Headers(res.headers)
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
  },
  async scheduled() {
    const stats = await refreshIskStats()
    if (!stats) throw new Error('isk-stats: IsekaiZero refresh failed')
    console.log('[isk-stats] refreshed', JSON.stringify({ stories: stats.stories, trimz: stats.trimz }))
  },
}
