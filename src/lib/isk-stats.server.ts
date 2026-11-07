import { STORIES } from '#/data/content'
import type { IskCounts, IskStats } from '#/lib/isk-stats'

/**
 * Server side of the live IsekaiZero counts.
 *
 * An hourly scheduled run (src/server.ts) asks IsekaiZero for the five
 * storylines and stores the result in the edge cache. /api/isk-stats serves
 * that copy. If a run is missed and the copy is more than an hour old, the
 * route refreshes it itself, and if IsekaiZero is down it serves the last good
 * copy. Only the storyline ids from content.ts are ever requested.
 */
export const REFRESH_S = 60 * 60
const GRACE_S = 10 * 60 // the hourly run lands a little after its slot
const KEEP_S = 30 * 24 * 60 * 60
const API = 'https://api-global.isekaizero.ai/api/storylines/'
const FRESH_KEY = 'https://kuletxai.whop.site/__cache/isk-stats/v2'
const LAST_KEY = 'https://kuletxai.whop.site/__cache/isk-stats/v2-last'

let memory: IskStats | null = null
let inflight: Promise<IskStats | null> | null = null

const edgeCache = () => (globalThis as { caches?: { default?: Cache } }).caches?.default

const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined)

async function readStory(id: string): Promise<IskCounts> {
  const res = await fetch(API + id, {
    headers: { accept: 'application/json', 'user-agent': 'kuletx-hub/1.0 (+https://kuletxai.whop.site)' },
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new Error(`storyline ${id}: HTTP ${res.status}`)
  // The payload holds other objects with their own "engagement" (playlists,
  // characters), so read the storyline's own block from the parsed tree.
  const body = (await res.json()) as { data?: { _id?: string; engagement?: Record<string, unknown> } }
  const e = body.data?._id === id ? body.data.engagement : undefined
  if (!e) throw new Error(`storyline ${id}: no engagement block`)
  const out: IskCounts = { messages: count(e.messageCount), chats: count(e.chatCount), likes: count(e.likeCount) }
  if (out.messages === undefined && out.chats === undefined && out.likes === undefined) {
    throw new Error(`storyline ${id}: no counts`)
  }
  return out
}

async function readCached(key: string): Promise<IskStats | null> {
  try {
    const hit = await edgeCache()?.match(key)
    return hit ? ((await hit.json()) as IskStats) : null
  } catch {
    return null
  }
}

async function writeCached(key: string, stats: IskStats, maxAge: number) {
  try {
    await edgeCache()?.put(
      key,
      new Response(JSON.stringify(stats), {
        headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${maxAge}` },
      }),
    )
  } catch {
    // No edge cache here (local dev, preview hosts): memory still works.
  }
}

async function pull(previous: IskStats | null): Promise<IskStats | null> {
  const results = await Promise.allSettled(STORIES.map((s) => readStory(s.id)))
  const stories: IskStats['stories'] = {}
  let fresh = 0
  results.forEach((r, i) => {
    const slug = STORIES[i].slug
    if (r.status === 'fulfilled') {
      stories[slug] = r.value
      fresh++
    } else {
      console.warn('[isk-stats]', String(r.reason))
      if (previous?.stories[slug]) stories[slug] = previous.stories[slug]
    }
  })
  if (!fresh) return null
  const stats: IskStats = { t: Date.now(), stories }
  memory = stats
  await Promise.all([writeCached(FRESH_KEY, stats, REFRESH_S + GRACE_S), writeCached(LAST_KEY, stats, KEEP_S)])
  return stats
}

/** Ask IsekaiZero now (one request at a time per isolate). */
export async function refreshIskStats(): Promise<IskStats | null> {
  const previous = memory ?? (await readCached(LAST_KEY))
  inflight ??= pull(previous)
    .catch((err) => {
      console.warn('[isk-stats] refresh failed', String(err))
      return null
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

const isFresh = (s: IskStats | null) => !!s && Date.now() - s.t < (REFRESH_S + GRACE_S) * 1000

export type IskStatsSource = 'memory' | 'edge' | 'isekaizero' | 'stale'

/** The newest copy: memory, then edge cache, then IsekaiZero, then the last good copy. */
export async function getIskStats(): Promise<{ stats: IskStats; source: IskStatsSource } | null> {
  if (isFresh(memory)) return { stats: memory!, source: 'memory' }
  const cached = await readCached(FRESH_KEY)
  if (cached && isFresh(cached)) {
    memory = cached
    return { stats: cached, source: 'edge' }
  }
  const stats = await refreshIskStats()
  if (stats) return { stats, source: 'isekaizero' }
  const last = memory ?? (await readCached(LAST_KEY))
  return last ? { stats: last, source: 'stale' } : null
}
