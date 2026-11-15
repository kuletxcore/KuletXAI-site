import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import { LiveCount, LiveDot } from '#/components/live-count'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { useLite } from '#/lib/perf'
import { play as sfx } from '#/lib/sfx'
import { KeyLabel } from '#/components/pad-glyph'

/**
 * THE HOME SCREEN — the landing page reimagined as the PS5 home screen.
 * stories/* is a faithful PS5 recreation in miniature; this is the same
 * language at the front door: full-bleed key art, a focusable rail of
 * world tiles with controller-style hints, a live clock, and the focused
 * world's logotype above its own Play button. Arrow keys move, ✕ or
 * Enter opens the world, △ jumps straight to the platform.
 */

const pad2 = (n: number) => String(n).padStart(2, '0')

export function ConsoleHome() {
  const live = useIskStats()
  const lite = useLite()
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  const [clock, setClock] = useState<string | null>(null)
  const [inView, setInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLUListElement>(null)
  const calm = useRef(false)

  const story = STORIES[idx]
  const platform = storyPlatformName(story)

  // The clock ticks once a second; SSR renders --:-- so hydration matches
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    calm.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Keyboard drives the rail only while the screen is on camera
  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Keep the focused tile centered in the rail
  useEffect(() => {
    const rail = railRef.current
    const tile = rail?.children[idx] as HTMLElement | undefined
    tile?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: calm.current ? 'auto' : 'smooth' })
  }, [idx])

  useEffect(() => {
    if (!inView) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        setIdx((i) => (i + (e.key === 'ArrowRight' ? 1 : -1) + STORIES.length) % STORIES.length)
        sfx('nav')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        sfx('enter')
        void navigate({ to: '/stories/$slug', params: { slug: STORIES[idx].slug }, search: {} })
      } else if (e.key === 'x' || e.key === 'X') {
        window.open(storyUrl(STORIES[idx]), '_blank', 'noopener')
        sfx('enter')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView, idx, navigate])

  const focus = (i: number) => setIdx(i)

  return (
    <section
      ref={sectionRef}
      aria-label="KuletX home screen — pick a world"
      className="relative flex min-h-[88svh] flex-col overflow-hidden border-b border-line bg-void text-white"
      style={{ fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Key art: the focused world owns the screen. Lite mode renders one layer, no crossfade. */}
      <div className="absolute inset-0" aria-hidden>
        {(lite ? [idx] : STORIES.map((_, i) => i)).map((i) => (
          <img
            key={STORIES[i].id}
            src={STORIES[i].cover}
            alt=""
            decoding="async"
            fetchPriority={i === idx ? 'high' : 'low'}
            className={`absolute inset-0 h-full w-full object-cover object-[50%_15%] transition-opacity duration-700 ${
              i === idx ? 'opacity-100' : 'opacity-0'
            } ${lite || i !== idx ? '' : 'kx-console-kenburns'}`}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-r from-black/95 via-black/70 to-black/5" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-black/45" />
      </div>

      {/* Top bar: mark left, world status right */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 sm:px-10 sm:pt-6">
        <img src="/brand/kx-mark.webp" alt="KuletX mark" className="h-7 opacity-90 sm:h-8" />
        <div className="flex items-center gap-3 font-mono text-[11px] text-white/80 sm:gap-4 sm:text-xs">
          <span className="flex items-center gap-1.5">
            <LiveDot />
            ONLINE
          </span>
          <span aria-hidden className="text-white/25">|</span>
          <span className="tabular-nums">{clock ?? '--:--'}</span>
          {lite && <span className="border border-white/25 px-1.5 py-0.5 font-mono text-[9px] uppercase text-white/60">Lite</span>}
        </div>
      </div>

      {/* Focused world panel */}
      <div className="relative z-10 mt-auto w-full max-w-3xl px-5 pt-14 sm:px-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
          World {pad2(idx + 1)} / {pad2(STORIES.length)} · <span className={story.rating === 'SFW' ? 'text-neon' : 'text-warn'}>{story.rating}</span> · {platform}
        </p>
        {story.logo ? (
          <img
            key={story.slug}
            src={story.logo.src}
            alt={story.title}
            width={story.logo.w}
            height={story.logo.h}
            className="mt-3 h-14 w-auto max-w-[86vw] object-contain object-left drop-shadow-[0_8px_28px_rgba(0,0,0,0.85)] sm:h-20"
          />
        ) : (
          <h2 className="mt-3 font-mono text-3xl font-extrabold leading-tight text-white sm:text-5xl">{story.title}</h2>
        )}
        <h1 className="sr-only">AI stories you play, watch &amp; binge — KuletX AI</h1>
        <p className="mt-4 line-clamp-3 max-w-lg text-sm leading-snug text-white/85 sm:text-base">{story.logline}</p>
        <p className="mt-2 font-mono text-[11px] text-white/60" title={`Likes · messages on ${platform}`}>
          ♥ <LiveCount value={countOf(live, story, 'likes')} /> likes · <LiveCount value={countOf(live, story, 'messages')} compact /> messages
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={storyUrl(story)}
            target="_blank"
            rel="noreferrer"
            onClick={() => sfx('enter')}
            className="flex items-center gap-3 rounded-sm bg-white px-5 py-3.5 font-mono text-[13px] font-bold uppercase tracking-wide text-black transition-colors hover:bg-neon sm:px-7 sm:py-4"
          >
            <svg viewBox="0 0 24 24" className="size-4 fill-black" aria-hidden><path d="M6 4.5v15l13-7.5z" /></svg>
            Play on {platform}
          </a>
          <Link
            to="/stories/$slug"
            params={{ slug: story.slug }}
            search={{}}
            onClick={() => sfx('enter')}
            className="rounded-sm border border-white/35 px-4 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm transition-colors hover:border-white hover:text-white sm:px-5 sm:py-4"
          >
            World file →
          </Link>
        </div>
      </div>

      {/* The rail: focused tile lifts and glows, the rest step back */}
      <div className="relative z-10 mt-5 border-t border-white/10 bg-black/45 backdrop-blur-md sm:mt-7">
        <span className="sr-only" role="status" aria-live="polite">
          World {idx + 1} of {STORIES.length}: {story.title}
        </span>
        <ul
          ref={railRef}
          aria-label="Worlds"
          className="flex snap-x snap-mandatory items-end gap-3 overflow-x-auto px-5 pt-9 pb-3 [scrollbar-width:none] sm:gap-4 sm:px-10 sm:pt-11 sm:pb-4 [&::-webkit-scrollbar]:hidden"
        >
          {STORIES.map((s, i) => (
            <li key={s.id} className="shrink-0 snap-center">
              <Link
                to="/stories/$slug"
                params={{ slug: s.slug }}
                search={{}}
                onClick={() => sfx('enter')}
                onMouseEnter={() => focus(i)}
                onFocus={() => focus(i)}
                aria-current={i === idx}
                aria-label={s.title}
                className={`group block outline-none transition-all duration-300 ${
                  i === idx ? 'z-10 -translate-y-2 scale-[1.12]' : 'translate-y-0 scale-100 opacity-55 hover:opacity-95 focus-visible:opacity-95'
                }`}
              >
                <img
                  src={s.tile ?? s.cover}
                  alt=""
                  loading={i < 3 ? 'eager' : 'lazy'}
                  decoding="async"
                  className={`h-36 w-24 rounded-md object-cover transition-shadow duration-300 sm:h-44 sm:w-32 ${
                    i === idx
                      ? 'shadow-[0_0_38px_rgba(255,255,255,0.32)] ring-[3px] ring-white'
                      : 'ring-1 ring-white/15 group-focus-visible:ring-2 group-focus-visible:ring-white/70'
                  }`}
                />
                <span
                  className={`mt-2 block max-w-24 truncate font-mono text-[9px] font-semibold uppercase tracking-wide sm:max-w-32 sm:text-[10px] ${
                    i === idx ? 'text-white' : 'text-white/55'
                  }`}
                >
                  {s.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {/* Controller hints — pure PlayStation home-screen grammar */}
        <div className="flex select-none items-center gap-4 border-t border-white/8 px-5 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-white/55 sm:gap-7 sm:px-10 sm:text-[10px]">
          <span className="flex items-center gap-1.5"><KeyLabel k="←" /><KeyLabel k="→" /> navigate</span>
          <span className="flex items-center gap-1.5"><KeyLabel k="✕" /> resume</span>
          <span className="flex items-center gap-1.5"><KeyLabel k="△" /> play on {platform}</span>
          <span className="ml-auto hidden text-white/30 md:inline">KuletX System v7.2 — memory card OK</span>
        </div>
      </div>
    </section>
  )
}
