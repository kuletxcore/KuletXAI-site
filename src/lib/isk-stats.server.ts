import { STORIES, TRIMZ } from '#/data/content'
import type { IskCounts, IskStats, TrimzCounts } from '#/lib/isk-stats'

/**
 * Live IsekaiZero and Trimz counts, server side: an hourly run (src/server.ts) caches them at the edge for /api/isk-stats,
 * which refreshes a stale copy itself and falls back to the last good one. Only content.ts stories and series are read.
 */
export const REFRESH_S = 60 * 60
const GRACE_S = 10 * 60 // the hourly run lands a little after its slot
const KEEP_S = 30 * 24 * 60 * 60
const API = 'https://api-global.isekaizero.ai/api/storylines/'
// One public listing covers every series on trimz.tv/u/kuletxcore
const TRIMZ_API = 'https://api.trimz.tv/api/ms/public-series?limit=50&order=updated_desc&owner_username=kuletxcore&locale=en'
const UA = 'kuletx-hub/1.0 (+https://kuletxai.whop.site)'
const FRESH_KEY = 'https://kuletxai.whop.site/__cache/isk-stats/v3'
const LAST_KEY = 'https://kuletxai.whop.site/__cache/isk-stats/v3-last'

let memory: IskStats | null = null
let inflight: Promise<IskStats | null> | null = null

const edgeCache = () => (globalThis as { caches?: { default?: Cache } }).caches?.default

const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : undefined)

async function readStory(id: string): Promise<IskCounts> {
  const res = await fetch(API + id, {
    headers: { accept: 'application/json', 'user-agent': UA },
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

/** Views and episode counts for the content.ts series, by slug. */
async function readTrimz(): Promise<Record<string, TrimzCounts>> {
  const res = await fetch(TRIMZ_API, { headers: { accept: 'application/json', 'user-agent': UA }, signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`trimz: HTTP ${res.status}`)
  const body = (await res.json()) as { items?: { slug?: string; total_views?: unknown; episode_count?: unknown }[] }
  const out: Record<string, TrimzCounts> = {}
  for (const item of body.items ?? []) {
    if (!item.slug || !TRIMZ.some((t) => t.slug === item.slug)) continue
    out[item.slug] = { views: count(item.total_views), episodes: count(item.episode_count) }
  }
  if (!Object.keys(out).length) throw new Error('trimz: none of our series in the listing')
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
  const [trimzResult, ...results] = await Promise.allSettled([readTrimz(), ...STORIES.map((s) => readStory(s.id))] as const)
  const stories: IskStats['stories'] = {}
  let fresh = 0
  results.forEach((r, i) => {
    const slug = STORIES[i].slug
    if (r.status === 'fulfilled') {
      stories[slug] = r.value as IskCounts
      fresh++
    } else {
      console.warn('[isk-stats]', String(r.reason))
      if (previous?.stories[slug]) stories[slug] = previous.stories[slug]
    }
  })
  let trimz = previous?.trimz
  if (trimzResult.status === 'fulfilled') {
    trimz = trimzResult.value
    fresh++
  } else console.warn('[isk-stats]', String(trimzResult.reason))
  if (!fresh) return null
  const stats: IskStats = { t: Date.now(), stories, ...(trimz && { trimz }) }
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
