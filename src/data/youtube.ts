import { STORIES, TRIMZ } from '#/data/content'
import { createServerFn } from '@tanstack/react-start'

export const YT_CHANNEL_ID = 'UCpNxX1ziFLkEFA3nW-lYxfw'
export const YT_CHANNEL_URL = 'https://youtube.com/@kuletxai'

export type YtVideo = {
  id: string
  title: string
  published: string
  views: number
  short: boolean
  /** The world the video is from, read from the storyline or Trimz link in its description */
  story?: string
  /** The Trimz series its description links to */
  series?: string
  /** The description's own words, without its link lines */
  blurb?: string
}

// Snapshot of the channel (Nov 2026). Used if the live feed can't be reached.
export const YT_SNAPSHOT: YtVideo[] = [
  { id: 'KIdeRQhgA-k', title: 'Acolytes: Maid for your Protection - Episode 3', published: '2026-10-30', views: 4, short: false, story: 'acolytes', series: 'acolytes-maid-for-your-protection' },
  { id: 'fcl4WcNrTQc', title: 'Random Bullshit GO!!!!', published: '2026-10-29', views: 182, short: true, story: 'acolytes', series: 'acolytes-maid-for-your-protection' },
  { id: 'UvnvUym34Lg', title: 'Acolytes: Maid for your Protection - Episode 2', published: '2026-10-29', views: 11, short: false, story: 'acolytes', series: 'acolytes-maid-for-your-protection' },
  { id: 'cl8mBfpIjdo', title: 'Acolytes: Maid for your Protection - Episode 1', published: '2026-10-28', views: 20, short: false, story: 'acolytes', series: 'acolytes-maid-for-your-protection' },
  { id: 'BPrv_HxKxU4', title: 'Acolytes: Maid for Your Protection', published: '2026-10-28', views: 1292, short: true, story: 'acolytes', series: 'acolytes-maid-for-your-protection' },
  { id: 'P6PO_5AIPaY', title: 'Acolytes: Maid for your Protection (Side B) - Episode 1', published: '2026-10-28', views: 56, short: false, story: 'acolytes', series: 'acolytes-maid-for-your-protection' },
  { id: '1-6a_xlnhYQ', title: 'Acolytes side B out now on Trimz', published: '2026-10-27', views: 415, short: true, story: 'acolytes', series: 'acolytes-maid-for-your-protection-side-b' },
]

/** Which world a description points at: a storyline link (IsekaiZero or KageSekai), else a Trimz series link. */
export function storyFromDescription(text: string) {
  const id = text.match(/(?:isekaizero|kagesekai)\.ai\/storylines\/([a-f0-9]{24})/i)?.[1]
  const byId = id && STORIES.find((s) => s.id === id)
  if (byId) return byId.slug
  for (const m of text.matchAll(/trimz\.tv\/([a-z0-9-]+)/gi)) {
    const parent = STORIES.find((s) => s.trimz?.includes(m[1]))
    if (parent) return parent.slug
  }
  return undefined
}

/** The first Trimz series a description links to. */
export function seriesFromDescription(text: string) {
  for (const m of text.matchAll(/trimz\.tv\/([a-z0-9-]+)/gi)) {
    const series = TRIMZ.find((t) => t.slug === m[1].toLowerCase())
    if (series) return series.slug
  }
  return undefined
}

/** A description's own words: every line that holds a link is dropped, since those are "Play on ...: <url>" labels. */
export function blurbFromDescription(text: string) {
  const words = text
    .split('\n')
    .filter((line) => !/https?:\/\/|www\./i.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  return words ? words[0].toUpperCase() + words.slice(1) : undefined
}

/** The world a video belongs to: its description's link, else a title that starts with the world's name. */
export function storyOfVideo(video: Pick<YtVideo, 'title' | 'story'>) {
  if (video.story) return STORIES.find((s) => s.slug === video.story)
  return STORIES.find((s) => video.title.toLowerCase().startsWith(s.title.split(':')[0].toLowerCase()))
}

/** "Short" or "Episode" for a video that is one; a remix or trailer has no type. */
export function videoKind(video: Pick<YtVideo, 'title' | 'short'>) {
  if (video.short) return 'Short'
  return /\bepisode\b/i.test(video.title) ? 'Episode' : undefined
}

/** The series (or else the world) a video is from, by name, for a description that is only links. */
export function videoFrom(video: Pick<YtVideo, 'title' | 'story' | 'series'>) {
  return TRIMZ.find((t) => t.slug === video.series)?.title ?? storyOfVideo(video)?.title
}

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

const describe = (text: string) => ({ story: storyFromDescription(text), series: seriesFromDescription(text), blurb: blurbFromDescription(text) })

/** Parse YouTube's Atom feed without a DOM (runs in the server worker). */
export function parseFeed(xml: string): YtVideo[] {
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
      ...describe(decode(entry.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] ?? '')),
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

/** The list the page arrived with, so the first story change doesn't wait on a server round trip. */
export function rememberYoutubeVideos(videos: YtVideo[]) {
  if (typeof window !== 'undefined') clientVideos ??= Promise.resolve(videos)
}
