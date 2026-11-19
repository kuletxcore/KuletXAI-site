import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { play as sfx } from '#/lib/sfx'
import { readBest } from '#/lib/minigame'
import type { MiniGame } from '#/lib/minigame'

/**
 * The shelf entry in the hub: a compact console tile that says what the mini-app is and what you scored last time.
 * It sits with the story's sections rather than inside one, because it is a way into the world, not a panel of it.
 */
export function ArcadeTile({ game }: { game: MiniGame }) {
  const [best, setBest] = useState<number | null>(null)
  useEffect(() => setBest(readBest(game.slug)), [game.slug])

  return (
    <Link
      to="/stories/$slug"
      params={{ slug: game.slug }}
      search={{ play: game.slug }}
      onClick={() => sfx('enter')}
      className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-left transition-colors hover:border-white/45 hover:bg-white/10"
      aria-label={`Launch ${game.name}, a playable piece of this world`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/90 font-mono text-sm font-black text-black transition-transform group-hover:scale-105">
        ▶
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-mono text-[12px] font-semibold text-white">{game.name}</span>
          <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-white/70 uppercase">
            mini-game
          </span>
        </span>
        <span className="mt-0.5 block truncate font-mono text-[10px] text-white/50">{game.tagline}</span>
      </span>
      <span className="shrink-0 text-right font-mono text-[10px] text-white/45">
        {best === null ? 'launch' : <>best<br /><span className="text-white/85">{best}</span></>}
      </span>
    </Link>
  )
}
