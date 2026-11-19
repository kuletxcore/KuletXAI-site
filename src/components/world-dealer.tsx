import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { LINKS, STORIES, storyPlatformName, storyUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { LiveCount, LiveDot } from '#/components/live-count'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { useLite } from '#/lib/perf'
import { play as sfx } from '#/lib/sfx'
import { writeMatch } from '#/lib/match'

// One tap on a vibe deals a world with its poster, live stats and a play link. The 18+ world stays out of the deck.

type VibeKey = 'surprise' | 'spies' | 'kaiju' | 'school' | 'chaos' | 'powers'

const VIBES: { key: VibeKey; label: string; slugs: string[] }[] = [
  { key: 'surprise', label: 'SURPRISE ME', slugs: ['acolytes', 'colossus-protocol', 'queen-bee', 'problem-spawner', 'i-am-the-table', 'godsmarked'] },
  { key: 'spies', label: 'SPIES & MENACE', slugs: ['acolytes'] },
  { key: 'kaiju', label: 'GIANTS & RUIN', slugs: ['colossus-protocol'] },
  { key: 'school', label: 'SCHOOL & STATUS', slugs: ['queen-bee', 'problem-spawner'] },
  { key: 'chaos', label: 'CHAOS & COMEDY', slugs: ['i-am-the-table', 'problem-spawner'] },
  { key: 'powers', label: 'POWERS & MYSTERY', slugs: ['godsmarked', 'problem-spawner'] },
]

const DECK = STORIES
const HEATS = [{ key: 'safe', label: 'SFW ONLY', max: 0 }, { key: 'max17', label: 'UP TO 17+', max: 1 }, { key: 'any', label: '18+ OK', max: 2 }] as const
type HeatKey = (typeof HEATS)[number]['key']
const RATING_RANK: Record<Story['rating'], number> = { SFW: 0, '17+': 1, '18+': 2 }
type FlavorKey = 'any' | 'chaos' | 'story' | 'power'
const FLAVORS: { key: FlavorKey; label: string; tags: string[] }[] = [
  { key: 'any', label: 'NO PREFERENCE', tags: [] },
  { key: 'chaos', label: 'CHAOS', tags: ['Comedy', 'Academy'] },
  { key: 'story', label: 'STORY & SECRETS', tags: ['Mystery', 'Thriller', 'Slow Burn'] },
  { key: 'power', label: 'POWER TRIPS', tags: ['Superpower', 'Kaiju', 'Transformation', 'Giantess'] },
]
const bySlug = new Map(DECK.map((s) => [s.slug, s]))
const poolFor = (key: VibeKey) => {
  const slugs = VIBES.find((v) => v.key === key)?.slugs ?? []
  const pool = slugs.map((s) => bySlug.get(s)).filter((s): s is Story => !!s)
  return pool.length ? pool : DECK
}
const pick = (pool: Story[], avoid?: string) => {
  const fresh = pool.length > 1 ? pool.filter((s) => s.slug !== avoid) : pool
  return fresh[Math.floor(Math.random() * fresh.length)]
}

export function WorldDealer() {
  const live = useIskStats()
  const lite = useLite()
  const [calm, setCalm] = useState(false)
  const [vibe, setVibe] = useState<VibeKey>('surprise')
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'dealt'>('idle')
  const [dealt, setDealt] = useState<Story | null>(null)
  const [dealNo, setDealNo] = useState(0)
  const [shuffleIdx, setShuffleIdx] = useState(0)
  const [heat, setHeat] = useState<HeatKey>('max17')
  const [flavor, setFlavor] = useState<FlavorKey>('any')
  const [why, setWhy] = useState<string[]>([])
  const [runner, setRunner] = useState<Story | null>(null)

  // Posters fly only for people who want motion and are not on a weak device
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setCalm(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  const noMotion = calm || lite

  // The shuffle: rapid-fire poster flashes, then the card lands
  useEffect(() => {
    if (phase !== 'shuffling') return
    const tick = window.setInterval(() => setShuffleIdx((i) => i + 1), 70)
    const land = window.setTimeout(
      () => {
        window.clearInterval(tick)
        setPhase('dealt')
        setDealNo((n) => n + 1)
        sfx('enter')
      },
      noMotion ? 120 : 720,
    )
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(land)
    }
  }, [phase, noMotion])

  const deal = (key: VibeKey = vibe) => {
    if (phase === 'shuffling') return
    setVibe(key)
    const cap = HEATS.find((h) => h.key === heat)?.max ?? 1
    const pool = DECK.filter((x) => RATING_RANK[x.rating] <= cap)
    let chosen: Story, reasons: string[], second: Story | null = null
    if (key === 'surprise' && flavor === 'any') {
      chosen = pick(pool, dealt?.slug); reasons = ['Pure chance. The deck insists.']
    } else {
      const mood = poolFor(key)
      const tags = FLAVORS.find((f) => f.key === flavor)?.tags ?? []
      const scored = pool.map((x) => {
        const r: string[] = []; let sc = Math.min(2, x.messages / 1500)
        if (mood.includes(x)) { sc += 6; r.push(`Fits the ${VIBES.find((v) => v.key === key)?.label.toLowerCase()} mood you picked`) }
        for (const t of x.tags) if (tags.includes(t)) { sc += 3; r.push(`Has the ${t.toLowerCase()} you asked for`) }
        if (x.rating === '18+') r.push('The adults-only door, as requested')
        if (x.trimz) r.push('Also a series on Trimz, if you would rather watch first')
        return { x, sc, r }
      }).sort((a, b) => b.sc - a.sc)
      const top = scored.find((v) => v.x.slug !== dealt?.slug) ?? scored[0]
      chosen = top.x; reasons = top.r.length ? top.r : ['The closest fit in the deck for those answers']
      second = scored.find((v) => v.x.slug !== chosen.slug)?.x ?? null
    }
    setDealt(chosen); setWhy(reasons); setRunner(second)
    writeMatch({ slug: chosen.slug, why: reasons, at: Date.now() })
    setPhase('shuffling'); sfx('tab')
  }
  const pickRunner = () => { if (!runner) return; const r = runner; setRunner(dealt); setDealt(r); setWhy(['Your runner-up, promoted. The deck keeps no grudges.']); writeMatch({ slug: r.slug, why: ['Your runner-up, promoted.'], at: Date.now() }); setPhase('shuffling') }

  const deckSize = DECK.length
  const shuffleCover = DECK[shuffleIdx % DECK.length]?.cover ?? DECK[0].cover

  return (
    <section id="dealer" className="scroll-mt-16 border-b border-line bg-panel/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
          <div>
            <p className="font-gamer text-sm text-neon">
              {'//'} THE MATCHMAKER<span className="text-mute"> v2.0 · was the World Dealer</span>
            </p>
            <h2 className="pixel mt-3 font-pixel text-4xl leading-[1.05] text-ink sm:text-6xl">
              CAN'T
              <br />
              DECIDE<span className="text-neon glow">?</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-mute">
              Three answers, one match, and the reasons why. The Matchmaker scores every world against your
              mood, your heat limit and your flavour, then slides the winner across the counter.
            </p>

            <fieldset className="mt-7">
              <legend className="font-gamer text-xs uppercase text-mute">1 · Today's vibe</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {VIBES.map((v) => {
                  const active = vibe === v.key
                  return (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => { setVibe(v.key); sfx('tab') }}
                      aria-pressed={active}
                      disabled={phase === 'shuffling'}
                      className={`min-h-11 border px-3 font-gamer text-xs uppercase transition-colors active:bg-neon/10 disabled:cursor-not-allowed disabled:opacity-60 ${
                        active
                          ? 'border-neon bg-neon text-void'
                          : 'border-line text-ink hover:border-neon hover:text-neon'
                      }`}
                    >
                      {v.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <fieldset className="mt-5"><legend className="font-gamer text-xs uppercase text-mute">2 · How hot can it get?</legend>
              <div className="mt-3 flex flex-wrap gap-2">{HEATS.map((h) => (
                <button key={h.key} type="button" onClick={() => { setHeat(h.key); sfx('tab') }} aria-pressed={heat === h.key} className={`min-h-11 border px-3 font-gamer text-xs uppercase ${heat === h.key ? 'border-warn bg-warn text-void' : 'border-line text-ink hover:border-warn hover:text-warn'}`}>{h.label}</button>))}
              </div></fieldset>
            <fieldset className="mt-5"><legend className="font-gamer text-xs uppercase text-mute">3 · Pick a flavour</legend>
              <div className="mt-3 flex flex-wrap gap-2">{FLAVORS.map((f) => (
                <button key={f.key} type="button" onClick={() => { setFlavor(f.key); sfx('tab') }} aria-pressed={flavor === f.key} className={`min-h-11 border px-3 font-gamer text-xs uppercase ${flavor === f.key ? 'border-neon bg-neon text-void' : 'border-line text-ink hover:border-neon hover:text-neon'}`}>{f.label}</button>))}
              </div></fieldset>

            <button
              type="button"
              onClick={() => deal(vibe)}
              disabled={phase === 'shuffling'}
              className="kx-deal-cta pixel mt-6 inline-flex items-center gap-3 bg-neon px-6 py-4 font-gamer text-base uppercase text-void transition-transform hover:scale-[1.02] hover:bg-ink disabled:opacity-70"
            >
              {phase === 'shuffling' ? (
                <>Shuffling…</>
              ) : phase === 'dealt' ? (
                <>↻ Match me again</>
              ) : (
                <>▶ Match my world</>
              )}
            </button>
            <p className="mt-3 font-gamer text-[11px] uppercase text-mute">
              Deck: all {deckSize} worlds · the 18+ world only enters when you open that door above
            </p>
          </div>

          {/* The table: face-down deck, shuffle, then the dealt card */}
          <div className="relative" aria-live="polite">
            <p className="pointer-events-none absolute -top-3 right-0 z-10 font-gamer text-[10px] uppercase text-mute/70">
              Table 01 · No bets, only stories
            </p>

            {phase === 'dealt' && dealt ? (
              <DealtCard key={`${dealt.slug}-${dealNo}`} story={dealt} lite={noMotion} onRedeal={() => deal(vibe)} live={live} why={why} runner={runner} onRunner={pickRunner} />
            ) : (
              <div className="kx-card-back relative flex min-h-[26rem] flex-col items-center justify-center overflow-hidden border border-line bg-void p-8 text-center sm:min-h-[30rem]">
                {phase === 'shuffling' && (
                  <img
                    src={shuffleCover}
                    alt=""
                    aria-hidden
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale"
                  />
                )}
                <div className="grid-bg absolute inset-0 opacity-60" aria-hidden />
                <img src="/brand/kx-mark.webp" alt="" aria-hidden className="relative w-28 opacity-90 sm:w-36" />
                <p className="pixel relative mt-6 font-pixel text-2xl text-ink sm:text-3xl">
                  {phase === 'shuffling' ? 'SHUFFLING' : 'AWAITING DEAL'}
                  <span className="cursor text-neon" />
                </p>
                <p className="relative mt-2 font-gamer text-xs uppercase text-mute">
                  {phase === 'shuffling' ? 'the dealer sweeps the deck' : 'pick a vibe, then press deal'}
                </p>
                <div className="kx-deal-scan absolute inset-0" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function DealtCard({
  story,
  lite,
  onRedeal,
  live,
  why,
  runner,
  onRunner,
}: {
  story: Story
  lite: boolean
  onRedeal: () => void
  live: ReturnType<typeof useIskStats>
  why?: string[]
  runner?: Story | null
  onRunner?: () => void
}) {
  const platform = storyPlatformName(story)
  const ratingClass =
    story.rating === 'SFW' ? 'bg-neon text-void' : story.rating === '18+' ? 'bg-danger text-white' : 'bg-warn text-void'

  return (
    <motion.article
      initial={lite ? { opacity: 0 } : { opacity: 0, y: 90, rotate: -7, scale: 0.85 }}
      animate={lite ? { opacity: 1 } : { opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={lite ? { duration: 0.15 } : { type: 'spring', stiffness: 210, damping: 21 }}
      className="relative overflow-hidden border border-line bg-void"
      style={{ boxShadow: `0 0 90px -18px ${story.accent}59, inset 0 0 60px -40px ${story.accent}40` }}
      aria-label={`Dealt world: ${story.title}`}
    >
      <div className="h-1 w-full" style={{ background: story.accent }} aria-hidden />
      <div className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="relative aspect-[4/3] overflow-hidden border-b border-line sm:aspect-auto sm:min-h-[30rem] sm:border-r sm:border-b-0">
          {/* Blurred echo of the cover fills the frame so the artwork itself can sit whole */}
          <img
            key={`bg-${story.slug}`}
            src={story.cover}
            alt=""
            aria-hidden
            decoding="async"
            className={`absolute inset-0 h-full w-full scale-110 object-cover opacity-35 ${lite ? '' : 'blur-2xl'}`}
          />
          <img
            key={story.slug}
            src={story.cover}
            alt={`Cover art for ${story.title}`}
            decoding="async"
            className="absolute inset-0 h-full w-full object-contain p-3 drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)]"
          />
          <span className={`absolute top-3 left-3 px-2 py-1 font-gamer text-xs ${ratingClass}`}>{story.rating}</span>
          {story.trimz && (
            <span className="absolute bottom-3 left-3 bg-void/85 px-2 py-1 font-gamer text-xs text-ink">▶ ON TRIMZ</span>
          )}
        </div>

        <div className="flex flex-col p-5">
          <p className="font-gamer text-[10px] uppercase leading-relaxed text-warn">{story.kicker}</p>
          <h3 className="mt-2 font-mono text-xl font-bold leading-snug text-ink">{story.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mute">{story.logline}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {story.tags.slice(0, 3).map((t) => (
              <span key={t} className="border border-line px-2 py-0.5 text-xs text-mute">
                #{t}
              </span>
            ))}
          </div>
          {why && why.length > 0 && (
            <div className="mt-4 border border-line bg-panel/60 p-3">
              <p className="font-gamer text-[10px] uppercase text-neon">Why this world</p>
              <ul className="mt-1.5 space-y-1 text-xs text-mute">{why.map((w) => <li key={w} className="flex gap-2"><span className="text-neon">▸</span>{w}</li>)}</ul>
              {runner && onRunner && <button type="button" onClick={onRunner} className="mt-2 inline-flex min-h-11 items-center font-gamer text-[10px] uppercase text-warn hover:text-ink">Runner-up: {runner.title} · deal it instead →</button>}
            </div>
          )}
          <p className="mt-4 font-gamer text-xs text-mute" title={`Likes · saves · chats · messages on ${platform}`}>
            ♥ <LiveCount value={countOf(live, story, 'likes')} /> · ★ <LiveCount value={countOf(live, story, 'saves')} /> · ✉{' '}
            <LiveCount value={countOf(live, story, 'chats')} />{' '}
            · <LiveCount value={countOf(live, story, 'messages')} compact /> MSG <LiveDot className="ml-1 inline-block align-middle" />
          </p>

          <div className="mt-auto pt-5">
            <a
              href={storyUrl(story)}
              target="_blank"
              rel="noreferrer"
              onClick={() => sfx('enter')}
              className="pixel block bg-neon px-4 py-3 text-center font-gamer text-sm uppercase text-void transition-colors hover:bg-ink"
            >
              ▶ Play on {platform} →
            </a>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/stories/$slug"
                params={{ slug: story.slug }}
                onClick={() => sfx('nav')}
                className="border border-line px-3 py-2.5 text-center font-gamer text-[11px] uppercase text-ink transition-colors hover:border-neon hover:text-neon"
              >
                World file →
              </Link>
              <button
                type="button"
                onClick={onRedeal}
                className="border border-line px-3 py-2.5 font-gamer text-[11px] uppercase text-mute transition-colors hover:border-warn hover:text-warn"
              >
                ↻ Deal again
              </button>
            </div>
            <p className="mt-3 text-center font-mono text-[10px] text-mute/70">
              Free to start · runs in your browser ·{' '}
              <a href={LINKS.isekai} target="_blank" rel="noreferrer" className="underline hover:text-neon">
                isekaizero.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
