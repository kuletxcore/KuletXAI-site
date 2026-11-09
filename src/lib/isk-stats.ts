import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { STORIES, type Story, type TrimzSeries } from '#/data/content'
import { isLite } from '#/lib/perf'

/**
 * Live IsekaiZero and Trimz counts. Pages render the numbers baked into content.ts (so server HTML and hydration match), then
 * swap in /api/isk-stats, re-checked on load, when the tab comes back, and on a timer while the page is open.
 */
export type IskCounts = { messages?: number; chats?: number; likes?: number }
export type TrimzCounts = { views?: number; episodes?: number }
export type IskStats = { t: number; stories: Record<string, IskCounts>; trimz?: Record<string, TrimzCounts> }
export type CountKey = keyof IskCounts

const KEY = 'kx_isk_stats'
const RECHECK_MS = 10 * 60 * 1000

let stats: IskStats | null = null
let checkedAt = 0
let started = false
let pending: Promise<void> | null = null
let timer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<() => void>()

function valid(v: unknown): v is IskStats {
  return !!v && typeof (v as IskStats).t === 'number' && typeof (v as IskStats).stories === 'object'
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { stats?: unknown; checkedAt?: number } | null
    if (raw && valid(raw.stats)) {
      stats = raw.stats
      checkedAt = raw.checkedAt ?? 0
    }
  } catch {
    /* nothing saved */
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ stats, checkedAt }))
  } catch {
    /* not persisted */
  }
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(() => void check(), Math.max(60_000, checkedAt + RECHECK_MS - Date.now()))
}

async function check() {
  if (pending) return pending
  pending = (async () => {
    try {
      const res = await fetch('/api/isk-stats', { headers: { accept: 'application/json' } })
      if (!res.ok) return
      const next: unknown = await res.json()
      if (!valid(next)) return
      checkedAt = Date.now()
      if (!stats || next.t !== stats.t) {
        stats = next
        listeners.forEach((l) => l())
      }
      save()
    } catch {
      /* offline: keep what we have */
    } finally {
      pending = null
      schedule()
    }
  })()
  return pending
}

function start() {
  if (started) return
  started = true
  if (Date.now() - checkedAt >= RECHECK_MS) void check()
  else schedule()
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - checkedAt >= RECHECK_MS) void check()
  })
}

if (typeof window !== 'undefined') load()

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Latest live stats (null during SSR/hydration and before any data). */
export function useIskStats() {
  const s = useSyncExternalStore(
    subscribe,
    () => stats,
    () => null,
  )
  useEffect(start, [])
  return s
}

/**
 * One count for a story: the live number, never below the baked-in one (a
 * glitchy API reply can't show a drop to zero).
 */
export function countOf(s: IskStats | null, story: Story, key: CountKey) {
  const live = s?.stories[story.slug]?.[key]
  return typeof live === 'number' ? Math.max(live, story[key]) : story[key]
}

/** A Trimz series count, live when known. Views never drop below the baked-in number; episodes follow Trimz. */
export function trimzCountOf(s: IskStats | null, t: TrimzSeries, key: keyof TrimzCounts) {
  const live = s?.trimz?.[t.slug]?.[key]
  if (typeof live !== 'number') return t[key]
  return key === 'views' ? Math.max(live, t.views) : live || t.episodes
}

export function totalOf(s: IskStats | null, key: CountKey) {
  return STORIES.reduce((n, story) => n + countOf(s, story, key), 0)
}

const fmt = new Intl.NumberFormat('en-US')
export const formatCount = (n: number) => fmt.format(n)

/**
 * A number that counts up when a live value arrives. Lite mode and reduced
 * motion get the new number straight away.
 */
export function useCountUp(value: number) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = from.current
    from.current = value
    if (start === value) return
    const still = isLite() || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still || document.visibilityState !== 'visible') {
      setShown(value)
      return
    }
    const t0 = performance.now()
    const dur = 900
    let raf = requestAnimationFrame(function tick(now) {
      // a frame's timestamp can be a little before t0; unclamped, the ease swings the number below the start (even negative)
      const p = Math.max(0, Math.min(1, (now - t0) / dur))
      const eased = 1 - (1 - p) ** 3
      setShown(Math.round(start + (value - start) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    })
    return () => {
      cancelAnimationFrame(raf)
      setShown(value)
    }
  }, [value])
  return shown
}
