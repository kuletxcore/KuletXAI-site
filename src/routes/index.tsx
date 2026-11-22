import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Footer, Header, SectionHead } from '#/components/site'
import { ContinueBand } from '#/components/continue-band'
import { jsonLd, siteJsonLd } from '#/lib/machine'
import { siteOrigin } from '#/lib/origin'
import { WorldFinder } from '#/components/world-finder'
import { HomePad } from '#/components/home-pad'
import { ColdOpen } from '#/components/cold-open'
import { play as sfx } from '#/lib/sfx'
import { LINKS, STORIES, TRIMZ, storyPlatformName, storyUrl, trimzSeriesUrl } from '#/data/content'
import type { DemoWorld } from '#/data/demo'
import { LiveCount } from '#/components/live-count'
import { countOf, totalOf, trimzCountOf, useIskStats } from '#/lib/isk-stats'
import { COVER_VIDEOS } from '#/data/cover-videos'
import { useLite } from '#/lib/perf'
import { setStill, useStill } from '#/lib/still'

export const Route = createFileRoute('/')({
  // Structured data for search and answer engines: who runs this site and what it is
  head: () => ({ scripts: [{ type: 'application/ld+json', children: jsonLd(siteJsonLd(siteOrigin())) }] }),
  component: Home,
})

// The Dealer pulls in the motion library, so it loads once the reader is within 900px of it.
// The #dealer anchor exists from first paint, so links to it never dangle.
const WorldDealer = lazy(() => import('#/components/world-dealer').then((m) => ({ default: m.WorldDealer })))
function DeferredDealer() {
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setNear(true)
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        setNear(true)
        io.disconnect()
      },
      { rootMargin: '900px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  if (near) return <Suspense fallback={null}><WorldDealer /></Suspense>
  return <section id="dealer" ref={ref} className="min-h-[720px] scroll-mt-16 border-b border-line" aria-label="The World Dealer" />
}

function Home() {
  return (
    <div className="crt min-h-screen">
      <Header />
      <WorldFinder />
      <HomePad />
      <main>
        <Hero />
        <ContinueBand />
        <Stories />
        <DeferredDealer />
        <Trimz />
        <Channels />
      </main>
      <Footer />
    </div>
  )
}

const HERO_DEFAULT: DemoWorld['slug'] = 'i-am-the-table'

function Hero() {
  const live = useIskStats()
  // The hero owns which world the cold open is showing, so the button under the headline always
  // points at the world on screen instead of at a section they then have to hunt through.
  const [world, setWorld] = useState<DemoWorld['slug']>(HERO_DEFAULT)
  const heroStory = STORIES.find((s) => s.slug === world)!
  return (
    <section id="top" className="relative overflow-hidden border-b border-line">
      <PosterWall />
      <div className="grid-bg absolute inset-0" aria-hidden />
      <MotionToggle />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center lg:gap-12">
        <div>
          <p className="font-gamer text-sm text-neon">&gt; boot storyteller.exe</p>
          <h1 className="pixel mt-5 font-pixel text-5xl leading-[1.05] text-ink sm:text-6xl xl:text-7xl">
            AI stories
            <br />
            you <span className="text-neon glow">play</span>,
            <br />
            watch &amp; <span className="text-neon glow">binge</span>
            <span className="cursor text-neon" />
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-mute sm:text-lg">
            KuletX builds interactive worlds on IsekaiZero and KageSekai, cuts them into series on Trimz, and
            breaks it all down on YouTube.
          </p>

          {/* One primary action, and it is the one that actually starts a story */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={storyUrl(heroStory)}
              target="_blank"
              rel="noreferrer"
              onClick={() => sfx('enter')}
              className="pixel bg-neon px-5 py-3 font-gamer text-sm uppercase text-void hover:bg-ink"
            >
              ▶ Play {world === 'acolytes' ? 'Acolytes' : 'I AM THE TABLE'}
            </a>
            <a
              href="#stories"
              className="pixel border border-line px-5 py-3 font-gamer text-sm uppercase text-ink hover:border-neon hover:text-neon"
            >
              Browse all {STORIES.length} worlds
            </a>
          </div>

          {/* The receipts, kept as one quiet strip so they sell without shouting */}
          <dl className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-5 font-gamer text-[11px] uppercase text-mute">
            <div className="flex items-baseline gap-2">
              <dt className="flex items-center">
                messages
              </dt>
              <dd className="font-pixel text-lg text-neon">
                <LiveCount value={totalOf(live, 'messages')} compact />
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt>likes</dt>
              <dd className="font-pixel text-lg text-neon">
                <LiveCount value={totalOf(live, 'likes')} compact />
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt>chats</dt>
              <dd className="font-pixel text-lg text-neon">
                <LiveCount value={totalOf(live, 'chats')} compact />
              </dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt>motto</dt>
              <dd className="text-warn">outslopping the competition</dd>
            </div>
          </dl>
        </div>

        <div className="lg:pl-2">
          <ColdOpen slug={world} onSlug={setWorld} />
          <p className="mt-2 text-center font-gamer text-[10px] uppercase text-mute/70">
            Press <kbd className="border border-line px-1 text-ink">1</kbd> or{' '}
            <kbd className="border border-line px-1 text-ink">2</kbd> to choose
          </p>
        </div>
      </div>
    </section>
  )
}

// The worlds drift behind the hero, so the first screen shows the stories instead of an empty grid
function PosterWall() {
  const wall = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = wall.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-paused', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const art = STORIES.map((s) => s.tile ?? s.cover)
  const rows = [art, [...art.slice(3), ...art.slice(0, 3)], [...art.slice(5), ...art.slice(0, 5)]]
  return (
    <div ref={wall} className="kx-wall pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -inset-x-1/4 top-[36%] flex -translate-y-1/2 -rotate-6 flex-col gap-3 opacity-45 md:top-1/2">
        {rows.map((row, r) => (
          <div key={r} className={`kx-wall-row flex w-max gap-3 ${r % 2 ? 'is-rev' : ''}`}>
            {[...row, ...row, ...row, ...row].map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                width={300}
                height={400}
                decoding="async"
                fetchPriority="low"
                className="size-32 shrink-0 rounded-sm object-cover sm:size-40"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-void/65 md:bg-transparent md:bg-linear-to-r md:from-void md:from-25% md:via-void/80 md:to-void/20" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-void to-transparent" />
    </div>
  )
}

// Anything that loops for longer than five seconds gets an off switch
function MotionToggle() {
  const still = useStill()
  return (
    <button
      type="button"
      onClick={() => setStill(!still)}
      aria-pressed={still}
      className="absolute right-2 bottom-2 z-10 inline-flex min-h-11 items-center gap-2 px-3 font-gamer text-[11px] uppercase text-mute hover:text-neon sm:right-4 sm:bottom-4"
    >
      <span aria-hidden>{still ? '▶' : '❚❚'}</span>
      {still ? 'Play motion' : 'Pause motion'}
    </button>
  )
}

// On phones the worlds sit in a swipeable shelf, not a seven-screen stack; sm and up keep the grid
const SLOT = 'w-[min(80vw,22rem)] shrink-0 snap-start sm:w-auto sm:shrink'
const pad2 = (n: number) => String(n).padStart(2, '0')

// A poster's own cover video: fetched the first time it plays, then only paused, and shown once frames arrive
function CoverVideo({ src, play }: { src: string; play: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [armed, setArmed] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (play) setArmed(true)
  }, [play])
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    if (play) void v.play().catch(() => {})
    else v.pause()
  }, [play, armed])
  if (!armed) return null
  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden
      onPlaying={() => setReady(true)}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${play && ready ? 'opacity-100' : 'opacity-0'}`}
    >
      <source src={src.replace(/\.mp4(?=\?|$)/, '.webm')} type="video/webm" />
      <source src={src} type="video/mp4" />
    </video>
  )
}

function Stories() {
  const live = useIskStats()
  const shelf = useRef<HTMLUListElement>(null)
  const [at, setAt] = useState(0)
  const total = STORIES.length + 1
  // Badges come from the live counts, so they move when the players do
  const topBy = (k: 'messages' | 'saves') => STORIES.reduce((a, b) => (countOf(live, b, k) > countOf(live, a, k) ? b : a))
  const mostPlayed = topBy('messages').slug
  const mostSaved = topBy('saves').slug
  const lite = useLite()
  const [hot, setHot] = useState<number | null>(null)
  const [shelfLive, setShelfLive] = useState(false)
  const [motionOk, setMotionOk] = useState(false)
  const canPlay = motionOk && !lite
  const still = useStill()

  // Posters move only for people who want motion and are not saving data
  useEffect(() => {
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const saving = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    const sync = () => setMotionOk(!calm.matches && !saving)
    sync()
    calm.addEventListener('change', sync)
    return () => calm.removeEventListener('change', sync)
  }, [])

  // In the phone shelf the card in view plays by itself, but only while the shelf is on screen
  useEffect(() => {
    const el = shelf.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setShelfLive(e.isIntersecting && el.scrollWidth > el.clientWidth), { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const playing = (i: number) => canPlay && (hot === i || (!still && shelfLive && at === i))
  const cool = (i: number) => setHot((h) => (h === i ? null : h))

  useEffect(() => {
    const el = shelf.current
    if (!el) return
    let raf = 0
    const read = () => {
      raf = 0
      const first = el.children[0] as HTMLElement
      const second = el.children[1] as HTMLElement
      const step = second.offsetLeft - first.offsetLeft
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2
      setAt(end ? el.children.length - 1 : Math.round(el.scrollLeft / step))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const go = (i: number) => {
    const el = shelf.current
    const card = el?.children[i] as HTMLElement | undefined
    if (!el || !card) return
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: card.offsetLeft - 16, behavior: calm ? 'auto' : 'smooth' })
  }

  return (
    <section id="stories" className="kx-cv scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <SectionHead
          kicker="01 // IsekaiZero + KageSekai"
          title="Pick a world"
          body="Open a world to see its cast and lore."
        />
        <ul
          ref={shelf}
          className="relative mt-12 -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto overscroll-x-contain px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:scroll-pl-0 sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:py-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
        >
          {STORIES.map((s, i) => (
            <li key={s.id} className={SLOT}>
              <Link
                to="/stories/$slug"
                params={{ slug: s.slug }}
                onClick={() => sfx('enter')}
                onMouseEnter={() => setHot(i)}
                onMouseLeave={() => cool(i)}
                onFocus={() => setHot(i)}
                onBlur={() => cool(i)}
                className="group flex h-full flex-col border border-line bg-panel hover:border-neon"
              >
                <div className="cover relative aspect-[3/4] overflow-hidden border-b border-line">
                  <img
                    src={s.cover}
                    alt={`Cover art for ${s.title}`}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                  {COVER_VIDEOS[s.slug] && <CoverVideo src={COVER_VIDEOS[s.slug]} play={playing(i)} />}
                  <span
                    className={`absolute top-3 left-3 px-2 py-1 font-gamer text-xs ${
                      s.rating === 'SFW' ? 'bg-neon text-void' : s.rating === '18+' ? 'bg-danger text-white' : 'bg-warn text-void'
                    }`}
                  >
                    {s.rating}
                  </span>
                  {(s.slug === mostPlayed || s.slug === mostSaved) && (
                    <span className="absolute top-3 right-3 flex flex-col items-end gap-1 font-gamer text-[10px]">
                      {s.slug === mostPlayed && <span className="bg-neon px-2 py-1 text-void">★ Most played</span>}
                      {s.slug === mostSaved && <span className="bg-ink px-2 py-1 text-void">★ Most saved</span>}
                    </span>
                  )}
                  {s.trimz && (
                    <span className="absolute bottom-3 left-3 bg-void/85 px-2 py-1 font-gamer text-xs text-ink">
                      ▶ ON TRIMZ
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-mono text-lg font-bold leading-snug text-ink group-hover:text-neon">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{s.logline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {s.tags.map((t) => (
                      <span key={t} className="border border-line px-2 py-0.5 text-xs text-mute">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-gamer text-xs">
                    <span className="text-mute" title={`Likes · saves · chats · messages on ${storyPlatformName(s)}`}>
                      ♥ <LiveCount value={countOf(live, s, 'likes')} /> · ★ <LiveCount value={countOf(live, s, 'saves')} /> · ✉ <LiveCount value={countOf(live, s, 'chats')} /> ·{' '}
                      <LiveCount value={countOf(live, s, 'messages')} compact /> MSG
                    </span>
                    <span className="text-neon">ENTER →</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          <li className={SLOT}>
            <div className="group relative flex h-full flex-col border border-dashed border-line bg-panel hover:border-solid hover:border-neon">
              {/* Cover slot: the five worlds tiled, dimmed, with the loading line on top */}
              <div className="cover relative aspect-[3/4] overflow-hidden border-b border-line">
                <div className="grid h-full grid-cols-2 grid-rows-3 gap-px bg-line" aria-hidden>
                  {STORIES.map((s, i) => (
                    <img
                      key={s.slug}
                      src={s.cover}
                      alt=""
                      loading="lazy"
                      className={`h-full w-full object-cover opacity-35 grayscale transition duration-500 group-hover:opacity-60 group-hover:grayscale-0 ${i === 0 ? 'row-span-2' : ''}`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 grid place-items-center bg-void/55 transition-colors group-hover:bg-void/35">
                  <span className="text-center">
                    <span className="pixel block font-pixel text-5xl text-neon glow">+</span>
                    <span className="mt-2 block font-gamer text-xs text-ink">
                      Next world
                    </span>
                  </span>
                </div>
                <span className="absolute top-3 left-3 bg-ink px-2 py-1 font-gamer text-xs text-void">CREATOR</span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-mono text-lg font-bold leading-snug text-ink group-hover:text-neon">
                  {/* The stretched ::after makes the whole card open the IsekaiZero profile */}
                  <a
                    href={LINKS.isekaiProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sfx('enter')}
                    className="after:absolute after:inset-0"
                  >
                    More worlds in the works
                  </a>
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">
                  KuletX storylines live on IsekaiZero, and the 18+ ones on KageSekai. Follow either creator page to catch new worlds the day they go live.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['AllWorlds', 'NewDrops', 'Follow'].map((t) => (
                    <span key={t} className="border border-line px-2 py-0.5 text-xs text-mute">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-gamer text-xs">
                  <span className="text-mute">{STORIES.length} LIVE</span>
                  <span className="flex gap-3 whitespace-nowrap">
                    <span className="text-neon">ISEKAIZERO →</span>
                    <a
                      href={LINKS.kageProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => sfx('enter')}
                      className="relative z-10 -my-3.5 inline-flex min-h-11 items-center text-danger-ink hover:text-ink"
                    >
                      KAGESEKAI →
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ul>
        {/* Eight dots can't each be 44px on a phone, so they only show position and the arrows steer */}
        <div className="mt-4 flex items-center justify-between gap-3 font-gamer text-xs text-mute sm:hidden">
          <span aria-live="polite">
            <span className="text-neon">{pad2(at + 1)}</span> / {pad2(total)}
          </span>
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`h-1 ${i === at ? 'w-5 bg-neon' : 'w-2 bg-mute/50'}`} />
            ))}
          </span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={() => go(Math.max(0, at - 1))}
              disabled={at === 0}
              aria-label="Previous world"
              className="grid size-11 place-items-center border border-line text-ink hover:border-neon hover:text-neon active:bg-neon/10 disabled:opacity-40"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(Math.min(total - 1, at + 1))}
              disabled={at === total - 1}
              aria-label="Next world"
              className="grid size-11 place-items-center border border-line text-ink hover:border-neon hover:text-neon active:bg-neon/10 disabled:opacity-40"
            >
              ›
            </button>
          </span>
        </div>
      </div>
    </section>
  )
}

function Trimz() {
  const live = useIskStats()
  const lite = useLite()
  const still = useStill()
  const [idx, setIdx] = useState(0)
  const [hover, setHover] = useState(false)
  const [inView, setInView] = useState(false)
  const [calm, setCalm] = useState(false)
  const screen = useRef<HTMLDivElement>(null)
  const t = TRIMZ[idx]

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setCalm(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // The reel runs while the screen is on screen, or under the pointer, and never in lite or paused motion
  useEffect(() => {
    const el = screen.current
    if (!el || !('IntersectionObserver' in window)) {
      setInView(true)
      return
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const reel = !lite && !still && !calm && (inView || hover)

  return (
    <section id="trimz" className="kx-cv scroll-mt-16 border-b border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            kicker="02 // Trimz"
            title="Now streaming"
            body="Anime series cut from the stories."
          />
          <a
            href={LINKS.trimz}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => sfx('enter')}
            className="inline-flex min-h-11 shrink-0 items-center self-start border border-neon px-4 font-gamer text-xs uppercase text-neon hover:bg-neon hover:text-void sm:self-auto"
          >
            Follow on Trimz →
          </a>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:gap-6">
          {/* The screen */}
          <div
            ref={screen}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            className="group relative overflow-hidden border border-line bg-void"
          >
            <div className="relative aspect-[4/5] sm:aspect-[16/9]">
              <img
                key={`poster-${t.slug}`}
                src={t.poster}
                alt={`Poster for ${t.title}`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-top opacity-80"
              />
              {t.video && <CoverVideo key={t.video} src={t.video} play={reel} />}
              <div className="absolute inset-0 bg-linear-to-t from-void via-void/55 to-void/5" aria-hidden />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3 font-gamer text-[10px] uppercase">
                <span className="flex items-center gap-2 bg-void/80 px-2 py-1 text-neon">
                  <span className={reel ? 'text-danger-ink' : 'text-mute'}>●</span> {reel ? 'Reel running' : 'Still frame'}
                </span>
                <span className="bg-void/80 px-2 py-1 text-mute">
                  Series {String(idx + 1).padStart(2, '0')} / {String(TRIMZ.length).padStart(2, '0')}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <p className="font-gamer text-[10px] uppercase text-neon">Now showing</p>
                <h3 className="mt-1 font-mono text-lg font-bold leading-snug text-ink sm:text-2xl">{t.title}</h3>
                <p className="mt-2 hidden max-w-xl text-sm leading-relaxed text-ink/80 sm:block">{t.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <a
                    href={trimzSeriesUrl(t.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => sfx('enter')}
                    className="pixel inline-flex min-h-11 items-center gap-2 bg-neon px-4 font-gamer text-xs uppercase text-void hover:bg-ink"
                  >
                    ▶ Watch on Trimz
                  </a>
                  <span className="inline-flex min-h-11 items-center border border-line bg-void/70 px-3 font-gamer text-[10px] uppercase text-mute">
                    <LiveCount value={trimzCountOf(live, t, 'episodes')} /> ep ·{' '}
                    <LiveCount value={trimzCountOf(live, t, 'views')} /> views
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* The slate: pick what's on the screen */}
          <div className="flex flex-col gap-3">
            <p className="font-gamer text-[10px] uppercase text-mute">The slate · {TRIMZ.length} series</p>
            <ul className="grid gap-3">
              {TRIMZ.map((x, i) => {
                const on = i === idx
                return (
                  <li key={x.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!on) sfx('tab')
                        setIdx(i)
                      }}
                      aria-pressed={on}
                      className={`group flex w-full items-stretch gap-3 border text-left transition-colors ${
                        on ? 'border-neon bg-void' : 'border-line bg-void/60 hover:border-neon/60'
                      }`}
                    >
                      <span className="cover relative w-20 shrink-0 overflow-hidden border-r border-line">
                        <img src={x.poster} alt="" loading="lazy" decoding="async" className="aspect-[2/3] h-full w-full object-cover" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3">
                        <span className={`font-gamer text-[10px] uppercase ${on ? 'text-neon' : 'text-mute'}`}>
                          {on ? '▸ On screen' : `Series ${String(i + 1).padStart(2, '0')}`}
                        </span>
                        <span className={`mt-0.5 line-clamp-2 font-mono text-sm font-bold leading-snug ${on ? 'text-ink' : 'text-ink/85'}`}>
                          {x.title}
                        </span>
                        <span className="mt-1 font-gamer text-[10px] text-mute">
                          <LiveCount value={trimzCountOf(live, x, 'episodes')} /> EP · <LiveCount value={trimzCountOf(live, x, 'views')} /> VIEWS
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <a
              href={LINKS.youtube}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sfx('enter')}
              className="group mt-auto flex min-h-11 items-center justify-between gap-3 border border-line px-3 py-3 font-gamer text-[10px] uppercase text-mute hover:border-neon hover:text-neon"
            >
              <span>Full episodes and trailers on YouTube</span>
              <span aria-hidden className="text-neon">
                →
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

const CHANNELS = [
  {
    key: 'isekai',
    name: 'IsekaiZero',
    verb: 'Play',
    body: 'Step into the stories yourself. Every storyline is a world you can talk to.',
    href: LINKS.isekaiProfile,
    handle: 'isekaizero.ai/creator/kuletxcore',
  },
  {
    key: 'kage',
    name: 'KageSekai',
    verb: 'Dare',
    body: 'The 18+ worlds live here, on the adult sister site of IsekaiZero. Same account, darker stories.',
    href: LINKS.kageProfile,
    handle: 'kagesekai.ai/creator/kuletxcore',
  },
  {
    key: 'trimz',
    name: 'Trimz',
    verb: 'Binge',
    body: 'Watch the series created by KuletXCore, episode by episode.',
    href: LINKS.trimz,
    handle: 'trimz.tv/u/kuletxcore',
  },
  {
    key: 'youtube',
    name: 'YouTube',
    verb: 'Watch',
    body: 'Trailers, behind-the-scenes and the AI storytelling process. Outslopping the competition.',
    href: LINKS.youtube,
    handle: '@kuletxai',
  },
]

function Channels() {
  return (
    <section id="watch" className="kx-cv scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <SectionHead kicker="03 // Channels" title="Four ways in" />
        <ul className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
          {CHANNELS.map((c, i) => (
            <li key={c.key} className="bg-void">
              <a href={c.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col p-6 hover:bg-panel sm:p-8">
                <span className="font-gamer text-xs text-mute">0{i + 1}</span>
                <span className="pixel mt-4 font-pixel text-4xl text-neon glow">{c.verb}</span>
                <span className="mt-1 font-mono text-lg font-bold text-ink">on {c.name}</span>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-mute">{c.body}</p>
                <span className="mt-6 font-gamer text-xs text-ink group-hover:text-neon">{c.handle} →</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
