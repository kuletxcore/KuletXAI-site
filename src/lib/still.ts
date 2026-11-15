import { useSyncExternalStore } from 'react'

/** "Pause motion" on the home page: stops the looping wall, cursor and posters for this browser. */
const KEY = 'kx_still'

export const STILL_HEAD_SCRIPT = `try{if(localStorage.getItem('${KEY}')==='on')document.documentElement.classList.add('kx-still')}catch(e){}`

const listeners = new Set<() => void>()
const read = () => (typeof document === 'undefined' ? false : document.documentElement.classList.contains('kx-still'))

export function setStill(on: boolean) {
  document.documentElement.classList.toggle('kx-still', on)
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

export function useStill() {
  return useSyncExternalStore(subscribe, read, () => false)
}
