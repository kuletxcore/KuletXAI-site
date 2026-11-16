import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

/**
 * Gamepad support through the standard mapping. onPress fires once per press; directions (D-pad or left stick)
 * repeat while held, like a console menu.
 */

export type PadButton = 'a' | 'b' | 'x' | 'y' | 'lb' | 'rb' | 'lt' | 'rt' | 'select' | 'start' | 'up' | 'down' | 'left' | 'right'
export type PadKind = 'xbox' | 'playstation' | 'switch' | 'gtnx' | 'generic'

const BUTTON_INDEX: Partial<Record<PadButton, number>> = {
  a: 0,
  b: 1,
  x: 2,
  y: 3,
  lb: 4,
  rb: 5,
  lt: 6,
  rt: 7,
  select: 8,
  start: 9,
  up: 12,
  down: 13,
  left: 14,
  right: 15,
}
const DIRECTIONS = new Set<PadButton>(['up', 'down', 'left', 'right'])
const STICK = 0.6
const REPEAT_DELAY = 380
// A held direction repeats faster the longer it's held: 140ms, then 80ms, then 45ms
const repeatEvery = (n: number) => (n < 3 ? 140 : n < 8 ? 80 : 45)

export const PAD_LABEL: Record<PadKind, Record<'a' | 'b' | 'x' | 'y' | 'lb' | 'rb', string>> = {
  xbox: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB' },
  generic: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB' },
  playstation: { a: '✕', b: '○', x: '□', y: '△', lb: 'L1', rb: 'R1' },
  // The standard mapping is positional: the bottom button is Nintendo's B, the right one is A
  switch: { a: 'B', b: 'A', x: 'Y', y: 'X', lb: 'L', rb: 'R' },
  gtnx: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB' },
}

// Infinix GT NX in split mode: each half is its own pad, both spoofing Xbox ids (045e/0b13), so match the name
const GTNX_L = /GT NX Controller-L|Infinix Controller-L/i
const GTNX_R = /GT NX Controller-R|Infinix Controller-R/i
const GTNX_BARE = /(GT NX|Infinix) Controller(?![-\w])/i
type Half = 'L' | 'R'

// Measured index per site button (controller-detect gtnx-split-profile.json v4). Halves report sideways.
const GTNX_MAP: Record<Half, Partial<Record<PadButton, number[]>>> = {
  L: { up: [3], down: [0], left: [1], right: [2], lb: [4], rb: [5], lt: [6], select: [8], start: [9] },
  R: { a: [3], b: [1], x: [2], y: [0], lb: [4], rb: [5], rt: [7], select: [8], start: [9], up: [15], down: [14], left: [12], right: [13] },
}
// Left stick arrives as digital buttons, rotated 90 degrees
const GTNX_STICK = { up: 14, down: 15, left: 13, right: 12 }
const PAD_CLICK = 11
// Touchpad zones count only once held this long, since a click fires a zone ~30-100ms before index 11
const ZONE_SETTLE = 110

function halvesOf(pads: Gamepad[]): Map<Half, Gamepad> {
  const out = new Map<Half, Gamepad>()
  for (const p of pads) {
    if (GTNX_L.test(p.id)) out.set('L', p)
    else if (GTNX_R.test(p.id)) out.set('R', p)
  }
  // Right after switching modes the left half can keep the unsuffixed combined name
  if (out.has('R') && !out.has('L')) {
    const stale = pads.find((p) => GTNX_BARE.test(p.id))
    if (stale) out.set('L', stale)
  }
  return out
}

export function kindOf(id: string): PadKind {
  if (GTNX_L.test(id) || GTNX_R.test(id)) return 'gtnx'
  // Xbox first: its name ("Xbox Wireless Controller") also contains "Wireless Controller"
  if (/xbox|xinput|vendor: 045e|^045e-/i.test(id)) return 'xbox'
  // Sony vendor id 054c; a DualShock 4 on Chrome is just "Wireless Controller (... Vendor: 054c ...)"
  // Android can report "Sony Interactive Entertainment Wireless Controller" with no vendor id
  if (/playstation|dualsense|dualshock|sony|vendor: 054c|^054c-|^wireless controller/i.test(id)) return 'playstation'
  if (/nintendo|pro controller|joy-con|vendor: 057e|^057e-/i.test(id)) return 'switch'
  return 'generic'
}

/** Sony model from the name or product id (Chrome "Product: 0ce6", Firefox "054c-0ce6-..."). */
export function modelOf(id: string): string | undefined {
  if (kindOf(id) !== 'playstation') return undefined
  if (/dualsense edge|\b0df2\b/i.test(id)) return 'DualSense Edge'
  if (/dualsense|\b0ce6\b/i.test(id)) return 'DualSense'
  if (/dualshock|\b(05c4|09cc|0ba0)\b/i.test(id)) return 'DUALSHOCK 4'
  return undefined
}

function pressed(pad: Gamepad, b: PadButton) {
  const i = BUTTON_INDEX[b]
  const btn = i === undefined ? undefined : pad.buttons[i]
  const digital = !!btn && (btn.pressed || btn.value > 0.5)
  if (digital || !DIRECTIONS.has(b)) return digital
  // Stick only steps left/right; its vertical axis scrolls (see onScroll)
  const [x = 0] = pad.axes
  if (b === 'left') return x < -STICK
  if (b === 'right') return x > STICK
  return false
}

let polled = false

export type PadInfo = { connected: boolean; kind: PadKind; model?: string }
const NO_PAD: PadInfo = { connected: false, kind: 'generic' }

// The connected pad, shared so every button prompt can pick the right image set
let current: PadInfo = NO_PAD
const padListeners = new Set<() => void>()
function publish(next: PadInfo) {
  if (next.connected === current.connected && next.kind === current.kind && next.model === current.model) return
  current = next
  for (const l of padListeners) l()
}
const subscribePad = (cb: () => void) => {
  padListeners.add(cb)
  return () => {
    padListeners.delete(cb)
  }
}

export function usePadInfo() {
  return useSyncExternalStore(subscribePad, () => current, () => NO_PAD)
}

const DEADZONE = 0.2
// Left stick scroll speed, px per second: a light push reads, full tilt flies,
// and holding it ramps up to full speed over RAMP_MS
const SCROLL_MIN_PX_S = 1300
const SCROLL_MAX_PX_S = 7000
const RAMP_MS = 700

/**
 * onPress: digital buttons and D-pad (plus stick left/right).
 * onScroll: left stick up/down, in pixels for this frame (eased, with a deadzone).
 */
export function useGamepad(onPress: (b: PadButton) => void, onScroll?: (dy: number) => void) {
  const [state, setState] = useState<PadInfo>(NO_PAD)
  const handler = useRef(onPress)
  handler.current = onPress
  const scroller = useRef(onScroll)
  scroller.current = onScroll

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getGamepads' in navigator)) return
    let raf = 0
    const held = new Map<PadButton, number>() // button -> next repeat time (or Infinity)
    const repeats = new Map<PadButton, number>()
    let lastFrame = 0
    let tiltSince = 0
    const buttons = Object.keys(BUTTON_INDEX) as PadButton[]

    const allPads = () => Array.from(navigator.getGamepads()).filter((p): p is Gamepad => !!p && p.connected)
    const firstPad = () => allPads()[0] ?? null
    let halves = new Map<Half, Gamepad>()
    const zoneSince = new Map<number, number>()
    let clickHeld = false

    const btn = (p: Gamepad | undefined, i: number) => !!p?.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5)
    // Split-mode read: merge both halves; touchpad zones wait to settle and are dropped while it's clicked
    const gtnxPressed = (b: PadButton, now: number) => {
      const L = halves.get('L')
      const R = halves.get('R')
      if ((GTNX_MAP.L[b] ?? []).some((i) => btn(L, i))) return true
      if (b === 'left' || b === 'right') {
        if (btn(L, GTNX_STICK[b])) return true
      }
      for (const i of GTNX_MAP.R[b] ?? []) {
        if (!btn(R, i)) continue
        if (i < 12) return true
        if (!clickHeld && now - (zoneSince.get(i) ?? now) >= ZONE_SETTLE) return true
      }
      return false
    }
    const trackZones = (now: number) => {
      const R = halves.get('R')
      clickHeld = btn(R, PAD_CLICK)
      for (const i of [12, 13, 14, 15]) {
        if (!btn(R, i)) zoneSince.delete(i)
        else if (clickHeld) zoneSince.set(i, Infinity)
        else if (!zoneSince.has(i)) zoneSince.set(i, now)
      }
    }

    // Buttons already held when this page starts listening belong to the previous
    // page (e.g. the B that navigated here). Ignore them until they're released.
    let primed = false

    const loop = (now: number) => {
      const pad = firstPad()
      if (!pad) {
        raf = 0
        halves = new Map()
        zoneSince.clear()
        held.clear()
        repeats.clear()
        lastFrame = 0
        return
      }
      const dt = lastFrame ? Math.min(50, now - lastFrame) : 16.7
      lastFrame = now
      // Chrome hands out snapshots, so the halves are re-read every frame
      halves = halvesOf(allPads())
      const split = halves.size > 0
      if (split) trackZones(now)
      const isDown = (b: PadButton) => (split ? gtnxPressed(b, now) : pressed(pad, b))
      if (!primed) {
        primed = true
        for (const b of buttons) if (isDown(b)) held.set(b, Infinity)
        raf = requestAnimationFrame(loop)
        return
      }
      for (const b of buttons) {
        const down = isDown(b)
        const next = held.get(b)
        if (down && next === undefined) {
          handler.current(b)
          held.set(b, DIRECTIONS.has(b) ? now + REPEAT_DELAY : Infinity)
          repeats.set(b, 0)
        } else if (down && next !== undefined && now >= next) {
          handler.current(b)
          const n = (repeats.get(b) ?? 0) + 1
          repeats.set(b, n)
          held.set(b, now + repeatEvery(n))
        } else if (!down && next !== undefined) {
          held.delete(b)
          repeats.delete(b)
        }
      }
      // Split mode has no analog axes: the left stick's up/down scrolls at full tilt
      const L = halves.get('L')
      const y = split ? (btn(L, GTNX_STICK.down) ? 1 : 0) - (btn(L, GTNX_STICK.up) ? 1 : 0) : (pad.axes[1] ?? 0)
      if (Math.abs(y) > DEADZONE && scroller.current) {
        tiltSince ||= now
        const t = Math.min(1, (Math.abs(y) - DEADZONE) / (1 - DEADZONE))
        const ramp = Math.min(1, (now - tiltSince) / RAMP_MS)
        const top = SCROLL_MIN_PX_S + (SCROLL_MAX_PX_S - SCROLL_MIN_PX_S) * ramp * ramp
        scroller.current(Math.sign(y) * t ** 1.8 * top * (dt / 1000))
      } else {
        tiltSince = 0
      }
      raf = requestAnimationFrame(loop)
    }

    const sync = () => {
      const pads = allPads()
      halves = halvesOf(pads)
      const pad = pads[0] ?? null
      const info: PadInfo = !pad
        ? NO_PAD
        : halves.size
          ? { connected: true, kind: 'gtnx', model: halves.size === 2 ? 'GT NX' : `GT NX ${halves.has('L') ? 'left' : 'right'} half` }
          : { connected: true, kind: kindOf(pad.id), model: modelOf(pad.id) }
      setState(info)
      publish(info)
      if (pad && !raf) raf = requestAnimationFrame(loop)
    }

    window.addEventListener('gamepadconnected', sync)
    window.addEventListener('gamepaddisconnected', sync)
    // The first getGamepads() starts the browser's gamepad service, which can stall a fresh
    // page's first frame; later pages in the same visit read the pads at once
    const firstSync = () => {
      polled = true
      sync()
    }
    const hasIdle = typeof window.requestIdleCallback === 'function'
    let wait = 0
    if (polled) sync()
    else wait = hasIdle ? window.requestIdleCallback(firstSync, { timeout: 600 }) : window.setTimeout(firstSync, 100)
    return () => {
      window.removeEventListener('gamepadconnected', sync)
      window.removeEventListener('gamepaddisconnected', sync)
      if (hasIdle) window.cancelIdleCallback(wait)
      else clearTimeout(wait)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return state
}
