import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { STORIES, storyPlatformName, storyUrl } from '#/data/content'
import type { Story } from '#/data/content'
import { countOf, formatCount, useIskStats } from '#/lib/isk-stats'
import { readSave, saveLabel } from '#/lib/save-state'
import { readMatch } from '#/lib/match'
import type { Match } from '#/lib/match'
import { play as sfx } from '#/lib/sfx'

/**
 * Ship 4 — the Session Dock. Every section of the home page used to end in a
 * scroll. The dock keeps the single most likely next play pinned to the thumb:
 * your save state if you have one, your Matchmaker verdict if you took the
 * quiz, otherwise the world players are actually playing. Play, file, share,
 * dismiss. Nothing else competes with it down here.
 */

type DockState = { story: Story; reason: string; kind: 'save' | 'match' | 'hot' }

export function SessionDock() {
  const live = useIskStats()
  const [shown, setShown] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [saveSlug, setSaveSlug] = useState<string | null>(null)
  const [saveReason, setSaveReason] = useState('')
  const [match, setMatch] = useState<Match | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const save = readSave()
    if (save) {
      setSaveSlug(save.slug)
      setSaveReason(`Continue: you stopped at ${saveLabel(save)}`)
    }
    setMatch(readMatch())
    try { setDismissed(sessionStorage.getItem('kx_dock_closed') === '1') } catch { /* shown */ }
    const onScroll = () => setShown(window.scrollY > 560)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const onMatch = (e: Event) => {
      setMatch((e as CustomEvent<Match>).detail)
      setDismissed(false)
    }
    window.addEventListener('kx:match', onMatch)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('kx:match', onMatch)
    }
  }, [])

  const hot = STORIES.reduce((a, b) => (countOf(live, b, 'messages') > countOf(live, a, 'messages') ? b : a))
  const state: DockState | null = dismissed
    ? null
    : saveSlug && STORIES.find((s) => s.slug === saveSlug)
      ? { story: STORIES.find((s) => s.slug === saveSlug)!, reason: saveReason, kind: 'save' }
      : match && STORIES.find((s) => s.slug === match.slug)
        ? { story: STORIES.find((s) => s.slug === match!.slug)!, reason: match.why[0] ?? 'Your match', kind: 'match' }
        : { story: hot, reason: `Most played right now · ${formatCount(countOf(live, hot, 'messages'))} messages`, kind: 'hot' }

  const visible = shown && !!state
  useEffect(() => {
    if (!visible) return
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = '104px'
    return () => { document.body.style.paddingBottom = prev }
  }, [visible])

  if (!state || !visible) return null
  const { story, reason, kind } = state

  const share = async () => {
    const url = `${window.location.origin}/stories/${story.slug}`
    const data = { title: story.title, text: `${story.title} — ${story.logline}`, url }
    try {
      if (navigator.share) { await navigator.share(data); return }
      throw new Error('no share')
    } catch {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
        sfx('enter')
      } catch { /* clipboard blocked: the button just rests */ }
    }
  }
  const close = () => {
    sfx('back')
    setDismissed(true)
    try { sessionStorage.setItem('kx_dock_closed', '1') } catch { /* dismissed for this page only */ }
  }

  return (
    <aside aria-label="Your next session" className="kx-dock fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-6 sm:bottom-5 sm:w-[26rem]">
      <div className="flex items-center gap-3 border border-neon/50 bg-panel/95 p-3 shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
        <img src={story.tile ?? story.cover} alt="" decoding="async" className="h-14 w-11 shrink-0 object-cover object-top" />
        <div className="min-w-0 flex-1">
          <p className="font-gamer text-[9px] uppercase text-neon">
            {kind === 'save' ? '▣ Save state' : kind === 'match' ? '▸ Your match' : '▸ Next session'}
          </p>
          <p className="truncate font-mono text-sm font-bold text-ink">{story.title}</p>
          <p className="line-clamp-1 text-[11px] text-mute">{reason}</p>
        </div>
        <a href={storyUrl(story)} target="_blank" rel="noreferrer" onClick={() => sfx('enter')}
          className="pixel inline-flex min-h-11 shrink-0 items-center bg-neon px-3 font-gamer text-[11px] uppercase text-void hover:bg-ink">
          ▶ Play
        </a>
        <Link to="/stories/$slug" params={{ slug: story.slug }} onClick={() => sfx('nav')} aria-label={`Open the world file for ${story.title}`}
          className="hidden min-h-11 shrink-0 items-center border border-line px-2.5 font-gamer text-[10px] uppercase text-ink hover:border-neon hover:text-neon min-[420px]:inline-flex">
          File
        </Link>
        <button type="button" onClick={share} aria-label={`Share ${story.title} (${storyPlatformName(story)})`}
          className="grid size-11 shrink-0 place-items-center border border-line font-gamer text-xs text-mute hover:border-neon hover:text-neon">
          {copied ? '✓' : '↗'}
        </button>
        <button type="button" onClick={close} aria-label="Dismiss session dock"
          className="grid size-11 shrink-0 place-items-center border border-line font-gamer text-xs text-mute hover:border-danger-ink hover:text-danger-ink">
          ✕
        </button>
      </div>
      {copied && <p className="mt-1 text-right font-gamer text-[10px] uppercase text-neon" role="status">Link copied · send it to a friend</p>}
    </aside>
  )
}
