import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { randInt } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * ACOLYTES — THE FRONT.
 * The maid café runs on one rule: the sign stays up and the floor stays calm. Orders that go cold cost the house
 * money; anything violent costs it the block. You flip between the two faces of the job with one button.
 *
 * Mechanic = premise: every tap is the choice the story is about, service or force.
 */

type Kind = 'order' | 'threat'
type Card = { id: number; kind: Kind; x: number; y: number; born: number; label: string }

const ROUND_MS = 22_000
const LIFE_MS = 1500
const ORDERS = ['matcha cloud', 'fruit tart', 'black coffee', 'two sugars', 'the usual']
const THREATS = ['a hand in a coat', 'the back door', 'a known face', 'a bad wire', 'someone counting exits']

export function AcolytesGame({ finish, calm }: GameProps) {
  const [mode, setMode] = useState<'service' | 'force'>('service')
  const [cards, setCards] = useState<Card[]>([])
  const [left, setLeft] = useState<(typeof ROUND_MS) | number>(ROUND_MS)
  const [tally, setTally] = useState({ served: 0, cleared: 0, burned: 0 })
  const [flash, setFlash] = useState<null | 'good' | 'bad'>(null)

  const modeRef = useRef(mode)
  modeRef.current = mode
  const done = useRef(false)
  const nextId = useRef(0)

  // Report once when the clock runs out
  useEffect(() => {
    if (left > 0 || done.current) return
    done.current = true
    const good = tally.served + tally.cleared
    const score = Math.round(Math.max(0, Math.min(100, (good * 100) / Math.max(1, good + tally.burned))))
    finish({
      score,
      verdict:
        score >= 90
          ? 'The block never even looked up. That is the job.'
          : score >= 60
            ? 'A few scenes. Nothing the neighbours will remember.'
            : 'The street is talking. So is the Agency.',
      stats: [
        { label: 'served', value: String(tally.served) },
        { label: 'cleared', value: String(tally.cleared) },
        { label: 'scenes', value: String(tally.burned) },
      ],
    })
  }, [left, tally, finish])

  // The clock
  useEffect(() => {
    const id = window.setInterval(() => setLeft((t) => Math.max(0, t - 100)), 100)
    return () => window.clearInterval(id)
  }, [])

  // Cards arrive, age and disappear. Each one that times out is a scene.
  useEffect(() => {
    if (left <= 0) return
    const spawn = window.setInterval(() => {
      setCards((list) => {
        if (list.length >= 5) return list
        const kind: Kind = Math.random() < 0.55 ? 'order' : 'threat'
        const fresh: Card = {
          id: nextId.current++,
          kind,
          x: randInt(6, 78),
          y: randInt(10, 68),
          born: Date.now(),
          label: kind === 'order' ? ORDERS[randInt(0, ORDERS.length - 1)] : THREATS[randInt(0, THREATS.length - 1)],
        }
        return [...list, fresh]
      })
    }, calm ? 1100 : 780)
    return () => window.clearInterval(spawn)
  }, [left, calm])

  useEffect(() => {
    const age = window.setInterval(() => {
      const now = Date.now()
      setCards((list) => {
        const gone = list.filter((c) => now - c.born > LIFE_MS)
        if (gone.length) {
          setTally((t) => ({ ...t, burned: t.burned + gone.length }))
          sfx('back')
          setFlash('bad')
          window.setTimeout(() => setFlash(null), 220)
        }
        return list.filter((c) => now - c.born <= LIFE_MS)
      })
    }, 120)
    return () => window.clearInterval(age)
  }, [])

  const flap = useCallback(() => {
    if (left <= 0) return
    sfx('tab')
    setMode((m) => (m === 'service' ? 'force' : 'service'))
  }, [left])

  const hit = (card: Card) => {
    if (left <= 0) return
    const right = (card.kind === 'order' && modeRef.current === 'service') || (card.kind === 'threat' && modeRef.current === 'force')
    setCards((list) => list.filter((c) => c.id !== card.id))
    if (right) {
      sfx('enter')
      setFlash('good')
      setTally((t) => (card.kind === 'order' ? { ...t, served: t.served + 1 } : { ...t, cleared: t.cleared + 1 }))
    } else {
      sfx('back')
      setFlash('bad')
      setTally((t) => ({ ...t, burned: t.burned + 1 }))
    }
    window.setTimeout(() => setFlash(null), 220)
  }

  // One button is the whole game: Space flips the face, Enter serves/clears whatever is first
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        flap()
      } else if (e.key === 'Enter' && cards[0]) {
        e.preventDefault()
        hit(cards[0])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flap, cards])

  const timePct = (left / ROUND_MS) * 100

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-white/80 transition-[width] duration-100" style={{ width: `${timePct}%` }} />
        </div>
        <span className="font-mono text-xs text-white/60 tabular-nums">{(left / 1000).toFixed(1)}s</span>
      </div>

      <div
        className={`relative flex-1 overflow-hidden rounded-xl border transition-colors ${
          flash === 'good' ? 'border-emerald-300/70' : flash === 'bad' ? 'border-red-400/70' : 'border-white/10'
        } ${mode === 'force' ? 'bg-[#1a0b10]' : 'bg-[#0b1210]'}`}
        style={{ minHeight: '13rem' }}
      >
        <p className="absolute top-2 left-3 font-mono text-[10px] tracking-wide text-white/40 uppercase">
          {mode === 'force' ? 'after hours · clear the floor' : 'front of house · keep it calm'}
        </p>
        {/* The shutter: the flat lighting change is the tell that the face has flipped */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: mode === 'force' ? 1 : 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(229,22,43,0.22), transparent 70%)',
          }}
        />
        {cards.map((c) => {
          const age = (Date.now() - c.born) / LIFE_MS
          const left = Math.max(0, 1 - age)
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => hit(c)}
              className={`absolute w-[8.5rem] rounded-lg border px-2 py-1.5 text-left text-[11px] leading-tight transition-transform hover:scale-[1.03] ${
                c.kind === 'order'
                  ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-50'
                  : 'border-red-400/50 bg-red-500/15 text-red-50'
              }`}
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
            >
              <span className="block font-mono text-[9px] tracking-wide uppercase opacity-70">
                {c.kind === 'order' ? 'order' : 'threat'}
              </span>
              {c.label}
              <span className="mt-1 block h-0.5 w-full rounded" style={{ background: `rgba(255,255,255,${0.15 + left * 0.5})` }} />
            </button>
          )
        })}
        {left <= 0 && (
          <p className="absolute inset-0 grid place-items-center font-mono text-sm text-white/60">closing time</p>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={flap}
          className={`ps5-cta grow !py-3 ${mode === 'force' ? '!bg-red-500/90' : '!bg-emerald-400/90'} !text-black`}
        >
          {mode === 'service' ? '◻ Service · Space' : '✕ Force · Space'}
        </button>
      </div>
      <p className="mt-2 flex justify-between font-mono text-[10px] text-white/50">
        <span>served {tally.served}</span>
        <span>cleared {tally.cleared}</span>
        <span className={tally.burned ? 'text-red-300' : ''}>scenes {tally.burned}</span>
      </p>
    </div>
  )
}
