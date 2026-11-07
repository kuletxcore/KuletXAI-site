import { Link, createFileRoute, notFound, useNavigate } from '@tanstack/react-router'
import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { STORIES } from '#/data/content'
import { STORY_MUSIC } from '#/data/music'
import { TROPHIES } from '#/data/trophies'
import type { Trophy, TrophyGrade } from '#/data/trophies'
import { PAD_LABEL, useGamepad } from '#/lib/gamepad'
import { KeyLabel } from '#/components/pad-glyph'
import type { PadButton } from '#/lib/gamepad'
import { setMusic, stopOst } from '#/lib/music'
import { isMuted, play as sfx, setMuted } from '#/lib/sfx'
import { glideIntoView, stopAllGlides } from '#/lib/smooth-scroll'

export const Route = createFileRoute('/stories_/$slug/trophies')({
  loader: ({ params }) => {
    const story = STORIES.find((s) => s.slug === params.slug)
    const set = TROPHIES[params.slug]
    if (!story || !set) throw notFound()
    return { story, set }
  },
  head: ({ loaderData }) => ({
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap' },
    ],
    meta: loaderData
      ? [
          { title: `Trophies · ${loaderData.story.title} | KuletX AI` },
          { name: 'description', content: `All ${loaderData.set.trophies.length} trophies in ${loaderData.story.title}, an interactive story on IsekaiZero.` },
          { name: 'theme-color', content: '#05070c' },
        ]
      : [],
  }),
  component: TrophyPage,
  notFoundComponent: () => (
    <div className="ps5 grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="ps5-title">No trophies here</p>
        <Link to="/" className="ps5-cta mt-8">
          Back to KuletX AI
        </Link>
      </div>
    </div>
  ),
})

const GRADE_ORDER: TrophyGrade[] = ['platinum', 'gold', 'silver', 'bronze']
const GRADE_LABEL: Record<TrophyGrade, string> = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' }

type Sort = 'default' | 'grade'

function TrophyPage() {
  const { story, set } = Route.useLoaderData()
  const navigate = useNavigate()
  const [sort, setSort] = useState<Sort>('default')
  const [selected, setSelected] = useState(0)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const listRef = useRef<HTMLOListElement>(null)

  const trophies = useMemo(() => {
    const list = [...set.trophies]
    // A hidden trophy's grade is a secret until revealed, so it sorts after every graded one
    const rank = (t: Trophy) => (t.hidden && !revealed.has(t.id) ? GRADE_ORDER.length : GRADE_ORDER.indexOf(t.grade))
    if (sort === 'grade') list.sort((a, b) => rank(a) - rank(b))
    return list
  }, [set, sort, revealed])
  const counts = useMemo(() => {
    const c: Record<TrophyGrade, number> = { platinum: 0, gold: 0, silver: 0, bronze: 0 }
    for (const t of set.trophies) c[t.grade]++
    return c
  }, [set])

  // Keep the story's music playing on its trophy list. A soundtrack track started
  // in the hub keeps playing here (the background music stays quiet under it);
  // it stops only if you leave for somewhere other than this story's hub.
  useEffect(() => {
    setMusic(STORY_MUSIC[story.slug]?.src ?? null)
    const hub = `/stories/${story.slug}`
    return () => {
      setMusic(null)
      window.setTimeout(() => {
        const at = window.location.pathname.replace(/\/$/, '')
        if (at !== hub && at !== `${hub}/trophies`) stopOst()
      }, 0)
    }
  }, [story.slug])

  const toggleReveal = useCallback((t: Trophy) => {
    if (!t.hidden) return
    sfx('enter')
    setRevealed((r) => {
      const next = new Set(r)
      if (next.has(t.id)) next.delete(t.id)
      else next.add(t.id)
      return next
    })
  }, [])
  // The list glides to the selection only when keys or the pad moved it; under the mouse it's already in view
  const selectedBy = useRef<'keys' | 'mouse'>('keys')
  const hover = useCallback((i: number) => {
    selectedBy.current = 'mouse'
    setSelected(i)
  }, [])
  const move = (dir: 1 | -1) => {
    selectedBy.current = 'keys'
    setSelected((i) => {
      const next = Math.min(trophies.length - 1, Math.max(0, i + dir))
      if (next !== i) sfx('nav')
      return next
    })
  }
  const back = () => {
    sfx('back')
    navigate({ to: '/stories/$slug', params: { slug: story.slug } })
  }
  const flipSort = () => {
    sfx('tab')
    setSort((s) => (s === 'default' ? 'grade' : 'default'))
    selectedBy.current = 'keys'
    setSelected(0)
  }

  // Selected card follows the controller / arrow keys
  useEffect(() => {
    if (selectedBy.current === 'mouse') return
    const el = listRef.current?.children[selected] as HTMLElement | undefined
    if (el) glideIntoView(el, 24)
  }, [selected])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        move(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        move(-1)
      } else if (e.key === 'Escape') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pad = useGamepad(
    (b: PadButton) => {
      if (b === 'down') move(1)
      else if (b === 'up') move(-1)
      else if (b === 'a') toggleReveal(trophies[selected])
      else if (b === 'b') back()
      else if (b === 'x') flipSort()
      else if (b === 'y') {
        const next = !isMuted()
        setMuted(next)
        if (!next) sfx('nav')
      }
    },
    (dy) => {
      stopAllGlides()
      window.scrollBy({ top: dy, behavior: 'instant' })
    },
  )
  const l = PAD_LABEL[pad.kind]

  return (
    <MotionConfig reducedMotion="user">
      <div className="ps5 kx-trophies min-h-dvh">
        <div className="kx-trophies-bg" aria-hidden>
          <img src={story.cover} alt="" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-8 md:pt-10">
          <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-4">
              <Link to="/stories/$slug" params={{ slug: story.slug }} onClick={() => sfx('back')} className="shrink-0 overflow-hidden rounded-lg border border-white/15" aria-label={`Back to ${story.title}`}>
                <img src={story.tile ?? story.cover} alt="" className="size-12 object-cover md:size-14" />
              </Link>
              <h1 className="text-2xl leading-tight font-light text-white md:text-4xl">{story.title}</h1>
            </div>
            <dl className="flex items-end gap-5 md:gap-7">
              <TrophyIcon grade="platinum" className="hidden size-12 md:block" />
              <div>
                <dt className="text-sm text-white/60">Trophies</dt>
                <dd className="kx-stat-underline text-2xl font-light tabular-nums">{set.trophies.length}</dd>
              </div>
              {(['gold', 'silver', 'bronze'] as const).map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <dt className="sr-only">{GRADE_LABEL[g]}</dt>
                  <TrophyIcon grade={g} className="size-7" />
                  <dd className="text-2xl font-light tabular-nums">{counts[g]}</dd>
                </div>
              ))}
            </dl>
          </header>

          <div className="mt-6 flex items-center justify-between gap-4 text-sm text-white/70">
            <span>All trophies: {set.trophies.length}</span>
            <button type="button" onClick={flipSort} className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-white/10" aria-label={`Sort by: ${sort === 'default' ? 'Game default' : 'Grade'}. Change sort`}>
              <SortIcon />
              Sort by: {sort === 'default' ? 'Game Default' : 'Grade (Platinum – Bronze)'}
            </button>
          </div>

          <ol ref={listRef} className="mt-4 flex flex-col gap-3" aria-label="Trophies">
            {trophies.map((t, i) => (
              <TrophyRow key={t.id} t={t} index={i} selected={i === selected} hiddenNow={t.hidden && !revealed.has(t.id)} art={story.tile ?? story.cover} onHover={hover} onToggle={toggleReveal} />
            ))}
          </ol>

          <p className="mt-8 text-xs text-white/45">
            Trophies come from the story's codex on IsekaiZero and unlock as you play. Grades and the Platinum are this site's own.
          </p>
        </div>

        <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#05070c]/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-[13px] text-white/75 sm:px-8">
            <Link to="/stories/$slug" params={{ slug: story.slug }} onClick={() => sfx('back')} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 font-semibold text-white hover:bg-white/10">
              ‹ Back
            </Link>
            {pad.connected ? (
              <>
                <Key k="▲/▼" label="Select" />
                <Key k={l.a} label="Reveal hidden" />
                <Key k={l.x} label="Sort" />
                <Key k={l.b} label="Back" />
              </>
            ) : (
              <>
                <span className="hidden items-center gap-1.5 md:inline-flex">
                  <span className="ps5-key">↑</span>/<span className="ps5-key">↓</span> Select
                </span>
                <span className="hidden items-center gap-1.5 md:inline-flex">
                  <span className="ps5-key">Esc</span> Back
                </span>
              </>
            )}
            <a href={`https://www.isekaizero.ai/storylines/${story.id}?referralCode=95OBGFQX`} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} className="ml-auto rounded-full bg-white px-4 py-1.5 font-bold text-black hover:scale-[1.03]">
              ▶ Play on IsekaiZero
            </a>
          </div>
        </footer>
      </div>
    </MotionConfig>
  )
}

// Memoized: moving the selection re-renders the two rows that changed, not the whole list
const TrophyRow = memo(function TrophyRow({
  t,
  index,
  selected,
  hiddenNow,
  art,
  onHover,
  onToggle,
}: {
  t: Trophy
  index: number
  selected: boolean
  hiddenNow: boolean
  art: string
  onHover: (i: number) => void
  onToggle: (t: Trophy) => void
}) {
  return (
    <li
      className={`kx-trophy ${hiddenNow ? 'kx-trophy-locked' : `kx-trophy-${t.grade}`} ${selected ? 'is-selected' : ''}`}
      onPointerMove={(e) => {
        // Scrolling the list under a still mouse also reports a move; only a pointer that moved selects
        if (e.pointerType === 'touch' || (e.clientX === lastPointer.x && e.clientY === lastPointer.y)) return
        lastPointer.x = e.clientX
        lastPointer.y = e.clientY
        if (!selected) onHover(index)
      }}
    >
      <div className="kx-trophy-art">
        {hiddenNow ? <LockedTrophyIcon className="size-[55%]" /> : t.grade === 'platinum' ? <img src={art} alt="" /> : <TrophyIcon grade={t.grade} className="size-[55%]" />}
      </div>
      <div className="min-w-0">
        <p className="text-base leading-snug font-bold text-white md:text-lg">{hiddenNow ? 'Hidden trophy' : t.title}</p>
        {!hiddenNow && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
            <TrophyIcon grade={t.grade} className="size-4" /> {GRADE_LABEL[t.grade]}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/55">
          {t.grade === 'platinum' ? 'Collect every trophy' : hiddenNow ? 'Grade and details hidden until revealed' : t.hidden ? 'Spoiler · hidden trophy' : 'Codex achievement'}
        </p>
      </div>
      <div className="kx-trophy-desc">
        {hiddenNow ? (
          <>
            <p className="text-sm text-white/60">This trophy is hidden. Keep playing to unlock it, or reveal it here.</p>
            <button type="button" onClick={() => onToggle(t)} className="ps5-pill mt-3">
              Reveal
            </button>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-white/85 md:text-[15px]">{t.description}</p>
            {t.hidden && (
              <button type="button" onClick={() => onToggle(t)} className="ps5-pill mt-3">
                Hide again
              </button>
            )}
          </>
        )}
      </div>
    </li>
  )
})
const lastPointer = { x: NaN, y: NaN }

function Key({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="ps5-key">
        <KeyLabel k={k} />
      </span>{' '}
      {label}
    </span>
  )
}

/** Trophy cup tinted by grade (Platinum gets the pale-blue cup). */
function TrophyIcon({ grade, className = '' }: { grade: TrophyGrade; className?: string }) {
  const id = `kx-trophy-${grade}-${useId().replace(/:/g, '')}` // unique per icon: a hidden copy can't own the shared gradient
  const stops: Record<TrophyGrade, [string, string]> = {
    platinum: ['#e8f3ff', '#7fb4e8'],
    gold: ['#ffe27a', '#c98a12'],
    silver: ['#f2f4f7', '#8c96a3'],
    bronze: ['#f0b38a', '#9a5528'],
  }
  const [a, b] = stops[grade]
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M7 3h10v2h3v2a5 5 0 01-4.1 4.92A5 5 0 0113 14.9V17h3v2H8v-2h3v-2.1a5 5 0 01-2.9-2.98A5 5 0 014 7V5h3V3zm0 4H6a3 3 0 001.06 2.29C7.02 8.87 7 8.44 7 8V7zm10 0v1c0 .44-.02.87-.06 1.29A3 3 0 0018 7h-1zM7 20h10v1H7z"
      />
    </svg>
  )
}

/** Grey cup with a padlock: a hidden trophy before it's revealed, so the colour can't give its grade away. */
function LockedTrophyIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#5d636e"
        d="M7 3h10v2h3v2a5 5 0 01-4.1 4.92A5 5 0 0113 14.9V17h3v2H8v-2h3v-2.1a5 5 0 01-2.9-2.98A5 5 0 014 7V5h3V3zm0 4H6a3 3 0 001.06 2.29C7.02 8.87 7 8.44 7 8V7zm10 0v1c0 .44-.02.87-.06 1.29A3 3 0 0018 7h-1zM7 20h10v1H7z"
      />
      <rect x="14.5" y="15.5" width="8" height="7" rx="1.4" fill="#d6dae1" stroke="#0c0e14" strokeWidth="1.2" />
      <path d="M16.5 15.5v-1.6a2 2 0 014 0v1.6" fill="none" stroke="#d6dae1" strokeWidth="1.5" />
      <circle cx="18.5" cy="19" r="1" fill="#0c0e14" />
    </svg>
  )
}

const SortIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M7 4v16M3 16l4 4 4-4M13 6h8M13 12h6M13 18h4" />
  </svg>
)
