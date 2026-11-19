import { STORIES } from '#/data/content'

/** The Matchmaker's last verdict (src/components/world-dealer.tsx). The Session Dock keeps selling it. */
export const MATCH_KEY = 'kx_match'
export type Match = { slug: string; why: string[]; at: number }

export function readMatch(): Match | null {
  if (typeof window === 'undefined') return null
  try {
    const v = JSON.parse(localStorage.getItem(MATCH_KEY) ?? 'null') as Match | null
    if (!v || typeof v.slug !== 'string' || !Array.isArray(v.why)) return null
    if (!STORIES.some((s) => s.slug === v.slug)) return null
    return v
  } catch {
    return null
  }
}

export function writeMatch(match: Match) {
  try {
    localStorage.setItem(MATCH_KEY, JSON.stringify(match))
    window.dispatchEvent(new CustomEvent('kx:match', { detail: match }))
  } catch {
    /* the match still shows; it just is not remembered */
  }
}
