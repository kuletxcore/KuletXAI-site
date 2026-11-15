import { useEffect, useRef, useState } from 'react'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import { DEMO_WORLDS } from '#/data/demo'
import type { DemoChoice, DemoWorld } from '#/data/demo'
import { useLite } from '#/lib/perf'
import { play as sfx } from '#/lib/sfx'

/**
 * THE TEASER — a scripted, fully client-side 30-second slice of the AI
 * storyteller, embedded in the landing page. Cold visitors can feel the
 * core loop (you choose → the world answers) before they ever sign up.
 * The end card is the conversion moment: a deep link into the real storyline.
 */

type Line = { who: 'them' | 'me'; text: string }

const storyFor = (slug: DemoWorld['slug']) => STORIES.find((s) => s.slug === slug)!
const RATING_CLASS = (r: string) => (r === 'SFW' ? 'bg-neon text-void' : r === '18+' ? 'bg-danger text-white' : 'bg-warn text-void')

export function StoryDemo() {
  const lite = useLite()
  const [calm, setCalm] = useState(false)
  const [demoSlug, setDemoSlug] = useState<DemoWorld['slug']>('i-am-the-table')
  const demo = DEMO_WORLDS.find((d) => d.slug === demoSlug)!
  const story = storyFor(demo.slug)
  const accent = story.accent

  const [nodeId, setNodeId] = useState(demo.start)
  const [log, setLog] = useState<Line[]>([])
  const [lineIdx, setLineIdx] = useState(0)
  const [chars, setChars] = useState(0)
  const [phase, setPhase] = useState<'reading' | 'choices' | 'end'>('reading')
  const [skipAll, setSkipAll] = useState(false)
  const [seen, setSeen] = useState(false)
  const [inView, setInView] = useState(false)

  const instantRef = useRef(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const instant = skipAll || calm || lite

  // The terminal boots only when it scrolls into view — nobody's demo is done before they arrive
  useEffect(() => {
    const el = terminalRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting)
        if (e.isIntersecting) setSeen(true)
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setCalm(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const node = demo.nodes[nodeId]
  const lines = node.say

  // Typewriter tick
  useEffect(() => {
    if (!seen || phase !== 'reading' || instant) return
    const line = lines[lineIdx]
    if (!line || chars >= line.length) return
    const t = window.setTimeout(() => setChars((c) => Math.min(c + 2, line.length)), 16)
    return () => window.clearTimeout(t)
  }, [chars, seen, phase, lineIdx, lines, instant])

  // Instant path (click-to-skip or reduced motion): dump every remaining line at once
  useEffect(() => {
    if (!seen || phase !== 'reading' || !instant) return
    if (instantRef.current) return
    instantRef.current = true
    setLog((prev) => [...prev, ...lines.slice(lineIdx).map((text) => ({ who: 'them' as const, text }))])
    setPhase(node.choices ? 'choices' : 'end')
    sfx('nav')
  }, [seen, phase, instant, lines, lineIdx, node])

  // Line completed: hold a beat, then commit it and move on
  useEffect(() => {
    if (!seen || phase !== 'reading' || instant) return
    const line = lines[lineIdx]
    if (!line || chars < line.length) return
    const t = window.setTimeout(
      () => {
        setLog((prev) => [...prev, { who: 'them', text: line }])
        if (lineIdx + 1 < lines.length) {
          setLineIdx((i) => i + 1)
          setChars(0)
        } else {
          sfx('nav')
          setPhase(node.choices ? 'choices' : 'end')
        }
      },
      280,
    )
    return () => window.clearTimeout(t)
  }, [chars, seen, phase, instant, lines, lineIdx, node])

  // Keep the log pinned to the latest beat
  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log, chars, phase])

  const reset = (d: DemoWorld, nextSlug: DemoWorld['slug']) => {
    setDemoSlug(nextSlug)
    instantRef.current = false
    setNodeId(d.start)
    setLog([])
    setLineIdx(0)
    setChars(0)
    setPhase('reading')
    setSkipAll(false)
  }

  const switchWorld = (nextSlug: DemoWorld['slug']) => {
    if (nextSlug === demoSlug) return
    sfx('tab')
    const d = DEMO_WORLDS.find((w) => w.slug === nextSlug)!
    reset(d, nextSlug)
  }

  const runAgain = () => {
    sfx('enter')
    reset(demo, demoSlug)
  }

  const pick = (c: DemoChoice) => {
    sfx('nav')
    instantRef.current = false
    setLog((prev) => [...prev, { who: 'me', text: c.label }])
    setNodeId(c.next)
    setLineIdx(0)
    setChars(0)
    setPhase('reading')
    setSkipAll(false)
  }

  // Keys 1–4 pick a choice while the choices are on screen and the terminal is in view
  useEffect(() => {
    if (!inView || phase !== 'choices') return
    const onKey = (e: KeyboardEvent) => {
      const n = Number.parseInt(e.key, 10)
      const choices = node.choices ?? []
      if (n >= 1 && n <= choices.length) pick(choices[n - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, phase, nodeId])

  const currentLine = phase === 'reading' && seen ? lines[lineIdx] : undefined
  const shownText = currentLine ? currentLine.slice(0, chars) : ''
  const typingDone = currentLine ? chars >= currentLine.length : false

  return (
    <section id="try" className="scroll-mt-16 border-b border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          {/* Pitch */}
          <div>
            <p className="font-gamer text-sm text-neon">
              {'//'} THE TEASER<span className="text-mute"> — no account, no install</span>
            </p>
            <h2 className="pixel mt-3 font-pixel text-4xl leading-[1.05] text-ink sm:text-6xl">
              ONE TURN.
              <br />
              <span className="text-neon glow">THE WHOLE LOOP.</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-mute">
              This is what playing an AI storyline feels like: you choose, the world answers, and the story never
              stops for a loading screen. A scripted 30-second slice — the live storyteller improvises forever and
              never says the same thing twice.
            </p>
            <ul className="mt-6 space-y-2 font-mono text-sm text-ink/90">
              {['You pick the moves, the world keeps up', 'Two minutes from here to playing the real thing', 'Free to start — same account, same worlds'].map((t) => (
                <li key={t} className="flex items-baseline gap-2">
                  <span className="text-neon">▸</span>
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 font-gamer text-[11px] uppercase leading-relaxed text-mute">
              Scripted teaser — the live session is improvised,
              <br />
              persistent, and unreasonably quotable
            </p>
          </div>

          {/* The terminal */}
          <div
            ref={terminalRef}
            className="relative border border-line bg-void"
            style={{ boxShadow: `0 0 90px -18px ${accent}40` }}
            aria-label="Interactive storyteller teaser"
          >
            {/* Title bar */}
            <div className="flex items-center gap-3 border-b border-line bg-panel/60 px-4 py-2.5">
              <span className="flex gap-1.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-danger" />
                <span className="size-2.5 rounded-full bg-warn" />
                <span className="size-2.5 rounded-full bg-neon" />
              </span>
              <p className="font-mono text-[11px] text-mute">
                storyteller.exe <span className="text-neon">--demo</span>
              </p>
              <span className="ml-auto border border-warn px-2 py-0.5 font-gamer text-[10px] uppercase text-warn">Demo</span>
            </div>

            {/* World tabs */}
            <div className="flex gap-2 border-b border-line p-2" role="tablist" aria-label="Pick a demo world">
              {DEMO_WORLDS.map((w) => {
                const s = storyFor(w.slug)
                const active = w.slug === demoSlug
                return (
                  <button
                    key={w.slug}
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchWorld(w.slug)}
                    className={`flex min-w-0 flex-1 items-center gap-3 border px-2 py-2 text-left transition-colors ${
                      active ? 'border-neon bg-neon/5' : 'border-line hover:border-neon/50'
                    }`}
                  >
                    <img
                      src={s.cover}
                      alt=""
                      decoding="async"
                      className={`h-14 w-10 shrink-0 rounded-sm object-cover object-top ${active ? '' : 'opacity-60 grayscale'}`}
                    />
                    <span className="min-w-0">
                      <span className={`block truncate font-gamer text-[11px] uppercase ${active ? 'text-ink' : 'text-mute'}`}>
                        {w.short}
                      </span>
                      <span className={`mt-1 inline-block px-1.5 py-0.5 font-gamer text-[9px] ${RATING_CLASS(s.rating)}`}>
                        {s.rating}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Message log */}
            <div
              ref={messagesRef}
              role="log"
              aria-live="polite"
              onClick={() => phase === 'reading' && setSkipAll(true)}
              className="relative h-72 cursor-pointer overflow-y-auto p-4 font-mono text-sm leading-relaxed sm:h-80 sm:p-5"
            >
              {!seen ? (
                <p className="mt-16 text-center font-pixel text-lg text-mute sm:mt-20">
                  STORYTELLER<span className="cursor text-neon" />
                </p>
              ) : (
                <>
                  {log.map((l, i) =>
                    l.who === 'me' ? (
                      <p key={i} className="mt-3 border-l-2 border-warn/70 pl-3 text-warn/90 first:mt-0">
                        <span className="font-gamer text-[9px] uppercase tracking-widest text-warn/70">You</span>
                        <br />“{l.text}”
                      </p>
                    ) : (
                      <p key={i} className="mt-3 text-ink first:mt-0">
                        <span className="font-gamer text-[9px] uppercase tracking-widest" style={{ color: accent }}>
                          {demo.speaker}
                        </span>
                        <br />
                        {l.text}
                      </p>
                    ),
                  )}
                  {currentLine !== undefined && (
                    <p className="mt-3 text-ink" aria-hidden="true">
                      <span className="font-gamer text-[9px] uppercase tracking-widest" style={{ color: accent }}>
                        {demo.speaker}
                      </span>
                      <br />
                      {shownText}
                      {!typingDone && <span className="cursor text-neon" />}
                    </p>
                  )}
                </>
              )}

              {/* Scanlines */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,0.22) 2px 3px)' }}
              />
              {phase === 'reading' && seen && !skipAll && !calm && !lite && (
                <span className="absolute right-3 bottom-2 font-gamer text-[9px] uppercase text-mute/70" aria-hidden>
                  click to skip ▸
                </span>
              )}
            </div>

            {/* Choices / end card */}
            <div className="border-t border-line bg-panel/40 p-3 sm:p-4">
              {phase === 'choices' && node.choices ? (
                <div className="flex flex-col gap-2" role="group" aria-label="Your moves">
                  {node.choices.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pick(c)}
                      className="group flex w-full items-center gap-3 border border-line px-3 py-2.5 text-left font-mono text-[13px] leading-snug text-ink transition-colors hover:border-neon hover:bg-neon/5"
                    >
                      <span className="grid size-6 shrink-0 place-items-center border border-line font-gamer text-[11px] text-neon group-hover:border-neon group-hover:bg-neon group-hover:text-void">
                        {i + 1}
                      </span>
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : phase === 'end' ? (
                <div className="text-center">
                  <p className="font-gamer text-[10px] uppercase tracking-widest text-warn">End of teaser</p>
                  <p className="mx-auto mt-1.5 max-w-md font-mono text-[13px] leading-snug text-ink">{node.end}</p>
                  <a
                    href={storyUrl(story)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => sfx('enter')}
                    className="pixel mt-3 inline-block px-5 py-3 font-gamer text-sm uppercase text-void transition-transform hover:scale-[1.02]"
                    style={{ background: accent }}
                  >
                    ▶ Play {story.title.length > 26 ? 'the real thing' : story.title} — free →
                  </a>
                  <p className="mt-2 font-gamer text-[10px] uppercase text-mute">
                    on {storyPlatformName(story)} · picks up instantly in your browser
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-3 font-gamer text-[11px] uppercase">
                    <button type="button" onClick={runAgain} className="border border-line px-3 py-2 text-mute hover:border-warn hover:text-warn">
                      ↻ Run it again
                    </button>
                    <a href="#stories" className="px-3 py-2 text-neon hover:text-ink">
                      All worlds ↓
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2" aria-hidden>
                  <span className="font-gamer text-[10px] uppercase tracking-widest text-mute">Storyteller is thinking…</span>
                  <span className="flex gap-2">
                    {[0, 1].map((i) => (
                      <span key={i} className="h-10 w-full max-w-44 border border-line bg-line/15" />
                    ))}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
