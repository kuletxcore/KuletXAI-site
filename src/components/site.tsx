import { Link } from '@tanstack/react-router'
import { LINKS } from '#/data/content'
import { FindButton } from '#/components/story-finder'

export function Logo({ className = 'h-8' }: { className?: string }) {
  return <img src="/brand/kuletx-ai-480.webp" srcSet="/brand/kuletx-ai-480.webp 480w, /brand/kuletx-ai-1200.webp 1200w" sizes="240px" alt="KuletX AI" width={480} height={165} className={`w-auto ${className}`} />
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        <Link to="/" aria-label="KuletX AI home" className="flex min-h-11 shrink-0 items-center transition-transform hover:scale-[1.03]">
          <Logo className="h-9 sm:h-10" />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 font-gamer text-xs uppercase sm:gap-2 sm:text-sm">
          <Link to="/" hash="stories" className="inline-flex min-h-11 items-center px-2 text-mute hover:text-neon">
            Stories
          </Link>
          <Link to="/" hash="trimz" className="inline-flex min-h-11 items-center px-2 text-mute hover:text-neon">
            Trimz
          </Link>
          <Link to="/" hash="watch" className="hidden min-h-11 items-center px-2 text-mute hover:text-neon sm:inline-flex">
            Channels
          </Link>
          <FindButton />
          <a
            href={LINKS.youtube}
            target="_blank"
            rel="noreferrer"
            className="hidden min-h-11 items-center border border-neon px-3 text-neon hover:bg-neon hover:text-void sm:inline-flex"
          >
            Subscribe
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
      <p className="mt-8 text-xs text-mute/70">
        Fonts: pixel faces by 00ff (hicchicc) and Obel Mono by Typographic Systems, under the{' '}
        <a href="/fonts/OFL-00ff.txt" className="underline hover:text-neon">
          SIL Open Font License
        </a>
        . Button prompts by Nicolae "Xelu" Berbece (CC0).
      </p>
    </footer>
  )
}
