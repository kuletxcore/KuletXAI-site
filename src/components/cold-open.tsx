import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import { COLD_OPENS, coldOpenAt } from '#/data/coldopen'
import type { ColdOpen } from '#/data/coldopen'
import { useLite } from '#/lib/perf'
import { play as sfx } from '#/lib/sfx'

/**
 * The Cold Open: the hero's right-hand screen, and the first thing on the site you can actually play.
 *
 * Why here: the front page had no playable thing above the fold. The STATUS.LOG panel was honest and pretty and
 * asked nothing of anyone. This asks one question with two answers, takes about ten seconds, and ends on the
 * only exit that matters (the story on its platform), which is also the only exit that converts. It stays
 * scripted and says so; the improvisation is what happens after the tap.
 */

const storyFor = (o: ColdOpen) => STORIES.find((s) => s.slug === o.slug)!
const pad2 = (n: number) => String(n).padStart(2, '0')

type Phase = 'open' | 'answering' | 'answered'

/** Nothing is chosen yet. Answered, the choice and the reply stay up and the exit takes the space the
 *  choices leave, so the screen never grows and the hero never re-flows under a thumb. */
const SCREEN = 'min-h-[19.5rem] sm:min-h-[21rem]'

export function ColdOpen() {
  const lite = useLite()
  const box = useRef<HTMLDivElement>(null)
  const moves = useRef<HTMLDivElement>(null)
  const land = useRef(0)
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('open')
  const [picked, setPicked] = useState<0 | 1 | null>(null)
  const [inView, setInView] = useState(false)

  // The opening world is fixed, not picked from storage or shuffled, so the server's HTML and the
  // browser's first render are the same screen. Returning players get their world from the CONTINUE band.
  const open = coldOpenAt(idx)
  const story = storyFor(open)
  const accent = story.accent
  const platform = storyPlatformName(story)

  // Keys 1 and 2 pick a move, but only while the screen is on screen and nothing else has the keyboard
  useEffect(() => {
    const el = box.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The hero's main button wakes this screen instead of scrolling to a card that is already beside it:
  // it highlights the moves and puts the keyboard on the first one, so Enter plays.
  useEffect(() => {
    const wake = () => {
      const el = moves.current
      if (!el) return
      el.classList.remove('is-waking')
      void el.offsetWidth
      el.classList.add('is-waking')
      el.querySelector('button')?.focus({ preventScroll: true })
    }
    window.addEventListener('kx:cold-open', wake)
    return () => window.removeEventListener('kx:cold-open', wake)
  }, [])

  const choose = (i: 0 | 1) => {
    if (phase !== 'open') return
    sfx('nav')
    setPicked(i)
    setPhase('answering')
    // The reply arrives a beat after the door closes, so the tap has weight
    window.clearTimeout(land.current)
    land.current = window.setTimeout(() => {
      setPhase('answered')
      sfx('enter')
    }, lite ? 90 : 460)
  }

  useEffect(() => {
    if (!inView || phase !== 'open') return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return
      if (e.key === '1') choose(0)
      else if (e.key === '2') choose(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, phase])

  useEffect(() => () => window.clearTimeout(land.current), [])

  const next = () => {
    window.clearTimeout(land.current)
    sfx('tab')
    setIdx((i) => (i + 1) % COLD_OPENS.length)
    setPicked(null)
    setPhase('open')
  }

  const reply = picked === null ? null : open.choices[picked].reply

  return (
    <div
      ref={box}
      id="cold-open"
      className="kx-open scroll-mt-24"
      style={{ ['--kx-accent' as string]: accent }}
      aria-label={`Cold open: ${story.title}`}
    >
      <img
        key={`${open.slug}-art`}
        src={story.cover}
        alt=""
        aria-hidden
        decoding="async"
        className="kx-open-art"
      />
      {!lite && <div className="kx-open-scan" aria-hidden />}

      <div className="kx-open-head">
        <span className="kx-open-dot" aria-hidden />
        <span className="text-ink">COLD OPEN</span>
        <span className="text-mute/50" aria-hidden>
          ·
        </span>
        <span className="text-mute/70">
          {pad2(idx + 1)}/{pad2(COLD_OPENS.length)}
        </span>
        <span className="ml-auto flex items-center gap-2 normal-case text-mute/70">
          <span className="hidden sm:inline">1 / 2 or tap</span>
          <span className="sm:hidden">tap</span>
        </span>
      </div>

      <div className={`p-4 sm:p-5 ${SCREEN}`}>
        {/* The name of the world, then the situation, then the turn */}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-gamer text-[11px] uppercase text-mute">
          <span
            className="px-1.5 py-0.5 text-void"
            style={{ background: story.rating === 'SFW' ? '#00ff66' : story.rating === '18+' ? '#e5162b' : '#ffb800', color: story.rating === '18+' ? '#fff' : undefined }}
          >
            {story.rating}
          </span>
          <span>{story.title}</span>
        </p>

        <div className="mt-3 space-y-2.5 font-mono text-[13px] leading-relaxed text-ink/90 sm:text-sm" aria-live="polite">
          {open.open.map((line, i) => (
            <p key={`${open.slug}-${i}`}>
              <span className="kx-open-speaker block">{open.speaker}</span>
              {line}
            </p>
          ))}
          {picked !== null && (
            <p className="kx-open-said font-mono text-[13px] leading-relaxed">
              <span className="kx-open-speaker block !text-warn/80">YOU</span>
              {open.choices[picked].label}
            </p>
          )}
          {reply && (
            <p className="kx-open-line">
              <span className="kx-open-speaker block">{open.speaker}</span>
              {reply}
            </p>
          )}
        </div>

        {/* Your move, then the way out */}
        <div className="mt-4">
          {phase === 'open' ? (
            <div ref={moves} className="kx-open-moves flex flex-col gap-2" role="group" aria-label="Your move">
              {open.choices.map((c, i) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => choose(i as 0 | 1)}
                  className="kx-open-move"
                >
                  <span className="kx-open-move-key" aria-hidden>
                    {i + 1}
                  </span>
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <a
                href={storyUrl(story)}
                target="_blank"
                rel="noreferrer"
                onClick={() => sfx('enter')}
                className="kx-open-cta w-full"
              >
                ▶ Keep playing on {platform}
              </a>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <Link
                  to="/stories/$slug"
                  params={{ slug: story.slug }}
                  onClick={() => sfx('enter')}
                  className="kx-open-link underline decoration-line underline-offset-4 hover:decoration-current"
                >
                  World file, cast &amp; soundtrack
                </Link>
                <button
                  type="button"
                  onClick={next}
                  className="kx-open-link !text-warn hover:!text-ink"
                >
                  Another world ↻
                </button>
              </div>
              <p className="mt-0.5 font-gamer text-[10px] uppercase leading-relaxed text-mute/70">
                Scripted cold open · free to start · the live story improvises from here
              </p>
            </div>
          )}
        </div>

        {/* Before you choose, the worlds are one tap away rather than hidden behind the fold */}
        {phase === 'open' && (
          <p className="mt-3 flex items-center justify-between gap-3 font-gamer text-[10px] uppercase text-mute/70">
            <button type="button" onClick={next} className="kx-open-link !min-h-0 !px-0 !text-[10px] hover:!text-warn">
              ↻ Another world
            </button>
            <span>
              {STORIES.length} worlds · no account
            </span>
          </p>
        )}
      </div>
    </div>
  )
}
