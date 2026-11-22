import { LINKS, STORIES, storyUrl } from '#/data/content'
import { play as sfx } from '#/lib/sfx'

// THE LOOP: what happens after "play", in three beats, then the door. It replaces the second scripted demo.

const STEPS = [
  {
    n: '01',
    title: 'You pick a world',
    body: 'Seven storylines, each with its own cast and lore. Open the world file here first, then step in on IsekaiZero or KageSekai when you are ready.',
    glyph: '▦',
  },
  {
    n: '02',
    title: 'It writes back',
    body: 'No menus, no rails. The storyteller improvises around your choices in character, remembers what you did, and gets meaner or warmer depending on how you play.',
    glyph: '✎',
  },
  {
    n: '03',
    title: 'It remembers you',
    body: 'Leave mid-scene and come back to the same room, the same argument, the same unfinished sentence. One memory card per world, kept for you.',
    glyph: '▣',
  },
]

export function HowItWorks() {
  const flagship = STORIES[0]
  return (
    <section id="loop" className="scroll-mt-16 border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="font-gamer text-sm text-neon">{'//'} THE LOOP</p>
            <h2 className="pixel mt-3 font-pixel text-4xl text-ink sm:text-5xl">
              PICK. PLAY.
              <br className="sm:hidden" /> <span className="text-neon glow">COME BACK.</span>
            </h2>
          </div>
          <a
            href="#top"
            className="inline-flex min-h-11 shrink-0 items-center self-start border border-neon px-4 font-gamer text-xs uppercase text-neon hover:bg-neon hover:text-void sm:self-auto"
          >
            ↑ Back to the scene
          </a>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="group relative bg-void p-6 transition-colors hover:bg-panel sm:p-8">
              <div className="flex items-baseline gap-3">
                <span className="font-gamer text-xs text-mute">{s.n}</span>
                <span aria-hidden className="font-pixel text-3xl leading-none text-neon glow">
                  {s.glyph}
                </span>
              </div>
              <h3 className="mt-5 font-mono text-lg font-bold text-ink group-hover:text-neon">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mute">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-col items-start justify-between gap-4 border border-line bg-panel/40 p-5 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={storyUrl(flagship)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sfx('enter')}
              className="pixel bg-neon px-4 py-2.5 font-gamer text-xs uppercase text-void hover:bg-ink"
            >
              ▶ Start with {flagship.title.split(':')[0]}
            </a>
            <a
              href={LINKS.kageProfile}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center border border-line px-4 font-gamer text-xs uppercase text-mute hover:border-danger-ink hover:text-danger-ink"
            >
              18+ worlds →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
