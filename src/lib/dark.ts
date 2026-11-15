import { useSyncExternalStore } from 'react'

/** Dark surfaces for the story hub. On unless the visitor switched it off. */
const KEY = 'kx_dark'

// Runs before first paint so the hub never flashes the lighter glass
export const DARK_HEAD_SCRIPT = `try{if(localStorage.getItem('${KEY}')!=='off')document.documentElement.classList.add('kx-dark')}catch(e){document.documentElement.classList.add('kx-dark')}`

const listeners = new Set<() => void>()
const read = () => (typeof document === 'undefined' ? true : document.documentElement.classList.contains('kx-dark'))

export function setDark(on: boolean) {
  document.documentElement.classList.toggle('kx-dark', on)
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {}
  listeners.forEach((l) => l())
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useDark() {
  return useSyncExternalStore(subscribe, read, () => true)
}
