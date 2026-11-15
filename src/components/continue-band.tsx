import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { STORIES } from '#/data/content'
import { agoLabel, clearSave, readSave, resumeSearch, saveLabel } from '#/lib/save-state'
import type { SaveState } from '#/lib/save-state'
import { play as sfx } from '#/lib/sfx'

/**
 * SAVE STATE — the console remembers you. Returning players are greeted
 * with a CONTINUE band between the hero and the grid: last world, last
 * section, one tap (or the R key) to resume. Invisible to first-time
 * visitors and to anyone who erases their slot. One memory card.
 */
export function ContinueBand() {
  const [save, setSave] = useState<SaveState | null>(null)
  const navigate = useNavigate()

  // Client-only: SSR renders nothing, the band fades in after mount for returning players
  useEffect(() => setSave(readSave()), [])

  // R resumes from anywhere on the home page
  useEffect(() => {
    if (!save) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.key.toLowerCase() !== 'r') return
      const t = e.target as HTMLElement | null
      if (t && /^(input|textarea|select)$/i.test(t.tagName)) return
      e.preventDefault()
      sfx('enter')
      void navigate({ to: '/stories/$slug', params: { slug: save.slug }, search: resumeSearch(save) })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save, navigate])

  if (!save) return null
  const story = STORIES.find((s) => s.slug === save.slug)
  if (!story) return null

  const search = resumeSearch(save)

  return (
    <aside aria-label="Resume your last session" className="kx-saveband relative overflow-hidden border-b border-warn/50 bg-void">
      {/* The world's art bleeds in from the right, dissolved into the dark */}
      <img
        src={story.cover}
        alt=""
        aria-hidden
        decoding="async"
        className="pointer-events-none absolute top-1/2 right-0 h-[230%] -translate-y-1/2 object-contain object-right opacity-70 [mask-image:linear-gradient(to_left,black_0%,transparent_75%)] sm:h-[280%]"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-void via-void/85 to-void/10" aria-hidden />
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-warn" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <Link to="/stories/$slug" params={{ slug: save.slug }} search={search} onClick={() => sfx('enter')} className="group min-w-0" title={`Resume ${story.title}`}>
          <p className="font-gamer text-[10px] uppercase text-warn">
            ▣ Save state<span className="text-mute"> // memory card</span>
          </p>
          <p className="pixel mt-1.5 line-clamp-1 font-pixel text-lg leading-none text-ink transition-colors group-hover:text-warn sm:text-2xl">
            {story.title}
          </p>
          <p className="mt-1.5 truncate font-mono text-[11px] text-mute">
            you stopped at <span className="text-ink">{saveLabel(save)}</span> · {agoLabel(save.at)}
          </p>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/stories/$slug"
            params={{ slug: save.slug }}
            search={search}
            onClick={() => sfx('enter')}
            className="pixel flex items-center gap-2 border-2 border-warn bg-warn px-4 py-3 font-gamer text-xs uppercase text-void transition-colors hover:border-ink hover:bg-ink sm:px-6 sm:text-sm"
          >
            Resume
            <kbd className="hidden border border-void/50 bg-void px-1.5 py-0.5 font-gamer text-[10px] text-warn sm:inline-block">R</kbd>
          </Link>
          <button
            type="button"
            onClick={() => {
              sfx('back')
              clearSave()
              setSave(null)
            }}
            aria-label="Erase save state"
            title="Erase save state — start fresh"
            className="grid size-9 shrink-0 place-items-center border border-line font-gamer text-sm text-mute transition-colors hover:border-danger hover:text-danger"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="kx-saveband-scan pointer-events-none absolute inset-y-0 w-24" aria-hidden />
    </aside>
  )
}
