import { useEffect, useRef, useState } from 'react'
import { storyPlatformName } from '#/data/content'
import type { Story } from '#/data/content'
import { countOf, useIskStats } from '#/lib/isk-stats'
import { renderStoryCard } from '#/lib/share-card'
import { play as sfx } from '#/lib/sfx'

// POSTER MAKER: turns the world you're looking at into a 1080x1350 card you can post.
// Drawn on the visitor's device, shared with the native sheet where the browser has one.

export function ShareCard({ story, onClose }: { story: Story; onClose: () => void }) {
  const live = useIskStats()
  const [src, setSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [note, setNote] = useState<string | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let alive = true
    setBusy(true)
    const stats = {
      messages: countOf(live, story, 'messages'),
      likes: countOf(live, story, 'likes'),
      saves: countOf(live, story, 'saves'),
      chats: countOf(live, story, 'chats'),
    }
    renderStoryCard(story, stats)
      .then((url) => {
        if (alive) {
          setSrc(url)
          setBusy(false)
        }
      })
      .catch(() => {
        if (alive) setBusy(false)
      })
    return () => {
      alive = false
    }
    // One card per world: the live numbers are snapshotted when it opens
  }, [story.slug])

  useEffect(() => {
    const before = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.documentElement.style.overflow = before
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const download = () => {
    if (!src) return
    sfx('enter')
    const a = document.createElement('a')
    a.href = src
    a.download = `kuletx-${story.slug}-card.png`
    a.click()
    setNote('Saved to your downloads')
  }

  const share = async () => {
    if (!src) return
    sfx('enter')
    try {
      const blob = await (await fetch(src)).blob()
      const file = new File([blob], `kuletx-${story.slug}-card.png`, { type: 'image/png' })
      const data = {
        files: [file],
        title: story.title,
        text: `${story.title} · ${story.hook} · play it on ${storyPlatformName(story)}`,
        url: window.location.href,
      }
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share(data)
        setNote('Shared')
      } else {
        download()
      }
    } catch {
      /* share sheet dismissed */
    }
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center overflow-y-auto p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="kx-card-title">
      <button type="button" tabIndex={-1} aria-label="Close poster maker" onClick={onClose} className="fixed inset-0 cursor-default bg-void/92 backdrop-blur-sm" />
      <div className="kx-find-panel relative my-auto w-full max-w-md border border-line bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <p id="kx-card-title" className="font-gamer text-[10px] uppercase text-neon">
            {'//'} Poster maker
            <span className="text-mute"> · 1080 × 1350</span>
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close poster maker"
            className="grid size-9 place-items-center border border-line font-gamer text-xs text-mute hover:border-danger-ink hover:text-danger-ink"
          >
            ✕
          </button>
        </div>

        <div className="p-3">
          {src ? (
            <img src={src} alt={`Share card for ${story.title}`} className="mx-auto block max-h-[58vh] w-auto max-w-full border border-line" />
          ) : (
            <div className="grid aspect-[4/5] place-items-center border border-dashed border-line bg-void">
              <p className="pixel font-pixel text-xl text-mute">{busy ? 'Rendering card' : 'No card'}<span className="cursor text-neon" /></p>
            </div>
          )}
        </div>

        <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={download}
            disabled={!src}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-neon px-3 font-gamer text-xs uppercase text-void hover:bg-ink disabled:opacity-50"
          >
            ⤓ Save PNG
          </button>
          <button
            type="button"
            onClick={() => void share()}
            disabled={!src}
            className="inline-flex min-h-12 items-center justify-center gap-2 border border-line px-3 font-gamer text-xs uppercase text-ink hover:border-neon hover:text-neon disabled:opacity-50"
          >
            ↗ Share card
          </button>
        </div>
        <p className="border-t border-line px-4 py-2 text-center font-mono text-[10px] text-mute/70">
          {note ?? 'Drawn on your device · the numbers are live from the platforms'}
        </p>
      </div>
    </div>
  )
}
