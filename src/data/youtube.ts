import { createServerFn } from '@tanstack/react-start'

export const YT_CHANNEL_ID = 'UCpNxX1ziFLkEFA3nW-lYxfw'
export const YT_CHANNEL_URL = 'https://youtube.com/@kuletxai'

export type YtVideo = {
  id: string
  title: string
  published: string
  views: number
  short: boolean
}

// Snapshot of the channel (Nov 2026). Used if the live feed can't be reached.
export const YT_SNAPSHOT: YtVideo[] = [
  { id: 'KIdeRQhgA-k', title: 'Acolytes: Maid for your Protection - Episode 3', published: '2026-10-30', views: 4, short: false },
  { id: 'fcl4WcNrTQc', title: 'Random Bullshit GO!!!!', published: '2026-10-29', views: 182, short: true },
  { id: 'UvnvUym34Lg', title: 'Acolytes: Maid for your Protection - Episode 2', published: '2026-10-29', views: 11, short: false },
  { id: 'cl8mBfpIjdo', title: 'Acolytes: Maid for your Protection - Episode 1', published: '2026-10-28', views: 20, short: false },
  { id: 'BPrv_HxKxU4', title: 'Acolytes: Maid for Your Protection', published: '2026-10-28', views: 1292, short: true },
  { id: 'P6PO_5AIPaY', title: 'Acolytes: Maid for your Protection (Side B) - Episode 1', published: '2026-10-28', views: 56, short: false },
  { id: '1-6a_xlnhYQ', title: 'Acolytes side B out now on Trimz', published: '2026-10-27', views: 415, short: true },
]

export const ytThumb = (id: string, size: 'maxresdefault' | 'hqdefault' | 'default' = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${size}.jpg`
export const ytWatchUrl = (v: YtVideo) => (v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`)
export const ytEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

/** Parse YouTube's Atom feed without a DOM (runs in the server worker). */
function parseFeed(xml: string): YtVideo[] {
  const out: YtVideo[] = []
  for (const entry of xml.split('<entry>').slice(1)) {
    const id = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1]
    if (!id || !title) continue
    out.push({
      id,
      title: decode(title),
      published: (entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '').slice(0, 10),
      views: Number(entry.match(/views="(\d+)"/)?.[1] ?? 0),
      short: /<link rel="alternate" href="https:\/\/www\.youtube\.com\/shorts\//.test(entry),
    })
  }
  return out
}

let cache: { at: number; videos: YtVideo[] } | null = null
const TTL = 15 * 60 * 1000

export const getYoutubeVideos = createServerFn({ method: 'GET' }).handler(async (): Promise<YtVideo[]> => {
  if (cache && Date.now() - cache.at < TTL) return cache.videos
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`, {
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) throw new Error(`feed ${res.status}`)
    const videos = parseFeed(await res.text())
    if (!videos.length) throw new Error('empty feed')
    cache = { at: Date.now(), videos }
    return videos
  } catch {
    return cache?.videos ?? YT_SNAPSHOT
  }
})

// Client side: fetch once per page load, reuse across story navigation
let clientVideos: Promise<YtVideo[]> | null = null
export function loadYoutubeVideos() {
  if (typeof window === 'undefined') return getYoutubeVideos()
  clientVideos ??= getYoutubeVideos().catch(() => YT_SNAPSHOT)
  return clientVideos
}
