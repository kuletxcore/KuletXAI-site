import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FINDER_INDEX, KIND_LABEL, searchItems } from '#/lib/finder'
import type { FinderItem } from '#/lib/finder'
import { LINKS, STORIES, storyUrl } from '#/data/content'
import { agoLabel, readSave, resumeSearch, saveLabel } from '#/lib/save-state'
import type { SaveState } from '#/lib/save-state'
import { play as sfx, setMuted, useMuted } from '#/lib/sfx'
import { setPerfMode, useLite } from '#/lib/perf'
import { setStill, useStill } from '#/lib/still'

// STORY FINDER: one field over every world, character, series, video and command on the site.
// Opens with Cmd/Ctrl+K or /, runs on the arrow keys and Enter, and works from any page.

export const openFinder = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('kx:finder'))
}

const stride = (storySlug: string) => STORIES.find((s) => s.slug === storySlug)

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/** The header's way into the palette: an icon, a label, and the shortcut. */
export function FindButton({ className = '' }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openFinder}
      aria-label="Search worlds, cast, series and commands"
      title="Search everything (Cmd or Ctrl + K)"
      className={`inline-flex min-h-11 items-center gap-2 px-2 font-gamer text-xs uppercase text-mute transition-colors hover:text-neon sm:border sm:border-line sm:px-3 ${className}`}
    >
      <svg {...iconProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.6-3.6" />
      </svg>
      <span className="hidden xs:inline sm:inline">Find</span>
      <kbd className="hidden border border-line/80 px-1 text-[10px] text-mute/80 md:inline-block">⌘K</kbd>
    </button>
  )
}

/** Highlight the characters that matched, when the title was the field that matched. */
function Title({ text, marks }: { text: string; marks: number[] }) {
  if (!marks.length) return <>{text}</>
  const hit = new Set(marks)
  return (
    <>
      {Array.from(text).map((ch, i) =>
        hit.has(i) ? (
          <mark key={i} className="bg-transparent font-bold text-neon">
            {ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  )
}

export function StoryFinder() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [save, setSave] = useState<SaveState | null>(null)
  const lite = useLite()
  const still = useStill()
  const muted = useMuted()
  const navigate = useNavigate()
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQ('')
    setSel(0)
  }, [])

  const show = useCallback(() => {
    setSave(readSave())
    setQ('')
    setSel(0)
    setOpen(true)
  }, [])

  // Global triggers: Cmd/Ctrl+K anywhere, / when nothing is being typed, and the header's button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) close()
        else show()
        return
      }
      if (open) {
        if (e.key === 'Escape') {
          e.preventDefault()
          close()
        }
        return
      }
      if (!typing && (e.key === '/' || e.key === 'F2')) {
        e.preventDefault()
        show()
      }
    }
    const onAsk = () => show()
    window.addEventListener('keydown', onKey)
    window.addEventListener('kx:finder', onAsk)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('kx:finder', onAsk)
    }
  }, [open, close, show])

  // The page behind the palette stays put
  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const before = root.style.overflow
    root.style.overflow = 'hidden'
    const id = window.setTimeout(() => input.current?.focus(), 20)
    return () => {
      root.style.overflow = before
      window.clearTimeout(id)
    }
  }, [open])

  // Commands read the current state, so "Pause motion" says what it will actually do
  const commands = useMemo<FinderItem[]>(() => {
    const out: FinderItem[] = []
    const resume = save ? stride(save.slug) : undefined
    if (save && resume) {
      out.push({
        id: 'do:resume',
        kind: 'action',
        title: `Continue ${resume.title}`,
        sub: `You stopped at ${saveLabel(save)} · ${agoLabel(save.at)}`,
        meta: ['Resume', 'Save state'],
        keywords: 'continue resume save state last session',
        run: () => navigate({ to: '/stories/$slug', params: { slug: save.slug }, search: resumeSearch(save) }),
      })
    }
    out.push(
      {
        id: 'do:surprise',
        kind: 'action',
        title: 'Surprise me',
        sub: 'Open a random SFW or 17+ world on IsekaiZero',
        meta: ['Do'],
        keywords: 'random surprise shuffle deal pick',
        run: () => {
          const deck = STORIES.filter((s) => s.rating !== '18+')
          const pick = deck[Math.floor(Math.random() * deck.length)]
          sfx('enter')
          window.open(storyUrl(pick), '_blank', 'noreferrer')
        },
      },
      {
        id: 'do:motion',
        kind: 'action',
        title: still ? 'Play motion' : 'Pause motion',
        sub: 'The poster wall, the cursor, the looping flourishes',
        meta: ['Setting'],
        keywords: 'motion pause play animation still',
        run: () => setStill(!still),
      },
      {
        id: 'do:sound',
        kind: 'action',
        title: muted ? 'Turn sound on' : 'Mute sound',
        sub: 'Interface sounds and the start-up sting',
        meta: ['Setting'],
        keywords: 'sound audio mute volume',
        run: () => setMuted(!muted),
      },
      {
        id: 'do:lite',
        kind: 'action',
        title: lite ? 'Full graphics' : 'Lite graphics',
        sub: 'Still backgrounds and no blur, for older machines',
        meta: ['Setting'],
        keywords: 'graphics lite performance quality',
        run: () => setPerfMode(lite ? 'full' : 'lite'),
      },
      { id: 'do:isekai', kind: 'action', title: 'IsekaiZero', sub: 'Every KuletX storyline, playable', meta: ['Channel'], keywords: 'isekaizero creator profile', href: LINKS.isekaiProfile },
      { id: 'do:kage', kind: 'action', title: 'KageSekai', sub: 'The 18+ worlds, same account', meta: ['Channel'], keywords: 'kagesekai 18 adult creator profile', href: LINKS.kageProfile },
      { id: 'do:trimz', kind: 'action', title: 'Trimz', sub: 'The series cut from the worlds', meta: ['Channel'], keywords: 'trimz watch series episodes', href: LINKS.trimz },
      { id: 'do:youtube', kind: 'action', title: 'YouTube', sub: 'Trailers and behind the scenes', meta: ['Channel'], keywords: 'youtube video subscribe channel', href: LINKS.youtube },
    )
    return out
  }, [save, still, muted, lite, navigate])

  const all = useMemo(() => [...commands, ...FINDER_INDEX], [commands])
  const found = useMemo(() => {
    if (q.trim()) return searchItems(all, q)
    // Resting state: where you left off, the loudest worlds, then where to go and what the site can do
    const worlds = [...STORIES].sort((a, b) => b.messages - a.messages).slice(0, 4)
    const order: FinderItem[] = [
      ...commands.filter((c) => c.id === 'do:resume'),
      ...worlds.map((s) => FINDER_INDEX.find((i) => i.id === `world:${s.slug}`)).filter((i): i is FinderItem => !!i),
      ...FINDER_INDEX.filter((i) => i.kind === 'jump'),
      ...commands.filter((c) => c.id !== 'do:resume'),
    ]
    return order.slice(0, 24).map((item) => ({ item, score: 0, marks: [] }))
  }, [q, all, commands])

  useEffect(() => setSel(0), [q])

  // Keep the highlighted row inside the scroller
  useEffect(() => {
    if (!open) return
    const el = list.current?.children[sel] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [sel, open])

  const go = useCallback(
    (item: FinderItem, play = false) => {
      sfx('enter')
      close()
      if (item.run) {
        item.run()
        return
      }
      if (item.hub && !play) {
        const search = item.hub.section ? { section: item.hub.section } : {}
        void navigate({ to: '/stories/$slug', params: { slug: item.hub.slug }, search })
        return
      }
      if (item.href) {
        const w = window.open(item.href, '_blank', 'noreferrer')
        if (w) w.opener = null
        return
      }
      if (item.anchor) {
        const behavior: ScrollBehavior = lite || still || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        const jump = (left: number) => {
          const el = document.getElementById(item.anchor as string)
          if (el) el.scrollIntoView({ behavior, block: 'start' })
          else if (left > 0) window.setTimeout(() => jump(left - 1), 70)
        }
        if (window.location.pathname === '/') {
          jump(0)
          history.replaceState(null, '', `#${item.anchor}`)
        } else {
          void navigate({ to: '/', hash: item.anchor })
          window.setTimeout(() => jump(14), 80)
        }
      }
    },
    [close, lite, still, navigate],
  )

  if (!open) return null
  const active = found[Math.min(sel, found.length - 1)]?.item

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[7vh] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Story finder">
      <button type="button" tabIndex={-1} aria-label="Close story finder" onClick={close} className={`absolute inset-0 cursor-default bg-void/90 ${lite ? '' : 'backdrop-blur-sm'}`} />
      <div className={`kx-find-panel relative w-full max-w-2xl border border-line bg-panel shadow-[0_30px_90px_rgba(0,0,0,0.8)]`}>
        <div className="flex items-center justify-between gap-3 border-b border-line bg-void/60 px-4 py-2 font-gamer text-[10px] uppercase tracking-wide text-mute">
          <span className="text-neon">
            {'//'} Story finder
          </span>
          <span className="flex items-center gap-3">
            <span aria-live="polite">
              {found.length} {found.length === 1 ? 'hit' : 'hits'}
            </span>
            <button type="button" onClick={close} className="inline-flex min-h-8 items-center border border-line px-2 text-[10px] text-mute hover:border-neon hover:text-neon" aria-label="Close story finder">
              esc
            </button>
          </span>
        </div>

        <div className="flex items-center gap-3 border-b border-line px-4">
          <span aria-hidden className="pixel font-pixel text-2xl leading-none text-neon">
            &gt;
          </span>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSel((i) => (found.length ? (i + 1) % found.length : 0))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSel((i) => (found.length ? (i - 1 + found.length) % found.length : 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (active) go(active, e.shiftKey)
              } else if (e.key === 'Escape') {
                e.preventDefault()
                close()
              } else if (e.key === 'Tab') {
                e.preventDefault()
              }
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="kx-find-list"
            aria-autocomplete="list"
            aria-activedescendant={active ? `kx-find-opt-${active.id}` : undefined}
            placeholder="World, character, series, video, or a command…"
            autoComplete="off"
            spellCheck={false}
            className="min-h-14 w-full min-w-0 bg-transparent py-3 font-mono text-base text-ink outline-none placeholder:text-mute/70 sm:text-lg"
          />
        </div>

        {found.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="pixel font-pixel text-xl text-ink">Nothing spawns for that</p>
            <p className="mt-2 text-sm text-mute">
              Try a world (<span className="text-neon">acolytes</span>), a tag (<span className="text-neon">kaiju</span>) or a
              character (<span className="text-neon">rin</span>).
            </p>
          </div>
        ) : (
          <ul ref={list} id="kx-find-list" role="listbox" aria-label="Results" className="kx-find-list max-h-[52vh] overflow-y-auto overscroll-contain py-1">
            {found.map(({ item, marks }, i) => {
              const on = i === sel
              return (
                <li
                  key={item.id}
                  id={`kx-find-opt-${item.id}`}
                  role="option"
                  aria-selected={on}
                  data-active={on}
                  onMouseMove={() => (on ? undefined : setSel(i))}
                  className={`group relative flex items-stretch gap-3 border-l-2 pl-2 transition-colors ${
                    on ? 'border-neon bg-neon/8' : 'border-transparent'
                  }`}
                >
                  <button type="button" onClick={() => go(item)} className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-2 text-left">
                    {item.image ? (
                      <img src={item.image} alt="" loading="lazy" decoding="async" className="h-11 w-8 shrink-0 border border-line object-cover" />
                    ) : (
                      <span className={`grid h-11 w-8 shrink-0 place-items-center border font-gamer text-[10px] ${on ? 'border-neon/60 text-neon' : 'border-line text-mute'}`}>
                        {KIND_LABEL[item.kind].slice(0, 2)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate font-mono text-sm font-bold ${on ? 'text-ink' : 'text-ink/90'}`}>
                          <Title text={item.title} marks={marks} />
                        </span>
                        <span className={`shrink-0 font-gamer text-[9px] uppercase ${on ? 'text-neon' : 'text-mute/80'}`}>{KIND_LABEL[item.kind]}</span>
                      </span>
                      {item.sub && <span className="mt-0.5 line-clamp-1 block text-xs leading-snug text-mute">{item.sub}</span>}
                    </span>
                  </button>
                  <span className="flex shrink-0 items-center gap-1 pr-2">
                    {item.hub && (
                      <span className={`hidden font-gamer text-[9px] uppercase sm:inline ${on ? 'text-neon' : 'text-mute/70'}`}>↵ open</span>
                    )}
                    {item.href && (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          sfx('enter')
                          close()
                        }}
                        className={`inline-flex min-h-11 items-center whitespace-nowrap border px-2 font-gamer text-[9px] uppercase ${
                          on ? 'border-neon text-neon hover:bg-neon hover:text-void' : 'border-line text-mute hover:border-neon hover:text-neon'
                        }`}
                        aria-label={`Open ${item.title} in a new tab`}
                      >
                        play ↗
                      </a>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line bg-void/60 px-4 py-2.5 font-gamer text-[10px] uppercase text-mute">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              <kbd className="border border-line px-1 text-ink">↑</kbd> <kbd className="border border-line px-1 text-ink">↓</kbd> move
            </span>
            <span>
              <kbd className="border border-line px-1 text-ink">↵</kbd> open
            </span>
            <span className="hidden sm:inline">
              <kbd className="border border-line px-1 text-ink">⇧</kbd>
              <kbd className="border border-line px-1 text-ink">↵</kbd> play
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="hidden sm:inline">find anywhere</span>
            <kbd className="border border-line px-1 text-ink">⌘K</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}
