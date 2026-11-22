import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import { DEMO_WORLDS } from '#/data/demo'
import type { DemoChoice, DemoWorld } from '#/data/demo'
import { useLite } from '#/lib/perf'
import { play as sfx } from '#/lib/sfx'
import { useStill } from '#/lib/still'

// The hero console: a real scene that types itself in, takes one choice and ends on that world's play button.
// The hero owns the world picker, so its own button always points at the world on screen.

type Line = { who: 'them' | 'me'; text: string }

const storyFor = (slug: DemoWorld['slug']) => STORIES.find((s) => s.slug === slug)!
const RATING_CLASS = (r: string) =>
  r === 'SFW' ? 'bg-neon text-void' : r === '18+' ? 'bg-danger text-white' : 'bg-warn text-void'

/** Console-looking label for a world, without the colon-and-subtitle the full title carries. */
const shortTitle = (slug: DemoWorld['slug']) =>
  slug === 'i-am-the-table' ? 'I AM THE TABLE' : 'Acolytes'

export function ColdOpen({ slug, onSlug }: { slug: DemoWorld['slug']; onSlug: (slug: DemoWorld['slug']) => void }) {
  const lite = useLite()
  const still = useStill()
  const demo = DEMO_WORLDS.find((d) => d.slug === slug)!
  const story = storyFor(slug)
  const accent = story.accent

  const [calm, setCalm] = useState(false)
  const [awake, setAwake] = useState(true)
  const [inView, setInView] = useState(true)
  const [nodeId, setNodeId] = useState(demo.start)
  const [log, setLog] = useState<Line[]>([])
  const [lineIdx, setLineIdx] = useState(0)
  const [chars, setChars] = useState(0)
  const [phase, setPhase] = useState<'reading' | 'choices' | 'end'>('reading')
  const [skip, setSkip] = useState(false)

  const dumped = useRef(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  // Reduced motion, Lite mode and Pause motion all get the whole scene at once: no typing, no waiting
  const instant = skip || calm || lite || still

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setCalm(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // A background tab doesn't type: the scene waits, so nobody arrives to a finished story they never saw
  useEffect(() => {
    const sync = () => setAwake(document.visibilityState !== 'hidden')
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  // Number keys only pick a choice while the console is on screen, so they can't hijack the rest of the page
  useEffect(() => {
    const el = boxRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // A new world starts a new scene
  useEffect(() => {
    setNodeId(demo.start)
    setLog([])
    setLineIdx(0)
    setChars(0)
    setPhase('reading')
    setSkip(false)
    dumped.current = false
  }, [demo])

  // On a world switch the old step id lingers for one render before the reset above lands
  const node = demo.nodes[nodeId] ?? demo.nodes[demo.start]
  const lines = node.say
  const running = awake && inView

  // Typing: two characters a frame, about as fast as the eye reads a line of dialogue
  useEffect(() => {
    if (!running || phase !== 'reading' || instant) return
    const line = lines[lineIdx]
    if (!line || chars >= line.length) return
    const t = window.setTimeout(() => setChars((c) => Math.min(c + 2, line.length)), 16)
    return () => window.clearTimeout(t)
  }, [chars, running, phase, lineIdx, lines, instant])

  // Instant path: the rest of the scene lands at once
  useEffect(() => {
    if (!running || phase !== 'reading' || !instant || dumped.current) return
    dumped.current = true
    setLog((prev) => [...prev, ...lines.slice(lineIdx).map((text) => ({ who: 'them' as const, text }))])
    setPhase(node.choices ? 'choices' : 'end')
  }, [running, phase, instant, lines, lineIdx, node])

  // A finished line is held a beat, then committed and the next one starts
  useEffect(() => {
    if (!running || phase !== 'reading' || instant) return
    const line = lines[lineIdx]
    if (!line || chars < line.length) return
    const t = window.setTimeout(() => {
      setLog((prev) => [...prev, { who: 'them', text: line }])
      if (lineIdx + 1 < lines.length) {
        setLineIdx((i) => i + 1)
        setChars(0)
      } else {
        setPhase(node.choices ? 'choices' : 'end')
      }
    }, 260)
    return () => window.clearTimeout(t)
  }, [chars, running, phase, instant, lines, lineIdx, node])

  // Keep the newest beat in view
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log, chars, phase])

  const pick = (c: DemoChoice) => {
    sfx('nav')
    dumped.current = false
    setLog((prev) => [...prev, { who: 'me', text: c.label }])
    setNodeId(c.next)
    setLineIdx(0)
    setChars(0)
    setPhase('reading')
    setSkip(false)
  }

  const replay = () => {
    sfx('enter')
    setNodeId(demo.start)
    setLog([])
    setLineIdx(0)
    setChars(0)
    setPhase('reading')
    setSkip(false)
    dumped.current = false
  }

  useEffect(() => {
    if (!inView || !running || phase !== 'choices') return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      const t = e.target as HTMLElement | null
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return
      const n = Number.parseInt(e.key, 10)
      const choices = node.choices ?? []
      if (n >= 1 && n <= choices.length) pick(choices[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // pick() is stable enough for this listener: it only reads the current node
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, running, phase, nodeId])

  const currentLine = phase === 'reading' ? lines[lineIdx] : undefined
  const shown = currentLine ? currentLine.slice(0, chars) : ''
  const typing = !currentLine || chars < currentLine.length
  const other = DEMO_WORLDS.find((d) => d.slug !== slug)!

  return (
    <div
      ref={boxRef}
      className="kx-console relative flex flex-col border border-line bg-void"
      style={{ ['--kx-accent' as string]: accent }}
      aria-label={`Playable opening scene: ${story.title}`}
    >
      {/* Title bar, with the other world one tap away */}
      <div className="flex items-center gap-2 border-b border-line bg-panel/70 px-3 py-2">
        <p className="font-mono text-[11px] text-mute">
          storyteller<span className="text-mute/60">.exe</span> <span className="text-neon">--cold-open</span>
        </p>
        <span className="ml-auto flex items-center gap-1">
          {DEMO_WORLDS.map((w) => {
            const on = w.slug === slug
            return (
              <button
                key={w.slug}
                type="button"
                onClick={() => {
                  if (on) return
                  sfx('tab')
                  onSlug(w.slug)
                }}
                aria-pressed={on}
                className={`min-h-11 border px-2 font-gamer text-[10px] uppercase transition-colors ${
                  on ? 'border-ink bg-ink text-void' : 'border-line text-mute hover:border-neon hover:text-neon'
                }`}
              >
                {shortTitle(w.slug)}
              </button>
            )
          })}
        </span>
      </div>

      {/* The scene */}
      <div
        ref={logRef}
        tabIndex={0}
        role="log"
        aria-live="polite"
        aria-label="Scene transcript"
        className="relative h-[19rem] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed focus:outline-none focus-visible:ring-1 focus-visible:ring-neon sm:h-[21rem] sm:text-sm"
      >
        <p className="flex items-center gap-2 font-gamer text-[10px] uppercase">
          <span className={RATING_CLASS(story.rating)}>{story.rating}</span>
          <span className="text-mute">{demo.speaker}</span>
        </p>

        {log.map((l, i) =>
          l.who === 'me' ? (
            <p key={i} className="mt-3 border-l-2 pl-3 text-warn/90" style={{ borderColor: 'var(--color-warn)' }}>
              <span className="font-gamer text-[9px] uppercase tracking-widest text-warn/70">You</span>
              <br />“{l.text}”
            </p>
          ) : (
            <p key={i} className="mt-3 text-ink">
              {l.text}
            </p>
          ),
        )}

        {currentLine !== undefined && (
          <p className="mt-3 text-ink" aria-hidden>
            {shown}
            {typing && <span className="cursor text-neon" />}
          </p>
        )}

        <div
          aria-hidden
          className="pointer-events-none sticky bottom-0 -mx-4 -mb-4 h-8"
          style={{ background: 'linear-gradient(to top, var(--color-void), transparent)' }}
        />
      </div>

      {/* Choices, or the hand-off */}
      <div className="relative border-t border-line bg-panel/40 p-3">
        {phase === 'reading' && running && !instant && (
          <button
            type="button"
            onClick={() => setSkip(true)}
            className="absolute -top-11 right-2 inline-flex min-h-11 items-center px-2 font-gamer text-[10px] uppercase text-mute hover:text-neon"
          >
            Skip ▸
          </button>
        )}

        {phase === 'choices' && node.choices ? (
          <div className="flex flex-col gap-2" role="group" aria-label="Your moves">
            {node.choices.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(c)}
                className="group flex min-h-11 w-full items-center gap-3 border border-line px-3 py-2 text-left font-mono text-[13px] leading-snug text-ink transition-colors hover:border-neon hover:bg-neon/5 active:bg-neon/10"
              >
                <span className="grid size-6 shrink-0 place-items-center border border-line font-gamer text-[11px] text-neon group-hover:border-neon group-hover:bg-neon group-hover:text-void">
                  {i + 1}
                </span>
                {c.label}
              </button>
            ))}
          </div>
        ) : phase === 'end' ? (
          <div>
            <p className="font-mono text-[12px] leading-snug text-mute">{node.end}</p>
            <a
              href={storyUrl(story)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sfx('enter')}
              className="pixel mt-3 flex items-center justify-center gap-2 px-4 py-3 font-gamer text-sm uppercase text-void transition-transform hover:scale-[1.01]"
              style={{ background: accent }}
            >
              ▶ Play {shortTitle(slug)} free
            </a>
            <div className="mt-2 flex items-center justify-between gap-2 font-gamer text-[10px] uppercase">
              <Link
                to="/stories/$slug"
                params={{ slug }}
                onClick={() => sfx('nav')}
                className="inline-flex min-h-11 items-center text-mute hover:text-neon"
              >
                World file →
              </Link>
              <span className="text-mute/70">{storyPlatformName(story)} · nothing else to install</span>
            </div>
            <div className="mt-1 flex items-center gap-3 font-gamer text-[10px] uppercase">
              <button
                type="button"
                onClick={replay}
                className="inline-flex min-h-11 items-center text-mute hover:text-warn"
              >
                ↻ Run it again
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx('tab')
                  onSlug(other.slug)
                }}
                className="inline-flex min-h-11 items-center text-mute hover:text-neon"
              >
                Try {shortTitle(other.slug)}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[4.25rem] items-center gap-2" aria-hidden>
          </div>
        )}
      </div>
    </div>
  )
}
