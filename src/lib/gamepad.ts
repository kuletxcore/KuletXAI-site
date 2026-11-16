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
  // Split halves are held sideways like Joy-Cons: face buttons sit in Switch positions, and the rail buttons are SL/SR
  gtnx: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'SL', rb: 'SR' },
}

// Infinix GT NX in split mode: each half is its own pad, both spoofing Xbox ids (045e/0b13), so match the name
const GTNX_L = /GT NX Controller-L|Infinix Controller-L/i
const GTNX_R = /GT NX Controller-R|Infinix Controller-R/i
const GTNX_BARE = /(GT NX|Infinix) Controller(?![-\w])/i
type Half = 'L' | 'R'

// Held sideways (rail on top, as the Infinix app shows split mode), each half reports like a sideways Joy-Con
// on the standard indexes (controller-detect gtnx-split-profile.json v6): directions 12-15 unrotated (left stick
// / touchpad edges), face buttons 0-3 in Switch positions (left d-pad / right face buttons), SL/SR on 4/5.
// So both halves share every role and are read by BUTTON_INDEX, like any standard pad.
const PAD_CLICK = 11
const ZONES = [12, 13, 14, 15]
// Pressing the touchpad in fires the edge under the finger ~30-100ms before index 11. A held edge counts once it
// has lasted this long without a click; a shorter tap counts when the finger lifts (if no click came).
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
    // Touchpad edges on the right half: when each press began, and whether a click spoiled it
    const zones = new Map<number, { since: number; clicked: boolean }>()
    const zoneTaps = new Set<number>() // edges tapped and released before settling: down for one frame

    const btn = (p: Gamepad | undefined, i: number) => !!p?.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5)
    const zoneDown = (i: number, now: number) => {
      if (zoneTaps.has(i)) return true
      const z = zones.get(i)
      return !!z && !z.clicked && now - z.since >= ZONE_SETTLE
    }
    // Split-mode read: either half, by standard index; the touchpad's edges go through zoneDown
    const gtnxPressed = (b: PadButton, now: number) => {
      const i = BUTTON_INDEX[b]
      if (i === undefined) return false
      const L = halves.get('L')
      const R = halves.get('R')
      if (btn(L, i)) return true
      if (ZONES.includes(i)) return zoneDown(i, now)
      return btn(R, i)
    }
    const trackZones = (now: number) => {
      const R = halves.get('R')
      const clicked = btn(R, PAD_CLICK)
      zoneTaps.clear()
      for (const i of ZONES) {
        const z = zones.get(i)
        if (btn(R, i)) {
          if (!z) zones.set(i, { since: now, clicked })
          else if (clicked) z.clicked = true
        } else if (z) {
          // A quick tap: released before it settled, with no click
          if (!z.clicked && now - z.since < ZONE_SETTLE) zoneTaps.add(i)
          zones.delete(i)
        }
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
        zones.clear()
        zoneTaps.clear()
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
      // Split mode has no analog axes: the stick and touchpad are D-pads there, so nothing scrolls
      const y = split ? 0 : (pad.axes[1] ?? 0)
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
