// Spatial focus for a controller on ordinary pages: move to the nearest control in a direction.

export type Dir = 'up' | 'down' | 'left' | 'right'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** The open modal dialog if there is one, so focus never leaves it, otherwise the whole page. */
export function focusScope(): ParentNode {
  const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')
  return dialogs[dialogs.length - 1] ?? document
}

function candidates(scope: ParentNode) {
  return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    if (el.tabIndex < 0 || el.closest('[aria-hidden="true"], [inert]')) return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
  })
}

/** Focus the best control in that direction; with nothing focused, the first one on screen. */
export function moveFocus(dir: Dir, calm: boolean) {
  const scope = focusScope()
  const all = candidates(scope)
  const current = document.activeElement instanceof HTMLElement && all.includes(document.activeElement) ? document.activeElement : null
  if (!current) {
    const onScreen = all.find((el) => {
      const r = el.getBoundingClientRect()
      return r.top >= 0 && r.bottom <= window.innerHeight
    })
    return focusEl(onScreen ?? all[0], calm)
  }
  const others = all.filter((el) => el !== current && !el.contains(current) && !current.contains(el))
  const i = pickNext(current.getBoundingClientRect(), others.map((el) => el.getBoundingClientRect()), dir)
  const best = i < 0 ? undefined : others[i]
  if (best) focusEl(best, calm)
}

type Box = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right' | 'width' | 'height'>

/** Index of the box to move to from `from` in direction `dir`, or -1. Pure, so it can be tested without a browser. */
export function pickNext(from: Box, boxes: Box[], dir: Dir) {
  const cx = from.left + from.width / 2
  const cy = from.top + from.height / 2
  let best = -1
  let bestScore = Infinity
  boxes.forEach((r, i) => {
    // Edge-to-edge distance along the direction, so a wide neighbour isn't skipped for a far one that lines up
    const main = dir === 'down' ? r.top - from.bottom : dir === 'up' ? from.top - r.bottom : dir === 'right' ? r.left - from.right : from.left - r.right
    if (main < -4) return
    const cross = dir === 'up' || dir === 'down' ? Math.abs(r.left + r.width / 2 - cx) : Math.abs(r.top + r.height / 2 - cy)
    const score = Math.max(0, main) + cross * 2
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}

export function focusEl(el: HTMLElement | undefined, calm: boolean) {
  if (!el) return
  el.focus({ preventScroll: true, focusVisible: true } as FocusOptions)
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: calm ? 'auto' : 'smooth' })
}
