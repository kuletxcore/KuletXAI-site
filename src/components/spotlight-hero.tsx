import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { LINKS, STORIES, storyPlatformName, trimzSeriesUrl } from '#/data/content'
import { countOf, totalOf, useIskStats } from '#/lib/isk-stats'
import { LiveCount, LiveDot } from '#/components/live-count'
import { play as sfx } from '#/lib/sfx'
import { useLite } from '#/lib/perf'

/** How long each world holds the spotlight before the next one takes it. */
const ROTATE = 7000

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * The landing hero as a live spotlight: a tilted poster wall you can point at, and the world under the
 * pointer becomes the whole stage — art, title, logline, CTA. Arrows browse, Enter enters. It rotates on
 * its own until you take over, and every bit of motion stops for Lite mode and reduced motion.
 */
export function SpotlightHero() {
  const live = useIskStats()
  const lite = useLite()
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)
  /** Pointer or focus is on the wall: hold the rotation while the visitor is looking. */
  const [hold, setHold] = useState(false)
  /** The visitor picked a world themselves, so the rotation stays off for the rest of the visit. */
  const [touched, setTouched] = useState(false)
  /** Reduced motion (starts true so nothing animates before we know). */
  const [calm, setCalm] = useState(true)
  const [awake, setAwake] = useState(true)
  const [visible, setVisible] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)
  const wallRef = useRef<HTMLUListElement>(null)

  const total = STORIES.length
  const story = STORIES[idx]
  const auto = !calm && !lite && !touched && !hold && awake && visible

  // Motion preferences: no self-advancing carousel for people who asked for less motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setCalm(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // Nothing rotates in a background tab, or while the hero has scrolled away
  useEffect(() => {
    const onVis = () => setAwake(!document.hidden)
    onVis()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The only timer on the page: seven seconds per world, restored when the visitor backs off
  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(() => setIdx((i) => (i + 1) % total), ROTATE)
    return () => window.clearInterval(id)
  }, [auto, total])

  // The wall leans toward the pointer, so the first screen has depth instead of a flat grid
  useEffect(() => {
    const el = wallRef.current
    if (!el || lite || calm) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const clamp = (n: number) => Math.max(-0.6, Math.min(0.6, n))
    let x = 0
    let y = 0
    let queued = false
    let tilt = false
    const write = (px: number, py: number) => {
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
    }
    const flush = () => {
      queued = false
      if (!tilt) {
        write(0, 0)
        return
      }
      const r = el.getBoundingClientRect()
      // Off screen (the visitor has scrolled past): relax the wall and stop measuring
      if (r.bottom < 0 || r.top > window.innerHeight) {
        tilt = false
        write(0, 0)
        return
      }
      write(clamp((x - r.left) / r.width - 0.5), clamp((y - r.top) / r.height - 0.5))
    }
    const queue = () => {
      if (!queued) {
        queued = true
        requestAnimationFrame(flush)
      }
    }
    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      tilt = true
      queue()
    }
    const reset = () => {
      tilt = false
      queue()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', reset)
    window.addEventListener('scroll', queue, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', reset)
      window.removeEventListener('scroll', queue)
    }
  }, [lite, calm])

  // Keyboard: ←/→ browse the wall, Enter opens the world in the spotlight
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || !visible) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const enterable = !t || t === document.body
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        pick((idx + 1) % total, 'nav')
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        pick((idx - 1 + total) % total, 'nav')
      } else if (e.key === 'Enter' && enterable) {
        e.preventDefault()
        sfx('enter')
        void navigate({ to: '/stories/$slug', params: { slug: story.slug } })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [idx, total, visible, story.slug, navigate])

  // Bring the chosen tile into view on the phone ribbon (the desktop wall never scrolls)
  const reveal = (i: number) => {
    const el = wallRef.current
    if (!el || el.scrollWidth <= el.clientWidth + 4) return
    const tile = el.children[i] as HTMLElement | undefined
    tile?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: calm ? 'auto' : 'smooth' })
  }

  /** Someone chose a world: stop rotating, switch the stage, click like a console. */
  const pick = (i: number, sound: 'tab' | 'nav' | null = 'tab') => {
    if (i === idx) return
    if (sound) sfx(sound)
    setTouched(true)
    setIdx(i)
    reveal(i)
  }

  const step = (d: number) => pick((idx + d + total) % total, null)

  return (
    <section
      ref={sectionRef}
      id="top"
      className="sp relative border-b border-line"
      style={{ '--accent': story.accent, '--sp-rotate': `${ROTATE}ms` } as CSSProperties}
      data-auto={auto ? 'on' : 'off'}
      aria-label="KuletX AI spotlight"
    >
      {/* One art layer per world, crossfaded as the spotlight moves */}
      <div className="sp-art" aria-hidden>
        {STORIES.map((s, i) => (
          <div key={s.slug} className={`sp-art-layer${i === idx ? ' is-on' : ''}`}>
            <img
              className="sp-art-soft"
              src={s.cover}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'low'}
            />
            <img
              className="sp-art-main"
              src={s.cover}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'low'}
            />
          </div>
        ))}
        <div className="sp-tint" />
        <div className="sp-scrim" />
        <div className="grid-bg sp-grid" />
      </div>

      <div className="sp-body">
        <div className="sp-intro">
          <p className="sp-kicker">
            <span className="sp-prompt" aria-hidden>
              &gt;
            </span>
            boot storyteller.exe
            <span className="sp-kicker-sep" aria-hidden>
              //
            </span>
            <span className="sp-live">
              <LiveDot /> LIVE
            </span>
          </p>
          <h1 className="pixel sp-h1">
            AI stories you <span className="sp-neon">play</span>, watch &amp;{' '}
            <span className="sp-neon">binge</span>
            <span className="cursor" aria-hidden />
          </h1>
          <p className="sp-sub">
            KuletX builds interactive worlds on IsekaiZero and KageSekai, cuts them into series on Trimz, and breaks
            it all down on YouTube.
          </p>
        </div>

        <div className="sp-wall-wrap">
          <ul
            ref={wallRef}
            className="sp-wall"
            aria-label="Worlds"
            onPointerEnter={() => setHold(true)}
            onPointerLeave={() => setHold(false)}
            onFocus={() => setHold(true)}
            onBlur={(e) => {
              const next = e.relatedTarget as Node | null
              if (!next || !e.currentTarget.contains(next)) setHold(false)
            }}
          >
            {STORIES.map((s, i) => (
              <li key={s.slug} className={i === idx ? 'is-on' : undefined}>
                <Link
                  to="/stories/$slug"
                  params={{ slug: s.slug }}
                  preload={false}
                  aria-label={`${s.title} on ${storyPlatformName(s)}`}
                  aria-current={i === idx ? 'true' : undefined}
                  onPointerEnter={() => setIdx(i)}
                  onFocus={() => setIdx(i)}
                  onClick={() => sfx('enter')}
                  onKeyDown={(e) => {
                    // Entering a world is a choice, so the wall stops drifting from then on
                    if (e.key === 'Enter' || e.key === ' ') setTouched(true)
                  }}
                  className="sp-tile"
                >
                  <img src={s.tile ?? s.cover} alt="" loading={i < 4 ? 'eager' : 'lazy'} decoding="async" />
                  <span className="sp-tile-num" aria-hidden>
                    {pad2(i + 1)}
                  </span>
                  <span className="sp-tile-frame" aria-hidden />
                </Link>
              </li>
            ))}
            <li className="is-next">
              <a
                href={LINKS.isekaiProfile}
                target="_blank"
                rel="noreferrer"
                className="sp-tile sp-tile-add"
                aria-label="More worlds on IsekaiZero"
              >
                <span aria-hidden>+</span>
                <em>NEXT_WORLD</em>
              </a>
            </li>
          </ul>
        </div>

        <div className="sp-spot" aria-live={auto ? 'off' : 'polite'} aria-atomic="true">
          <div className="sp-spot-meta">
            <span className="sp-pos">
              <b>{pad2(idx + 1)}</b>
              <i aria-hidden>/</i>
              {pad2(total)}
            </span>
            <span className={`sp-rating ${story.rating === '18+' ? 'is-adult' : ''}`}>{story.rating}</span>
            <span className="sp-plat">{storyPlatformName(story)}</span>
            <span className="sp-spot-kicker">{story.kicker}</span>
          </div>

          <h2 key={story.slug} className="sp-title">
            {story.title}
          </h2>
          <p key={`${story.slug}-log`} className="sp-logline">
            {story.logline}
          </p>

          <ul className="sp-tags">
            {story.tags.map((t) => (
              <li key={t}>#{t}</li>
            ))}
          </ul>

          <div className="sp-actions">
            <Link
              to="/stories/$slug"
              params={{ slug: story.slug }}
              onClick={() => {
                setTouched(true)
                sfx('enter')
              }}
              className="sp-cta pixel"
            >
              <PlayGlyph />
              Enter world
            </Link>
            {story.trimz?.[0] ? (
              <a
                href={trimzSeriesUrl(story.trimz[0])}
                target="_blank"
                rel="noreferrer"
                className="sp-ghost"
                onClick={() => sfx('enter')}
              >
                Watch the series
              </a>
            ) : (
              <a href="#stories" className="sp-ghost" onClick={() => sfx('nav')}>
                Browse all worlds
              </a>
            )}
          </div>

          <p className="sp-counts">
            <span title="Player likes">
              <b aria-hidden>♥</b> <LiveCount value={countOf(live, story, 'likes')} />
            </span>
            <span title="Chats started">
              <b aria-hidden>✉</b> <LiveCount value={countOf(live, story, 'chats')} />
            </span>
            <span title="Messages sent">
              <LiveCount value={countOf(live, story, 'messages')} compact /> MSG
            </span>
          </p>
        </div>
      </div>

      <div className="sp-hud">
        <div className="sp-hud-live">
          <span className="sp-live">
            <LiveDot /> LIVE
          </span>
          <span className="sp-hud-stat">
            <b>
              <LiveCount value={totalOf(live, 'messages')} compact />
            </b>{' '}
            messages
          </span>
          <span className="sp-hud-stat">
            <b>
              <LiveCount value={totalOf(live, 'likes')} />
            </b>{' '}
            likes
          </span>
          <span className="sp-hud-stat sp-hud-wide">
            <b>{total}</b> worlds
          </span>
          <span className="sp-motto" aria-hidden>
            » outslopping the competition
          </span>
        </div>

        <ol className="sp-ticks" aria-label="Choose a world">
          {STORIES.map((s, i) => (
            <li key={s.slug} className={i === idx ? 'is-on' : undefined}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-label={`Spotlight ${s.title}`}
                aria-current={i === idx ? 'true' : undefined}
              >
                <span className="sp-tick" aria-hidden>
                  <i />
                </span>
                <span className="sp-tick-n" aria-hidden>
                  {pad2(i + 1)}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <div className="sp-nav">
          <span className="sp-hint" aria-hidden>
            <kbd className="sp-key">←</kbd>
            <kbd className="sp-key">→</kbd>
            browse
          </span>
          <button type="button" onClick={() => step(-1)} className="sp-arrow" aria-label="Previous world">
            <Chevron dir="left" />
          </button>
          <button type="button" onClick={() => step(1)} className="sp-arrow" aria-label="Next world">
            <Chevron dir="right" />
          </button>
        </div>
      </div>

      <span className="sp-corner sp-corner-tl" aria-hidden />
      <span className="sp-corner sp-corner-br" aria-hidden />
    </section>
  )
}

function PlayGlyph() {
  return (
    <svg className="sp-glyph" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.2v13.6L19 12z" />
    </svg>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
      <path d={dir === 'left' ? 'M14.5 5 7.5 12l7 7' : 'M9.5 5l7 7-7 7'} />
    </svg>
  )
}
