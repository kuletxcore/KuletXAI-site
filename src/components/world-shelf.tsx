import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from '@tanstack/react-router'
import { LINKS, STORIES, storyPlatformName, trimzSeriesUrl } from '#/data/content'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { COVER_VIDEOS } from '#/data/cover-videos'
import { LiveCount, LiveDot } from '#/components/live-count'
import { play as sfx } from '#/lib/sfx'
import { useLite } from '#/lib/perf'

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * The world shelf. On a roomy screen the section pins to the viewport and vertical scroll
 * glides the shelf sideways — every world is a full-bleed poster you scroll past rather than
 * a card in a grid. Small screens and reduced motion get a plain swipeable strip instead.
 */
export function WorldShelf() {
  const live = useIskStats()
  const lite = useLite()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLUListElement>(null)
  const [pinned, setPinned] = useState(false)
  const [active, setActive] = useState(0)
  /** Panel under the pointer or focus: its cover video plays, like the old card grid */
  const [hot, setHot] = useState<number | null>(null)
  const total = STORIES.length + 1 // the last panel is the creator slot

  // Pin only where there is room, and only when motion is welcome
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    // Lite mode skips the pinned shelf too: it redraws a full screen of art on every frame
    const sync = () => setPinned(wide.matches && !calm.matches && !lite)
    sync()
    wide.addEventListener('change', sync)
    calm.addEventListener('change', sync)
    return () => {
      wide.removeEventListener('change', sync)
      calm.removeEventListener('change', sync)
    }
  }, [lite])

  /** Where to put the shelf so a given panel sits in the middle (pinned mode only). */
  const travelTo = useCallback((index: number) => {
    const section = sectionRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!section || !stage || !track) return
    const panel = track.children[index] as HTMLElement | undefined
    if (!panel) return
    const shift = Math.max(0, track.scrollWidth - stage.clientWidth)
    if (!shift) return
    const target = Math.min(shift, Math.max(0, panel.offsetLeft - (stage.clientWidth - panel.offsetWidth) / 2))
    const progress = target / shift
    const run = section.offsetHeight - window.innerHeight
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY + progress * run,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [])

  // Vertical scroll drives the horizontal glide; the section is as tall as the travel needs
  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const track = trackRef.current
    if (!section || !stage || !track) return
    if (!pinned) {
      section.style.height = ''
      track.style.transform = ''
      stage.style.removeProperty('--p')
      return
    }

    let shift = 0
    let frame = 0

    const paint = () => {
      frame = 0
      const run = section.offsetHeight - window.innerHeight
      const top = section.getBoundingClientRect().top
      const progress = run > 0 ? Math.min(1, Math.max(0, -top / run)) : 0
      track.style.transform = `translate3d(${(-progress * shift).toFixed(1)}px, 0, 0)`
      stage.style.setProperty('--p', progress.toFixed(4))
      // Only re-render when the shelf actually moves to a different panel
      const index = Math.round(progress * (track.children.length - 1))
      setActive((was) => (was === index ? was : index))
    }

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    const measure = () => {
      shift = Math.max(0, track.scrollWidth - stage.clientWidth)
      section.style.height = `${Math.round(window.innerHeight + shift * 0.62)}px`
      queue()
    }

    measure()
    // Images and fonts settle a beat after hydration; the widths are CSS-driven, but re-measure once
    const settle = window.setTimeout(measure, 400)
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', measure)
      cancelAnimationFrame(frame)
    }
  }, [pinned])

  // Small screens swipe the strip themselves, so follow that scroll for the counter
  useEffect(() => {
    if (pinned) return
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return
    let frame = 0
    const read = () => {
      frame = 0
      const middle = viewport.scrollLeft + viewport.clientWidth / 2
      let best = 0
      let closest = Number.POSITIVE_INFINITY
      Array.prototype.forEach.call(track.children, (panel: HTMLElement, i: number) => {
        const distance = Math.abs(panel.offsetLeft + panel.offsetWidth / 2 - middle)
        if (distance < closest) {
          closest = distance
          best = i
        }
      })
      setActive((was) => (was === best ? was : best))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    viewport.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      viewport.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [pinned])

  // Keyboard users tabbing through the shelf get the panel they land on, not a clipped edge
  const onFocus = (e: React.FocusEvent<HTMLUListElement>) => {
    const panel = (e.target as HTMLElement).closest('li')
    if (!panel || !trackRef.current) return
    const index = Array.prototype.indexOf.call(trackRef.current.children, panel)
    setHot(index)
    if (pinned) travelTo(index)
  }

  return (
    <section
      ref={sectionRef}
      id="stories"
      className="ws scroll-mt-16 border-b border-line"
      data-pinned={pinned ? 'true' : 'false'}
      aria-labelledby="ws-title"
    >
      <div ref={stageRef} className="ws-stage">
        <header className="ws-head">
          <div className="ws-head-main">
            <p className="ws-kicker">
              <LiveDot /> 01 // IsekaiZero + KageSekai
            </p>
            <h2 id="ws-title" className="pixel ws-title">
              Pick a world
            </h2>
            <p className="ws-sub">Seven interactive storylines. Scroll the shelf, or open one and talk to it.</p>
          </div>
          <div className="ws-nav">
            <span className="ws-hint" aria-hidden>
              {pinned ? 'scroll to travel' : 'swipe'}
              <Arrow />
            </span>
            <span className="ws-count" aria-label={`World ${active + 1} of ${total}`}>
              <b>{pad2(active + 1)}</b>
              <i aria-hidden>/</i>
              {pad2(total)}
            </span>
            <div className="ws-ticks" aria-hidden>
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={i <= active ? 'is-on' : undefined} />
              ))}
            </div>
          </div>
        </header>

        <div ref={viewportRef} className="ws-viewport">
          <ul ref={trackRef} className="ws-track" aria-label="Worlds" onFocus={onFocus}>
            {STORIES.map((s, i) => (
              <li
                key={s.slug}
                className={`ws-panel${s.trimz?.[0] ? ' has-trimz' : ''}`}
                style={{ '--accent': s.accent } as CSSProperties}
                onPointerEnter={() => setHot(i)}
                onPointerLeave={() => setHot((was) => (was === i ? null : was))}
              >
                <Link
                  to="/stories/$slug"
                  params={{ slug: s.slug }}
                  onClick={() => sfx('enter')}
                  className="ws-link"
                  aria-label={`${s.title} on ${storyPlatformName(s)}: open the world`}
                >
                  <img
                    className="ws-art"
                    src={s.cover}
                    alt=""
                    loading={i < 3 ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={i === 0 ? 'high' : 'low'}
                  />
                  {COVER_VIDEOS[s.slug] && <CoverVideo src={COVER_VIDEOS[s.slug]} play={hot === i} />}
                  <span className="ws-scrim" aria-hidden />
                  <span className="ws-num" aria-hidden>
                    {pad2(i + 1)}
                  </span>
                  <span className={`ws-rating${s.rating === '18+' ? ' is-adult' : ''}`}>{s.rating}</span>
                  <span className="ws-plat">{storyPlatformName(s)}</span>

                  <span className="ws-body">
                    {s.logo ? (
                      <img className="ws-logo" src={s.logo.src} alt={s.title} width={s.logo.w} height={s.logo.h} loading="lazy" />
                    ) : (
                      <span className="ws-name">{s.title}</span>
                    )}
                    <span className="ws-line">{s.logline}</span>
                    <span className="ws-meta">
                      <span className="ws-tags">
                        {s.tags.slice(0, 3).map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </span>
                      <span className="ws-stats">
                        ♥ <LiveCount value={countOf(live, s, 'likes')} /> · ✉ <LiveCount value={countOf(live, s, 'chats')} /> ·{' '}
                        <LiveCount value={countOf(live, s, 'messages')} compact /> MSG
                      </span>
                    </span>
                    <span className="ws-open">
                      Enter world
                      <Arrow />
                    </span>
                  </span>
                </Link>
                {s.trimz?.[0] && (
                  <a
                    className="ws-trimz"
                    href={trimzSeriesUrl(s.trimz[0])}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => sfx('enter')}
                    aria-label={`Watch the ${s.title} series on Trimz`}
                  >
                    ▶ On Trimz
                  </a>
                )}
              </li>
            ))}

            <li className="ws-panel ws-panel-next">
              <a
                href={LINKS.isekaiProfile}
                target="_blank"
                rel="noreferrer"
                className="ws-link ws-next"
                aria-label="More worlds on IsekaiZero"
              >
                <span className="ws-next-grid" aria-hidden>
                  {STORIES.map((s) => (
                    <img key={s.slug} src={s.tile ?? s.cover} alt="" loading="lazy" decoding="async" />
                  ))}
                </span>
                <span className="ws-next-body">
                  <span className="ws-next-plus" aria-hidden>
                    +
                  </span>
                  <span className="ws-next-title">
                    NEXT_WORLD.LOADING<span className="cursor" aria-hidden />
                  </span>
                  <span className="ws-next-sub">Creator on IsekaiZero — new worlds every month</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/** A poster's own cover video: fetched the first time it plays, then only paused. */
function CoverVideo({ src, play }: { src: string; play: boolean }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [armed, setArmed] = useState(false)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (play) setArmed(true)
  }, [play])
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    if (play) void v.play().catch(() => {})
    else v.pause()
  }, [play, armed])
  if (!armed) return null
  return (
    <video
      ref={ref}
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden
      onPlaying={() => setReady(true)}
      className={`ws-cover${play && ready ? ' is-ready' : ''}`}
    >
      <source src={src.replace(/\.mp4(?=\?|$)/, '.webm')} type="video/webm" />
      <source src={src} type="video/mp4" />
    </video>
  )
}

function Arrow() {
  return (
    <svg className="ws-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  )
}
