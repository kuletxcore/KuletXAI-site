import { useState } from 'react'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import { DEMO_WORLDS } from '#/data/demo'
import { play as sfx } from '#/lib/sfx'

/** Ship 1: the hero is playable. Two real moves of I AM THE TABLE where the
 *  STATUS.LOG used to describe the product, ending in the free play link. */
const demo = DEMO_WORLDS.find((d) => d.slug === 'i-am-the-table')!
const story = STORIES.find((s) => s.slug === demo.slug)!

export function FirstTurn() {
  const [nodeId, setNodeId] = useState(demo.start)
  const [moves, setMoves] = useState(0)
  const [last, setLast] = useState('')
  const node = demo.nodes[nodeId]
  const done = moves >= 2
  const pick = (label: string, next: string) => { sfx('nav'); setLast(label); setNodeId(next); setMoves((m) => m + 1) }
  const again = () => { sfx('enter'); setNodeId(demo.start); setMoves(0); setLast('') }
  return (
    <div className="kx-rise border border-line bg-panel/85" aria-label="Play your first turn">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <p className="font-mono text-[11px] text-mute">storyteller.exe <span className="text-neon">--your-first-turn</span></p>
        <span className="border border-neon px-2 py-0.5 font-gamer text-[10px] uppercase text-neon">Playable</span>
      </div>
      <div className="max-h-64 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed sm:max-h-72" aria-live="polite">
        <p className="font-gamer text-[9px] uppercase" style={{ color: story.accent }}>{demo.speaker}</p>
        {node.say.slice(0, 3).map((l, i) => <p key={`${nodeId}-${i}`} className="mt-2 text-ink first:mt-1">{l}</p>)}
        {last && <p className="mt-3 border-l-2 border-warn/70 pl-3 text-warn/90"><span className="font-gamer text-[9px] uppercase text-warn/70">Your last move</span><br />“{last}”</p>}
      </div>
      <div className="border-t border-line bg-void/60 p-3">
        {done ? (
          <div className="text-center">
            <p className="font-gamer text-[10px] uppercase text-warn">Two moves in. The table has opinions now.</p>
            <a href={storyUrl(story)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="pixel mt-3 block px-5 py-3.5 font-gamer text-sm uppercase text-void hover:scale-[1.01]" style={{ background: story.accent }}>▶ Play {story.title} free →</a>
            <p className="mt-2 font-gamer text-[10px] uppercase text-mute">on {storyPlatformName(story)} · free to start</p>
            <div className="mt-2 flex justify-center gap-2 font-gamer text-[11px] uppercase">
              <button type="button" onClick={again} className="inline-flex min-h-11 items-center border border-line px-3 text-mute hover:border-warn hover:text-warn">↻ Two more moves</button>
              <a href="#try" className="inline-flex min-h-11 items-center px-3 text-neon hover:text-ink">Full teaser ↓</a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2" role="group" aria-label="Your move">
            <p className="font-gamer text-[10px] uppercase text-mute">Your move {moves + 1} of 2 · pick one</p>
            {(node.choices ?? []).map((c, i) => (
              <button key={i} type="button" onClick={() => pick(c.label, c.next)} className="group flex min-h-11 w-full items-center gap-3 border border-line px-3 py-2.5 text-left font-mono text-[13px] text-ink hover:border-neon hover:bg-neon/5">
                <span className="grid size-6 shrink-0 place-items-center border border-line font-gamer text-[11px] text-neon group-hover:bg-neon group-hover:text-void">{i + 1}</span>{c.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
