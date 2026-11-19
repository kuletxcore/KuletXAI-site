import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { randInt } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * THE PROBLEM SPAWNER — CONTAIN IT.
 * Every roll drops a permanent problem into Meridian. You cannot choose what appears; you only choose what you
 * spend containing it. The roll never asks first.
 *
 * Mechanic = premise: no aim, no undo, and a budget of containment that is always slightly too small.
 */

type Roll = { id: number; x: number; y: number; label: string; cost: number; danger: number }

const THINGS = [
  { label: 'a sword that hums', cost: 1, danger: 2 },
  { label: 'a stranger in your coat', cost: 2, danger: 3 },
  { label: 'a building that was not there', cost: 4, danger: 5 },
  { label: 'something with too many joints', cost: 3, danger: 4 },
  { label: 'the smell of a storm', cost: 1, danger: 1 },
  { label: 'a door, standing alone', cost: 2, danger: 2 },
]

const BUDGET = 12
const ROLLS = 6

export function SpawnerGame({ finish }: GameProps) {
  const [budget, setBudget] = useState(BUDGET)
  const [rolls, setRolls] = useState<Roll[]>([])
  const [contained, setContained] = useState<number[]>([])
  const [leaked, setLeaked] = useState(0)
  const [announce, setAnnounce] = useState<string | null>(null)
  const [left, setLeft] = useState(ROLLS)

  const done = useRef(false)
  const nextId = useRef(0)
  const leakedRef = useRef(0)
  leakedRef.current = leaked
  const budgetRef = useRef(budget)
  budgetRef.current = budget

  // A roll arrives on a timer; it stays on the floor until you deal with it or the round ends
  useEffect(() => {
    if (left <= 0) return
    const id = window.setTimeout(() => {
      const t = THINGS[randInt(0, THINGS.length - 1)]
      const r: Roll = { id: nextId.current++, x: randInt(6, 70), y: randInt(8, 60), ...t }
      setRolls((list) => [...list, r])
      setAnnounce(`rolling… ${t.label}`)
      sfx('tab')
      setLeft((n) => n - 1)
    }, 1500)
    return () => window.clearTimeout(id)
  }, [left])

  // Every roll that is still loose when the dust settles becomes a permanent problem
  useEffect(() => {
    if (left > 0 || !done.current) return
    const score = Math.max(0, Math.min(100, 100 - leakedRef.current * 16 - (BUDGET - budgetRef.current) * 1.5))
    finish({
      score,
      verdict:
        score >= 85
          ? 'Meridian barely noticed. It will notice next week.'
          : score >= 55
            ? 'Contained, mostly. Some of it is still out there being permanent.'
            : 'That is a lot of permanent. Meridian has started keeping a list.',
      stats: [
        { label: 'contained', value: String(contained.length) },
        { label: 'loose', value: String(leakedRef.current) },
        { label: 'budget left', value: String(Math.max(0, budgetRef.current)) },
      ],
    })
  }, [left, contained.length, finish])

  const contain = (r: Roll) => {
    if (budgetRef.current < r.cost) {
      sfx('back')
      setAnnounce('not enough containment left')
      return
    }
    sfx('enter')
    setBudget((b) => b - r.cost)
    setRolls((list) => list.filter((x) => x.id !== r.id))
    setContained((list) => [...list, r.id])
    setAnnounce(`contained: ${r.label}`)
  }

  const letItBe = (r: Roll) => {
    sfx('back')
    setRolls((list) => list.filter((x) => x.id !== r.id))
    setLeaked((n) => n + 1)
    setAnnounce(`left running: ${r.label}`)
  }

  // Clock out: everything still on the floor leaks
  const clockOut = () => {
    if (done.current) return
    done.current = true
    setLeaked((n) => n + rolls.length)
    setRolls([])
    setLeft(0)
  }

  const danger = rolls.reduce((n, r) => n + r.danger, 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between font-mono text-[10px] text-white/50">
        <span>rolls left {left}</span>
        <span className={budget <= 3 ? 'text-amber-300' : ''}>containment {budget}/{BUDGET}</span>
        <span className={leaked ? 'text-red-300' : ''}>loose {leaked}</span>
      </div>

      <div className="relative mt-2 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0c0f14]">
        {/* The field the problems land on */}
        {rolls.map((r) => {
          const affordable = budget >= r.cost
          return (
            <div
              key={r.id}
              className="absolute w-[9rem] rounded-lg border border-amber-300/40 bg-amber-300/10 p-2 text-[11px] leading-tight text-amber-50"
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
            >
              <p>{r.label}</p>
              <div className="mt-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => contain(r)}
                  disabled={!affordable}
                  className="rounded border border-white/25 px-1.5 py-0.5 font-mono text-[9px] disabled:opacity-40"
                >
                  contain {r.cost}
                </button>
                <button
                  type="button"
                  onClick={() => letItBe(r)}
                  className="rounded border border-white/20 px-1.5 py-0.5 font-mono text-[9px] text-white/60"
                >
                  leave
                </button>
              </div>
            </div>
          )
        })}
        {announce && (
          <p className="absolute inset-x-0 bottom-2 px-3 font-mono text-[10px] text-white/45">{announce}</p>
        )}
        {danger > 0 && (
          <div className="absolute top-2 right-2 rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[9px] text-red-200">
            field pressure {danger}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={clockOut}
        disabled={left > 0 && rolls.length === 0}
        className="ps5-cta mt-3 !py-3 disabled:opacity-40"
      >
        Clock out
      </button>
    </div>
  )
}
