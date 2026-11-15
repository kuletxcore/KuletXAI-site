/**
 * BYOC — Bring Your Original Character. Every KuletX world is played as
 * you: your name, your archetype, the secret you carry in. The passport
 * never leaves this device — it is a personal artifact, not an account.
 */

const KEY = 'kx_byoc'
const TTL_MS = 365 * 24 * 60 * 60 * 1000

export type ByocPassport = {
  name: string
  archetype: string
  secret: string
  serial: string
  at: number
}

export const ARCHETYPES = [
  { id: 'saint', name: 'The Saint', epithet: 'You enter a room and the desperate find you.' },
  { id: 'ghost', name: 'The Ghost', epithet: 'Uninvited in. Unremembered out.' },
  { id: 'spark', name: 'The Spark', epithet: 'Chaos follows you like weather.' },
  { id: 'anchor', name: 'The Anchor', epithet: 'When everything falls, you are the wall.' },
  { id: 'blade', name: 'The Blade', epithet: 'One question. One perfect answer.' },
  { id: 'starless', name: 'The Starless', epithet: 'No name, no history. The story starts with you.' },
] as const

export type ArchetypeId = (typeof ARCHETYPES)[number]['id']
const VALID_ARCHETYPES = new Set<string>(ARCHETYPES.map((a) => a.id))

export const SECRETS = [
  'You once walked away from a life everyone wanted.',
  'Someone in your last story still knows your name.',
  'You keep your hands steady on purpose.',
  'You lie about being fine. Everyone buys it.',
  'You remember every face. You pretend not to.',
  'You ran from something. It let you.',
  'You chose the hard chair. You always do.',
  'You came in through the door nobody watches.',
  'You promised never to be the strongest one in the room — and broke it.',
  'You had never said this out loud until now.',
] as const

export const normalizeName = (raw: string): string =>
  raw
    .replace(/[\x00-\x1f\x7f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 22)

/** FNV-1a over the identity triple; stable per day so the card doesn't churn on re-forge */
export function serialFor(name: string, archetype: string, at: number): string {
  const seed = `${name.toLowerCase()}|${archetype}|${Math.floor(at / 86_400_000)}`
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `KX-${(h >>> 0).toString(36).toUpperCase().padStart(7, '0').slice(-7)}`
}

export function readByoc(): ByocPassport | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<ByocPassport> | null
    if (!raw || typeof raw !== 'object') return null
    if (typeof raw.name !== 'string') return null
    const name = normalizeName(raw.name)
    if (!name) return null
    if (typeof raw.archetype !== 'string' || !VALID_ARCHETYPES.has(raw.archetype)) return null
    if (typeof raw.secret !== 'string' || !raw.secret.trim() || raw.secret.length > 160) return null
    if (typeof raw.at !== 'number' || Date.now() - raw.at > TTL_MS) return null
    const serial = typeof raw.serial === 'string' && /^KX-[0-9A-Z]{7}$/.test(raw.serial) ? raw.serial : serialFor(name, raw.archetype, raw.at)
    return { name, archetype: raw.archetype, secret: raw.secret.trim(), serial, at: raw.at }
  } catch {
    return null
  }
}

export function forgeByoc(input: { name: string; archetype: string; secret: string }): ByocPassport | null {
  const name = normalizeName(input.name)
  if (!name || !VALID_ARCHETYPES.has(input.archetype)) return null
  const secret = input.secret.trim().slice(0, 160)
  if (!secret) return null
  const at = Date.now()
  const passport: ByocPassport = { name, archetype: input.archetype, secret, serial: serialFor(name, input.archetype, at), at }
  try {
    localStorage.setItem(KEY, JSON.stringify(passport))
  } catch {
    /* private mode: the console just won't keep it — fine */
  }
  return passport
}

export function clearByoc(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/** Fired on the window whenever the passport changes, so the home screen CTA can react without prop drilling */
export const BYOC_EVENT = 'kx-byoc'
export const announceByoc = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BYOC_EVENT))
}
