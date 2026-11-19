import { STORIES } from '#/data/content'

/** Ship 8: worlds a visitor bookmarks for later (kx_saved_worlds, newest first).
 *  Distinct from the hub's automatic save state: this one is a choice. */
const KEY = 'kx_saved_worlds'
export function readSavedWorlds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && STORIES.some((s) => s.slug === x)) : []
  } catch { return [] }
}
export function toggleSavedWorld(slug: string): string[] {
  const cur = readSavedWorlds()
  const next = cur.includes(slug) ? cur.filter((s) => s !== slug) : [slug, ...cur]
  try { localStorage.setItem(KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent('kx:saved', { detail: next })) } catch { /* still toggles in memory elsewhere */ }
  return next
}
