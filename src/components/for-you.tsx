import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { storyPlatformName, storyUrl } from '#/data/content'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { LiveCount } from '#/components/live-count'
import { forgetTaste, recommend, tasteCount, tasteWords, useTaste } from '#/lib/taste'
import { play as sfx } from '#/lib/sfx'

// FOR YOU: returning visitors get a world picked from what they actually opened, with the reason in
// plain words. Nothing is sent anywhere, and one button forgets the whole profile.

export function ForYou() {
  const taste = useTaste()
  const live = useIskStats()
  const picks = useMemo(() => recommend(taste), [taste])
  const words = useMemo(() => tasteWords(taste), [taste])
  const n = tasteCount(taste)
  if (!n || !picks.length) return null
  const [top, ...rest] = picks

  return (
    <aside aria-label="Picked for you" className="mt-8 border border-line bg-panel">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-gamer text-[10px] uppercase text-neon">
            ▣ For you <span className="text-mute">// the storyteller remembers</span>
          </p>
          <Link
            to="/stories/$slug"
            params={{ slug: top.story.slug }}
            onClick={() => sfx('enter')}
            className="group mt-2 flex items-center gap-3"
          >
            <img
              src={top.story.cover}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-16 w-12 shrink-0 border border-line object-cover"
            />
            <span className="min-w-0">
              <span className="pixel block truncate font-pixel text-lg leading-tight text-ink group-hover:text-neon sm:text-xl">
                {top.story.title}
              </span>
              <span className="mt-1 block truncate font-mono text-xs text-mute">{top.reason}</span>
              <span className="mt-1 block font-gamer text-[10px] text-mute/80">
                {top.story.rating} · on {storyPlatformName(top.story)} ·{' '}
                <LiveCount value={countOf(live, top.story, 'messages')} compact /> messages
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={storyUrl(top.story)}
            target="_blank"
            rel="noreferrer"
            onClick={() => sfx('enter')}
            className="pixel inline-flex min-h-11 items-center justify-center gap-2 bg-neon px-4 font-gamer text-xs uppercase text-void hover:bg-ink"
          >
            ▶ Play
          </a>
          <Link
            to="/stories/$slug"
            params={{ slug: top.story.slug }}
            onClick={() => sfx('enter')}
            className="inline-flex min-h-11 items-center justify-center border border-line px-3 font-gamer text-[11px] uppercase text-ink hover:border-neon hover:text-neon"
          >
            World file →
          </Link>
          <button
            type="button"
            onClick={() => {
              sfx('back')
              forgetTaste()
            }}
            aria-label="Forget my taste profile"
            title="Forget what this browser remembers"
            className="grid size-11 place-items-center border border-line font-gamer text-xs text-mute hover:border-danger-ink hover:text-danger-ink"
          >
            ✕
          </button>
        </div>
      </div>

      {rest.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-4 py-2 sm:px-5">
          <span className="font-gamer text-[10px] uppercase text-mute">Also for you</span>
          <ul className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            {rest.map((p) => (
              <li key={p.story.slug}>
                <Link
                  to="/stories/$slug"
                  params={{ slug: p.story.slug }}
                  onClick={() => sfx('nav')}
                  className="group inline-flex min-h-11 items-center gap-2 font-mono text-xs text-ink/90 hover:text-neon"
                >
                  <span className={`h-3 w-1 ${p.story.rating === 'SFW' ? 'bg-neon' : p.story.rating === '18+' ? 'bg-danger' : 'bg-warn'}`} aria-hidden />
                  {p.story.title.split(':')[0]}
                </Link>
              </li>
            ))}
          </ul>
          <p className="ml-auto font-gamer text-[10px] text-mute/80">
            {n} world{n === 1 ? '' : 's'} opened
            {words.length ? ` · ${words.slice(0, 3).map((w) => `#${w}`).join(' ')}` : ''} · stays in this browser
          </p>
        </div>
      )}
    </aside>
  )
}
