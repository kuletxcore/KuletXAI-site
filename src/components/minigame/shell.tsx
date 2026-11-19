import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { RANK_LINE, rankOf, readBest, writeBest } from '#/lib/minigame'
import type { GameResult, MiniGame, Rank } from '#/lib/minigame'
import { useLite } from '#/lib/perf'
import { play as sfx } from '#/lib/sfx'
import { GAMES } from './games'

/**
 * The arcade shell. Launching a mini-app from the hub should feel like starting a game on a console, so the shell
 * owns that theatre: the app tile, the full-screen "now launching" card, the frame with its console chrome, the
 * end-of-run rank card, and the way back into the world it came from.
 *
 * It replaces the hub's own background entirely while open, so nothing behind it moves or competes.
 */

type Phase = 'splash' | 'playing' | 'result'

const ROMAN: Record<Rank, string> = { S: 'S', A: 'A', B: 'B', C: 'C', D: 'D' }

export function Arcade({ game, onExit }: { game: MiniGame; onExit: () => void }) {
  const [phase, setPhase] = useState<Phase>('splash')
  const [result, setResult] = useState<GameResult | null>(null)
  const [best, setBest] = useState<number | null>(null)
  const [runKey, setRunKey] = useState(0)
  const lite = useLite()
  const reduced = usePrefersReducedMotion()
  const calm = lite || reduced
  const shellRef = useRef<HTMLDivElement>(null)

  useEffect(() => setBest(readBest(game.slug)), [game.slug])

  // Hold the page still underneath and let Escape back out
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    shellRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (phase === 'playing') onExit()
      else if (phase === 'result') closeResult()
      else onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [phase, onExit])

  function closeResult() {
    setResult(null)
    setPhase('splash')
  }

  const finish = (r: GameResult) => {
    setResult(r)
    setPhase('result')
    writeBest(game.slug, r.score)
    setBest((b) => (b === null || r.score > b ? r.score : b))
    sfx(r.score >= 75 ? 'enter' : 'back')
  }

  const launch = () => {
    sfx('enter')
    setPhase('playing')
    setRunKey((k) => k + 1)
  }

  const play = () => {
    setResult(null)
    setPhase('playing')
    setRunKey((k) => k + 1)
  }

  const story: Story | undefined = STORIES.find((s) => s.slug === game.slug)
  const Game = game.Component
  const shell = 'ps5-arcade'

  return (
    <div
      ref={shellRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`${game.name}: a playable piece of ${story?.title ?? 'KuletX'}`}
      className={`${shell} fixed inset-0 z-[60] flex flex-col outline-none`}
    >
      {/* The console backdrop: the world's own art, dimmed, with the boot grid over it */}
      {story && (
        <img
          src={story.cover}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-2xl"
          style={{ backgroundColor: story.accent }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-black/70" aria-hidden />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" aria-hidden />

      {/* Chrome: what is running, and the way out */}
      <header className="relative flex items-center gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <span className="font-mono text-[11px] tracking-widest text-white/45 uppercase">KuletX Arcade</span>
        <span className="h-4 w-px bg-white/20" aria-hidden />
        <span className="min-w-0 truncate font-mono text-[11px] text-white/80">{game.name}</span>
        <button
          type="button"
          onClick={() => {
            sfx('back')
            onExit()
          }}
          className="ps5-round ml-auto !h-9 !w-auto !rounded-full px-3 font-mono text-[11px]"
          aria-label="Close the arcade"
        >
          Exit <span className="ml-1 text-white/45">Esc</span>
        </button>
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-y-auto p-3 sm:p-6">
        {phase === 'splash' && (
          <LaunchCard
            game={game}
            story={story}
            best={best}
            calm={calm}
            onStart={launch}
            onExit={() => {
              sfx('back')
              onExit()
            }}
          />
        )}

        {phase === 'playing' && (
          <div className="w-full max-w-xl">
            <div className="ps5-glass p-3 sm:p-4">
              <Game key={runKey} finish={finish} calm={calm} />
            </div>
            <p className="mt-2 text-center font-mono text-[10px] text-white/35">
              The world keeps going without you · Esc quits the run
            </p>
          </div>
        )}

        {phase === 'result' && result && (
          <ResultCard
            game={game}
            story={story}
            result={result}
            best={best}
            calm={calm}
            onAgain={play}
            onClose={closeResult}
          />
        )}
      </div>

      {/* The shelf: every other mini-app, one press away, like a console row */}
      <footer className="relative border-t border-white/10 px-3 py-3 sm:px-6">
        <p className="mb-2 font-mono text-[10px] tracking-widest text-white/35 uppercase">in the arcade</p>
        <div className="ps5-scroll flex gap-2 overflow-x-auto pb-1">
          {GAMES.map((g) => {
            const s = STORIES.find((x) => x.slug === g.slug)
            const here = g.slug === game.slug
            return (
              <Link
                key={g.slug}
                to="/stories/$slug"
                params={{ slug: g.slug }}
                search={{ play: g.slug }}
                className={`flex w-36 shrink-0 items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                  here ? 'border-white/50 bg-white/15' : 'border-white/15 bg-white/5 hover:border-white/40'
                }`}
              >
                {s && <img src={s.tile ?? s.cover} alt="" className="size-9 shrink-0 rounded object-cover" />}
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[10px] text-white/85">{g.name}</span>
                  <span className="block truncate font-mono text-[9px] text-white/40">{here ? 'playing' : 'launch'}</span>
                </span>
              </Link>
            )
          })}
        </div>
      </footer>
    </div>
  )
}

/** The launch card: the game's own title screen, in the console's visual language. */
function LaunchCard({
  game,
  story,
  best,
  calm,
  onStart,
  onExit,
}: {
  game: MiniGame
  story: Story | undefined
  best: number | null
  calm: boolean
  onStart: () => void
  onExit: () => void
}) {
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    button.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onStart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStart])

  return (
    <div className={`w-full max-w-lg ${calm ? '' : 'ps5-arcade-launch'}`}>
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/55 backdrop-blur-xl">
        <div className="relative h-40 overflow-hidden sm:h-48">
          {story && <img src={story.cover} alt="" className="h-full w-full object-cover object-top opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="font-mono text-[10px] tracking-[0.2em] text-white/50 uppercase">
              {story ? story.kicker : 'Trimz · series cut'}
            </p>
            <h2 className="ps5-shadow mt-1 font-mono text-3xl font-extrabold tracking-tight text-white">{game.name}</h2>
            <p className="mt-1 font-mono text-[12px] text-white/70">{game.tagline}</p>
          </div>
          {best !== null && (
            <div className="absolute top-3 right-3 rounded-full border border-white/25 bg-black/50 px-2.5 py-1 font-mono text-[10px] text-white/80">
              best <span className="text-white">{best}</span> · {ROMAN[rankOf(best)]}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <p className="text-[13px] leading-relaxed text-white/80">{game.premise}</p>
          <ul className="mt-3 space-y-1.5">
            {game.how.map((h) => (
              <li key={h} className="flex items-baseline gap-2 font-mono text-[11px] text-white/60">
                <span className="text-white/35">▸</span>
                {h}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button ref={button} type="button" onClick={onStart} className="ps5-cta grow">
              ▶ Start
            </button>
            {story && (
              <a
                href={storyUrl(story)}
                target="_blank"
                rel="noreferrer"
                onClick={() => sfx('enter')}
                className="ps5-round !h-auto !w-auto !rounded-full px-4 py-3 font-mono text-[11px]"
              >
                Skip to {storyPlatformName(story)} →
              </a>
            )}
            <button type="button" onClick={onExit} className="ps5-round !h-auto !w-auto !rounded-full px-4 py-3 font-mono text-[11px]">
              Back
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] text-white/35">
            A twenty-second piece of the world · nothing here is required to play the real story
          </p>
        </div>
      </div>
    </div>
  )
}

/** The end card: a rank, the receipts, and the door into the actual storyline. */
function ResultCard({
  game,
  story,
  result,
  best,
  calm,
  onAgain,
  onClose,
}: {
  game: MiniGame
  story: Story | undefined
  result: GameResult
  best: number | null
  calm: boolean
  onAgain: () => void
  onClose: () => void
}) {
  const rank = rankOf(result.score)
  const next = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    next.current?.focus()
  }, [])

  return (
    <div className={`w-full max-w-lg ${calm ? '' : 'ps5-arcade-result'}`}>
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-black/60 backdrop-blur-xl">
        <div className="flex items-end gap-4 border-b border-white/10 p-5">
          <div
            className={`grid size-20 shrink-0 place-items-center rounded-xl font-mono text-4xl font-black ${
              rank === 'S' ? 'bg-amber-300 text-black' : rank === 'A' ? 'bg-white text-black' : 'bg-white/15 text-white'
            }`}
            aria-label={`Rank ${rank}`}
          >
            {rank}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[10px] tracking-widest text-white/45 uppercase">{game.name} · run complete</p>
            <p className="mt-1 font-mono text-2xl font-bold text-white">{result.score} <span className="text-sm text-white/40">/ 100</span></p>
            <p className="mt-1 text-[12px] leading-snug text-white/65">{RANK_LINE[rank]}</p>
          </div>
          {best !== null && (
            <p className="ml-auto shrink-0 text-right font-mono text-[10px] text-white/40">
              best
              <span className="block text-base text-white/80">{best}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-px bg-white/10">
          {result.stats.map((s) => (
            <div key={s.label} className="bg-black/40 px-3 py-2.5 text-center">
              <p className="font-mono text-[9px] tracking-wide text-white/40 uppercase">{s.label}</p>
              <p className="mt-0.5 font-mono text-sm text-white/90">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="p-4">
          <p className="text-[12px] leading-relaxed text-white/70">{result.verdict}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {story ? (
              <a
                ref={next}
                href={storyUrl(story)}
                target="_blank"
                rel="noreferrer"
                onClick={() => sfx('enter')}
                className="ps5-cta grow"
              >
                Play the real {story.title.split(':')[0]} →
              </a>
            ) : (
              <a ref={next} href="https://trimz.tv/u/kuletxcore" target="_blank" rel="noreferrer" className="ps5-cta grow">
                Watch the series →
              </a>
            )}
            <button type="button" onClick={onAgain} className="ps5-round !h-auto !w-auto !rounded-full px-4 py-3 font-mono text-[11px]">
              ↻ Again
            </button>
            <button type="button" onClick={onClose} className="ps5-round !h-auto !w-auto !rounded-full px-4 py-3 font-mono text-[11px]">
              Shelf
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}
