import { useEffect, useRef, useState } from 'react'

/**
 * Gamepad support via the standard Gamepad API mapping.
 * Fires onPress once per press; directions (D-pad or left stick) repeat while
 * held, like a console menu.
 */

export type PadButton = 'a' | 'b' | 'x' | 'y' | 'lb' | 'rb' | 'lt' | 'rt' | 'select' | 'start' | 'up' | 'down' | 'left' | 'right'
export type PadKind = 'xbox' | 'playstation' | 'generic'

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
}

export function kindOf(id: string): PadKind {
  // Xbox first: its name ("Xbox Wireless Controller") also contains "Wireless Controller"
  if (/xbox|xinput|vendor: 045e|^045e-/i.test(id)) return 'xbox'
  // Sony vendor id 054c; a DualShock 4 on Chrome is just "Wireless Controller (... Vendor: 054c ...)"
  // Android can report "Sony Interactive Entertainment Wireless Controller" with no vendor id
  if (/playstation|dualsense|dualshock|sony|vendor: 054c|^054c-|^wireless controller/i.test(id)) return 'playstation'
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
  const [state, setState] = useState<{ connected: boolean; kind: PadKind; model?: string }>({ connected: false, kind: 'generic' })
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

    const firstPad = () => Array.from(navigator.getGamepads()).find((p): p is Gamepad => !!p && p.connected) ?? null

    // Buttons already held when this page starts listening belong to the previous
    // page (e.g. the B that navigated here). Ignore them until they're released.
    let primed = false

    const loop = (now: number) => {
      const pad = firstPad()
      if (!pad) {
        raf = 0
        held.clear()
        repeats.clear()
        lastFrame = 0
        return
      }
      const dt = lastFrame ? Math.min(50, now - lastFrame) : 16.7
      lastFrame = now
      if (!primed) {
        primed = true
        for (const b of buttons) if (pressed(pad, b)) held.set(b, Infinity)
        raf = requestAnimationFrame(loop)
        return
      }
      for (const b of buttons) {
        const down = pressed(pad, b)
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
      const y = pad.axes[1] ?? 0
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
      const pad = firstPad()
      setState(pad ? { connected: true, kind: kindOf(pad.id), model: modelOf(pad.id) } : { connected: false, kind: 'generic' })
      if (pad && !raf) raf = requestAnimationFrame(loop)
    }

    window.addEventListener('gamepadconnected', sync)
    window.addEventListener('gamepaddisconnected', sync)
    sync()
    return () => {
      window.removeEventListener('gamepadconnected', sync)
      window.removeEventListener('gamepaddisconnected', sync)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return state
}
