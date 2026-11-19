import { useEffect, useState } from 'react'
import { KeyLabel } from '#/components/pad-glyph'
import { PAD_LABEL, usePadInfo } from '#/lib/gamepad'
import type { PadKind } from '#/lib/gamepad'
import { play as sfx } from '#/lib/sfx'

// Every shortcut as an action, with the keys and the connected pad's buttons that do it. Opens on ? or from the footer.

export const openControls = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('kx:controls'))
}

type Btn = 'a' | 'b' | 'x' | 'y' | 'lb' | 'rb'
// A pad entry is a face or shoulder button (named per controller below) or a fixed glyph such as the D-pad
type PadKey = Btn | '◀' | '▶' | '▲' | '▼' | 'LS'
type Row = { label: string; keys?: string[]; pad?: PadKey[] }

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

const GROUPS = (mod: string): { title: string; rows: Row[] }[] => [
  {
    title: 'Anywhere',
    rows: [
      { label: 'Find a world (home page)', keys: ['/'], pad: ['x'] },
      { label: 'Find, even while typing (home page)', keys: [mod, 'K'] },
      { label: 'This sheet', keys: ['?'] },
      { label: 'Close a card, the finder or this sheet', keys: ['Esc'], pad: ['b'] },
    ],
  },
  {
    title: 'Home',
    rows: [
      { label: 'Resume the world you left off in', keys: ['R'] },
      { label: 'Move to the next control', keys: ['Tab'], pad: ['◀', '▶'] },
      { label: 'Select it', keys: ['Enter'], pad: ['a'] },
      { label: 'Jump between sections', pad: ['lb', 'rb'] },
      { label: 'Scroll', pad: ['LS'] },
    ],
  },
  {
    title: 'Story hub',
    rows: [
      { label: 'Previous or next world', keys: ['←', '→'], pad: ['◀', '▶'] },
      { label: 'Move between sections', keys: ['↑', '↓'], pad: ['▲', '▼'] },
      { label: 'Jump to section 1 to 8', keys: ['1', '8'] },
      { label: 'Switch tab: story, series, video', keys: ['Q', 'E'], pad: ['lb', 'rb'] },
      { label: 'Play the world, series or video', keys: ['Enter'], pad: ['a'] },
      { label: 'Open the selected section', pad: ['x'] },
      { label: 'Unredact the intro card', keys: ['R'], pad: ['x'] },
      { label: 'Sound on or off', pad: ['y'] },
      { label: 'Back to the home page', pad: ['b'] },
      { label: 'Scroll', pad: ['LS'] },
    ],
  },
]

const KIND_NAME: Record<PadKind, string> = { xbox: 'Xbox controller', playstation: 'PlayStation controller', switch: 'Switch controller', gtnx: 'GT NX', generic: 'controller' }
const BTNS = new Set<string>(['a', 'b', 'x', 'y', 'lb', 'rb'])
const padGlyph = (k: PadKey, kind: PadKind) => (BTNS.has(k) ? PAD_LABEL[kind][k as Btn] : k)

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
  // Same test as the CSS that hides keyboard hints: no fine pointer that can hover means a touch screen
  const touch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches
  const close = () => {
    sfx('back')
    setOpen(false)
  }

  // Rows that only a controller can do are hidden until one is connected
  const groups = GROUPS(MAC ? '⌘' : 'Ctrl')
    .map((g) => ({ ...g, rows: g.rows.filter((r) => r.keys || pad.connected) }))
    .filter((g) => g.rows.length)

  return (
    <div className="fixed inset-0 z-[68] flex items-start justify-center overflow-y-auto p-3 pt-[6vh] sm:p-6 sm:pt-[9vh]" role="dialog" aria-modal="true" aria-labelledby="kx-controls-title">
      <button type="button" tabIndex={-1} aria-label="Close controls" onClick={close} className="fixed inset-0 cursor-default bg-void/92 backdrop-blur-sm" />
      <div className="kx-find-panel relative w-full max-w-3xl border border-line bg-panel shadow-[0_40px_120px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between gap-3 border-b border-line bg-void/60 px-4 py-2.5">
          <p id="kx-controls-title" className="font-gamer text-[10px] uppercase text-neon">
            {'//'} Controls{' '}
            <span className="text-mute">
              · {touch ? 'touch' : 'keyboard'}
              {pad.connected ? ` and ${pad.model ?? KIND_NAME[pad.kind]}` : ''}
            </span>
          </p>
          <button type="button" onClick={close} aria-label="Close controls" className="grid size-11 place-items-center border border-line font-gamer text-xs text-mute hover:border-danger-ink hover:text-danger-ink">
            ✕
          </button>
        </div>

        <p className="kx-touch-only border-b border-line px-4 py-3 text-sm leading-relaxed text-mute">
          Tap anything and swipe the world shelf. Every action has an on-screen button, so there's nothing to learn.
        </p>

        <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-5">
          {groups.map((g) => (
            <div key={g.title} className={`${g.title === 'Story hub' ? 'sm:row-span-2' : ''} ${g.rows.some((r) => r.pad && pad.connected) ? '' : 'kx-kbm-only'}`}>
              <p className="font-gamer text-[10px] uppercase text-mute">{g.title}</p>
              <dl className="mt-2 divide-y divide-line/70 border-t border-line/70">
                {g.rows.map((r) => (
                  <div key={`${g.title}-${r.label}`} className={`flex items-center justify-between gap-3 py-1.5 ${r.pad && pad.connected ? '' : 'kx-kbm-only'}`}>
                    <dt className="flex shrink-0 items-center gap-2">
                      {r.keys && (
                        <span className="kx-kbm-only flex items-center gap-0.5" aria-label={`Keys: ${r.keys.join(' ')}`}>
                          {r.keys.map((k) => (
                            <span key={k} className="ps5-key">
                              <KeyLabel k={k} keyboard />
                            </span>
                          ))}
                        </span>
                      )}
                      {r.keys && r.pad && pad.connected && <span className="kx-kbm-only text-[10px] text-mute">or</span>}
                      {r.pad && pad.connected && (
                        <span className="flex items-center gap-0.5">
                          {r.pad.map((k) => (
                            <span key={k} className="ps5-key">
                              <KeyLabel k={padGlyph(k, pad.kind)} />
                            </span>
                          ))}
                        </span>
                      )}
                    </dt>
                    <dd className="min-w-0 text-right text-xs leading-snug text-mute">{r.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
          {!pad.connected && (
            <div>
              <p className="font-gamer text-[10px] uppercase text-mute">Controller</p>
              <p className="mt-2 text-sm leading-relaxed text-mute">
                Connect any controller and press a button: the story hub works with all of it, and this sheet shows your
                pad's own buttons.
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
