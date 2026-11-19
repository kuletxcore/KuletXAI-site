import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { LiveCount } from '#/components/live-count'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { shareWorld } from '#/lib/share'
import { play as sfx } from '#/lib/sfx'

/** Ship 7: Quick Peek. The shelf card used to be a one-way door to the hub;
 *  now a cover-corner PEEK opens the world's file in place — pitch, world,
 *  cast, hook — so visitors can fall for a world without pogo-sticking. */
export function openPeek(slug: string) { window.dispatchEvent(new CustomEvent('kx:peek', { detail: { slug } })) }

const RATING = (r: Story['rating']) => (r === 'SFW' ? 'bg-neon text-void' : r === '18+' ? 'bg-danger text-white' : 'bg-warn text-void')

export function QuickPeek() {
  const live = useIskStats()
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const on = (e: Event) => { setSlug((e as CustomEvent<{ slug: string }>).detail.slug); sfx('tab') }
    window.addEventListener('kx:peek', on)
    return () => window.removeEventListener('kx:peek', on)
  }, [])
  useEffect(() => {
    if (!slug) return
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSlug(null) }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [slug])

  const s = STORIES.find((x) => x.slug === slug)
  if (!s) return null
  const close = () => { sfx('back'); setSlug(null) }
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:px-4" role="presentation" onClick={close}>
      <div className="absolute inset-0 bg-void/85" aria-hidden />
      <article role="dialog" aria-modal="true" aria-label={`Quick look: ${s.title}`} className="kx-rise relative max-h-[88vh] w-full max-w-3xl overflow-y-auto border border-line bg-panel sm:border-neon/40" onClick={(e) => e.stopPropagation()}>
        <div className="grid sm:grid-cols-[2fr_3fr]">
          <div className="relative max-h-56 overflow-hidden sm:max-h-none">
            <img src={s.cover} alt={`Cover art for ${s.title}`} className="h-full w-full object-cover object-top" />
            <span className={`absolute top-3 left-3 px-2 py-1 font-gamer text-xs ${RATING(s.rating)}`}>{s.rating}</span>
          </div>
          <div className="flex flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-gamer text-[10px] uppercase" style={{ color: s.accent }}>{s.kicker}</p>
                <h3 className="mt-1.5 font-mono text-xl font-bold leading-snug text-ink">{s.title}</h3>
              </div>
              <button type="button" onClick={close} aria-label="Close quick look" className="grid size-11 shrink-0 place-items-center border border-line text-mute hover:border-danger-ink hover:text-danger-ink">✕</button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-mute">{s.pitch[0]}</p>
            <ul className="mt-4 space-y-2">
              {s.world.slice(0, 3).map((w) => (
                <li key={w.label} className="flex gap-3 text-[13px] leading-relaxed"><span className="shrink-0 font-gamer text-[10px] uppercase text-neon">{w.label}</span><span className="text-mute">{w.text}</span></li>
              ))}
            </ul>
            <p className="mt-4 border-l-2 pl-3 font-mono text-[13px] text-ink" style={{ borderColor: s.accent }}>{s.hook}</p>
            <p className="mt-4 font-gamer text-[11px] uppercase text-mute">
              ♥ <LiveCount value={countOf(live, s, 'likes')} /> · ★ <LiveCount value={countOf(live, s, 'saves')} /> · <LiveCount value={countOf(live, s, 'messages')} compact /> messages on {storyPlatformName(s)}
            </p>
            <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
              <a href={storyUrl(s)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="pixel inline-flex min-h-12 items-center justify-center bg-neon px-4 font-gamer text-sm uppercase text-void hover:bg-ink">▶ Play free →</a>
              <button type="button" onClick={async () => { const r = await shareWorld(s, window.location.origin); if (r === 'copied') { setCopied(true); window.setTimeout(() => setCopied(false), 2000) } }} className="inline-flex min-h-12 items-center border border-line px-4 font-gamer text-[11px] uppercase text-ink hover:border-neon hover:text-neon">{copied ? '✓ Copied' : '↗ Share'}</button>
            </div>
            <Link to="/stories/$slug" params={{ slug: s.slug }} onClick={() => sfx('nav')} className="mt-2 inline-flex min-h-11 items-center justify-center font-gamer text-[11px] uppercase text-neon hover:text-ink">Full world file: cast, gallery, soundtrack →</Link>
          </div>
        </div>
      </article>
    </div>
  )
}
