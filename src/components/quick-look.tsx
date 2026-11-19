import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import { storyPlatformName, storyUrl, trimzSeriesUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { ISK } from '#/data/isk'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { LiveCount, LiveDot } from '#/components/live-count'
import { play as sfx } from '#/lib/sfx'

// QUICK LOOK: everything a card can't fit, without leaving the page. The pitch, the hook, who you meet,
// the live numbers, and one press to play the real thing or open its world file.

const RATING_CLASS = (r: Story['rating']) =>
  r === 'SFW' ? 'bg-neon text-void' : r === '18+' ? 'bg-danger text-white' : 'bg-warn text-void'

export function QuickLook({ story, onClose }: { story: Story | null; onClose: () => void }) {
  const live = useIskStats()
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!story) return
    const before = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const id = window.setTimeout(() => closeRef.current?.focus(), 20)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      // Keep Tab inside the dialog
      if (e.key === 'Tab' && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = before
      window.clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [story, onClose])

  if (!story) return null
  const isk = ISK[story.slug]
  const platform = storyPlatformName(story)
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="kx-look-title">
      <button type="button" tabIndex={-1} aria-label="Close quick look" onClick={onClose} className="fixed inset-0 cursor-default bg-void/90 backdrop-blur-sm" />
      <div
        ref={panel}
        className="kx-find-panel relative my-auto w-full max-w-4xl border border-line bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.85)]"
        style={{ boxShadow: `0 40px 120px rgba(0,0,0,0.85), 0 0 0 1px ${story.accent}33` }}
      >
        <div className="h-1 w-full" style={{ background: story.accent }} aria-hidden />
        <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="cover relative hidden overflow-hidden border-r border-line md:block">
            <img src={story.cover} alt={`Cover art for ${story.title}`} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-panel/90 via-transparent to-transparent" aria-hidden />
            <span className={`absolute top-3 left-3 px-2 py-1 font-gamer text-xs ${RATING_CLASS(story.rating)}`}>{story.rating}</span>
            {story.trimz && (
              <a
                href={trimzSeriesUrl(story.trimz[0])}
                target="_blank"
                rel="noreferrer"
                onClick={() => sfx('enter')}
                className="absolute bottom-3 left-3 inline-flex min-h-11 items-center gap-2 bg-void/90 px-3 font-gamer text-[11px] uppercase text-ink hover:bg-neon hover:text-void"
              >
                ▶ Watch the series
              </a>
            )}
          </div>

          <div className="flex flex-col p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="font-gamer text-[10px] leading-relaxed uppercase text-warn">{story.kicker}</p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close quick look"
                className="grid size-11 shrink-0 place-items-center border border-line font-gamer text-sm text-mute hover:border-danger-ink hover:text-danger-ink"
              >
                ✕
              </button>
            </div>
            <h2 id="kx-look-title" className="mt-2 font-mono text-2xl font-bold leading-tight text-ink">
              {story.title}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-gamer text-[10px] uppercase text-mute">
              <span className={`px-1.5 py-0.5 ${RATING_CLASS(story.rating)}`}>{story.rating}</span>
              <span>on {platform}</span>
              {story.tags.map((t) => (
                <span key={t} className="text-mute/80">
                  #{t}
                </span>
              ))}
            </p>

            <p className="mt-3 text-sm leading-relaxed text-mute">{story.logline}</p>
            <p className="mt-2 text-sm leading-relaxed text-mute/90">{story.pitch[0]}</p>
            <p className="mt-3 border-l-2 pl-3 font-mono text-sm leading-relaxed text-ink/90" style={{ borderColor: story.accent }}>
              “{story.hook}”
            </p>

            {isk?.cast.length ? (
              <div className="mt-4">
                <p className="font-gamer text-[10px] uppercase text-mute">You meet</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {isk.cast.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center gap-1.5 border border-line pr-2">
                      {c.portrait ? (
                        <img src={c.portrait} alt="" loading="lazy" decoding="async" className="size-8 object-cover" />
                      ) : (
                        <span className="grid size-8 place-items-center bg-void font-gamer text-[10px] text-mute">{c.name[0]}</span>
                      )}
                      <span className="max-w-28 truncate font-mono text-[11px] text-ink/90">{c.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-gamer text-[10px] uppercase text-mute">
              <span className="flex items-center gap-1.5" title={`Live totals on ${platform}`}>
                <LiveDot /> <LiveCount value={countOf(live, story, 'messages')} compact /> messages
              </span>
              <span>♥ <LiveCount value={countOf(live, story, 'likes')} /></span>
              <span>★ <LiveCount value={countOf(live, story, 'saves')} /></span>
              <span>✉ <LiveCount value={countOf(live, story, 'chats')} /></span>
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <a
                href={storyUrl(story)}
                target="_blank"
                rel="noreferrer"
                onClick={() => sfx('enter')}
                className="pixel inline-flex min-h-12 items-center justify-center gap-2 bg-neon px-4 font-gamer text-sm uppercase text-void hover:bg-ink"
              >
                ▶ Play on {platform}
              </a>
              <Link
                to="/stories/$slug"
                params={{ slug: story.slug }}
                onClick={() => {
                  sfx('enter')
                  onClose()
                }}
                className="inline-flex min-h-12 items-center justify-center border border-line px-4 font-gamer text-xs uppercase text-ink hover:border-neon hover:text-neon"
              >
                World file: cast, gallery, OST →
              </Link>
            </div>
            <p className="mt-2 text-center font-mono text-[10px] text-mute/70">Free to start · runs in your browser · no download</p>
          </div>
        </div>
      </div>
    </div>
  )
}
