import { useEffect } from 'react'

/**
 * THE BROWSER CHROME, ON A HUB PAGE.
 *
 * Everything else about the hub is dark and deliberate, but the browser's own furniture was not: <body> is the
 * homepage's near-black green, the scrollbar is the OS default (light, on a page that hides every other scrollbar),
 * overscroll bounces white, and selecting text flashes neon green. Those are the moments a console UI reads as a
 * website instead of a console.
 *
 * The attribute is set before first paint, from the route's own head script, so the background never flashes the
 * homepage colour on the way in. The hook keeps it in sync on client-side navigation and clears it on the way out.
 */

// Any /stories path: the hub, and the trophy list that belongs to it. Both are console surfaces.
export const HUB_HEAD_SCRIPT = `try{var p=location.pathname;if(p==='/stories'||p.indexOf('/stories/')===0)document.documentElement.setAttribute('data-hub','')}catch(e){}`

const ATTR = 'data-hub'

export function useHubTheme() {
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute(ATTR, '')
    return () => root.removeAttribute(ATTR)
  }, [])
}
