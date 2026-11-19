import { useEffect } from 'react'

// Dark browser chrome on hub pages (background, scrollbar, overscroll, selection), set before first paint.

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
