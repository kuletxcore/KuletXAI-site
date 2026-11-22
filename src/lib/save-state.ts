import { STORIES } from '#/data/content'

// The hub saves the last world, tab and section; the home page offers CONTINUE from it. One slot, kept 120 days.

const KEY = 'kx_savestate'
const TTL_MS = 120 * 24 * 60 * 60 * 1000

export type SaveState = {
  slug: string
  /** Which hub tab was open: stories (default), trimz, youtube */
  tab?: 'trimz' | 'youtube'
  section?: string
  at: number
}

const VALID_SECTIONS = new Set(['overview', 'intro', 'cast', 'gallery', 'ost', 'trophies', 'world', 'watch'])
const VALID_SLUGS = new Set(STORIES.map((s) => s.slug))

export function readSave(): SaveState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<SaveState> | null
    if (!raw || typeof raw !== 'object') return null
    if (typeof raw.slug !== 'string' || !VALID_SLUGS.has(raw.slug)) return null
    if (typeof raw.at !== 'number' || !Number.isFinite(raw.at) || Date.now() - raw.at > TTL_MS) return null
    const save: SaveState = { slug: raw.slug, at: raw.at }
    if (raw.tab === 'trimz' || raw.tab === 'youtube') save.tab = raw.tab
    else if (typeof raw.section === 'string' && VALID_SECTIONS.has(raw.section)) save.section = raw.section
    return save
  } catch {
    return null
  }
}

export function writeSave(save: SaveState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    /* Private browsing blocks storage, so nothing is remembered */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* Same as above: no storage, nothing to clear */
  }
}

export function saveLabel(save: SaveState): string {
  const story = STORIES.find((s) => s.slug === save.slug)
  if (!story) return save.slug
  if (save.tab === 'trimz') return 'the series on Trimz'
  if (save.tab === 'youtube') return 'the videos'
  return (
    {
      overview: 'the overview',
      intro: 'the intro recording',
      cast: 'the cast files',
      gallery: 'the gallery',
      ost: 'the soundtrack',
      trophies: 'the trophy list',
      world: 'the world lore',
      watch: 'the watch guide',
    }[save.section ?? 'overview'] ?? 'the overview'
  )
}

/** Typed search params for a resume link (mirrors the hub's validated search shape). */
export function resumeSearch(save: SaveState): { tab?: 'trimz' | 'youtube'; section?: string } {
  if (save.tab) return { tab: save.tab }
  if (save.section && save.section !== 'overview') return { section: save.section }
  return {}
}

/** "just now" / "5m ago" / "3h ago" / "2d ago" */
export function agoLabel(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
