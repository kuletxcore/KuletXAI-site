import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { randInt } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * WRISTBOUND — ONE HOUR, ONE FORM.
 * The artifact gives you a form for an hour and then takes it back. Every job needs a different body, and the wrong
 * body is not a failure state the world forgives.
 *
 * Mechanic = premise: a timer you cannot pause, and a form you have to swap before it expires.
 */

type Form = { key: string; name: string; gift: string; solves: string[] }

const FORMS: Form[] = [
  { key: 'runner', name: 'Runner', gift: 'fast, fragile', solves: ['chase', 'escape'] },
  { key: 'anchor', name: 'Anchor', gift: 'heavy, unshakable', solves: ['hold', 'break'] },
  { key: 'wire', name: 'Wire', gift: 'thin, reaches anywhere', solves: ['reach', 'silence'] },
  { key: 'mask', name: 'Mask', gift: 'someone else entirely', solves: ['lie', 'silence'] },
]

const JOBS = [
  { need: 'chase', text: 'a courier is already two streets ahead' },
  { need: 'hold', text: 'the fire door has to stay shut for sixty seconds' },
  { need: 'reach', text: 'the ledger is behind a grille, four inches wide' },
  { need: 'break', text: 'the lock is rated for a car' },
  { need: 'lie', text: 'the guard at the gate has a photograph of you' },
  { need: 'escape', text: 'the lab seals itself in ten' },
]

const HOUR = 20 // seconds of "an hour", so the arcade fits in a coffee break

export function WristboundGame({ finish }: GameProps) {
  const [form, setForm] = useState(FORMS[1])
  const [job, setJob] = useState(JOBS[0])
  const [left, setLeft] = useState(HOUR)
  const [solved, setSolved] = useState(0)
  const [tries, setTries] = useState(0)
  const [flash, setFlash] = useState<null | boolean>(null)

  const done = useRef(false)
  const solvedRef = useRef(0)
  solvedRef.current = solved
  const triesRef = useRef(0)
  triesRef.current = tries

  useEffect(() => {
    const id = window.setInterval(() => setLeft((l) => Math.max(0, l - 0.1)), 100)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (left > 0 || done.current) return
    done.current = true
    const score = Math.round(Math.max(0, Math.min(100, solvedRef.current * 17 + Math.max(0, 8 - triesRef.current) * 2)))
    finish({
      score,
      verdict:
        score >= 85
          ? 'Every form, the right one, on time. Nobody who mattered saw you change.'
          : score >= 55
            ? 'You made it out. The artifact is keeping count of the rest.'
            : 'The hour ran out with the wrong body on. That is the whole horror of it.',
      stats: [
        { label: 'jobs', value: String(solvedRef.current) },
        { label: 'wrong forms', value: String(Math.max(0, triesRef.current - solvedRef.current)) },
        { label: 'hour', value: left > 0 ? 'running' : 'expired' },
      ],
    })
  }, [left, finish])

  const attempt = () => {
    if (left <= 0 || done.current) return
    const ok = form.solves.includes(job.need)
    setTries((t) => t + 1)
    setFlash(ok)
    sfx(ok ? 'enter' : 'back')
    window.setTimeout(() => setFlash(null), 260)
    if (ok) setSolved((n) => n + 1)
    // Either way the hour moves on; a wrong body costs the same as a right one
    setLeft((l) => Math.max(0, l - 1.4))
    setJob(JOBS[randInt(0, JOBS.length - 1)])
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= FORMS.length) {
        e.preventDefault()
        sfx('nav')
        setForm(FORMS[n - 1])
      } else if (e.key === 'Enter') {
        e.preventDefault()
        attempt()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, job, left])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full transition-[width] duration-100 ${left < 6 ? 'bg-red-400' : 'bg-violet-300'}`} style={{ width: `${(left / HOUR) * 100}%` }} />
        </div>
        <span className="font-mono text-xs text-white/60 tabular-nums">{left.toFixed(1)}s left</span>
      </div>

      <div className={`mt-3 flex-1 rounded-xl border p-4 transition-colors ${flash === true ? 'border-emerald-300/60 bg-emerald-300/5' : flash === false ? 'border-red-400/60 bg-red-400/5' : 'border-white/10 bg-[#0d0b14]'}`}>
        <p className="font-mono text-[10px] tracking-wide text-violet-200/60 uppercase">job</p>
        <p className="mt-1 text-[14px] leading-snug text-white/90">{job.text}</p>
        <p className="mt-3 font-mono text-[11px] text-white/50">
          current form · <span className="text-violet-200">{form.name}</span> — {form.gift}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {FORMS.map((f, i) => (
          <button
            key={f.key}
            type="button"
            onClick={() => {
              sfx('nav')
              setForm(f)
            }}
            aria-pressed={form.key === f.key}
            className={`rounded-lg border px-1.5 py-2 text-center font-mono text-[10px] leading-tight transition-colors ${
              form.key === f.key ? 'border-violet-300 bg-violet-300/20 text-white' : 'border-white/15 text-white/65 hover:border-violet-300/60'
            }`}
          >
            <span className="block text-[9px] text-white/40">{i + 1}</span>
            {f.name}
            {form.key === f.key && <span className="mt-1 block text-[9px] text-violet-200/80">{f.gift}</span>}
          </button>
        ))}
      </div>

      <button type="button" onClick={attempt} className="ps5-cta mt-2 !py-3">
        Wear it
      </button>
      <p className="mt-1.5 flex justify-between font-mono text-[10px] text-white/45">
        <span>solved {solved}</span>
        <span>wrong forms {Math.max(0, tries - solved)}</span>
      </p>
    </div>
  )
}
