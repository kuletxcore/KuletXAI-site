import { useEffect, useRef, useState } from 'react'
import type { GameProps } from '#/lib/minigame'
import { play as sfx } from '#/lib/sfx'

/**
 * QUEEN BEE — STATUS.
 * Kingsmere runs on one currency and it is not grades. Everyone you meet is either a rival you can read or a
 * faction you can court. Pick the move that matches what they actually want.
 *
 * Mechanic = premise: reading people correctly is the whole climb; the wrong read costs you the hall.
 */

type Move = { label: string; want: 'status' | 'chaos' | 'receipts'; reply: string }
type Encounter = {
  who: string
  faction: string
  line: string
  want: Move['want']
  moves: Move[]
}

const ENCOUNTERS: Encounter[] = [
  {
    who: 'Vivienne Ashgrove',
    faction: 'The Vanguard',
    line: '“Darling, sit. Nobody will mind.” — every head in the hall is already looking at your seat.',
    want: 'status',
    moves: [
      { label: 'Sit. Smile. Say nothing.', want: 'status', reply: 'The hall decides you are not a threat. It is wrong, but useful.' },
      { label: 'Sit on the table instead.', want: 'chaos', reply: 'A fork drops somewhere. Nobody picks it up.' },
      { label: '“Which seat was hers?”', want: 'receipts', reply: 'Three girls stop eating. One of them knows.' },
    ],
  },
  {
    who: 'The Circuit',
    faction: 'Rumors and receipts',
    line: '“We heard something about June. We were wondering if you had heard it too.”',
    want: 'receipts',
    moves: [
      { label: 'Trade them something real.', want: 'receipts', reply: 'They write nothing down and remember everything.' },
      { label: '“Ask me again when it costs you.”', want: 'status', reply: 'They respect it. They also start a file on you.' },
      { label: 'Laugh, loud, in the wrong register.', want: 'chaos', reply: 'By fourth period it is a rumor about you.' },
    ],
  },
  {
    who: 'Dell Mercer',
    faction: 'The Wreckage',
    line: '“You could just flip the whole table. Everyone is waiting for somebody to.”',
    want: 'chaos',
    moves: [
      { label: '“Lead the way.”', want: 'chaos', reply: 'You have a faction now. It is currently four people and a golf cart.' },
      { label: '“I am flattered. No.”', want: 'status', reply: 'Dell files you under “coward” where you can see it.' },
      { label: '“Who told you that?”', want: 'receipts', reply: 'Dell looks at the Vanguard table for exactly one second too long.' },
    ],
  },
  {
    who: 'Coach Brannock',
    faction: 'The Line',
    line: '“Halls are not free. You want the corridor, you take it on the court.”',
    want: 'chaos',
    moves: [
      { label: 'Play. Dirty. Win anyway.', want: 'chaos', reply: 'The Line respects nothing else. The trainers will fix your shoulder.' },
      { label: 'Play fair and lose well.', want: 'status', reply: 'The Line does not respect it. The Aux does.' },
      { label: 'Find out who pays the referees.', want: 'receipts', reply: 'Two phone calls. One of them is from a Vanguard number.' },
    ],
  },
]

export function QueenBeeGame({ finish }: GameProps) {
  const [idx, setIdx] = useState(0)
  const [rep, setRep] = useState(0) // −3 … 6
  const [results, setResults] = useState<{ ok: boolean; reply: string }[]>([])
  const done = useRef(false)
  const repRef = useRef(rep)
  repRef.current = rep
  const enc = ENCOUNTERS[idx]

  const answer = (m: Move) => {
    const ok = m.want === enc.want
    sfx(ok ? 'enter' : 'back')
    setRep((r) => Math.max(-3, Math.min(6, r + (ok ? 1 : -1))))
    const nextResults = [...results, { ok, reply: m.reply }]
    setResults(nextResults)
    if (idx + 1 < ENCOUNTERS.length) {
      window.setTimeout(() => setIdx((i) => i + 1), 1200)
    } else if (!done.current) {
      done.current = true
      window.setTimeout(() => {
        const finalRep = repRef.current
        const score = Math.round(((finalRep + 3) / 9) * 100)
        const right = nextResults.filter((r) => r.ok).length
        finish({
          score,
          verdict:
            score >= 85
              ? 'You did not climb the hierarchy. You walked in already at the top.'
              : score >= 55
                ? 'You have a seat. Keeping it is the next story.'
                : 'The halls went quiet, but not in the way you wanted.',
          stats: [
            { label: 'right reads', value: `${right}/${ENCOUNTERS.length}` },
            { label: 'standing', value: `${finalRep > 0 ? '+' : ''}${finalRep}` },
            { label: 'hall', value: score >= 85 ? 'Vanguard' : score >= 55 ? 'contested' : 'Wreckage' },
          ],
        })
      }, 1300)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= enc.moves.length) {
        e.preventDefault()
        answer(enc.moves[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const last = results[results.length - 1]

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between font-mono text-[10px] text-white/50">
        <span>{enc.faction}</span>
        <span>
          {idx + 1}/{ENCOUNTERS.length} · standing {rep > 0 ? '+' : ''}{rep}
        </span>
      </div>

      <div className="mt-2 flex-1 rounded-xl border border-white/10 bg-[#150d16] p-4">
        <p className="font-mono text-sm font-semibold text-fuchsia-100">{enc.who}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/80">{enc.line}</p>
        {last && (
          <p className={`mt-3 border-l-2 pl-2 text-[12px] leading-snug ${last.ok ? 'border-emerald-300/60 text-emerald-100' : 'border-red-400/60 text-red-100'}`}>
            {last.reply}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {enc.moves.map((m, i) => (
          <button
            key={m.label}
            type="button"
            onClick={() => answer(m)}
            className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-[12px] leading-snug text-white/90 transition-colors hover:border-fuchsia-300/60 hover:bg-fuchsia-300/10"
          >
            <span className="grid size-5 shrink-0 place-items-center rounded border border-white/20 font-mono text-[10px]">
              {i + 1}
            </span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
