import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { setStill, useStill } from '#/lib/still'
import { play as sfx } from '#/lib/sfx'

/**
 * KX://FIND — one input to every world, series, channel and action on the home page.
 *
 * The home page used to be a ~7,600px scroll: hero, dealer, grid, teaser, Trimz,
 * channels. A cold visitor had to learn that map before they could act on it.
 * The Finder inverts it: press `/` (or ⌘K / Ctrl-K) anywhere, type what you feel
 * like ("kaiju", "comedy", "school", "18+"), and jump straight there. Enter opens
 * a world's file, Shift+Enter plays it on its platform.
 *
 * Cost discipline: this shell only listens for the summon. The panel itself is a
 * separate chunk (`world-finder-panel.tsx`) fetched the first time it opens, it
 * renders nothing while closed, and it loads no art until then. First paint
 * pays for a key listener, nothing more.
 */

export const OPEN_FINDER_EVENT = 'kx:open-finder'

/** Ask the mounted Finder to open, optionally pre-filled (hero vibe chips use this). */
export function openFinder(query = '') {
  window.dispatchEvent(new CustomEvent(OPEN_FINDER_EVENT, { detail: { query } }))
}

const FinderPanel = lazy(() => import('#/components/world-finder-panel').then((m) => ({ default: m.FinderPanel })))


export function WorldFinder() {
  const still = useStill()
  const [session, setSession] = useState<{ query: string; n: number } | null>(null)
  const lastFocus = useRef<Element | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session

  const hide = (quiet = false) => {
    setSession(null)
    if (!quiet) sfx('back')
    const el = lastFocus.current as HTMLElement | null
    el?.focus?.()
  }

  // Global summon: `/` or ⌘K / Ctrl-K from anywhere on the page (unless already typing somewhere)
  useEffect(() => {
    const show = (q = '') => {
      lastFocus.current = document.activeElement
      setSession({ query: q, n: Date.now() })
      sfx('tab')
    }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (sessionRef.current) hide()
        else show()
      } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !sessionRef.current) {
        e.preventDefault()
        show()
      }
    }
    const onOpen = (e: Event) => show((e as CustomEvent<{ query?: string }>).detail?.query ?? '')
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_FINDER_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_FINDER_EVENT, onOpen)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Scroll lock only while open
  useEffect(() => {
    if (!session) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [session])

  if (!session) return null
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[12vh]" aria-hidden>
          <div className="kx-finder-panel w-full max-w-3xl border border-neon/60 bg-panel px-4 py-6 font-gamer text-xs text-neon">
            &gt; KX://FIND<span className="cursor" />
          </div>
        </div>
      }
    >
      <FinderPanel
        key={session.n}
        initialQuery={session.query}
        still={still}
        onToggleMotion={() => setStill(!still)}
        onClose={hide}
      />
    </Suspense>
  )
}
