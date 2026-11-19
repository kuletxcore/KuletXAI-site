import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LINKS, STORIES, TRIMZ, storyPlatformName, storyUrl, trimzSeriesUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { countOf, formatCount, useIskStats } from '#/lib/isk-stats'
import { readSave, resumeSearch, saveLabel } from '#/lib/save-state'
import { play as sfx } from '#/lib/sfx'

const HINTS: Record<string, string> = {
  acolytes: 'spies maid cafe agents tea night thriller', 'colossus-protocol': 'kaiju giant monster rift apocalypse',
  'queen-bee': 'school rivals queen status slow burn', 'problem-spawner': 'academy chaos superpower comedy curse',
  'i-am-the-table': 'table comedy fantasy furniture reincarnation', godsmarked: 'goddess costume superhero powers mystery',
  wristbound: 'transformation dark artifact hero adult body horror',
}
type Filter = 'all' | 'worlds' | 'watch' | 'go' | 'safe' | 'adult'
const FILTERS: [Filter, string][] = [['all', 'All'], ['worlds', 'Worlds'], ['watch', 'Watch'], ['go', 'Go'], ['safe', 'SFW + 17+'], ['adult', '18+ only']]
type Item = { id: string; kind: 'world' | 'watch' | 'go'; title: string; hint: string; meta: string; search: string; cover?: string; glyph?: string; rating?: Story['rating']; story?: Story; slug?: string; hash?: string; href?: string; saveSearch?: { tab?: 'trimz' | 'youtube'; section?: string } }
const RATING = (r: Story['rating']) => (r === 'SFW' ? 'bg-neon text-void' : r === '18+' ? 'bg-danger text-white' : 'bg-warn text-void')
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const subseq = (n: string, h: string) => { let i = 0; for (const c of h) if (c === n[i]) i++; return i >= n.length }
function score(item: Item, raw: string) {
  const q = norm(raw.trim()); if (!q) return 0
  const title = norm(item.title), search = norm(item.search)
  let sc = title === q ? 120 : title.startsWith(q) ? 90 : title.includes(q) ? 70 : 0
  for (const tok of q.split(/\s+/)) {
    if (title.includes(tok)) sc += 18
    else if (item.rating?.toLowerCase() === tok) sc += 40
    else if (search.includes(tok)) sc += 12
    else if (subseq(tok, title) || subseq(tok, search)) sc += 4
    else return -1
  }
  return sc
}

export function FinderPanel({ initialQuery, onClose }: { initialQuery: string; onClose: (quiet?: boolean) => void }) {
  const navigate = useNavigate()
  const live = useIskStats()
  const [query, setQuery] = useState(initialQuery)
  const [filter, setFilter] = useState<Filter>('all')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const items = useMemo<Item[]>(() => {
    const out: Item[] = []
    const save = readSave()
    if (save) { const st = STORIES.find((s) => s.slug === save.slug); if (st) out.push({ id: 'resume', kind: 'go', title: `Continue: ${st.title}`, hint: `You stopped at ${saveLabel(save)}`, meta: 'SAVE STATE', search: 'continue resume save return', cover: st.cover, rating: st.rating, slug: st.slug, saveSearch: resumeSearch(save) }) }
    for (const s of STORIES) out.push({ id: s.slug, kind: 'world', title: s.title, hint: s.logline, meta: storyPlatformName(s), search: `${s.title} ${s.logline} ${s.tags.join(' ')} ${s.cast.map((c) => c.name).join(' ')} ${HINTS[s.slug] ?? ''} ${s.rating}`, cover: s.cover, rating: s.rating, story: s, slug: s.slug })
    for (const t of TRIMZ) out.push({ id: t.slug, kind: 'watch', title: t.title, hint: t.summary, meta: 'TRIMZ SERIES', search: `${t.title} ${t.summary} trimz watch binge series`, cover: t.poster, glyph: '▶', href: trimzSeriesUrl(t.slug) })
    const go = (id: string, title: string, hint: string, search: string, x: Partial<Item>): Item => ({ id, kind: 'go', title, hint, meta: 'GO', search, glyph: '→', ...x })
    out.push(
      go('dealer', 'Match my world', 'Three answers, one scored match', 'dealer match quiz vibe deal choose cant decide', { hash: 'dealer' }),
      go('try', 'Try the playable teaser', 'Ninety seconds, no account', 'try demo teaser play sample', { hash: 'try' }),
      go('stories', 'Browse all worlds', 'The full shelf', 'all worlds grid browse shelf', { hash: 'stories' }),
      go('isekai', 'Play on IsekaiZero', 'SFW and 17+ worlds', 'isekai play account', { href: LINKS.isekaiProfile }),
      go('kage', 'Dare on KageSekai', 'The 18+ worlds', 'kage adult 18 dare', { href: LINKS.kageProfile }),
      go('youtube', 'Watch on YouTube', 'Trailers and process', 'youtube videos subscribe', { href: LINKS.youtube }),
    )
    return out
  }, [])

  const visible = useMemo(() => {
    const inF = (i: Item) => filter === 'all' ? true : filter === 'worlds' ? i.kind === 'world' : filter === 'watch' ? i.kind === 'watch' : filter === 'go' ? i.kind === 'go' : filter === 'safe' ? i.kind !== 'world' || i.rating !== '18+' : i.rating === '18+'
    const pool = items.filter(inF)
    if (!query.trim()) return pool
    return pool.map((i) => ({ i, s: score(i, query) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).map((x) => x.i)
  }, [items, filter, query])

  useEffect(() => setSel(0), [query, filter])
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [sel])

  const run = (item: Item, playNow = false) => {
    sfx('enter'); onClose(true)
    if (playNow && item.story) return window.open(storyUrl(item.story), '_blank', 'noreferrer')
    if (item.slug) return void navigate({ to: '/stories/$slug', params: { slug: item.slug }, search: item.saveSearch ?? {} })
    if (item.hash) return document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth' })
    if (item.href) window.open(item.href, '_blank', 'noreferrer')
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (visible.length) { sfx('nav'); setSel((s) => (e.key === 'ArrowDown' ? (s + 1) % visible.length : (s - 1 + visible.length) % visible.length)) } }
    else if (e.key === 'Enter' && visible[sel]) { e.preventDefault(); run(visible[sel], e.shiftKey) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[8vh] sm:pt-[12vh]" role="presentation" onClick={() => onClose()}>
      <div className="absolute inset-0 bg-void/85" aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Find a world, series or channel" className="kx-rise relative flex max-h-[82vh] w-full max-w-3xl flex-col border border-neon/60 bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.7)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-gamer text-xs text-neon">&gt; KX://FIND<span className="cursor" /> <span className="text-mute">every world, one input</span></p>
          <span className="flex items-center gap-3 font-gamer text-[11px] text-mute"><span aria-live="polite">{visible.length} found</span>
            <button type="button" onClick={() => onClose()} aria-label="Close finder" className="grid size-11 place-items-center border border-line text-ink hover:border-danger-ink hover:text-danger-ink">✕</button></span>
        </div>
        <div className="border-b border-line px-4 pt-4">
          <label htmlFor="kx-find" className="sr-only">Find a world, series or channel</label>
          <input ref={inputRef} id="kx-find" type="text" role="combobox" aria-expanded="true" aria-controls="kx-find-list" aria-activedescendant={visible[sel] ? `kx-opt-${sel}` : undefined}
            autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go" placeholder="Type a vibe, a world, a rating…"
            value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKey}
            className="w-full border border-line bg-void px-4 py-3.5 font-mono text-base text-ink placeholder:text-mute/70 focus:border-neon focus:outline-none" />
          <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter results">
            {FILTERS.map(([k, l]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => { sfx('tab'); setFilter(k) }} className={`inline-flex min-h-11 shrink-0 items-center border px-3 font-gamer text-[11px] uppercase ${filter === k ? 'border-neon bg-neon text-void' : 'border-line text-ink hover:border-neon hover:text-neon'}`}>{l}</button>)}
          </div>
        </div>
        <div ref={listRef} id="kx-find-list" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {visible.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="pixel font-pixel text-2xl text-ink">NO WORLD MATCHES “{query.toUpperCase()}”</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-mute">Try a mood: kaiju, comedy, spies, school, powers. Or let the Matchmaker pick.</p>
              <button type="button" onClick={() => { onClose(true); document.getElementById('dealer')?.scrollIntoView({ behavior: 'smooth' }) }} className="pixel mt-5 bg-neon px-5 py-3 font-gamer text-sm uppercase text-void hover:bg-ink">▶ Match my world</button>
            </div>
          ) : visible.map((item, idx) => (
            <div key={item.id} id={`kx-opt-${idx}`} role="option" aria-selected={idx === sel} onMouseMove={() => setSel(idx)}
              className={`flex items-stretch gap-1 border ${idx === sel ? 'border-neon bg-neon/10' : 'border-transparent'}`}>
              <button type="button" onClick={() => run(item)} className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left">
                {item.cover ? <img src={item.cover} alt="" loading="lazy" decoding="async" className="h-14 w-11 shrink-0 object-cover object-top" />
                  : <span aria-hidden className="grid h-14 w-11 shrink-0 place-items-center border border-line font-gamer text-sm text-neon">{item.glyph ?? '→'}</span>}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="truncate font-mono text-sm font-bold text-ink">{item.title}</span>
                    {item.rating && <span className={`px-1.5 py-0.5 font-gamer text-[9px] ${RATING(item.rating)}`}>{item.rating}</span>}</span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-mute">{item.hint}</span>
                  <span className="mt-1 block font-gamer text-[10px] uppercase text-mute">{item.story ? `♥ ${formatCount(countOf(live, item.story, 'likes'))} · ★ ${formatCount(countOf(live, item.story, 'saves'))} · ${formatCount(countOf(live, item.story, 'messages'))} MSG · ${item.meta}` : item.meta}</span>
                </span>
              </button>
              {item.story && <a href={storyUrl(item.story)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')} aria-label={`Play ${item.title} now`} className="m-1 inline-flex min-h-11 shrink-0 items-center self-center border border-neon px-3 font-gamer text-[11px] uppercase text-neon hover:bg-neon hover:text-void">Play →</a>}
            </div>
          ))}
        </div>
        <p className="kx-kbm-only flex gap-4 border-t border-line px-4 py-2.5 font-gamer text-[10px] uppercase text-mute"><span><span className="text-neon">↑↓</span> move</span><span><span className="text-neon">Enter</span> world file</span><span><span className="text-neon">Shift+Enter</span> play now</span><span><span className="text-neon">Esc</span> close</span></p>
      </div>
    </div>
  )
}
