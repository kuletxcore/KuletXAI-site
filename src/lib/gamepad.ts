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
const REPEAT_EVERY = 140

export const PAD_LABEL: Record<PadKind, Record<'a' | 'b' | 'x' | 'y' | 'lb' | 'rb', string>> = {
  xbox: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB' },
  generic: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB' },
  playstation: { a: '✕', b: '○', x: '□', y: '△', lb: 'L1', rb: 'R1' },
}

export function kindOf(id: string): PadKind {
  // Xbox first: its name ("Xbox Wireless Controller") also contains "Wireless Controller"
  if (/xbox|xinput|vendor: 045e|^045e-/i.test(id)) return 'xbox'
  // Sony vendor id 054c; a DualShock 4 on Chrome is just "Wireless Controller (... Vendor: 054c ...)"
  if (/playstation|dualsense|dualshock|vendor: 054c|^054c-|^wireless controller/i.test(id)) return 'playstation'
  return 'generic'
}

function pressed(pad: Gamepad, b: PadButton) {
  const i = BUTTON_INDEX[b]
  const btn = i === undefined ? undefined : pad.buttons[i]
  const digital = !!btn && (btn.pressed || btn.value > 0.5)
  if (digital || !DIRECTIONS.has(b)) return digital
  const [x = 0, y = 0] = pad.axes
  if (b === 'left') return x < -STICK
  if (b === 'right') return x > STICK
  if (b === 'up') return y < -STICK
  return y > STICK
}

export function useGamepad(onPress: (b: PadButton) => void) {
  const [state, setState] = useState<{ connected: boolean; kind: PadKind }>({ connected: false, kind: 'generic' })
  const handler = useRef(onPress)
  handler.current = onPress

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('getGamepads' in navigator)) return
    let raf = 0
    const held = new Map<PadButton, number>() // button -> next repeat time (or Infinity)
    const buttons = Object.keys(BUTTON_INDEX) as PadButton[]

    const firstPad = () => Array.from(navigator.getGamepads()).find((p): p is Gamepad => !!p && p.connected) ?? null

    const loop = (now: number) => {
      const pad = firstPad()
      if (!pad) {
        raf = 0
        held.clear()
        return
      }
      for (const b of buttons) {
        const down = pressed(pad, b)
        const next = held.get(b)
        if (down && next === undefined) {
          handler.current(b)
          held.set(b, DIRECTIONS.has(b) ? now + REPEAT_DELAY : Infinity)
        } else if (down && next !== undefined && now >= next) {
          handler.current(b)
          held.set(b, now + REPEAT_EVERY)
        } else if (!down && next !== undefined) {
          held.delete(b)
        }
      }
      raf = requestAnimationFrame(loop)
    }

    const sync = () => {
      const pad = firstPad()
      setState(pad ? { connected: true, kind: kindOf(pad.id) } : { connected: false, kind: 'generic' })
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
