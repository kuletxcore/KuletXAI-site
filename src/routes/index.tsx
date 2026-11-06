import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

const LINKS = {
  isekai: 'https://www.isekaizero.ai',
  trimz: 'https://trimz.tv/u/kuletxcore',
  youtube: 'https://youtube.com/@kuletxai',
}

type Story = {
  id: string
  title: string
  summary: string
  cover: string
  rating: 'SFW' | '17+'
  tags: string[]
  likes: number
  chats: number
}

// Public storylines from the kuletxcore account on IsekaiZero (Nov 2026)
const STORIES: Story[] = [
  {
    id: '6aa78f6bd17fe984ab332064',
    title: 'Acolytes: Maid for your Protection',
    summary:
      'By day, you serve tea and cake. By night, you lead an elite black-ops unit no government will admit exists.',
    cover: '/covers/1.webp',
    rating: '17+',
    tags: ['Spy', 'Thriller', 'Undercover'],
    likes: 156,
    chats: 129,
  },
  {
    id: '6aa4a2ce523ccdd47ab9b80d',
    title: 'Colossus Protocol',
    summary:
      'You can grow from human height to 300 meters. When kaiju rise from the coastal rifts, you are the only one who can meet them at their own scale.',
    cover: '/covers/3.webp',
    rating: '17+',
    tags: ['Kaiju', 'Giantess', 'Apocalypse'],
    likes: 32,
    chats: 38,
  },
  {
    id: '6a9ae1c5a66365ba9f1523f1',
    title: 'Acknowledge Me: Become the Queen Bee',
    summary:
      'You arrived as a nobody. Climb the social hierarchy until the entire school has to acknowledge you.',
    cover: '/covers/5.webp',
    rating: 'SFW',
    tags: ['High School', 'Rivals', 'Slow Burn'],
    likes: 14,
    chats: 20,
  },
  {
    id: '6a9504a149fd840d6d383b33',
    title: 'The Problem Spawner',
    summary:
      "Cursed with a power you can't control, you spawn random fragments of other worlds into reality. Survive the chaos.",
    cover: '/covers/4.webp',
    rating: 'SFW',
    tags: ['Academy', 'Superpower', 'Comedy'],
    likes: 11,
    chats: 10,
  },
  {
    id: '6a9d1ba30b414546e54a59aa',
    title: 'I AM THE TABLE!!!',
    summary:
      'You become The Table™, an unbreakable, sentient table in a fantasy world. Chaos, comedy and furniture-based destiny follow.',
    cover: '/covers/2.webp',
    rating: 'SFW',
    tags: ['Fantasy', 'Comedy', 'Transmigration'],
    likes: 5,
    chats: 9,
  },
]

const totalLikes = STORIES.reduce((n, s) => n + s.likes, 0)
const totalChats = STORIES.reduce((n, s) => n + s.chats, 0)

function Home() {
  return (
    <div className="crt min-h-screen">
      <Header />
      <main>
        <Hero />
        <Stories />
        <Channels />
      </main>
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a href="#top" className="pixel font-pixel text-xl text-neon glow">
          KULETX<span className="text-ink">_AI</span>
        </a>
        <nav className="flex items-center gap-4 font-gamer text-xs uppercase sm:gap-6 sm:text-sm">
          <a href="#stories" className="text-mute hover:text-neon">
            Stories
          </a>
          <a href="#watch" className="text-mute hover:text-neon">
            Watch
          </a>
          <a
            href={LINKS.youtube}
            target="_blank"
            rel="noreferrer"
            className="hidden border border-neon px-3 py-1.5 text-neon hover:bg-neon hover:text-void sm:inline-block"
          >
            Subscribe
          </a>
        </nav>
      </div>
    </header>
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
            <a
              href="#stories"
              className="pixel bg-neon px-5 py-3 font-gamer text-sm uppercase text-void hover:bg-ink"
            >
              ▶ Play a story
            </a>
            <a
              href={LINKS.youtube}
              target="_blank"
              rel="noreferrer"
              className="pixel border border-line px-5 py-3 font-gamer text-sm uppercase text-ink hover:border-neon hover:text-neon"
            >
              Watch on YouTube
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
    <section id="stories" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead
          kicker="01 // IsekaiZero"
          title="Pick a world"
          body="Interactive AI storylines. You make the choices, the storyteller keeps up."
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STORIES.map((s, i) => (
            <li key={s.id}>
              <a
                href={`${LINKS.isekai}/storylines/${s.id}`}
                target="_blank"
                rel="noreferrer"
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
                    className={`absolute top-3 left-3 px-2 py-1 font-gamer text-xs ${
                      s.rating === 'SFW' ? 'bg-neon text-void' : 'bg-warn text-void'
                    }`}
                  >
                    {s.rating}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-mono text-lg font-bold leading-snug text-ink group-hover:text-neon">
                    {s.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-mute">{s.summary}</p>
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
                    <span className="text-neon">PLAY →</span>
                  </div>
                </div>
              </a>
            </li>
          ))}
          <li className="sm:col-span-2 lg:col-span-1">
            <a
              href={LINKS.trimz}
              target="_blank"
              rel="noreferrer"
              className="group flex h-full min-h-64 flex-col justify-between border border-dashed border-line p-6 hover:border-neon"
            >
              <span className="font-gamer text-xs text-mute">NEXT_WORLD.LOADING</span>
              <span>
                <span className="pixel block font-pixel text-3xl text-ink group-hover:text-neon">
                  More worlds in the works
                </span>
                <span className="mt-3 block text-sm text-mute">
                  New storylines drop as series on Trimz first. Catch the episodes while you wait.
                </span>
              </span>
              <span className="font-gamer text-xs text-neon">WATCH ON TRIMZ →</span>
            </a>
          </li>
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
    href: LINKS.isekai,
    handle: 'isekaizero.ai',
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
    <section id="watch" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionHead
          kicker="02 // Channels"
          title="Three ways in"
          body="Same universe, different screens."
        />
        <ul className="mt-12 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {CHANNELS.map((c, i) => (
            <li key={c.key} className="bg-void">
              <a
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col p-6 hover:bg-panel sm:p-8"
              >
                <span className="font-gamer text-xs text-mute">0{i + 1}</span>
                <span className="pixel mt-4 font-pixel text-4xl text-neon glow">{c.verb}</span>
                <span className="mt-1 font-mono text-lg font-bold text-ink">on {c.name}</span>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-mute">{c.body}</p>
                <span className="mt-6 font-gamer text-xs text-ink group-hover:text-neon">
                  {c.handle} →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SectionHead({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-gamer text-sm text-neon">{kicker}</p>
      <h2 className="pixel mt-3 font-pixel text-4xl text-ink sm:text-5xl">{title}</h2>
      <p className="mt-4 text-mute">{body}</p>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="pixel font-pixel text-2xl text-neon">KULETX_AI</p>
          <p className="mt-2 text-sm text-mute">AI storytelling. © {new Date().getFullYear()} KuletX.</p>
        </div>
        <nav className="flex flex-wrap gap-4 font-gamer text-xs">
          <a href={LINKS.isekai} target="_blank" rel="noreferrer" className="text-mute hover:text-neon">
            IsekaiZero
          </a>
          <a href={LINKS.trimz} target="_blank" rel="noreferrer" className="text-mute hover:text-neon">
            Trimz
          </a>
          <a href={LINKS.youtube} target="_blank" rel="noreferrer" className="text-mute hover:text-neon">
            YouTube
          </a>
        </nav>
      </div>
      <p className="mt-8 text-xs text-mute/70">
        Fonts: pixel faces by 00ff (hicchicc) and Obel Mono by Typographic Systems, under the{' '}
        <a href="/fonts/OFL-00ff.txt" className="underline hover:text-neon">
          SIL Open Font License
        </a>
        .
      </p>
    </footer>
  )
}
