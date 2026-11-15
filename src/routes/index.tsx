import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { STORIES, TRIMZ, LINKS, storyPlatform, storyPlatformName, storyUrl, trimzSeriesUrl } from '#/data/content'
import { STORY_MUSIC } from '#/data/music'
import { ISK } from '#/data/isk'
import { COVER_VIDEOS } from '#/data/cover-videos'
import { LiveCount, LiveDot } from '#/components/live-count'
import { countOf, totalOf, trimzCountOf, useIskStats } from '#/lib/isk-stats'
import { PlatformChip, PlatformIcon } from '#/components/platform'
import { Logo } from '#/components/site'
import { play as sfx } from '#/lib/sfx'
import { watchFrameRate, useLite } from '#/lib/perf'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const live = useIskStats()
  const lite = useLite()
  const [selected, setSelected] = useState(0)
  const [paused, setPaused] = useState(false)
  const story = STORIES[selected]

  // auto-rotate like a console attract screen — pauses on hover/focus/interaction
  useEffect(() => {
    if (paused) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm) return
    const id = window.setInterval(() => setSelected((i) => (i + 1) % STORIES.length), 5800)
    return () => clearInterval(id)
  }, [paused])

  // watch FPS and drop to lite if needed (same as hub)
  useEffect(() => watchFrameRate(), [])

  // keyboard: arrows switch story
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        sfx('nav')
        setSelected((i) => (i + 1) % STORIES.length)
        setPaused(true)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        sfx('nav')
        setSelected((i) => (i - 1 + STORIES.length) % STORIES.length)
        setPaused(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="kx-home ps5 crt" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* fixed console backdrop — same system as the hub */}
      <div className="kx-home-backdrop ps5-backdrop" aria-hidden>
        {STORIES.map((s, i) => (
          <HomeBackdrop
            key={s.slug}
            src={s.cover}
            video={ISK[s.slug]?.videoCover ?? COVER_VIDEOS[s.slug]}
            active={i === selected}
            lite={lite}
          />
        ))}
        <div className="ps5-vignette" />
      </div>

      <div className="kx-home-app ps5-app">
        <HomeHeader live={live} />

        {/* ── console hero: tile reel + featured story ── */}
        <section className="kx-home-hero">
          {/* tile rail — the primary way in */}
          <div className="kx-home-rail">
            <div className="kx-home-rail-top">
              <p className="font-gamer text-[11px] tracking-[0.14em] text-white/60">
                {String(selected + 1).padStart(2, '0')} / {String(STORIES.length).padStart(2, '0')} · SELECT A WORLD
              </p>
              <p className="hidden items-center gap-2 font-gamer text-[11px] text-white/40 md:flex">
                <span className="ps5-key !h-5 !min-w-6 !rounded-md text-[10px]">←</span>
                <span className="ps5-key !h-5 !min-w-6 !rounded-md text-[10px]">→</span>
                <span className="ml-1">navigate</span>
                <span className="mx-2 h-3 w-px bg-white/15" />
                <span className="ps5-key !h-5 min-w-6 rounded-md px-1.5 text-[10px]">↵</span>
                <span className="ml-1">play</span>
              </p>
            </div>

            <div className="kx-home-tiles" role="listbox" aria-label="Story worlds">
              {STORIES.map((s, i) => {
                const active = i === selected
                return (
                  <button
                    key={s.slug}
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      if (!active) sfx('nav')
                      setSelected(i)
                      setPaused(true)
                    }}
                    onMouseEnter={() => {
                      if (!active) setSelected(i)
                    }}
                    className={`kx-home-tile ${active ? 'is-active' : ''}`}
                    title={s.title}
                  >
                    <img src={s.tile ?? s.cover} alt="" loading={i < 3 ? 'eager' : 'lazy'} />
                    <span className={`kx-home-tile-badge ${s.rating === '18+' ? 'is-adult' : s.rating === '17+' ? 'is-mature' : 'is-sfw'}`}>{s.rating}</span>
                    {s.trimz && <span className="kx-home-tile-trimz">▶ TRIMZ</span>}
                  </button>
                )
              })}
              <Link
                to="/"
                hash="how"
                onClick={() => sfx('nav')}
                className="kx-home-tile kx-home-tile--more"
                title="How interactive stories work"
              >
                <span className="grid h-full place-items-center p-3 text-center">
                  <span className="font-pixel text-3xl leading-none text-white/90">+</span>
                  <span className="mt-1 font-gamer text-[10px] leading-tight text-white/70">
                    HOW IT
                    <br />
                    WORKS
                  </span>
                </span>
              </Link>
            </div>

            {/* dots for phone */}
            <div className="kx-home-dots" aria-hidden>
              {STORIES.map((_, i) => (
                <span key={i} className={i === selected ? 'is-active' : ''} />
              ))}
            </div>
          </div>

          {/* featured story — the conversion engine */}
          <div className="kx-home-feature">
            <div className="kx-home-feature-main">
              <div className="flex flex-wrap items-center gap-2">
                <PlatformChip platform={storyPlatform(story)} />
                <span className={`kx-home-rating ${story.rating === '18+' ? 'is-adult' : story.rating === '17+' ? 'is-mature' : 'is-sfw'}`}>{story.rating}</span>
                <span className="flex items-center gap-1.5 text-xs text-white/65">
                  <LiveDot />
                  <LiveCount value={countOf(live, story, 'messages')} /> messages
                </span>
                <span className="hidden items-center gap-1.5 text-xs text-white/40 sm:flex">
                  <span className="h-2 w-px bg-white/20" />
                  ♥ <LiveCount value={countOf(live, story, 'likes')} /> · ✉ <LiveCount value={countOf(live, story, 'chats')} />
                </span>
              </div>

              {story.logo ? (
                <h1 className="kx-home-title-logo">
                  <img src={story.logo.src} alt={story.title} width={story.logo.w} height={story.logo.h} className="ps5-logo" />
                </h1>
              ) : (
                <h1 className="kx-home-title">{story.title}</h1>
              )}

              <p className="kx-home-logline">{story.logline}</p>

              <p className="hidden max-w-[560px] text-sm leading-relaxed text-white/70 md:block">{story.pitch[0]}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {story.tags.map((t) => (
                  <span key={t} className="rounded-full border border-white/14 bg-white/8 px-3 py-1 text-xs font-medium text-white/75">
                    #{t}
                  </span>
                ))}
              </div>

              {/* world at a glance */}
              <div className="kx-home-world">
                {story.world.slice(0, 3).map((w) => (
                  <div key={w.label} className="kx-home-world-item">
                    <dt>{w.label}</dt>
                    <dd>{w.text}</dd>
                  </div>
                ))}
              </div>

              {/* dual CTAs: direct play is primary for conversion, explore is secondary */}
              <div className="kx-home-ctas">
                <a
                  href={storyUrl(story)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => sfx('enter')}
                  className="kx-home-cta kx-home-cta--primary"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-black text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M6 4l15 8-15 8z" />
                    </svg>
                  </span>
                  Play on {storyPlatformName(story)}
                  <span className="hidden font-mono text-xs font-normal opacity-70 sm:inline">→ {story.chats > 0 ? `${countOf(live, story, 'chats')} chats` : 'start now'}</span>
                </a>
                <Link
                  to="/stories/$slug"
                  params={{ slug: story.slug }}
                  onClick={() => sfx('enter')}
                  className="kx-home-cta kx-home-cta--ghost"
                >
                  Explore world
                  <span aria-hidden>↗</span>
                </Link>
              </div>

              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/45">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Live on {storyPlatformName(story)}
                </span>
                <span>·</span>
                <span>{story.kicker}</span>
                {STORY_MUSIC[story.slug] && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      ♪ <span className="text-white/65">{STORY_MUSIC[story.slug].title}</span>
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* preview card — visible on desktop, the hook that sells the click */}
            <div className="kx-home-preview">
              <Link
                to="/stories/$slug"
                params={{ slug: story.slug }}
                onClick={() => sfx('enter')}
                className="kx-home-preview-card group"
              >
                <img src={story.cover} alt="" className="kx-home-preview-img" />
                {COVER_VIDEOS[story.slug] && !lite && <PreviewVideo src={COVER_VIDEOS[story.slug]} active />}
                <span className="kx-home-preview-scrim" />
                <span className="kx-home-preview-meta">
                  <span className="kx-home-preview-kicker">{story.kicker}</span>
                  <span className="kx-home-preview-title">{story.title}</span>
                  <span className="kx-home-preview-cta">
                    Enter
                    <span className="grid size-6 place-items-center rounded-full bg-white text-black transition-transform group-hover:scale-110">↗</span>
                  </span>
                </span>
              </Link>
              <p className="mt-3 text-center font-gamer text-[11px] tracking-wide text-white/40">
                {selected + 1} / {STORIES.length} · auto-plays in {paused ? 'paused' : '5s'} · move to explore
              </p>
            </div>
          </div>
        </section>

        {/* live social proof bar */}
        <div className="kx-home-proof">
          <span className="inline-flex items-center gap-2 font-gamer text-xs text-white/55">
            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
            LIVE NOW
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="font-mono text-sm text-white">
            <LiveCount value={totalOf(live, 'messages')} /> messages
          </span>
          <span className="font-gamer text-xs text-white/45">sent</span>
          <span className="h-4 w-px bg-white/10" />
          <span className="hidden items-center gap-2 sm:inline-flex">
            <span className="font-mono text-sm text-white">
              <LiveCount value={totalOf(live, 'likes')} /> likes
            </span>
            <span className="font-gamer text-xs text-white/45">·</span>
            <span className="font-mono text-sm text-white">
              <LiveCount value={totalOf(live, 'chats')} /> chats
            </span>
          </span>
          <span className="ml-auto hidden font-gamer text-xs text-white/30 sm:inline">updates every 2 min · from IsekaiZero & KageSekai</span>
        </div>

        {/* how it works — the conversion explainer that the old homepage lacked */}
        <section id="how" className="kx-home-how">
          <div className="kx-home-how-head">
            <p className="font-gamer text-xs tracking-[0.14em] text-white/50">01 — HOW IT WORKS</p>
            <h2 className="mt-2 font-mono text-2xl font-bold tracking-tight text-white sm:text-3xl">Not a novel. A world that talks back.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">Every storyline is a character-driven simulation. You chat, you choose, the world remembers. No two playthroughs are the same.</p>
          </div>
          <ol className="kx-home-how-grid">
            <li className="kx-home-how-card">
              <span className="kx-home-how-num">01</span>
              <h3>Pick a world</h3>
              <p>Seven storylines — spy thriller, kaiju defense, prestige high school, comedy isekai, and more. Each has its own cast, lore, and tone.</p>
              <Link to="/stories/$slug" params={{ slug: story.slug }} onClick={() => sfx('enter')} className="kx-home-how-link">
                Try {story.title.split(':')[0]} →
              </Link>
            </li>
            <li className="kx-home-how-card">
              <span className="kx-home-how-num">02</span>
              <h3>Chat &amp; choose</h3>
              <p>Talk in natural language. The AI storyteller keeps character, remembers your choices, and advances the plot with you in it.</p>
              <span className="kx-home-how-link is-muted">No app · runs in browser</span>
            </li>
            <li className="kx-home-how-card">
              <span className="kx-home-how-num">03</span>
              <h3>Own the story</h3>
              <p>Your messages shape relationships, unlock scenes, and earn trophies. Come back tomorrow and the world picked up where you left it.</p>
              <Link to="/stories/$slug/trophies" params={{ slug: story.slug }} onClick={() => sfx('enter')} className="kx-home-how-link">
                {(() => {
                  const trophies = STORIES.length * 4
                  return `${trophies}+ trophies to earn →`
                })()}
              </Link>
            </li>
          </ol>
        </section>

        {/* Trimz — re-skinned to console glass */}
        <section id="trimz" className="kx-home-trimz">
          <div className="kx-home-section-head">
            <div>
              <p className="font-gamer text-xs tracking-[0.14em] text-white/50">02 — TRIMZ</p>
              <h2 className="mt-2 font-mono text-2xl font-bold text-white sm:text-3xl">Binge the anime</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">Short-form series cut from the stories. Watch where the storylines go when the chat ends.</p>
            </div>
            <a href={LINKS.trimz} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="kx-home-pill">
              Follow on Trimz →
            </a>
          </div>
          <ul className="kx-home-trimz-grid">
            {TRIMZ.map((t) => (
              <li key={t.slug}>
                <a href={trimzSeriesUrl(t.slug)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="kx-home-trimz-card group">
                  <div className="kx-home-trimz-cover">
                    <img src={t.poster} alt="" loading="lazy" />
                    {t.video && !lite && <video src={t.video} muted loop playsInline preload="metadata" className="kx-home-trimz-video" />}
                    <span className="kx-home-trimz-play">
                      <span>▶</span>
                    </span>
                  </div>
                  <div className="kx-home-trimz-body">
                    <p className="font-gamer text-[11px] tracking-wide text-white/50">SERIES · TRIMZ</p>
                    <h3 className="mt-1 font-mono text-base font-bold leading-snug text-white group-hover:text-white">{t.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">{t.summary}</p>
                    <p className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3 font-gamer text-xs text-white/45">
                      <span>
                        <LiveCount value={trimzCountOf(live, t, 'episodes')} /> EP
                      </span>
                      <span className="h-3 w-px bg-white/10" />
                      <span>
                        <LiveCount value={trimzCountOf(live, t, 'views')} /> views
                      </span>
                      <span className="ml-auto text-white/70 group-hover:text-white">Watch →</span>
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* channels — four ways in, now glass */}
        <section id="watch" className="kx-home-channels">
          <div className="kx-home-section-head">
            <div>
              <p className="font-gamer text-xs tracking-[0.14em] text-white/50">03 — CHANNELS</p>
              <h2 className="mt-2 font-mono text-2xl font-bold text-white sm:text-3xl">Four ways in</h2>
              <p className="mt-2 text-sm text-white/60">Same universe, different screens. Start wherever you are.</p>
            </div>
          </div>
          <ul className="kx-home-channels-grid">
            {CHANNELS.map((c, i) => (
              <li key={c.key}>
                <a href={c.href} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="kx-home-channel">
                  <span className="font-gamer text-xs text-white/35">0{i + 1}</span>
                  <span className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-black tracking-tight text-white">{c.verb}</span>
                    <PlatformIcon platform={c.platform as never} />
                  </span>
                  <span className="font-mono text-sm font-bold text-white/90">on {c.name}</span>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{c.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1 font-gamer text-xs text-white/70 group-hover:text-white">
                    {c.handle} <span aria-hidden>→</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <HomeFooter />
      </div>

      {/* mobile sticky conversion bar — the one-tap play that the old homepage never had */}
      <div className="kx-home-sticky">
        <div className="kx-home-sticky-inner">
          <img src={story.tile ?? story.cover} alt="" className="size-10 rounded-lg object-cover" />
          <span className="min-w-0">
            <span className="block truncate font-mono text-sm font-bold leading-none text-white">{story.title.split(':')[0]}</span>
            <span className="block text-xs text-white/60">on {storyPlatformName(story)} · {story.rating}</span>
          </span>
          <a href={storyUrl(story)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="kx-home-cta kx-home-cta--primary !px-4 !py-2 !text-sm">
            Play
          </a>
          <Link to="/stories/$slug" params={{ slug: story.slug }} onClick={() => sfx('enter')} className="kx-home-cta kx-home-cta--ghost !px-3 !py-2 !text-xs">
            Explore
          </Link>
        </div>
      </div>
    </div>
  )
}

function HomeHeader({ live }: { live: ReturnType<typeof useIskStats> }) {
  return (
    <header className="kx-home-header">
      <Link to="/" aria-label="KuletX AI home" className="shrink-0">
        <Logo className="h-8 sm:h-9" />
      </Link>
      <nav className="hidden items-center gap-1 font-gamer text-xs sm:flex">
        <a href="#how" className="rounded-full px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          How it works
        </a>
        <a href="#trimz" className="rounded-full px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          Trimz
        </a>
        <a href="#watch" className="rounded-full px-3 py-1.5 text-white/70 hover:bg-white/10 hover:text-white">
          Channels
        </a>
      </nav>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-gamer text-xs text-white/60 sm:inline-flex">
          <LiveDot />
          <LiveCount value={totalOf(live, 'messages')} /> online
        </span>
        <a href={LINKS.youtube} target="_blank" rel="noreferrer" className="hidden rounded-full bg-white px-4 py-2 font-gamer text-xs font-bold text-black hover:bg-white/90 sm:inline-flex">
          Subscribe
        </a>
        <Link to="/" hash="watch" className="rounded-full border border-white/15 bg-white/8 px-3 py-2 font-gamer text-xs text-white backdrop-blur sm:hidden">
          Channels
        </Link>
      </div>
    </header>
  )
}

function HomeBackdrop({ src, video, active, lite }: { src: string; video?: string; active: boolean; lite: boolean }) {
  const [canPlay, setCanPlay] = useState(false)
  const coarse = useIsCoarse()
  // lite or touch gets a tiny pre-blurred image instead of a live filter — same trick as the hub
  const soft = softOf(src)
  const glowSrc = lite || coarse ? (soft ?? src) : undefined
  const showGlowBlur = !lite && !coarse

  useEffect(() => {
    if (!active || lite) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (calm) return
    const id = window.setTimeout(() => setCanPlay(true), 700)
    return () => clearTimeout(id)
  }, [active, lite])

  if (!active && !glowSrc) return <div className="ps5-layer" aria-hidden />
  return (
    <div className={`ps5-layer ${active ? 'is-active' : ''}`} aria-hidden>
      {showGlowBlur ? <img src={src} alt="" className="ps5-layer-blur" loading={active ? 'eager' : 'lazy'} /> : glowSrc ? <img src={glowSrc} alt="" className="ps5-layer-soft" loading={active ? 'eager' : 'lazy'} /> : null}
      <img src={src} alt="" className="ps5-layer-art" loading={active ? 'eager' : 'lazy'} />
      {video && active && canPlay && !lite && (
        <video
          key={video}
          src={video}
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          className="ps5-layer-art ps5-fade opacity-100"
          onLoadedData={(e) => e.currentTarget.play().catch(() => {})}
        />
      )}
    </div>
  )
}

function PreviewVideo({ src, active }: { src: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (active) v.play().catch(() => {})
    else v.pause()
  }, [active])
  return <video ref={ref} src={src} muted loop playsInline preload="metadata" className="kx-home-preview-video" aria-hidden />
}

function softOf(src: string) {
  return src.startsWith('/') ? `/soft/${src.slice(1).replace(/\//g, '-')}` : undefined
}

function useIsCoarse() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia('(pointer: coarse)')
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia('(pointer: coarse)').matches,
    () => false,
  )
}

const CHANNELS = [
  { key: 'isekai', platform: 'isk', name: 'IsekaiZero', verb: 'Play', body: 'Step into the stories yourself. Every storyline is a world you can talk to.', href: LINKS.isekaiProfile, handle: 'isekaizero.ai/creator/kuletxcore' },
  { key: 'kage', platform: 'kage', name: 'KageSekai', verb: 'Dare', body: 'The 18+ worlds live on the adult sister site of IsekaiZero. Same account, darker stories.', href: LINKS.kageProfile, handle: 'kagesekai.ai/creator/kuletxcore' },
  { key: 'trimz', platform: 'trimz', name: 'Trimz', verb: 'Binge', body: 'Watch the series created by KuletXCore, episode by episode.', href: LINKS.trimz, handle: 'trimz.tv/u/kuletxcore' },
  { key: 'youtube', platform: 'youtube', name: 'YouTube', verb: 'Watch', body: 'Trailers, behind-the-scenes and the AI storytelling process. Outslopping the competition.', href: LINKS.youtube, handle: '@kuletxai' },
]

function HomeFooter() {
  return (
    <footer className="kx-home-footer">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo className="h-10" />
          <p className="mt-2 text-sm text-white/50">AI storytelling. © {new Date().getFullYear()} KuletX.</p>
        </div>
        <nav className="flex flex-wrap gap-4 font-gamer text-xs">
          <a href={LINKS.isekai} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white">
            IsekaiZero
          </a>
          <a href={LINKS.kageProfile} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white">
            KageSekai
          </a>
          <a href={LINKS.trimz} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white">
            Trimz
          </a>
          <a href={LINKS.youtube} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white">
            YouTube
          </a>
        </nav>
      </div>
      <p className="mt-8 text-xs text-white/35">
        Fonts: pixel faces by 00ff (hicchicc) and Obel Mono by Typographic Systems, under the <a href="/fonts/OFL-00ff.txt" className="underline hover:text-white">SIL Open Font License</a>. UI sounds from{' '}
        <a href="https://antislop.ai.id/install" target="_blank" rel="noreferrer" className="underline hover:text-white">
          antislop
        </a>
        .
      </p>
    </footer>
  )
}
