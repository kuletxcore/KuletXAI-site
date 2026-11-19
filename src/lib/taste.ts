import { useSyncExternalStore } from 'react'
import { STORIES } from '#/data/content'
import type { Story } from '#/data/content'

// What the site remembers about a visitor's taste: which worlds they opened, how often and how recently.
// It only ever lives in their browser, and one button forgets it (src/components/for-you.tsx).

const KEY = 'kx_taste'
const TTL_MS = 180 * 24 * 60 * 60 * 1000

export type TasteEntry = { at: number; n: number }
export type Taste = Record<string, TasteEntry>
export type Pick = { story: Story; score: number; reason: string; tags: string[] }

const EMPTY: Taste = {}
let taste: Taste = EMPTY

function read(): Taste {
  if (typeof window === 'undefined') return EMPTY
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as unknown
    if (!raw || typeof raw !== 'object') return EMPTY
    const out: Taste = {}
    for (const [slug, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!STORIES.some((s) => s.slug === slug)) continue
      const e = v as Partial<TasteEntry>
      if (typeof e?.at !== 'number' || Date.now() - e.at > TTL_MS) continue
      out[slug] = { at: e.at, n: Math.max(1, Math.min(50, Number(e.n) || 1)) }
    }
    return out
  } catch {
    return EMPTY
  }
}

taste = read()

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function save(next: Taste) {
  taste = next
  try {
    if (Object.keys(next).length) localStorage.setItem(KEY, JSON.stringify(next))
    else localStorage.removeItem(KEY)
  } catch {
    /* no storage: the taste only lasts this visit */
  }
  notify()
}

/** A world was opened (hub visit, or a quick look's play link). */
export function recordOpen(slug: string) {
  if (typeof window === 'undefined') return
  const prev = taste[slug]
  save({ ...taste, [slug]: { at: Date.now(), n: (prev?.n ?? 0) + 1 } })
}

export function forgetTaste() {
  save({})
}

export function useTaste() {
  return useSyncExternalStore(
    subscribe,
    () => taste,
    () => EMPTY,
  )
}

export const tasteCount = (t: Taste) => Object.keys(t).length

/** Tags and ratings this visitor leans toward, weighted by how often and how recently they opened a world. */
export function tasteProfile(t: Taste) {
  const tags = new Map<string, number>()
  const ratings = new Map<string, number>()
  let total = 0
  for (const [slug, e] of Object.entries(t)) {
    const story = STORIES.find((s) => s.slug === slug)
    if (!story) continue
    const days = (Date.now() - e.at) / 86_400_000
    const weight = (1 + Math.min(3, e.n - 1) * 0.5) / (1 + days / 60)
    total += weight
    for (const tag of story.tags) tags.set(tag, (tags.get(tag) ?? 0) + weight)
    ratings.set(story.rating, (ratings.get(story.rating) ?? 0) + weight)
  }
  const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
  return { tags: topTags, ratings, total }
}

/**
 * The next worlds to deal. Shared tags and the same rating count up, a world already opened counts down
 * (it can still come back when it clearly leads), and a world never opened gets a freshness point so the
 * shelf keeps moving.
 */
export function recommend(t: Taste, limit = 3): Pick[] {
  const opened = Object.keys(t)
  if (!opened.length) return []
  const profile = tasteProfile(t)
  const strongest = opened
    .map((slug) => ({ story: STORIES.find((s) => s.slug === slug), weight: t[slug].n }))
    .filter((x): x is { story: Story; weight: number } => !!x.story)
    .sort((a, b) => b.weight - a.weight)[0]?.story
  const out: Pick[] = []
  for (const story of STORIES) {
    const shared = story.tags.filter((tag) => profile.tags.includes(tag))
    const seen = t[story.slug]
    // A world's own tags say less about what comes next, so a repeat visit scores them at a discount
    const tagScore = shared.reduce((n, tag) => n + (profile.tags[0] === tag ? 4 : 2.4), 0) * (seen ? 0.4 : 1)
    const ratingScore = (profile.ratings.get(story.rating) ?? 0) * 1.5
    let score = tagScore + ratingScore
    if (seen) score -= 3
    else score += 1.2
    if (score <= 0) continue

    // The opened world this one has most in common with, for the "because you opened…" line
    let source: Story | undefined
    let best = 0
    for (const slug of opened) {
      const from = STORIES.find((s) => s.slug === slug)
      const hits = from ? from.tags.filter((tag) => story.tags.includes(tag)).length : 0
      if (hits > best) {
        best = hits
        source = from
      }
    }
    const reason = seen
      ? `Back for another run${shared.length ? ` · more ${shared.slice(0, 2).join(', ')}` : ''}`
      : shared.length && source
        ? `Because you opened ${source.title.split(':')[0]} · more ${shared.slice(0, 2).join(', ')}`
        : strongest && strongest.rating === story.rating
          ? `Because you opened ${strongest.title.split(':')[0]} · both ${story.rating}`
          : `A different kind of world${strongest ? ` after ${strongest.title.split(':')[0]}` : ''}`
    out.push({ story, score, reason, tags: shared.slice(0, 2) })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** The profile in plain words, for the band's "what it knows" line. */
export function tasteWords(t: Taste, limit = 4): string[] {
  return tasteProfile(t).tags.slice(0, limit)
}
