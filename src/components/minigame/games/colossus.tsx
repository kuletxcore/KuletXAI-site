import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { clamp } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * COLOSSUS PROTOCOL — THE SHIFT.
 * You grow to meet a kaiju, and growth is a resource, not a button you spam: below its height you lose, above it you
 * burn resonance. The story's whole doctrine — the size, the ten-minute cost, the acceptable losses — is the rules.
 *
 * Mechanic = premise: the target rises, the burn rises, and you have to be exactly big enough and no bigger.
 */

type Foe = { height: number; name: string }

const FOES: Foe[] = [
  { height: 30, name: 'Tier One · wader' },
  { height: 55, name: 'Tier Two · breaker' },
  { height: 80, name: 'Tier Three · city-ender' },
  { height: 110, name: 'Tier Three · twin wake' },
]

const BURN_MAX = 100

export function ColossusGame({ finish }: GameProps) {
  const [idx, setIdx] = useState(0)
  const [me, setMe] = useState(1.7)
  const [burn, setBurn] = useState(0)
  const [phase, setPhase] = useState<'grow' | 'hold' | 'won' | 'lost'>('grow')
  const [log, setLog] = useState<string[]>([])
  const [seconds, setSeconds] = useState(0)

  const meRef = useRef(me)
  meRef.current = me
  const burnRef = useRef(burn)
  burnRef.current = burn
  const foe = FOES[idx]
  const done = useRef(false)

  // Growing costs resonance, proportionally: the bigger the shift the hotter the burn
  const grow = useCallback(() => {
    if (phase !== 'grow') return
    sfx('nav')
    setMe((m) => {
      const next = Math.min(300, m * 1.45)
      setBurn((b) => Math.min(BURN_MAX, b + (next > 150 ? 7 : 4)))
      return next
    })
  }, [phase])

  const shrink = useCallback(() => {
    if (phase !== 'grow') return
    sfx('back')
    setMe((m) => Math.max(1.7, m / 1.45))
    setBurn((b) => Math.max(0, b - 2))
  }, [phase])

  const commit = () => {
    if (phase !== 'grow') return
    const ratio = meRef.current / foe.height
    if (ratio < 0.9) {
      sfx('back')
      setPhase('lost')
      setLog((l) => [...l, `${foe.name} stepped over you at ${Math.round(meRef.current)} m.`])
    } else if (ratio > 1.6) {
      sfx('back')
      setBurn((b) => Math.min(BURN_MAX, b + 30))
      setPhase('lost')
      setLog((l) => [...l, `You came in at ${Math.round(meRef.current)} m. Resonance burn took the ward.`])
    } else {
      sfx('enter')
      setPhase('hold')
    }
  }

  // Holding: the burn climbs while you stay big. It's the ten-minute clock, compressed.
  useEffect(() => {
    if (phase !== 'hold') return
    const id = window.setInterval(() => {
      setBurn((b) => {
        const next = b + (meRef.current > 100 ? 3.4 : 2.2)
        if (next >= BURN_MAX) {
          if (!done.current) {
            done.current = true
            setPhase('lost')
            setLog((l) => [...l, 'Resonance burn. You come back down the hard way.'])
          }
          return BURN_MAX
        }
        return next
      })
      setSeconds((s) => s + 1)
    }, 220)
    return () => window.clearInterval(id)
  }, [phase])

  // Held long enough to count as a save
  useEffect(() => {
    if (phase !== 'hold' || seconds < 9) return
    setPhase('won')
    setLog((l) => [...l, `${foe.name} down. ${Math.round(meRef.current)} m of you held the line.`])
  }, [phase, seconds, foe.name])

  useEffect(() => {
    if (phase !== 'won' && phase !== 'lost') return
    if (idx < FOES.length - 1 && phase === 'won') {
      // Next foe: reset the body, keep the burn, so the run compounds like the story does
      const id = window.setTimeout(() => {
        done.current = false
        setIdx((i) => i + 1)
        setMe(1.7)
        setSeconds(0)
        setPhase('grow')
      }, 900)
      return () => window.clearTimeout(id)
    }
    // Run over
    const cleared = Math.max(0, idx + (phase === 'won' ? 1 : 0))
    const score = Math.round(clamp(cleared * 22 + (BURN_MAX - burnRef.current) * 0.2, 0, 100))
    finish({
      score,
      verdict:
        score >= 90
          ? 'Four tiers, nothing lost. The form with the blank line stays blank.'
          : score >= 60
            ? 'The city is standing. So are you, mostly.'
            : 'Reyes is already rewriting the doctrine around you.',
      stats: [
        { label: 'held', value: `${cleared}/${FOES.length}` },
        { label: 'final size', value: `${Math.round(meRef.current)} m` },
        { label: 'burn', value: `${Math.round(burnRef.current)}%` },
      ],
    })
  }, [phase, idx, finish, burn])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault()
        grow()
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault()
        shrink()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        commit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grow, shrink, phase])

  // Height on a log scale, so 1.7 m and 300 m are both legible
  const pct = (Math.log(me) / Math.log(300)) * 100
  const foePct = (Math.log(foe.height) / Math.log(300)) * 100
  const inBand = me / foe.height >= 0.9 && me / foe.height <= 1.6

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between font-mono text-[11px] text-white/60">
        <span>
          target · {foe.name} · <span className="text-white/90">{foe.height} m</span>
        </span>
        <span>{idx + 1}/{FOES.length}</span>
      </div>

      {/* The scale: your body against the thing in the water */}
      <div className="relative mt-3 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0a0d12]">
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-cyan-400/15 to-transparent" aria-hidden />
        <div className="absolute inset-y-4 left-6 w-px bg-white/15" aria-hidden />
        <div
          className="absolute left-4 w-8 rounded-t bg-red-400/80 transition-all duration-200"
          style={{ bottom: '2rem', height: `${foePct * 0.8}%` }}
          title={`${foe.height} m`}
        />
        <div
          className="absolute right-6 w-6 rounded-t bg-white/90 transition-all duration-200"
          style={{ bottom: '2rem', height: `${Math.max(2, pct * 0.8)}%` }}
          title={`you · ${Math.round(me)} m`}
        />
        <p className="absolute right-14 bottom-2 font-mono text-[11px] text-white/70">{Math.round(me)} m</p>
        <p className="absolute left-14 bottom-2 font-mono text-[11px] text-red-200">{foe.height} m</p>
        <div className={`absolute top-2 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 font-mono text-[10px] ${inBand ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/10 text-white/60'}`}>
          {inBand ? 'in the band' : me / foe.height < 0.9 ? 'too small' : 'too big'}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between font-mono text-[10px] text-white/50">
          <span>resonance burn</span>
          <span className={burn > 70 ? 'text-red-300' : ''}>{Math.round(burn)}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full transition-[width] duration-150 ${burn > 70 ? 'bg-red-400' : 'bg-amber-300'}`} style={{ width: `${burn}%` }} />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={grow} disabled={phase !== 'grow'} className="ps5-round !h-12 !w-auto grow !rounded-xl px-4 font-mono text-xs disabled:opacity-40">
          ▲ grow
        </button>
        <button type="button" onClick={shrink} disabled={phase !== 'grow'} className="ps5-round !h-12 !w-auto !rounded-xl px-4 font-mono text-xs disabled:opacity-40">
          ▼ shrink
        </button>
        <button type="button" onClick={commit} disabled={phase !== 'grow'} className="ps5-cta !py-3 grow disabled:opacity-40">
          Engage
        </button>
      </div>

      {log.length > 0 && <p className="mt-2 line-clamp-2 font-mono text-[10px] text-white/50">{log[log.length - 1]}</p>}
    </div>
  )
}
