import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LINKS, STORIES, TRIMZ, storyPlatformName, storyUrl, trimzSeriesUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { countOf, formatCount, useIskStats } from '#/lib/isk-stats'
import { readSave, resumeSearch, saveLabel } from '#/lib/save-state'
import type { SaveState } from '#/lib/save-state'
import { play as sfx } from '#/lib/sfx'

/**
 * The Finder's panel. Kept in its own chunk (see world-finder.tsx): nothing here —
 * search, thumbs, live counts — is downloaded until the first summon.
 */

type Kind = 'world' | 'watch' | 'go'
type Filter = 'all' | 'worlds' | 'watch' | 'go' | 'safe' | 'adult'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'worlds', label: 'Worlds' },
  { key: 'watch', label: 'Watch' },
  { key: 'go', label: 'Go' },
  { key: 'safe', label: 'SFW + 17+' },
  { key: 'adult', label: '18+ only' },
]

/** Extra words people actually type, per world. Tags alone miss synonyms and moods. */
const HINTS: Record<string, string> = {
  acolytes: 'spies maid cafe agents tea night undercover thriller black ops',
  'colossus-protocol': 'kaiju giant monster coastal rift apocalypse scale',
  'queen-bee': 'school rivals queen status hierarchy romance slow burn',
  'problem-spawner': 'academy chaos superpower random comedy curse spawner',
  'i-am-the-table': 'table comedy fantasy furniture reincarnation transmigration silly',
  godsmarked: 'goddess costume superhero comic powers mystery transformation',
  wristbound: 'transformation dark artifact hero knots adult body horror',
}

type Item = {
  id: string
  kind: Kind
  title: string
  hint: string
  meta: string
  search: string
  cover?: string
  glyph?: string
  rating?: Story['rating']
  story?: Story
  to?: { slug?: string; hash?: string; search?: { tab?: 'trimz' | 'youtube'; section?: string } }
  href?: string
}

const RATING_CLASS = (r: Story['rating']) =>
  r === 'SFW' ? 'bg-neon text-void' : r === '18+' ? 'bg-danger text-white' : 'bg-warn text-void'

const RECENT_KEY = 'kx_finder_recent'
const readRecents = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as unknown
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 3) : []
  } catch {
    return []
  }
}
const pushRecent = (slug: string) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([slug, ...readRecents().filter((s) => s !== slug)].slice(0, 3)))
  } catch {
    /* private browsing: recents are a nicety, not a requirement */
  }
}

/** Subsequence match, so "tbl" still finds the table. */
const isSubsequence = (needle: string, hay: string) => {
  let i = 0
  for (const ch of hay) if (ch === needle[i]) i++
  return i >= needle.length
}

/** Case- and accent-insensitive, so "cafe" and "café" both find the maid café. */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

function scoreOf(item: Item, raw: string): number {
  const q = norm(raw.trim())
  if (!q) return 0
  const title = norm(item.title)
  const search = norm(item.search)
  let score = title === q ? 120 : title.startsWith(q) ? 90 : title.includes(q) ? 70 : 0
  for (const token of q.split(/\s+/)) {
    if (title.includes(token)) score += 18
    else if (item.rating?.toLowerCase() === token) score += 40
    else if (search.includes(token)) score += 12
    else if (isSubsequence(token, title) || isSubsequence(token, search)) score += 4
    else return -1
  }
  return score
}

function buildItems(save: SaveState | null, still: boolean): Item[] {
  const items: Item[] = []
  if (save) {
    const story = STORIES.find((s) => s.slug === save.slug)
    if (story)
      items.push({
        id: 'go:resume',
        kind: 'go',
        title: `Continue: ${story.title}`,
        hint: `You stopped at ${saveLabel(save)}`,
        meta: 'SAVE STATE',
        search: 'continue resume save memory card back return',
        cover: story.cover,
        rating: story.rating,
        to: { slug: story.slug, search: resumeSearch(save) },
      })
  }
  for (const s of STORIES)
    items.push({
      id: `world:${s.slug}`,
      kind: 'world',
      title: s.title,
      hint: s.logline,
      meta: storyPlatformName(s),
      search: `${s.title} ${s.logline} ${s.kicker} ${s.tags.join(' ')} ${s.cast.map((c) => c.name).join(' ')} ${HINTS[s.slug] ?? ''} ${s.rating} ${storyPlatformName(s)}`,
      cover: s.cover,
      rating: s.rating,
      story: s,
      to: { slug: s.slug },
    })
  for (const t of TRIMZ)
    items.push({
      id: `watch:${t.slug}`,
      kind: 'watch',
      title: t.title,
      hint: t.summary,
      meta: 'TRIMZ SERIES',
      search: `${t.title} ${t.summary} trimz series watch binge episodes anime`,
      cover: t.poster,
      glyph: '▶',
      href: trimzSeriesUrl(t.slug),
    })
  const go = (id: string, title: string, hint: string, search: string, extra: Partial<Item>): Item => ({
    id: `go:${id}`,
    kind: 'go',
    title,
    hint,
    meta: 'GO',
    search,
    glyph: '→',
    ...extra,
  })
  items.push(
    go('dealer', 'Deal me a world', 'Pick a vibe, the World Dealer deals you a card', 'dealer random surprise pick choose vibe deal card cant decide', { to: { hash: 'dealer' } }),
    go('teaser', 'Try the playable teaser', 'Ninety seconds of the storyteller, no account needed', 'try play demo teaser test sample table acolytes', { to: { hash: 'try' } }),
    go('stories', 'Browse all worlds', 'The full grid, every rating, with live counts', 'all worlds stories grid browse list', { to: { hash: 'stories' } }),
    go('trimz', 'Binge on Trimz', 'Series cut from the stories', 'trimz watch series binge', { to: { hash: 'trimz' } }),
    go('isekai', 'Play on IsekaiZero', 'Where the SFW and 17+ worlds live', 'isekai isekaizero play account', { href: LINKS.isekaiProfile }),
    go('kage', 'Dare on KageSekai', 'The 18+ worlds live here', 'kage kagesekai adult 18+ dare', { href: LINKS.kageProfile }),
    go('youtube', 'Watch on YouTube', 'Trailers and the storytelling process', 'youtube videos trailers subscribe watch', { href: LINKS.youtube }),
    go('motion', still ? 'Play motion' : 'Pause motion', 'Stops the drifting posters, the cursor blink and every loop', 'motion pause play still animation reduce quiet', { glyph: still ? '▶' : '❚❚' }),
  )
  return items
}

export function FinderPanel({
  initialQuery,
  still,
  onToggleMotion,
  onClose,
}: {
  initialQuery: string
  still: boolean
  onToggleMotion: () => void
  onClose: (quiet?: boolean) => void
}) {
  const navigate = useNavigate()
  const live = useIskStats()
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<Filter>('all')
  const [sel, setSel] = useState(0)
  const [save] = useState<SaveState | null>(() => readSave())
  const [recents] = useState<string[]>(() => readRecents())
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useMemo(() => buildItems(save, still), [save, still])

  const visible = useMemo(() => {
    const inFilter = (i: Item) =>
      filter === 'all'
        ? true
        : filter === 'worlds'
          ? i.kind === 'world'
          : filter === 'watch'
            ? i.kind === 'watch'
            : filter === 'go'
              ? i.kind === 'go'
              : filter === 'safe'
                ? i.kind !== 'world' || i.rating !== '18+'
                : i.rating === '18+'
    const pool = items.filter(inFilter)
    if (!query.trim()) {
      if (filter !== 'all') return pool
      // Cold open: jump-back-in first, then worlds in shelf order, then watch, then go
      const rank = (i: Item) =>
        i.id === 'go:resume' ? -2 : recents.includes(i.story?.slug ?? '') ? -1 : i.kind === 'world' ? 0 : i.kind === 'watch' ? 1 : 2
      return [...pool].sort((a, b) => rank(a) - rank(b))
    }
    return pool
      .map((i) => ({ i, s: scoreOf(i, query) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s || a.i.title.localeCompare(b.i.title))
      .map((x) => x.i)
  }, [items, filter, query, recents])

  useEffect(() => setSel(0), [query, filter])
  useEffect(() => setSel((s) => Math.min(s, Math.max(0, visible.length - 1))), [visible.length])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  // Keep the selected row in view without yanking the page (the list is its own scroller)
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const run = (item: Item, playNow = false) => {
    sfx('enter')
    if (item.id === 'go:motion') {
      onToggleMotion()
      onClose(true)
      return
    }
    if (item.story) pushRecent(item.story.slug)
    onClose(true)
    if (playNow && item.story) {
      window.open(storyUrl(item.story), '_blank', 'noreferrer')
      return
    }
    if (item.to) {
      if (item.to.slug) void navigate({ to: '/stories/$slug', params: { slug: item.to.slug }, search: item.to.search ?? {} })
      else if (item.to.hash) document.getElementById(item.to.hash)?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    if (item.href) window.open(item.href, '_blank', 'noreferrer')
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!visible.length) return
      sfx('nav')
      setSel((s) => (e.key === 'ArrowDown' ? (s + 1) % visible.length : (s - 1 + visible.length) % visible.length))
    } else if (e.key === 'Enter' && visible[sel]) {
      e.preventDefault()
      run(visible[sel], e.shiftKey)
    }
  }

  // Escape closes; Tab cycles inside the dialog instead of escaping behind it
  const onDialogKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key !== 'Tab') return
    const root = e.currentTarget as HTMLElement
    const focusables = Array.from(root.querySelectorAll<HTMLElement>('button, a[href], input')).filter((el) => !el.hasAttribute('disabled'))
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const groupOf = (i: Item) =>
    i.id === 'go:resume' || recents.includes(i.story?.slug ?? '') ? 'Jump back in' : i.kind === 'world' ? 'Worlds' : i.kind === 'watch' ? 'Watch' : 'Go'
  const browsing = !query.trim() && filter === 'all'

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]" role="presentation" onClick={() => onClose()}>
      <div className="kx-finder absolute inset-0 bg-void/85" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Find a world, series or channel"
        className="kx-finder-panel relative flex max-h-[82vh] w-full max-w-3xl flex-col border border-neon/60 bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onDialogKey}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="font-gamer text-xs text-neon">
            &gt; KX://FIND<span className="cursor" /> <span className="text-mute">every world, one input</span>
          </p>
          <span className="flex items-center gap-3 font-gamer text-[11px] text-mute">
            <span aria-live="polite">{visible.length} found</span>
            <button type="button" onClick={() => onClose()} aria-label="Close finder" className="grid size-11 place-items-center border border-line text-sm text-ink hover:border-danger-ink hover:text-danger-ink">
              ✕
            </button>
          </span>
        </div>

        <div className="border-b border-line px-4 pt-4">
          <label htmlFor="kx-finder-input" className="sr-only">Find a world, series or channel</label>
          <input
            ref={inputRef}
            id="kx-finder-input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="kx-finder-list"
            aria-activedescendant={visible[sel] ? `kx-finder-opt-${sel}` : undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            placeholder="Type a vibe, a world, a rating…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            className="w-full border border-line bg-void px-4 py-3.5 font-mono text-base text-ink placeholder:text-mute/70 focus:border-neon focus:outline-none"
          />
          <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter results">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => {
                  sfx('tab')
                  setFilter(f.key)
                }}
                className={`inline-flex min-h-11 shrink-0 items-center border px-3 font-gamer text-[11px] uppercase transition-colors ${
                  filter === f.key ? 'border-neon bg-neon text-void' : 'border-line text-ink hover:border-neon hover:text-neon'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={listRef} id="kx-finder-list" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {visible.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="pixel font-pixel text-2xl text-ink">NO WORLD MATCHES “{query.toUpperCase()}”</p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-mute">
                Try a mood instead: kaiju, comedy, spies, school, powers. Or let the Dealer pick for you.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose(true)
                  document.getElementById('dealer')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="pixel mt-5 bg-neon px-5 py-3 font-gamer text-sm uppercase text-void hover:bg-ink"
              >
                ▶ Deal me a world instead
              </button>
            </div>
          ) : (
            visible.map((item, idx) => {
              const active = idx === sel
              const heading = browsing && (idx === 0 || groupOf(visible[idx - 1]) !== groupOf(item)) ? groupOf(item) : null
              return (
                <div key={item.id}>
                  {heading && <p className="px-2 pt-3 pb-1 font-gamer text-[10px] uppercase text-mute first:pt-1">{heading}</p>}
                  <div
                    id={`kx-finder-opt-${idx}`}
                    role="option"
                    aria-selected={active}
                    className={`flex items-stretch gap-1 border ${active ? 'border-neon bg-neon/10' : 'border-transparent'}`}
                    onMouseMove={() => setSel(idx)}
                  >
                    <button type="button" onClick={() => run(item)} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left">
                      {item.cover ? (
                        <img src={item.cover} alt="" loading="lazy" decoding="async" className="h-14 w-11 shrink-0 object-cover object-top" />
                      ) : (
                        <span aria-hidden className="grid h-14 w-11 shrink-0 place-items-center border border-line font-gamer text-sm text-neon">{item.glyph ?? '→'}</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-mono text-sm font-bold text-ink">{item.title}</span>
                          {item.rating && <span className={`px-1.5 py-0.5 font-gamer text-[9px] ${RATING_CLASS(item.rating)}`}>{item.rating}</span>}
                        </span>
                        <span className="mt-0.5 line-clamp-1 block text-xs leading-relaxed text-mute">{item.hint}</span>
                        <span className="mt-1 block font-gamer text-[10px] uppercase text-mute">
                          {item.story
                            ? `♥ ${formatCount(countOf(live, item.story, 'likes'))} · ★ ${formatCount(countOf(live, item.story, 'saves'))} · ${formatCount(countOf(live, item.story, 'messages'))} MSG · ${item.meta}`
                            : item.meta}
                        </span>
                      </span>
                    </button>
                    {item.story && (
                      <a
                        href={storyUrl(item.story)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.stopPropagation()
                          sfx('enter')
                          pushRecent(item.story!.slug)
                        }}
                        aria-label={`Play ${item.title} now on ${storyPlatformName(item.story)}`}
                        className="m-1 inline-flex min-h-11 shrink-0 items-center self-center border border-neon px-3 font-gamer text-[11px] uppercase text-neon hover:bg-neon hover:text-void"
                      >
                        Play →
                      </a>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <p className="kx-kbm-only flex items-center gap-4 border-t border-line px-4 py-2.5 font-gamer text-[10px] uppercase text-mute">
          <span><span className="text-neon">↑↓</span> move</span>
          <span><span className="text-neon">Enter</span> world file</span>
          <span><span className="text-neon">Shift+Enter</span> play now</span>
          <span><span className="text-neon">Esc</span> close</span>
        </p>
      </div>
    </div>
  )
}
