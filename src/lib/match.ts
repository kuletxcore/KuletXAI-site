import { STORIES } from '#/data/content'
export const MATCH_KEY = 'kx_match'
export type Match = { slug: string; why: string[]; at: number }
export function readMatch(): Match | null {
  if (typeof window === 'undefined') return null
  try {
    const v = JSON.parse(localStorage.getItem(MATCH_KEY) ?? 'null') as Match | null
    return v && typeof v.slug === 'string' && Array.isArray(v.why) && STORIES.some((s) => s.slug === v.slug) ? v : null
  } catch { return null }
}
export function writeMatch(m: Match) {
  try { localStorage.setItem(MATCH_KEY, JSON.stringify(m)); window.dispatchEvent(new CustomEvent('kx:match', { detail: m })) } catch { /* still shown */ }
}
