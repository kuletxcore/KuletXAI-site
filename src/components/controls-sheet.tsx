import { useEffect, useState } from 'react'
import { KeyLabel } from '#/components/pad-glyph'
import { PAD_LABEL, usePadInfo } from '#/lib/gamepad'
import { play as sfx } from '#/lib/sfx'

// THE CONTROLS SHEET: the whole machine's keyboard and controller map in one place, on ? or from the footer.
// Prompts follow the pad you actually have plugged in (src/components/pad-glyph.tsx).

export const openControls = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('kx:controls'))
}

type Row = { keys: string[]; label: string }

const ANYWHERE: Row[] = [
  { keys: ['/'], label: 'Find a world, character, series or command' },
  { keys: ['⌘K'], label: 'Same, from anywhere on the site' },
  { keys: ['?'], label: 'This sheet' },
  { keys: ['Esc'], label: 'Close a card, the finder or this sheet' },
]

const HOME: Row[] = [
  { keys: ['R'], label: 'Resume the world you left off in' },
  { keys: ['←', '→'], label: 'Move along the world shelf' },
  { keys: ['Enter'], label: 'Open the focused world' },
  { keys: ['Space'], label: 'Scroll the page' },
]

const HUB: Row[] = [
  { keys: ['←', '→'], label: 'Previous or next world' },
  { keys: ['↑', '↓'], label: 'Move between sections' },
  { keys: ['1', '…', '8'], label: 'Jump to a section' },
  { keys: ['Q', 'E'], label: 'Switch tab: story, series, video' },
  { keys: ['Enter'], label: 'Play the world, series or video' },
]

const PAD: Row[] = [
  { keys: ['◀', '▶'], label: 'Worlds, characters and gallery items' },
  { keys: ['▲', '▼'], label: 'Sections' },
  { keys: ['A'], label: 'Play or open' },
  { keys: ['B'], label: 'Back' },
  { keys: ['X'], label: 'Enter the open section' },
  { keys: ['Y'], label: 'Sound on or off' },
  { keys: ['LB', 'RB'], label: 'Tabs' },
  { keys: ['LS'], label: 'Scroll' },
]

export function ControlsSheet() {
  const [open, setOpen] = useState(false)
  const pad = usePadInfo()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable)
      if (!typing && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (open && e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
      }
    }
    const onAsk = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('kx:controls', onAsk)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('kx:controls', onAsk)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const root = document.documentElement
    const before = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = before
    }
  }, [open])

  if (!open) return null
  const close = () => {
    sfx('back')
    setOpen(false)
  }

  // The pad half follows the controller that is actually connected
  const labels = PAD_LABEL[pad.kind]
  const padRows: Row[] = pad.connected
    ? PAD.map((r) => ({
        ...r,
        keys: r.keys.map((k) => (k === 'A' ? labels.a : k === 'B' ? labels.b : k === 'X' ? labels.x : k === 'Y' ? labels.y : k === 'LB' ? labels.lb : k === 'RB' ? labels.rb : k)),
      }))
    : []

  return (
    <div className="fixed inset-0 z-[68] flex items-start justify-center overflow-y-auto p-3 pt-[6vh] sm:p-6 sm:pt-[9vh]" role="dialog" aria-modal="true" aria-labelledby="kx-controls-title">
      <button type="button" tabIndex={-1} aria-label="Close controls" onClick={close} className="fixed inset-0 cursor-default bg-void/92 backdrop-blur-sm" />
      <div className="kx-find-panel relative w-full max-w-3xl border border-line bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-void/60 px-4 py-2.5">
          <p id="kx-controls-title" className="font-gamer text-[10px] uppercase text-neon">
            {'//'} Controls <span className="text-mute">· keyboard{pad.connected ? ' + controller' : ''}</span>
          </p>
          <button type="button" onClick={close} aria-label="Close controls" className="grid size-9 place-items-center border border-line font-gamer text-xs text-mute hover:border-danger-ink hover:text-danger-ink">
            ✕
          </button>
        </div>

        <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-5">
          <Block title="Anywhere" rows={ANYWHERE} />
          <Block title="Home" rows={HOME} />
          <Block title="Story hub" rows={HUB} />
          {pad.connected ? (
            <Block title={`Your controller · ${pad.model ?? pad.kind}`} rows={padRows} />
          ) : (
            <div>
              <p className="font-gamer text-[10px] uppercase text-mute">Controller</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Plug in a pad and press any button. Every screen works with PlayStation, Xbox and Switch controllers, and
                with the Infinix GT NX in split mode.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-line px-4 py-2.5 font-mono text-[10px] text-mute/80">
          Settings live in the story hub's sound panel: sound, lite graphics and dark surfaces. The home page's
          <span className="text-ink"> Pause motion </span> button stops everything that loops.
        </div>
      </div>
    </div>
  )
}

function Block({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div>
      <p className="font-gamer text-[10px] uppercase text-mute">{title}</p>
      <dl className="mt-2 divide-y divide-line/70 border-t border-line/70">
        {rows.map((r) => (
          <div key={`${title}-${r.label}`} className="flex items-center justify-between gap-3 py-1.5">
            <dt className="flex shrink-0 items-center gap-1">
              {r.keys.map((k) => (
                <kbd
                  key={k}
                  className="inline-flex min-h-7 min-w-7 items-center justify-center border border-line bg-void px-1.5 font-gamer text-[10px] text-ink"
                >
                  {/^[A-Z]{1,2}$|^(LS|LB|RB|LT|RT)$/.test(k) || /^[✕○□△◀▶▲▼]$/.test(k) ? <KeyLabel k={k} /> : k}
                </kbd>
              ))}
            </dt>
            <dd className="min-w-0 text-right text-xs leading-snug text-mute">{r.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
