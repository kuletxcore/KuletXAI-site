import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { randInt } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * GODSMARKED — BORROWED DIVINITY.
 * The costume does not come off. Every power you spend is borrowed and the lender wants it back, so the run is a
 * choice between being seen and being safe.
 *
 * Mechanic = premise: a resource that drains while you use it, and a mask that costs you either way.
 */

type Half = { left: string; right: string }

const PAIRS: Half[] = [
  { left: 'a bus doing 60', right: 'the bus, politely re-routed' },
  { left: 'a shout in an alley', right: 'the alley, holding its breath' },
  { left: 'four men, one knife', right: 'one man, no knife' },
  { left: 'a rooftop, too far', right: 'the rooftop, closer' },
  { left: 'a name you wanted', right: 'the name, unread' },
]

const POWER = 100

export function GodsmarkedGame({ finish }: GameProps) {
  const [power, setPower] = useState(POWER)
  const [pair, setPair] = useState(PAIRS[0])
  const [round, setRound] = useState(1)
  const [saved, setSaved] = useState(0)
  const [spent, setSpent] = useState(0)
  const [seen, setSeen] = useState(0)
  const [beats, setBeats] = useState<string[]>([])

  const done = useRef(false)
  const powerRef = useRef(power)
  powerRef.current = power
  const savedRef = useRef(saved)
  savedRef.current = saved
  const spentRef = useRef(spent)
  spentRef.current = spent
  const seenRef = useRef(seen)
  seenRef.current = seen

  // The costume leaks power on its own: standing still is not free
  useEffect(() => {
    if (done.current) return
    const id = window.setInterval(() => setPower((p) => Math.max(0, p - 1.1)), 500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (power > 0 || done.current) return
    done.current = true
    const score = Math.round(Math.max(0, Math.min(100, savedRef.current * 18 + (POWER - spentRef.current) * 0.2 - seenRef.current * 4)))
    finish({
      score,
      verdict:
        score >= 85
          ? 'Nobody saw the glow. Everybody saw the result.'
          : score >= 55
            ? 'The city is fine. The city is asking questions.'
            : 'You were very bright, very briefly, and everyone knows your name.',
      stats: [
        { label: 'saves', value: String(savedRef.current) },
        { label: 'seen', value: String(seenRef.current) },
        { label: 'borrowed', value: `${Math.round(spentRef.current)}` },
      ],
    })
  }, [power, finish])

  const use = (loud: boolean, text: string) => {
    if (done.current) return
    sfx(loud ? 'enter' : 'nav')
    const cost = loud ? 22 : 9
    setPower((p) => Math.max(0, p - cost))
    setSpent((s) => s + cost)
    if (loud) setSeen((n) => n + 1)
    setSaved((n) => n + (loud ? 1 : Math.random() > 0.45 ? 1 : 0))
    setBeats((b) => [...b.slice(-2), text])
    if (round >= 6) {
      done.current = true
      window.setTimeout(() => {
        const score = Math.round(Math.max(0, Math.min(100, savedRef.current * 18 + (POWER - spentRef.current) * 0.2 - seenRef.current * 4)))
        finish({
          score,
          verdict:
            score >= 85
              ? 'Nobody saw the glow. Everybody saw the result.'
              : score >= 55
                ? 'The city is fine. The city is asking questions.'
                : 'You were very bright, very briefly, and everyone knows your name.',
          stats: [
            { label: 'saves', value: String(savedRef.current) },
            { label: 'seen', value: String(seenRef.current) },
            { label: 'borrowed', value: `${Math.round(spentRef.current)}` },
          ],
        })
      }, 500)
      return
    }
    setRound((r) => r + 1)
    setPair(PAIRS[randInt(0, PAIRS.length - 1)])
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between font-mono text-[10px] text-white/50">
        <span>borrowed power</span>
        <span className={power < 25 ? 'text-red-300' : 'text-amber-200'}>{Math.round(power)}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full transition-[width] duration-300 ${power < 25 ? 'bg-red-400' : 'bg-amber-300'}`} style={{ width: `${power}%` }} />
      </div>

      <div className="relative mt-3 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#0a0c14] p-4">
        <p className="font-mono text-[10px] tracking-wide text-white/40 uppercase">incoming · round {round}/6</p>
        <p className="mt-2 text-[15px] leading-snug text-white/90">{pair.left}</p>
        {beats.length > 0 && (
          <ul className="mt-3 space-y-1">
            {beats.map((b, i) => (
              <li key={i} className="font-mono text-[11px] text-white/55">
                → {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => use(false, 'quiet hands. the alley never notices.')} className="ps5-round !h-auto !w-auto !rounded-xl px-3 py-3 text-left font-mono text-[11px] leading-tight">
          quiet hands
          <span className="mt-0.5 block text-[9px] text-white/45">−9 power · unseen</span>
        </button>
        <button type="button" onClick={() => use(true, 'the whole street turns to look at you.')} className="ps5-round !h-auto !w-auto !rounded-xl px-3 py-3 text-left font-mono text-[11px] leading-tight">
          full divinity
          <span className="mt-0.5 block text-[9px] text-white/45">−22 power · seen</span>
        </button>
      </div>
    </div>
  )
}
