import { STORIES, storyUrl, totalChats, totalLikes, totalMessages } from '#/data/content'
import { formatCount } from '#/lib/isk-stats'
import { play as sfx } from '#/lib/sfx'

/** Ship 10: The Last Screen. The page used to end with a footer and a shrug.
 *  Now it ends like a cabinet that wants one more coin: the most-played world,
 *  the all-time totals, and three doors — play it, match me, or try a turn. */
export function Finale() {
  const top = STORIES.reduce((a, b) => (b.messages > a.messages ? b : a))
  return (
    <section id="finale" className="relative scroll-mt-16 overflow-hidden border-b border-line">
      <img src={top.tile ?? top.cover} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top opacity-25" />
      <div className="absolute inset-0 bg-linear-to-b from-void via-void/70 to-void" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 md:py-28">
        <p className="font-gamer text-sm text-neon">&gt; end_of_page.exe</p>
        <h2 className="pixel mx-auto mt-5 max-w-3xl font-pixel text-5xl leading-[1.02] text-ink sm:text-7xl">
          GAME <span className="text-neon glow">NOT</span> OVER
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-mute">
          You scrolled past {STORIES.length} worlds, {formatCount(totalMessages)} player messages, {formatCount(totalLikes)} likes
          and {formatCount(totalChats)} started chats to get here. The most-played world is still open.
        </p>
        <div className="mx-auto mt-9 flex max-w-2xl flex-col gap-3 sm:flex-row">
          <a href={storyUrl(top)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="pixel flex-1 bg-neon px-5 py-4 font-gamer text-sm uppercase text-void hover:bg-ink">▶ Play {top.title.length > 22 ? 'the top world' : top.title} →</a>
          <a href="#dealer" className="flex-1 border border-line bg-void/70 px-5 py-4 font-gamer text-sm uppercase text-ink hover:border-neon hover:text-neon">Match me instead</a>
          <a href="#try" className="flex-1 border border-line bg-void/70 px-5 py-4 font-gamer text-sm uppercase text-ink hover:border-neon hover:text-neon">One more turn</a>
        </div>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
          className="mt-8 inline-flex min-h-11 items-center px-3 font-gamer text-[11px] uppercase text-mute hover:text-neon">↑ Back to the top · no loading, promise</button>
      </div>
    </section>
  )
}
