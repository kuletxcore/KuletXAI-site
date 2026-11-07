import { createFileRoute } from '@tanstack/react-router'
import { STORIES } from '#/data/content'
import type { IskCounts, IskStats } from '#/lib/isk-stats'

/**
 * Live IsekaiZero counts (messages, chats, likes) for the hub's storylines.
 * IsekaiZero is asked at most once every few hours: the result is kept in the
 * edge cache and in memory, and the last good copy is served if it is down.
 * Only the five storyline ids from content.ts are ever requested.
 */
const FRESH_S = 3 * 60 * 60
const KEEP_S = 30 * 24 * 60 * 60
const API = 'https://api-global.isekaizero.ai/api/storylines/'
const FRESH_KEY = 'https://kuletxai.whop.site/__cache/isk-stats/v1'
const LAST_KEY = 'https://kuletxai.whop.site/__cache/isk-stats/v1-last'

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

async function refresh(previous: IskStats | null): Promise<IskStats | null> {
  const results = await Promise.allSettled(STORIES.map((s) => readStory(s.id)))
  const stories: IskStats['stories'] = {}
  let fresh = 0
  results.forEach((r, i) => {
    const slug = STORIES[i].slug
    if (r.status === 'fulfilled') {
      stories[slug] = r.value
      fresh++
    } else if (previous?.stories[slug]) {
      stories[slug] = previous.stories[slug]
    }
  })
  if (!fresh) return null
  const stats: IskStats = { t: Date.now(), stories }
  memory = stats
  await Promise.all([writeCached(FRESH_KEY, stats, FRESH_S), writeCached(LAST_KEY, stats, KEEP_S)])
  return stats
}

const isFresh = (s: IskStats | null) => !!s && Date.now() - s.t < FRESH_S * 1000

function json(stats: IskStats, source: string) {
  return new Response(JSON.stringify(stats), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=600',
      'x-kx-stats': source,
    },
  })
}

export const Route = createFileRoute('/api/isk-stats')({
  server: {
    handlers: {
      GET: async () => {
        if (isFresh(memory)) return json(memory!, 'memory')

        const cached = await readCached(FRESH_KEY)
        if (isFresh(cached)) {
          memory = cached
          return json(cached!, 'edge')
        }

        const previous = memory ?? (await readCached(LAST_KEY))
        inflight ??= refresh(previous)
          .catch(() => null)
          .finally(() => {
            inflight = null
          })
        const stats = await inflight
        if (stats) return json(stats, 'isekaizero')
        if (previous) return json(previous, 'stale')
        return new Response('{"error":"IsekaiZero unavailable"}', {
          status: 503,
          headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        })
      },
    },
  },
})
