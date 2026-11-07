/**
 * Retargetable smooth scrolling for controller and arrow-key navigation.
 *
 * The browser's own smooth scroll restarts from zero speed every time it is
 * called, so a held D-pad (a new target every ~50–140ms) stutters. A glide
 * here keeps its momentum and just moves its target: each frame it covers a
 * fixed share of the remaining distance, measured in real time so it feels the
 * same at 60Hz and 120Hz.
 */
type Scroller = Element | Window

const TAU_MS = 40 // time constant: ~95% of the way in about 120ms

const glides = new Map<Scroller, { target: number; raf: number; last: number }>()

const isWindow = (s: Scroller): s is Window => s === window

const getTop = (s: Scroller) => (isWindow(s) ? window.scrollY : (s as Element).scrollTop)
const maxTop = (s: Scroller) =>
  isWindow(s) ? document.documentElement.scrollHeight - window.innerHeight : (s as Element).scrollHeight - (s as Element).clientHeight

// 'instant' skips the page's CSS `scroll-behavior: smooth`, which would fight each frame
const setTop = (s: Scroller, top: number) => (isWindow(s) ? window.scrollTo({ top, behavior: 'instant' }) : s.scrollTo({ top, behavior: 'instant' }))

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Glide `scroller` to `top` (clamped), continuing any glide already running. */
export function glideTo(scroller: Scroller, top: number) {
  const target = Math.max(0, Math.min(maxTop(scroller), Math.round(top)))
  if (reducedMotion()) {
    stopGlide(scroller)
    setTop(scroller, target)
    return
  }
  const running = glides.get(scroller)
  if (running) {
    running.target = target
    return
  }
  const g = { target, raf: 0, last: performance.now() }
  const step = (now: number) => {
    const dt = Math.min(64, now - g.last)
    g.last = now
    const cur = getTop(scroller)
    const left = g.target - cur
    if (Math.abs(left) < 0.75) {
      setTop(scroller, g.target)
      glides.delete(scroller)
      return
    }
    const move = left * (1 - Math.exp(-dt / TAU_MS))
    // Always move at least a pixel so the glide can't stall on sub-pixel steps
    setTop(scroller, cur + (Math.abs(move) < 1 ? Math.sign(left) : move))
    g.raf = requestAnimationFrame(step)
  }
  g.raf = requestAnimationFrame(step)
  glides.set(scroller, g)
}

export function stopGlide(scroller: Scroller) {
  const g = glides.get(scroller)
  if (g) cancelAnimationFrame(g.raf)
  glides.delete(scroller)
}

/** Stop every glide (the stick or a touch takes over). */
export function stopAllGlides() {
  for (const s of [...glides.keys()]) stopGlide(s)
}

function scrollParent(el: Element): Element | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1) return p
  }
  return null
}

/**
 * Like scrollIntoView({ block: 'nearest' }), gliding: the nearest scrolling
 * box first (e.g. the section panel), then the page. `margin` keeps a little
 * room around the item.
 */
export function glideIntoView(el: Element, margin = 12) {
  const box = scrollParent(el)
  let r = el.getBoundingClientRect()
  if (box) {
    const b = box.getBoundingClientRect()
    const target = glides.get(box)?.target ?? box.scrollTop
    // Position relative to where the box is heading, not where it is mid-glide
    const offset = target - box.scrollTop
    const top = r.top - offset
    const bottom = r.bottom - offset
    if (top < b.top + margin) glideTo(box, target - (b.top + margin - top))
    else if (bottom > b.bottom - margin) glideTo(box, target + (bottom - (b.bottom - margin)))
    r = box.getBoundingClientRect() // then make sure the box itself is on screen
  }
  const target = glides.get(window)?.target ?? window.scrollY
  const offset = target - window.scrollY
  const top = r.top - offset
  const bottom = r.bottom - offset
  const room = window.innerHeight - margin
  if (top < margin) glideTo(window, target - (margin - top))
  else if (bottom > room) glideTo(window, target + Math.min(bottom - room, top - margin))
}

// A finger or wheel on the page wins over any glide in progress
if (typeof window !== 'undefined') {
  for (const ev of ['wheel', 'touchstart'] as const) window.addEventListener(ev, stopAllGlides, { passive: true, capture: true })
}
