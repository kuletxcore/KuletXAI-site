import { Link, createFileRoute } from '@tanstack/react-router'
import { Footer, Header, SectionHead } from '#/components/site'
import { play as sfx } from '#/lib/sfx'
import { LINKS, STORIES, TRIMZ, totalChats, totalLikes, trimzSeriesUrl } from '#/data/content'

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
  return (
    <section id="top" className="relative overflow-hidden border-b border-line">
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
            KuletX builds interactive worlds on IsekaiZero, cuts them into series on Trimz, and
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
            <Stat label="player likes" value={totalLikes} />
            <Stat label="chats started" value={totalChats} />
            <Stat label="trimz series" value={TRIMZ.length} />
            <Stat label="motto" value="outslopping the competition" small />
          </dl>
        </div>
      </div>
    </section>
  )
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-mute">{label}</dt>
      <dd className={small ? 'text-right text-warn' : 'pixel font-pixel text-2xl text-neon'}>{value}</dd>
    </div>
  )
}

function Stories() {
  return (
    <section id="stories" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead
          kicker="01 // IsekaiZero"
          title="Pick a world"
          body="Interactive AI storylines. You make the choices, the storyteller keeps up. Open a world to see its cast and lore."
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((s, i) => (
            <li key={s.id}>
              <Link
                to="/stories/$slug"
                params={{ slug: s.slug }}
                onClick={() => sfx('enter')}
                className="group flex h-full flex-col border border-line bg-panel hover:border-neon"
              >
                <div className="cover relative aspect-[3/4] overflow-hidden border-b border-line">
                  <img
                    src={s.cover}
                    alt={`Cover art for ${s.title}`}
                    loading={i < 3 ? 'eager' : 'lazy'}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={`absolute top-3 left-3 px-2 py-1 font-gamer text-xs text-void ${
                      s.rating === 'SFW' ? 'bg-neon' : 'bg-warn'
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
                    <span className="text-mute">
                      ♥ {s.likes} · ✉ {s.chats}
                    </span>
                    <span className="text-neon">ENTER →</span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          <li>
            <a
              href={LINKS.isekaiProfile}
              target="_blank"
              rel="noreferrer"
              onClick={() => sfx('enter')}
              className="group flex h-full flex-col border border-dashed border-line bg-panel hover:border-solid hover:border-neon"
            >
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
                <h3 className="font-mono text-lg font-bold leading-snug text-ink group-hover:text-neon">More worlds in the works</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">
                  Every KuletX storyline lives on IsekaiZero. Follow the creator page to catch new worlds the day they go live.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['AllWorlds', 'NewDrops', 'Follow'].map((t) => (
                    <span key={t} className="border border-line px-2 py-0.5 text-xs text-mute">
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-gamer text-xs">
                  <span className="text-mute">@kuletxcore · {STORIES.length} live</span>
                  <span className="text-neon">PROFILE →</span>
                </div>
              </div>
            </a>
          </li>
        </ul>
      </div>
    </section>
  )
}

function Trimz() {
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
                      {t.episodes} EP · {t.views} VIEWS
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
        <SectionHead kicker="03 // Channels" title="Three ways in" body="Same universe, different screens." />
        <ul className="mt-12 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
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
