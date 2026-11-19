import { STORIES, TRIMZ, storyPlatformName, storyUrl, trimzSeriesUrl } from '#/data/content'
import { ISK } from '#/data/isk'
import { YT_SNAPSHOT, ytWatchUrl } from '#/data/youtube'

// The index behind STORY FINDER (src/components/story-finder.tsx): every world, character,
// series, video and jump on the site, searchable from one field with the keyboard.

export type FinderKind = 'world' | 'cast' | 'series' | 'video' | 'jump' | 'action'

export type FinderItem = {
  id: string
  kind: FinderKind
  title: string
  /** Second line: the logline, a character's role, a section's promise. */
  sub?: string
  /** Rating and tags, shown as small chips and searchable. */
  meta?: string[]
  image?: string
  /** Extra search words that never show (characters in a story, handles, aliases). */
  keywords?: string
  /** Leaves the site. */
  href?: string
  /** Opens a story hub, optionally on one of its sections. */
  hub?: { slug: string; section?: string }
  /** Scrolls to an anchor on the home page. */
  anchor?: string
  /** Runs in place (the palette's own commands). */
  run?: () => void
}

const CAST_ROLE = (role: string) => (role === 'persona' ? 'You play them' : 'Character')

function castItems(): FinderItem[] {
  const items: FinderItem[] = []
  for (const story of STORIES) {
    const isk = ISK[story.slug]
    const seen = new Set<string>()
    for (const c of isk?.cast ?? []) {
      seen.add(c.name.toLowerCase())
      items.push({
        id: `cast:${story.slug}:${c.id}`,
        kind: 'cast',
        title: c.name,
        sub: c.summary,
        meta: [CAST_ROLE(c.role), story.title],
        image: c.portrait,
        keywords: `${c.name} ${story.slug} ${story.tags.join(' ')}`,
        hub: { slug: story.slug, section: 'cast' },
      })
    }
    // The hand-written cast fills in the people the platform lists don't cover
    for (const c of story.cast) {
      if (seen.has(c.name.toLowerCase())) continue
      items.push({
        id: `cast:${story.slug}:${c.name}`,
        kind: 'cast',
        title: c.name,
        sub: c.role,
        meta: ['Cast', story.title],
        keywords: `${c.name} ${story.slug} ${story.tags.join(' ')}`,
        hub: { slug: story.slug, section: 'cast' },
      })
    }
  }
  return items
}

/** Same static index every time, so the palette isn't rebuilt on every keystroke. */
export const FINDER_INDEX: FinderItem[] = [
  ...STORIES.map(
    (s): FinderItem => ({
      id: `world:${s.slug}`,
      kind: 'world',
      title: s.title,
      sub: s.logline,
      meta: [s.rating, storyPlatformName(s), ...s.tags],
      image: s.tile ?? s.cover,
      keywords: `${s.slug} ${s.kicker} ${s.hook} ${s.tags.join(' ')} ${s.cast.map((c) => c.name).join(' ')}`,
      href: storyUrl(s),
      hub: { slug: s.slug },
    }),
  ),
  ...castItems(),
  ...TRIMZ.map(
    (t): FinderItem => ({
      id: `series:${t.slug}`,
      kind: 'series',
      title: t.title,
      sub: t.summary,
      meta: ['Trimz series', `${t.episodes} ep`],
      image: t.poster,
      keywords: `trimz series ${t.slug} ${t.key}`,
      href: trimzSeriesUrl(t.slug),
    }),
  ),
  ...YT_SNAPSHOT.map(
    (v): FinderItem => ({
      id: `video:${v.id}`,
      kind: 'video',
      title: v.title.replace(/&amp;/g, '&'),
      sub: `${v.published} · ${v.views.toLocaleString('en-US')} views`,
      meta: ['YouTube', v.short ? 'Short' : 'Video'],
      image: `https://i.ytimg.com/vi/${v.id}/default.jpg`,
      keywords: 'youtube video',
      href: ytWatchUrl(v),
    }),
  ),
  { id: 'jump:top', kind: 'jump', title: 'Top of the page', sub: 'Back to the boot screen', anchor: 'top', keywords: 'home start hero' },
  { id: 'jump:stories', kind: 'jump', title: 'Pick a world', sub: 'The story shelf: seven interactive worlds', anchor: 'stories', keywords: 'stories worlds shelf isekaizero kagesekai' },
  { id: 'jump:dealer', kind: 'jump', title: 'The World Dealer', sub: 'Pick a vibe, get a world dealt to you', anchor: 'dealer', keywords: 'dealer random surprise pick' },
  { id: 'jump:try', kind: 'jump', title: 'The Teaser', sub: 'Play a scripted taste of the storyteller', anchor: 'try', keywords: 'demo play teaser try sample' },
  { id: 'jump:trimz', kind: 'jump', title: 'Trimz series', sub: 'The AI anime cut from the worlds', anchor: 'trimz', keywords: 'trimz watch binge series episodes' },
  { id: 'jump:watch', kind: 'jump', title: 'Channels', sub: 'IsekaiZero, KageSekai, Trimz and YouTube', anchor: 'watch', keywords: 'channels links subscribe follow' },
]

// ---- Matching -------------------------------------------------------------

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')

export type Match = { score: number; marks: number[] }

const marksFor = (from: number, len: number) => Array.from({ length: len }, (_, i) => from + i)

/** Characters of the query in order, not necessarily touching. */
function subsequence(q: string, text: string): Match | null {
  const marks: number[] = []
  let score = 0
  let at = 0
  for (const ch of q) {
    const hit = text.indexOf(ch, at)
    if (hit === -1) return null
    // Neighbours in the source and starts of words are worth more than scattered letters
    score += 12 + (hit === at ? 14 : 0) + (hit === 0 || /[\s\-_:·/]/.test(text[hit - 1]) ? 16 : 0)
    marks.push(hit)
    at = hit + 1
  }
  return { score, marks }
}

export function fuzzyMatch(query: string, text: string): Match | null {
  const q = norm(query).trim()
  if (!q) return { score: 1, marks: [] }
  const t = norm(text)
  if (!t) return null
  const idx = t.indexOf(q)
  if (idx >= 0) {
    const boundary = idx === 0 || /[\s\-_:·/]/.test(t[idx - 1])
    return { score: 1000 + (boundary ? 90 : 0) + Math.max(0, 70 - idx * 3) - Math.min(60, t.length / 6), marks: marksFor(idx, q.length) }
  }
  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length === 1) return subsequence(q, t)
  let score = 0
  const marks = new Set<number>()
  for (const tok of tokens) {
    const hit = subsequence(tok, t)
    if (!hit) return null
    score += hit.score
    for (const m of hit.marks) marks.add(m)
  }
  return { score: score / tokens.length - 10, marks: [...marks].sort((a, b) => a - b) }
}

export type Found = { item: FinderItem; score: number; marks: number[] }

/** Best field wins: the title counts fully, the second line, tags and hidden words count less. */
export function searchItems(items: FinderItem[], query: string, limit = 24): Found[] {
  if (!query.trim()) return items.slice(0, limit).map((item) => ({ item, score: 0, marks: [] }))
  const out: Found[] = []
  for (const item of items) {
    const fields: [string, number][] = [
      [item.title, 1],
      [item.sub ?? '', 0.5],
      [(item.meta ?? []).join(' '), 0.55],
      [item.keywords ?? '', 0.42],
    ]
    let best = 0
    let marks: number[] = []
    for (const [text, weight] of fields) {
      if (!text) continue
      const hit = fuzzyMatch(query, text)
      if (hit && hit.score * weight > best) {
        best = hit.score * weight
        marks = text === item.title ? hit.marks : []
      }
    }
    if (best > 0) out.push({ item, score: best, marks })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

export const KIND_LABEL: Record<FinderKind, string> = {
  world: 'World',
  cast: 'Cast',
  series: 'Series',
  video: 'Video',
  jump: 'Jump',
  action: 'Do',
}
