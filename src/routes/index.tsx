import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Footer, Header, SectionHead } from '#/components/site'
import { play as sfx } from '#/lib/sfx'
import { LINKS, STORIES, TRIMZ, storyPlatformName, trimzSeriesUrl } from '#/data/content'
import { LiveCount, LiveDot } from '#/components/live-count'
import { countOf, totalOf, trimzCountOf, useIskStats } from '#/lib/isk-stats'
import { COVER_VIDEOS } from '#/data/cover-videos'
import { useLite } from '#/lib/perf'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="crt min-h-screen">
      <Header />
      <main>
        <Hero />
        <Stories />
        <Trimz />
        <Channels />
      </main>
      <Footer />
    </div>
  )
}

function Hero() {
  const live = useIskStats()
  return (
    <section id="top" className="relative overflow-hidden border-b border-line">
      <PosterWall />
      <div className="grid-bg absolute inset-0" aria-hidden />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.3fr_1fr] md:items-center md:py-28">
        <div>
          <p className="font-gamer text-sm text-neon">&gt; boot storyteller.exe</p>
          <h1 className="pixel mt-5 font-pixel text-5xl leading-[1.05] text-ink sm:text-7xl">
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
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#stories" className="pixel bg-neon px-5 py-3 font-gamer text-sm uppercase text-void hover:bg-ink">
              ▶ Play a story
            </a>
            <a
              href="#trimz"
              className="pixel border border-line px-5 py-3 font-gamer text-sm uppercase text-ink hover:border-neon hover:text-neon"
            >
              Binge on Trimz
            </a>
          </div>
        </div>

        <div className="border border-line bg-panel/80 p-5 font-mono text-sm">
          <div className="flex items-center justify-between border-b border-line pb-3 font-gamer text-xs text-mute">
            <span>STATUS.LOG</span>
            <span className="text-neon">● ONLINE</span>
          </div>
          <dl className="mt-4 space-y-3">
            <Stat label="public storylines" value={STORIES.length} />
            <Stat
              label={
                <>
                  messages sent <LiveDot className="ml-1" />
                </>
              }
              value={<LiveCount value={totalOf(live, 'messages')} />}
            />
            <Stat label="player likes" value={<LiveCount value={totalOf(live, 'likes')} />} />
            <Stat label="chats started" value={<LiveCount value={totalOf(live, 'chats')} />} />
            <Stat label="trimz series" value={TRIMZ.length} />
            <Stat label="motto" value="outslopping the competition" small />
          </dl>
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

function Stat({ label, value, small }: { label: ReactNode; value: ReactNode; small?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex items-center text-mute">{label}</dt>
      <dd className={small ? 'text-right text-warn' : 'pixel font-pixel text-2xl text-neon'}>{value}</dd>
    </div>
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
  const lite = useLite()
  const [hot, setHot] = useState<number | null>(null)
  const [shelfLive, setShelfLive] = useState(false)
  const [motionOk, setMotionOk] = useState(false)
  const canPlay = motionOk && !lite

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
  const playing = (i: number) => canPlay && (hot === i || (shelfLive && at === i))
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
    <section id="stories" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead
          kicker="01 // IsekaiZero + KageSekai"
          title="Pick a world"
          body="Interactive AI storylines. You make the choices, the storyteller keeps up. Open a world to see its cast and lore."
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
                    <span className="text-mute" title={`Likes · chats · messages on ${storyPlatformName(s)}`}>
                      ♥ <LiveCount value={countOf(live, s, 'likes')} /> · ✉ <LiveCount value={countOf(live, s, 'chats')} /> ·{' '}
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
                      NEXT_WORLD.LOADING<span className="cursor text-neon" />
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
                    rel="noreferrer"
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
                      rel="noreferrer"
                      onClick={() => sfx('enter')}
                      className="relative z-10 text-danger hover:text-ink"
                    >
                      KAGESEKAI →
                    </a>
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <div className="mt-4 flex items-center justify-between font-gamer text-xs text-mute sm:hidden">
          <span aria-hidden>
            <span className="text-neon">{pad2(at + 1)}</span> / {pad2(total)}
          </span>
          <div className="flex">
            {Array.from({ length: total }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`World ${i + 1} of ${total}`}
                aria-current={i === at}
                className="grid h-8 w-6 place-items-center"
              >
                <span className={`h-1 ${i === at ? 'w-5 bg-neon' : 'w-2 bg-mute/50'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Trimz() {
  const live = useIskStats()
  return (
    <section id="trimz" className="scroll-mt-16 border-b border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHead
            kicker="02 // Trimz"
            title="Now streaming"
            body="AI anime series cut from the stories. Short episodes, made to binge."
          />
          <a
            href={LINKS.trimz}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 self-start border border-neon px-4 py-2 font-gamer text-xs uppercase text-neon hover:bg-neon hover:text-void sm:self-auto"
          >
            Follow on Trimz →
          </a>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {TRIMZ.map((t) => (
            <li key={t.slug}>
              <a
                href={trimzSeriesUrl(t.slug)}
                target="_blank"
                rel="noreferrer"
                className="group grid h-full grid-cols-[2fr_3fr] border border-line bg-void hover:border-neon"
              >
                <div className="cover relative overflow-hidden border-r border-line">
                  <img
                    src={t.poster}
                    alt={`Poster for ${t.title}`}
                    loading="lazy"
                    className="aspect-[2/3] h-full w-full object-cover"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 grid place-items-center bg-void/30 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <span className="grid size-14 place-items-center bg-neon font-gamer text-xl text-void">▶</span>
                  </span>
                </div>
                <div className="flex flex-col p-5">
                  <span className="font-gamer text-xs text-neon">SERIES</span>
                  <h3 className="mt-2 font-mono text-lg font-bold leading-snug text-ink group-hover:text-neon">
                    {t.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{t.summary}</p>
                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-gamer text-xs">
                    <span className="text-mute">
                      <LiveCount value={trimzCountOf(live, t, 'episodes')} /> EP · <LiveCount value={trimzCountOf(live, t, 'views')} /> VIEWS
                    </span>
                    <span className="text-neon">WATCH →</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
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
    <section id="watch" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead kicker="03 // Channels" title="Four ways in" body="Same universe, different screens." />
        <ul className="mt-12 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
          {CHANNELS.map((c, i) => (
            <li key={c.key} className="bg-void">
              <a href={c.href} target="_blank" rel="noreferrer" className="group flex h-full flex-col p-6 hover:bg-panel sm:p-8">
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
