import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * TRIMZ — THE CUT.
 * The series exists because somebody chose which four seconds matter. Cut the beat so the episode lands on the
 * moment, not on the establishing shot.
 *
 * Mechanic = premise: the same craft the Trimz episodes are made with — pick the beat, then pick the out.
 */

type Beat = { id: number; label: string; good: boolean }

const CLIPS: { title: string; beats: Beat[] }[] = [
  {
    title: 'Acolytes ep. 02 — "the sign"',
    beats: [
      { id: 0, label: 'café exterior, morning', good: false },
      { id: 1, label: 'she flips the sign to CLOSED', good: true },
      { id: 2, label: 'a tray of clean cups', good: false },
      { id: 3, label: 'the back room light goes out', good: false },
    ],
  },
  {
    title: 'Colossus ep. 01 — "the shift"',
    beats: [
      { id: 0, label: 'radar blip, coastal rift', good: false },
      { id: 1, label: 'her boots leave the deck', good: true },
      { id: 2, label: 'a form with one blank line', good: false },
      { id: 3, label: 'seagulls, unbothered', good: false },
    ],
  },
  {
    title: 'I AM THE TABLE ep. 03 — "the hammer"',
    beats: [
      { id: 0, label: 'monologue, at length', good: false },
      { id: 1, label: 'the hammer lands and bounces', good: true },
      { id: 2, label: 'a stool, destroyed', good: false },
      { id: 3, label: 'termites, retreating', good: false },
    ],
  },
]

export function TrimzGame({ finish }: GameProps) {
  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const done = useRef(false)
  const scoreRef = useRef(0)
  scoreRef.current = score

  const clip = CLIPS[Math.min(round, CLIPS.length - 1)]

  const choose = (b: Beat) => {
    if (picked !== null || done.current) return
    setPicked(b.id)
    const next = scoreRef.current + (b.good ? 33 : 0)
    setScore(next)
    sfx(b.good ? 'enter' : 'back')
    window.setTimeout(() => {
      if (round + 1 < CLIPS.length) {
        setRound((r) => r + 1)
        setPicked(null)
      } else if (!done.current) {
        done.current = true
        const final = Math.min(100, next)
        finish({
          score: final,
          verdict:
            final >= 90
              ? 'Every cut lands on the moment. That is why people binge it.'
              : final >= 60
                ? 'Two of three. The third one drags, and you know it.'
                : 'That edit has an establishing shot problem.',
          stats: [
            { label: 'cuts landed', value: `${Math.round(final / 33)}/${CLIPS.length}` },
            { label: 'format', value: 'short vertical' },
            { label: 'next', value: 'render queue' },
          ],
        })
      }
    }, 900)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= 4) {
        e.preventDefault()
        const b = clip.beats[n - 1]
        if (b) choose(b)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, picked])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between font-mono text-[10px] text-white/50">
        <span>clip {round + 1}/{CLIPS.length}</span>
        <span>score {score}</span>
      </div>

      <div className="mt-2 rounded-xl border border-white/10 bg-[#0c1013] p-3">
        <p className="font-mono text-[11px] text-cyan-100/80">{clip.title}</p>
        <p className="mt-1 font-mono text-[10px] text-white/40">which beat does the episode end on?</p>
      </div>

      <div className="mt-2 grid flex-1 grid-cols-2 gap-2">
        {clip.beats.map((b, i) => {
          const chosen = picked === b.id
          const reveal = picked !== null
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => choose(b)}
              className={`flex flex-col justify-between rounded-lg border p-2 text-left font-mono text-[11px] leading-tight transition-colors ${
                reveal && b.good
                  ? 'border-emerald-300/70 bg-emerald-300/15 text-emerald-50'
                  : chosen
                    ? 'border-red-400/70 bg-red-400/15 text-red-50'
                    : 'border-white/15 bg-white/5 text-white/80 hover:border-cyan-300/60'
              }`}
            >
              <span className="text-[9px] text-white/35">{i + 1}</span>
              {b.label}
              {reveal && b.good && <span className="mt-1 text-[9px] text-emerald-200/80">the moment</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
