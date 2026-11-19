import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { LINKS, STORIES, storyPlatformName, storyUrl } from '#/data/content'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { useLite } from '#/lib/perf'
import { play as sfx } from '#/lib/sfx'
import { FindButton } from '#/components/story-finder'
import { openControls } from '#/components/controls-sheet'

export function Logo({ className = 'h-8' }: { className?: string }) {
  return <img src="/brand/kuletx-ai-480.webp" srcSet="/brand/kuletx-ai-480.webp 480w, /brand/kuletx-ai-1200.webp 1200w" sizes="240px" alt="KuletX AI" width={480} height={165} className={`w-auto ${className}`} />
}

/** The loudest world right now, by the messages players have sent it. */
export function useFeaturedStory() {
  const live = useIskStats()
  return useMemo(
    () => [...STORIES].sort((a, b) => countOf(live, b, 'messages') - countOf(live, a, 'messages'))[0],
    [live],
  )
}

// The header is the site's command bar: go anywhere, find anything, and always one press from a world
export function Header() {
  const lite = useLite()
  const featured = useFeaturedStory()
  const platform = storyPlatformName(featured)
  return (
    <header className={`sticky top-0 z-40 border-b border-line bg-void/90 ${lite ? '' : 'backdrop-blur'}`}>
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link to="/" aria-label="KuletX AI home" className="flex min-h-11 shrink-0 items-center transition-transform hover:scale-[1.03]">
          <Logo className="h-9 sm:h-10" />
        </Link>
        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 font-gamer text-xs uppercase sm:gap-1 sm:text-sm">
          <Link to="/" hash="stories" className="inline-flex min-h-11 items-center px-2 text-mute hover:text-neon">
            Stories
          </Link>
          <Link to="/" hash="trimz" className="hidden min-h-11 items-center px-2 text-mute hover:text-neon sm:inline-flex">
            Trimz
          </Link>
          <Link to="/" hash="watch" className="hidden min-h-11 items-center px-2 text-mute hover:text-neon lg:inline-flex">
            Channels
          </Link>
          <FindButton className="ml-0.5" />
          <a
            href={storyUrl(featured)}
            target="_blank"
            rel="noreferrer"
            onClick={() => sfx('enter')}
            title={`Play ${featured.title} on ${platform}`}
            className="pixel ml-1 inline-flex min-h-11 items-center gap-1.5 bg-neon px-3 text-void transition-colors hover:bg-ink sm:px-4"
          >
            <span aria-hidden>▶</span>
            <span className="font-gamer text-xs uppercase sm:text-sm">Play</span>
            <span className="hidden max-w-36 truncate font-mono text-[11px] font-bold normal-case opacity-80 xl:inline">
              {featured.title.split(':')[0]}
            </span>
          </a>
        </nav>
      </div>
    </header>
  )
}

export function SectionHead({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="font-gamer text-sm text-neon">{kicker}</p>
      <h2 className="pixel mt-3 font-pixel text-4xl text-ink sm:text-5xl">{title}</h2>
      {body && <p className="mt-4 text-mute">{body}</p>}
    </div>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo className="h-12" />
          <p className="mt-2 text-sm text-mute">AI storytelling. © {new Date().getFullYear()} KuletX.</p>
        </div>
        <nav aria-label="Elsewhere" className="flex flex-wrap items-center gap-x-2 font-gamer text-xs [&>a]:px-1">
          <a href={LINKS.isekai} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-mute hover:text-neon">
            IsekaiZero
          </a>
          <a href={LINKS.kageProfile} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-mute hover:text-neon">
            KageSekai
          </a>
          <a href={LINKS.trimz} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-mute hover:text-neon">
            Trimz
          </a>
          <a href={LINKS.youtube} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-mute hover:text-neon">
            YouTube
          </a>
        </nav>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="font-gamer text-[10px] uppercase text-mute/70">Touch, mouse, keyboard and controller</p>
        <button
          type="button"
          onClick={openControls}
          className="inline-flex min-h-11 items-center gap-2 border border-line px-3 font-gamer text-[10px] uppercase text-mute hover:border-neon hover:text-neon"
        >
          <kbd className="border border-line px-1 text-[10px] text-ink">?</kbd> Controls
        </button>
      </div>
      <p className="mt-6 text-xs text-mute/70">
        Fonts: pixel faces by 00ff (hicchicc) and Obel Mono by Typographic Systems, under the{' '}
        <a href="/fonts/OFL-00ff.txt" className="underline hover:text-neon">
          SIL Open Font License
        </a>
        . Button prompts by Nicolae "Xelu" Berbece (CC0).
      </p>
    </footer>
  )
}
