import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * I AM THE TABLE — LOAD-BEARING.
 * You are furniture. People put things on you without asking. Shift your weight to keep the stack from toppling
 * into the stranger who is monologuing on your surface.
 *
 * Mechanic = premise: a balance game where doing nothing is a choice and every object adds weight to one side.
 */

type Item = { id: number; side: -1 | 0 | 1; weight: string; glyph: string }

const OBJECTS: { glyph: string; weight: string }[] = [
  { glyph: '☕', weight: 'a hot mug' },
  { glyph: '🕯️', weight: 'a candle nobody paid for' },
  { glyph: '⚒️', weight: 'the hammer' },
  { glyph: '📜', weight: 'Form 12-C' },
  { glyph: '🍺', weight: 'somebody’s ale' },
  { glyph: '🪑', weight: 'Sir Reginald' },
]

const HOLD_MS = 24_000

export function TableGame({ finish, calm }: GameProps) {
  const [tilt, setTilt] = useState(0) // -100 … 100
  const [items, setItems] = useState<Item[]>([])
  const [left, setLeft] = useState(HOLD_MS)
  const [dropped, setDropped] = useState(0)
  const [held, setHeld] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const tiltRef = useRef(tilt)
  tiltRef.current = tilt
  const done = useRef(false)
  const nextId = useRef(0)

  // The stack pushes you over; you push back with the arrow keys
  useEffect(() => {
    const id = window.setInterval(() => {
      setTilt((t) => {
        const load = items.reduce((n, it) => n + it.side, 0)
        const drift = load * 1.35 + (calm ? 0 : Math.sin(Date.now() / 900) * 0.35)
        return Math.max(-100, Math.min(100, t + drift))
      })
      setLeft((l) => Math.max(0, l - 100))
    }, 100)
    return () => window.clearInterval(id)
  }, [items, calm])

  // Something new lands, and it lands off-centre
  useEffect(() => {
    if (left <= 0) return
    const id = window.setInterval(() => {
      const o = OBJECTS[Math.floor(Math.random() * OBJECTS.length)]
      const side: -1 | 0 | 1 = Math.random() < 0.2 ? 0 : Math.random() < 0.5 ? -1 : 1
      setItems((list) => [...list.slice(-5), { id: nextId.current++, side, ...o }])
      sfx('nav')
    }, 1600)
    return () => window.clearInterval(id)
  }, [left])

  // Toppling: a fall costs you, then the table gets a moment to settle
  useEffect(() => {
    if (Math.abs(tilt) < 100) return
    if (done.current) return
    setDropped((d) => d + 1)
    setTilt(0)
    setItems([])
    sfx('back')
    setToast('the stack went over · somebody is furious')
    const id = window.setTimeout(() => setToast(null), 1400)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tilt])

  useEffect(() => {
    if (left > 0 || done.current) return
    done.current = true
    const heldS = Math.round((HOLD_MS - left) / 1000)
    const score = Math.max(0, Math.min(100, 100 - dropped * 22 + Math.min(10, held / 4)))
    finish({
      score,
      verdict:
        score >= 90
          ? 'Not one thing moved. Barnaby is telling everyone.'
          : score >= 60
            ? 'A wobble or two. Furniture is allowed those.'
            : 'You are a table. Tables do not topple. Let us not speak of it.',
      stats: [
        { label: 'held', value: `${heldS}s` },
        { label: 'toppled', value: String(dropped) },
        { label: 'objects', value: String(items.length) },
      ],
    })
  }, [left, dropped, items.length, finish])

  const push = (dir: -1 | 1) => {
    if (left <= 0) return
    sfx('nav')
    setTilt((t) => Math.max(-100, Math.min(100, t + dir * 9)))
    setHeld((h) => h + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        push(-1)
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        push(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left])

  const risk = Math.abs(tilt) > 70

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-white/80 transition-[width] duration-100" style={{ width: `${(left / HOLD_MS) * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-white/60 tabular-nums">{(left / 1000).toFixed(1)}s</span>
      </div>

      <div className="relative mt-2 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#100d0a]">
        <p className="absolute top-2 left-3 font-mono text-[10px] tracking-wide text-white/40 uppercase">
          oak · four legs · load-bearing
        </p>

        {/* The table, tilting around its centre */}
        <div
          className="absolute inset-x-6 bottom-8 h-3 rounded-sm bg-amber-800/80 transition-transform duration-100"
          style={{ transform: `rotate(${tilt / 26}deg)`, boxShadow: '0 10px 24px rgba(0,0,0,0.5)' }}
        >
          {items.map((it, i) => (
            <span
              key={it.id}
              className="absolute -top-7 text-xl"
              style={{ left: `${50 + it.side * (18 + i * 5)}%`, transform: `translateX(-50%)` }}
              title={it.weight}
            >
              {it.glyph}
            </span>
          ))}
          <span className="absolute -top-16 left-1/2 -translate-x-1/2 text-2xl" aria-hidden>
            🧍
          </span>
        </div>

        {/* The safe band under the table */}
        <div className="absolute inset-x-10 bottom-2 h-4 rounded-sm border border-dashed border-white/15" aria-hidden />

        {toast && (
          <p className="absolute inset-x-0 bottom-24 text-center font-mono text-[11px] text-red-300">{toast}</p>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
        <button type="button" onClick={() => push(-1)} className="ps5-round !h-11 !w-auto !rounded-xl px-5 text-xs">
          ◀ lean
        </button>
        <span className={risk ? 'text-red-300' : 'text-white/50'}>
          tilt {Math.round(tilt)} · toppled {dropped}
        </span>
        <button type="button" onClick={() => push(1)} className="ps5-round !h-11 !w-auto !rounded-xl px-5 text-xs">
          lean ▶
        </button>
      </div>
    </div>
  )
}
