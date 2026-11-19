import { useEffect, useState } from 'react'
import { openFinder } from '#/components/story-finder'
import { play as sfx } from '#/lib/sfx'

// THUMB DOCK: the phone's shortcut bar. On a tall phone the home page is a long scroll, so the four
// places worth reaching sit under the thumb, with the finder in the last slot. Desktop keeps the header.

const SPOTS = [
  { id: 'stories', label: 'Worlds' },
  { id: 'dealer', label: 'Dealer' },
  { id: 'try', label: 'Teaser' },
  { id: 'trimz', label: 'Watch' },
] as const

const icon = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

const Icons: Record<string, React.ReactNode> = {
  stories: (
    <svg {...icon}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  dealer: (
    <svg {...icon}>
      <rect x="3" y="6" width="12" height="15" transform="rotate(-8 9 13)" />
      <path d="M9 4h11v14" />
    </svg>
  ),
  try: (
    <svg {...icon}>
      <path d="M4 6l7 6-7 6z" />
      <path d="M13 6h6v12h-6" />
    </svg>
  ),
  trimz: (
    <svg {...icon}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" />
    </svg>
  ),
  find: (
    <svg {...icon}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.6-3.6" />
    </svg>
  ),
}

export function ThumbDock() {
  const [active, setActive] = useState<string>('stories')

  // Which section owns the screen: the last one whose top has passed the middle of the viewport
  useEffect(() => {
    let raf = 0
    const read = () => {
      raf = 0
      const line = window.innerHeight * 0.42
      let found = SPOTS[0].id as string
      for (const spot of SPOTS) {
        const el = document.getElementById(spot.id)
        if (el && el.getBoundingClientRect().top <= line) found = spot.id
      }
      setActive(found)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  const jump = (id: string) => {
    sfx('nav')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById(id)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-void/95 pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {SPOTS.map((spot) => {
          const on = active === spot.id
          return (
            <li key={spot.id} className="flex-1">
              <button
                type="button"
                onClick={() => jump(spot.id)}
                aria-current={on ? 'location' : undefined}
                className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 pt-1 font-gamer text-[9px] uppercase transition-colors ${
                  on ? 'text-neon' : 'text-mute'
                }`}
              >
                <span className={`h-0.5 w-6 ${on ? 'bg-neon' : 'bg-transparent'}`} aria-hidden />
                {Icons[spot.id]}
                {spot.label}
              </button>
            </li>
          )
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => {
              sfx('nav')
              openFinder()
            }}
            className="flex min-h-14 w-full flex-col items-center justify-center gap-1 pt-1 font-gamer text-[9px] uppercase text-mute transition-colors hover:text-neon"
          >
            <span className="h-0.5 w-6 bg-transparent" aria-hidden />
            {Icons.find}
            Find
          </button>
        </li>
      </ul>
    </nav>
  )
}
