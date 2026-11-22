import { useRef } from 'react'
import type { PadButton } from '#/lib/gamepad'
import { PAD_LABEL, useGamepad } from '#/lib/gamepad'
import { KeyLabel } from '#/components/pad-glyph'
import { openFinder } from '#/components/world-finder'
import { openControls } from '#/components/controls-sheet'
import { focusEl, focusScope, moveFocus } from '#/lib/spatial'
import { isMuted, play as sfx, setMuted } from '#/lib/sfx'

// Controller support for the home page: the D-pad moves focus, A selects, B backs out, LB/RB jump sections.

const SECTIONS = ['top', 'stories', 'dealer', 'trimz', 'watch']

const calm = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('kx-still')

// Inside a dialog (the finder, the controls sheet) the pad speaks the keys the dialog already understands
function keyToFocused(key: string) {
  const target = document.activeElement instanceof HTMLElement ? document.activeElement : document.body
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

function jumpSection(step: number) {
  const els = SECTIONS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
  const y = window.innerHeight * 0.3
  const at = els.reduce((acc, el, i) => (el.getBoundingClientRect().top <= y ? i : acc), 0)
  const next = els[Math.min(els.length - 1, Math.max(0, at + step))]
  if (!next) return
  next.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' })
  const first = next.querySelector<HTMLElement>('a[href], button:not([disabled])')
  if (first) focusEl(first, true)
}

export function HomePad() {
  const lastNav = useRef(0)
  const pad = useGamepad(
    (b: PadButton) => {
      const inDialog = focusScope() !== document
      const dir = b === 'up' || b === 'down' || b === 'left' || b === 'right' ? b : null
      if (inDialog) {
        if (dir === 'up') keyToFocused('ArrowUp')
        else if (dir === 'down') keyToFocused('ArrowDown')
        else if (dir) moveFocus(dir, true)
        else if (b === 'a') {
          const el = document.activeElement
          if (el instanceof HTMLInputElement) keyToFocused('Enter')
          else if (el instanceof HTMLElement) el.click()
        } else if (b === 'b' || b === 'start') keyToFocused('Escape')
        return
      }
      if (dir) {
        const now = performance.now()
        if (now - lastNav.current > 40) sfx('nav')
        lastNav.current = now
        moveFocus(dir, calm())
      } else if (b === 'a') {
        const el = document.activeElement
        if (el instanceof HTMLElement && el !== document.body) el.click()
        else moveFocus('down', calm())
      } else if (b === 'b') {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
      } else if (b === 'x') openFinder()
      else if (b === 'y') {
        const next = !isMuted()
        setMuted(next)
        if (!next) sfx('nav')
      } else if (b === 'lb' || b === 'rb') {
        sfx('tab')
        jumpSection(b === 'lb' ? -1 : 1)
      } else if (b === 'start') openControls()
    },
    (dy) => window.scrollBy(0, dy),
  )

  if (!pad.connected) return null
  const l = PAD_LABEL[pad.kind]
  const hints: [string[], string][] = [
    [['◀', '▶'], 'Move'],
    [[l.a], 'Select'],
    [[l.x], 'Find'],
    [[l.lb, l.rb], 'Section'],
  ]
  return (
    <div className="kx-pad-legend pointer-events-none fixed right-3 bottom-3 z-30 hidden items-center gap-3 border border-line bg-void/90 px-3 py-2 font-gamer text-[10px] uppercase text-mute sm:flex" aria-hidden>
      {hints.map(([keys, label]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          {keys.map((k) => (
            <span key={k} className="ps5-key ps5-key-sm">
              <KeyLabel k={k} />
            </span>
          ))}
          {label}
        </span>
      ))}
    </div>
  )
}
