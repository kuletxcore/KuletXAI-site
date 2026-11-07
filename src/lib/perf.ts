import { useSyncExternalStore } from 'react'

/**
 * Lite graphics for older PCs: still backgrounds instead of video, no blur
 * effects, no start-screen WebGL scene, no tile resize animation.
 *
 * Mode is "auto" unless the visitor picks one in the settings menu. Auto judges
 * the device first (graphics chip, memory, CPU, Data Saver), then confirms with
 * a frame-rate check once the hub has settled: Lite only if two checks are slow.
 * The <html> class `kx-lite` drives the CSS; PERF_HEAD_SCRIPT sets it before
 * first paint so a returning visitor never starts the heavy version at all.
 */

export type PerfMode = 'auto' | 'lite' | 'full'
/** Why auto mode chose Lite. 'data' is live (Data Saver), the rest are remembered. */
export type LiteReason = 'gpu' | 'memory' | 'cpu' | 'fps' | 'data'

const MODE_KEY = 'kx_perf'
const VERDICT_KEY = 'kx_lite_auto' // a LiteReason once auto mode decided this device needs Lite
const SLOW_KEY = 'kx_slow_checks' // slow frame checks in a row, carried across visits
const HW_OK_KEY = 'kx_hw_ok' // when the hardware last passed, so the WebGL probe isn't redone every load
const HW_OK_FOR = 7 * 24 * 3600e3
const LEGACY_KEY = 'kx_auto_lite' // old one-shot verdict, dropped so every device is judged again

export const PERF_HEAD_SCRIPT = `try{var s=localStorage,m=s.getItem('${MODE_KEY}'),c=navigator.connection;if(m==='lite'||(m!=='full'&&(s.getItem('${VERDICT_KEY}')||(c&&c.saveData))))document.documentElement.classList.add('kx-lite')}catch(e){}`

let mode: PerfMode = 'auto'
let reason: LiteReason | null = null
let lite = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

const read = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k)
    else localStorage.setItem(k, v)
  } catch {
    /* not persisted */
  }
}

function apply() {
  const next = mode === 'lite' || (mode === 'auto' && reason !== null)
  if (next === lite) return
  lite = next
  document.documentElement.classList.toggle('kx-lite', lite)
  notify()
}

/** Old integrated GPUs and software renderers that struggle with video + blur. */
const WEAK_GPU = /intel(\(r\))? hd graphics|\bgma\b|mobile intel|swiftshader|llvmpipe|softpipe|\bsoftware\b|basic render/i
/** Phone and tablet GPUs from roughly 2014 and earlier. */
const OLD_MOBILE_GPU = /mali-(4\d\d|t6\d\d)|adreno( \(tm\))? [234]\d\d\b|powervr sgx/i

function gpuIsWeak() {
  try {
    // Null here with WebGL still available means the browser fell back to software rendering
    const fast = document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true })
    const gl = fast ?? document.createElement('canvas').getContext('webgl')
    if (!gl) return true // no WebGL at all: very old or blocklisted GPU
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return !fast || WEAK_GPU.test(renderer) || OLD_MOBILE_GPU.test(renderer)
  } catch {
    return false
  }
}

type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }

function hardwareVerdict(): LiteReason | null {
  const nav = navigator as NavigatorHints
  // deviceMemory exists only in Chromium; Safari's core count alone is too coarse to judge by
  if (nav.deviceMemory !== undefined) {
    if (nav.deviceMemory <= 2) return 'memory'
    if (nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) return 'cpu'
  }
  return gpuIsWeak() ? 'gpu' : null
}

const saveData = () => !!(navigator as NavigatorHints).connection?.saveData

/** Auto mode's verdict from storage, probing the hardware only when it hasn't passed recently. */
function judge(fresh: boolean) {
  const stored = read(VERDICT_KEY) as LiteReason | null
  if (stored && !fresh) {
    reason = stored
    return
  }
  const okAt = Number(read(HW_OK_KEY))
  const recent = !fresh && okAt > 0 && Date.now() - okAt < HW_OK_FOR
  const hw = recent ? null : hardwareVerdict()
  if (hw) write(VERDICT_KEY, hw)
  else if (!recent) write(HW_OK_KEY, String(Date.now()))
  reason = hw ?? (saveData() ? 'data' : null)
}

if (typeof window !== 'undefined') {
  write(LEGACY_KEY, null)
  const saved = read(MODE_KEY)
  mode = saved === 'lite' || saved === 'full' ? saved : 'auto'
  lite = document.documentElement.classList.contains('kx-lite')
  if (mode === 'auto') judge(false)
  apply()
}

const SETTLE_MS = 4000 // after the hub mounts: route change, fonts and first video frames are done
const SAMPLE_MS = 3000
const RECHECK_MS = 6000
// 30fps caps (battery saver, iOS Low Power Mode) must still pass: slow means under ~26fps
const SLOW_MEDIAN_MS = 38
const SLOW_FPS = 24

let rearm: (() => void) | null = null

/**
 * Auto mode's frame-rate check for the hub. It waits for the page to settle,
 * then samples for 3s; Lite turns on only after two slow samples (this visit or
 * the last). A fast sample clears the count. Paused while hidden or on the start screen.
 */
export function watchFrameRate() {
  if (typeof window === 'undefined') return () => {}
  let raf = 0
  let timer = 0
  const stop = () => {
    clearTimeout(timer)
    cancelAnimationFrame(raf)
  }
  const sample = () => {
    if (mode !== 'auto' || lite) return
    if (document.hidden || window.__kxBootActive) {
      timer = window.setTimeout(sample, 1000)
      return
    }
    const gaps: number[] = []
    let last = 0
    const start = performance.now()
    const frame = (now: number) => {
      // A tab switch mid-sample throttles rAF: throw the sample away and wait again
      if (document.hidden) {
        timer = window.setTimeout(sample, 1000)
        return
      }
      if (last) gaps.push(now - last)
      last = now
      if (now - start < SAMPLE_MS) {
        raf = requestAnimationFrame(frame)
        return
      }
      if (mode !== 'auto' || lite) return
      gaps.sort((a, b) => a - b)
      const median = gaps[gaps.length >> 1] ?? 0
      // A 10-year-old Intel HD can be too slow to deliver frames at all, so few frames counts as slow too
      const fps = gaps.length / ((now - start) / 1000)
      if (fps >= SLOW_FPS && median <= SLOW_MEDIAN_MS) {
        write(SLOW_KEY, null)
        return
      }
      const slow = Number(read(SLOW_KEY)) + 1
      if (slow < 2) {
        write(SLOW_KEY, String(slow))
        timer = window.setTimeout(sample, RECHECK_MS)
        return
      }
      write(SLOW_KEY, null)
      write(VERDICT_KEY, 'fps')
      reason = 'fps'
      apply()
    }
    raf = requestAnimationFrame(frame)
  }
  const begin = () => {
    stop()
    timer = window.setTimeout(sample, SETTLE_MS)
  }
  begin()
  rearm = begin
  return () => {
    stop()
    if (rearm === begin) rearm = null
  }
}

export function isLite() {
  return lite
}

export function setPerfMode(next: PerfMode) {
  mode = next
  write(MODE_KEY, next)
  if (next === 'auto') {
    // Start over: forget every earlier verdict and test this device again
    write(VERDICT_KEY, null)
    write(SLOW_KEY, null)
    write(HW_OK_KEY, null)
    judge(true)
  }
  apply()
  notify() // mode itself changed even if lite didn't
  if (next === 'auto' && !lite) rearm?.()
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

/** Current mode plus why auto mode picked Lite on this device (null when it didn't). */
export function usePerfMode() {
  const m = useSyncExternalStore(subscribe, () => mode, () => 'auto' as PerfMode)
  const r = useSyncExternalStore(subscribe, () => reason, () => null)
  return { mode: m, reason: r, autoLite: m === 'auto' && r !== null }
}
