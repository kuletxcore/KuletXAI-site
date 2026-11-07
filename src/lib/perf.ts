import { useSyncExternalStore } from 'react'

/**
 * Lite graphics for older PCs: still backgrounds instead of video, no blur
 * effects, no start-screen WebGL scene, no tile resize animation.
 *
 * Mode is "auto" unless the visitor picks one in the settings menu. Auto turns
 * Lite on when the GPU is an old integrated chip (Intel HD / GMA) or a software
 * renderer, or when the page measures a low frame rate. The <html> class
 * `kx-lite` drives the CSS; PERF_HEAD_SCRIPT sets it before first paint so a
 * returning visitor never starts the heavy version at all.
 */

export type PerfMode = 'auto' | 'lite' | 'full'

const MODE_KEY = 'kx_perf'
const AUTO_KEY = 'kx_auto_lite' // '1' once auto mode decided this device needs Lite

export const PERF_HEAD_SCRIPT = `try{var m=localStorage.getItem('${MODE_KEY}');if(m==='lite'||(m!=='full'&&localStorage.getItem('${AUTO_KEY}')==='1'))document.documentElement.classList.add('kx-lite')}catch(e){}`

let mode: PerfMode = 'auto'
let autoLite = false
let lite = false
const listeners = new Set<() => void>()

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* not persisted */
  }
}

function apply() {
  const next = mode === 'lite' || (mode === 'auto' && autoLite)
  if (next === lite) return
  lite = next
  document.documentElement.classList.toggle('kx-lite', lite)
  listeners.forEach((l) => l())
}

/** Old integrated GPUs and software renderers that struggle with video + blur. */
const WEAK_GPU = /intel(\(r\))? hd graphics(?! [5-6]\d\d)|\bgma\b|mobile intel|swiftshader|llvmpipe|softpipe|software|basic render/i

function weakGpu() {
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return true // no WebGL at all: very old or blocklisted GPU
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return WEAK_GPU.test(renderer)
  } catch {
    return false
  }
}

function markAutoLite() {
  autoLite = true
  write(AUTO_KEY, '1')
  apply()
}

if (typeof window !== 'undefined') {
  const saved = read(MODE_KEY)
  mode = saved === 'lite' || saved === 'full' ? saved : 'auto'
  autoLite = read(AUTO_KEY) === '1'
  lite = document.documentElement.classList.contains('kx-lite')
  if (mode === 'auto' && !autoLite && weakGpu()) markAutoLite()
  apply()
}

/**
 * Auto mode safety net: sample the frame rate once the page has settled and
 * switch to Lite if it's consistently low. Runs once per page load; skipped
 * while the tab is hidden or the start screen is up.
 */
export function watchFrameRate() {
  if (typeof window === 'undefined' || mode !== 'auto' || lite) return () => {}
  let raf = 0
  let timer = window.setTimeout(function sample() {
    if (document.hidden || window.__kxBootActive) {
      timer = window.setTimeout(sample, 2000)
      return
    }
    const gaps: number[] = []
    let last = 0
    const start = performance.now()
    const frame = (now: number) => {
      if (last) gaps.push(now - last)
      last = now
      if (document.hidden) return // tab hidden mid-sample: give up for this load
      if (now - start < 2500) {
        raf = requestAnimationFrame(frame)
        return
      }
      gaps.sort((a, b) => a - b)
      const median = gaps[gaps.length >> 1] ?? 0
      if (gaps.length > 10 && median > 34) markAutoLite() // under ~30 fps most of the time
    }
    raf = requestAnimationFrame(frame)
  }, 4000)
  return () => {
    clearTimeout(timer)
    cancelAnimationFrame(raf)
  }
}

export function isLite() {
  return lite
}

export function setPerfMode(next: PerfMode) {
  mode = next
  write(MODE_KEY, next)
  if (next === 'auto') {
    autoLite = read(AUTO_KEY) === '1'
    if (!autoLite && weakGpu()) markAutoLite()
  }
  apply()
  listeners.forEach((l) => l()) // mode itself changed even if lite didn't
}

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function useLite() {
  return useSyncExternalStore(subscribe, () => lite, () => false)
}

/** Current mode plus whether auto mode picked Lite on this device. */
export function usePerfMode() {
  const m = useSyncExternalStore(subscribe, () => mode, () => 'auto' as PerfMode)
  const auto = useSyncExternalStore(subscribe, () => autoLite, () => false)
  return { mode: m, autoLite: auto }
}
