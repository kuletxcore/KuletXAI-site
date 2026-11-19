import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useStill } from '#/lib/still'
import { play as sfx } from '#/lib/sfx'

/** Ship 2: KX://FIND — press / or Cmd-K, type a vibe, land on a world.
 *  Shell is a key listener; the panel chunk loads on first summon only. */
export const OPEN_FINDER_EVENT = 'kx:open-finder'
export function openFinder(query = '') { window.dispatchEvent(new CustomEvent(OPEN_FINDER_EVENT, { detail: { query } })) }
const FinderPanel = lazy(() => import('#/components/world-finder-panel').then((m) => ({ default: m.FinderPanel })))

const SUGGESTIONS = ['kaiju', 'comedy', 'maid café spies', 'school rivals', 'goddess costume', 'a table', '18+']
export function FinderTrigger() {
  const still = useStill()
  const [at, setAt] = useState(0)
  useEffect(() => {
    if (still || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setAt((i) => (i + 1) % SUGGESTIONS.length), 2600)
    return () => window.clearInterval(id)
  }, [still])
  return (
    <div className="mt-6 max-w-lg">
      <button type="button" onClick={() => openFinder()} aria-haspopup="dialog" aria-label="Find a world, series or channel"
        className="group flex min-h-14 w-full items-center gap-3 border border-neon/70 bg-void/85 px-4 text-left hover:bg-neon/10">
        <span aria-hidden className="font-gamer text-sm text-neon">&gt;</span>
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-mute sm:text-base">Find a world… try <span className="text-ink">“{SUGGESTIONS[at]}”</span><span className="cursor text-neon" /></span>
        <kbd className="kx-kbm-only shrink-0 border border-line px-2 py-1 font-gamer text-[11px] text-mute group-hover:text-neon">/</kbd>
        <span aria-hidden className="shrink-0 font-gamer text-xs text-neon">FIND</span>
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-gamer text-[10px] uppercase text-mute">Tonight I want:</span>
        {(['Kaiju', 'Comedy', 'Spies', 'School', 'Powers'] as const).map((v) => (
          <button key={v} type="button" onClick={() => openFinder(v)} className="inline-flex min-h-11 items-center border border-line px-3 font-gamer text-[11px] uppercase text-ink hover:border-neon hover:text-neon">{v}</button>
        ))}
      </div>
    </div>
  )
}

export function WorldFinder() {
  const [session, setSession] = useState<{ q: string; n: number } | null>(null)
  const lastFocus = useRef<Element | null>(null)
  const ref = useRef(session); ref.current = session
  const hide = (quiet = false) => { setSession(null); if (!quiet) sfx('back'); (lastFocus.current as HTMLElement | null)?.focus?.() }
  useEffect(() => {
    const show = (q = '') => { lastFocus.current = document.activeElement; setSession({ q, n: Date.now() }); sfx('tab') }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const typing = !!t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (ref.current) hide(); else show() }
      else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && !ref.current) { e.preventDefault(); show() }
    }
    const onOpen = (e: Event) => show((e as CustomEvent<{ query?: string }>).detail?.query ?? '')
    window.addEventListener('keydown', onKey); window.addEventListener(OPEN_FINDER_EVENT, onOpen)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(OPEN_FINDER_EVENT, onOpen) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!session) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [session])
  if (!session) return null
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[12vh]" aria-hidden><div className="kx-rise w-full max-w-3xl border border-neon/60 bg-panel px-4 py-6 font-gamer text-xs text-neon">&gt; KX://FIND<span className="cursor" /></div></div>}>
      <FinderPanel key={session.n} initialQuery={session.q} onClose={hide} />
    </Suspense>
  )
}
