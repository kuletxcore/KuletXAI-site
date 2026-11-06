import { Link } from '@tanstack/react-router'
import { LINKS } from '#/data/content'

export function Logo({ className = 'h-8' }: { className?: string }) {
  return <img src="/brand/kuletx-ai-480.webp" srcSet="/brand/kuletx-ai-480.webp 480w, /brand/kuletx-ai-1200.webp 1200w" sizes="240px" alt="KuletX AI" width={480} height={165} className={`w-auto ${className}`} />
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-void/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="KuletX AI home" className="shrink-0 transition-transform hover:scale-[1.03]">
          <Logo className="h-9 sm:h-10" />
        </Link>
        <nav className="flex items-center gap-4 font-gamer text-xs uppercase sm:gap-6 sm:text-sm">
          <Link to="/" hash="stories" className="text-mute hover:text-neon">
            Stories
          </Link>
          <Link to="/" hash="trimz" className="text-mute hover:text-neon">
            Trimz
          </Link>
          <Link to="/" hash="watch" className="hidden text-mute hover:text-neon sm:inline">
            Channels
          </Link>
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
