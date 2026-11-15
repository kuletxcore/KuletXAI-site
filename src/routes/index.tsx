import { createFileRoute } from '@tanstack/react-router'
import { Footer, Header, SectionHead } from '#/components/site'
import { LINKS, TRIMZ, trimzSeriesUrl } from '#/data/content'
import { LiveCount } from '#/components/live-count'
import { trimzCountOf, useIskStats } from '#/lib/isk-stats'
import { SpotlightHero } from '#/components/spotlight-hero'
import { WorldShelf } from '#/components/world-shelf'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="crt min-h-screen">
      <Header />
      <main>
        <SpotlightHero />
        <WorldShelf />
        <Trimz />
        <Channels />
      </main>
      <Footer />
    </div>
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
            className="inline-flex min-h-11 shrink-0 items-center self-start border border-neon px-4 font-gamer text-xs uppercase text-neon hover:bg-neon hover:text-void sm:self-auto"
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
