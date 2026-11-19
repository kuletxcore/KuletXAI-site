import { useState } from 'react'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import { DEMO_WORLDS } from '#/data/demo'
import { play as sfx } from '#/lib/sfx'

/**
 * Ship 1 — the playable hero. The first screen used to describe the product
 * (a STATUS.LOG of totals) and ask for a scroll. Now it demonstrates it:
 * two real moves of I AM THE TABLE, in the hero, ending in the play link.
 * The full teaser still lives further down; this is its first turn, moved
 * to where the decision actually happens.
 */

const demo = DEMO_WORLDS.find((d) => d.slug === 'i-am-the-table')!
const story = STORIES.find((s) => s.slug === demo.slug)!
const MOVES_TO_PLAY = 2

export function FirstTurn() {
  const [nodeId, setNodeId] = useState(demo.start)
  const [moves, setMoves] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const node = demo.nodes[nodeId]
  const done = moves >= MOVES_TO_PLAY

  const pick = (label: string, next: string) => {
    sfx('nav')
    setPicked((p) => [...p, label])
    setNodeId(next)
    setMoves((m) => m + 1)
  }
  const again = () => {
    sfx('enter')
    setNodeId(demo.start)
    setMoves(0)
    setPicked([])
  }

  return (
    <div className="kx-first-turn border border-line bg-panel/85" aria-label="Play your first turn">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="font-mono text-[11px] text-mute">
          storyteller.exe <span className="text-neon">--your-first-turn</span>
        </p>
        <span className="border border-neon px-2 py-0.5 font-gamer text-[10px] uppercase text-neon">Playable</span>
      </div>

      <div className="max-h-64 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed sm:max-h-72" aria-live="polite">
        <p className="font-gamer text-[9px] uppercase" style={{ color: story.accent }}>{demo.speaker}</p>
        {node.say.slice(0, 3).map((line, i) => (
          <p key={`${nodeId}-${i}`} className="mt-2 text-ink first:mt-1">{line}</p>
        ))}
        {picked.length > 0 && (
          <p className="mt-3 border-l-2 border-warn/70 pl-3 text-warn/90">
            <span className="font-gamer text-[9px] uppercase text-warn/70">Your last move</span>
            <br />“{picked[picked.length - 1]}”
          </p>
        )}
      </div>

      <div className="border-t border-line bg-void/60 p-3">
        {done ? (
          <div className="text-center">
            <p className="font-gamer text-[10px] uppercase text-warn">Two moves in. The table has opinions now.</p>
            <a
              href={storyUrl(story)}
              target="_blank"
              rel="noreferrer"
              onClick={() => sfx('enter')}
              className="pixel mt-3 block px-5 py-3.5 font-gamer text-sm uppercase text-void transition-transform hover:scale-[1.01]"
              style={{ background: story.accent }}
            >
              ▶ Play {story.title} free →
            </a>
            <p className="mt-2 font-gamer text-[10px] uppercase text-mute">
              on {storyPlatformName(story)} · no account to look · free to start
            </p>
            <div className="mt-2 flex items-center justify-center gap-2 font-gamer text-[11px] uppercase">
              <button type="button" onClick={again} className="inline-flex min-h-11 items-center border border-line px-3 text-mute hover:border-warn hover:text-warn">
                ↻ Two more moves
              </button>
              <a href="#try" className="inline-flex min-h-11 items-center px-3 text-neon hover:text-ink">Full teaser ↓</a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2" role="group" aria-label="Your move">
            <p className="font-gamer text-[10px] uppercase text-mute">Your move {moves + 1} of {MOVES_TO_PLAY} · pick one</p>
            {(node.choices ?? []).map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(c.label, c.next)}
                className="group flex min-h-11 w-full items-center gap-3 border border-line px-3 py-2.5 text-left font-mono text-[13px] leading-snug text-ink transition-colors hover:border-neon hover:bg-neon/5 active:bg-neon/10"
              >
                <span className="grid size-6 shrink-0 place-items-center border border-line font-gamer text-[11px] text-neon group-hover:border-neon group-hover:bg-neon group-hover:text-void">{i + 1}</span>
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
