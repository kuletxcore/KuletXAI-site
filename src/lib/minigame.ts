import type { ComponentType } from 'react'

/**
 * The mini-apps behind the hub's PLAY tile: each world gets a 20-second arcade piece whose mechanic is the premise.
 * Acolytes is juggling cover and violence, Colossus is the discipline of growing, the Table is load-bearing balance.
 *
 * Games are self-contained: they render their own playfield, decide when they're over, and report a 0–100 score
 * plus a verdict line. The shell (minigame/shell.tsx) owns the launch sequence, the frame and the rank.
 */

export type GameResult = {
  /** 0–100 */
  score: number
  /** One line of flavour under the rank, written for that world */
  verdict: string
  /** Two or three receipts from the run */
  stats: { label: string; value: string }[]
}

export type GameProps = {
  finish: (result: GameResult) => void
  /** True when the run should skip decoration: reduced motion or Lite mode */
  calm: boolean
}

export type MiniGame = {
  /** Matches a story slug in src/data/content.ts */
  slug: string
  /** Shown on the launch card, in the console idiom */
  name: string
  tagline: string
  /** The premise in one line, so the game teaches the world before the first press */
  premise: string
  how: string[]
  Component: ComponentType<GameProps>
}

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D'

export const rankOf = (score: number): Rank =>
  score >= 90 ? 'S' : score >= 75 ? 'A' : score >= 55 ? 'B' : score >= 30 ? 'C' : 'D'

export const RANK_LINE: Record<Rank, string> = {
  S: 'Flawless. The world noticed.',
  A: 'Strong run. That is how it is done.',
  B: 'You held it together.',
  C: 'Rough, but you are still standing.',
  D: 'The world won that one.',
}

const BEST_PREFIX = 'kx_arcade_best_'

/** Best score per world, so the tile can show a rank worth beating. */
export function readBest(slug: string): number | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(BEST_PREFIX + slug)
    const n = raw === null ? NaN : Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export function writeBest(slug: string, score: number) {
  try {
    const prev = readBest(slug)
    if (prev === null || score > prev) window.localStorage.setItem(BEST_PREFIX + slug, String(Math.round(score)))
  } catch {
    /* private mode: nothing is remembered, the run still counts */
  }
}

/* Small maths helpers the games share */

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
export const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
export const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1))
export const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)]
