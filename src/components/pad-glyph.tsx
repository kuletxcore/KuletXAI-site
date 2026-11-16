import type { PadKind } from '#/lib/gamepad'
import { usePadInfo } from '#/lib/gamepad'
import { useDark } from '#/lib/dark'
import { useLite } from '#/lib/perf'

// Button prompts by Nicolae "Xelu" Berbece (CC0). Full mode gets the 256px set, lite the 100px one.
// PlayStation: a DualShock 4 always gets the coloured PS4 set; otherwise dark surfaces get PS4 and light get PS5.

type Entry = [file: string, name: string]

const STICK_AND_DPAD = (prefix: string): Record<string, Entry> => ({
  LS: [`${prefix}-stick`, 'Left stick'],
  '◀': [`${prefix}-left`, 'D-pad left'],
  '▶': [`${prefix}-right`, 'D-pad right'],
  '▲': [`${prefix}-up`, 'D-pad up'],
  '▼': [`${prefix}-down`, 'D-pad down'],
})

const XBOX: Record<string, Entry> = {
  A: ['xbox-a', 'A'],
  B: ['xbox-b', 'B'],
  X: ['xbox-x', 'X'],
  Y: ['xbox-y', 'Y'],
  LB: ['xbox-lb', 'LB'],
  RB: ['xbox-rb', 'RB'],
  ...STICK_AND_DPAD('xbox'),
}

const PAD: Record<PadKind, Record<string, Entry>> = {
  playstation: {
    '✕': ['ps-cross', 'Cross'],
    '○': ['ps-circle', 'Circle'],
    '□': ['ps-square', 'Square'],
    '△': ['ps-triangle', 'Triangle'],
    L1: ['ps-l1', 'L1'],
    R1: ['ps-r1', 'R1'],
    ...STICK_AND_DPAD('ps'),
  },
  switch: {
    A: ['switch-a', 'A'],
    B: ['switch-b', 'B'],
    X: ['switch-x', 'X'],
    Y: ['switch-y', 'Y'],
    L: ['switch-l', 'L'],
    R: ['switch-r', 'R'],
    ...STICK_AND_DPAD('switch'),
  },
  xbox: XBOX,
  // GT NX split mode: the halves are held sideways like Joy-Cons, and their face buttons report in Switch
  // positions (A right, B bottom, X top, Y left), so they get the Switch set. SL/SR (the rail buttons, which
  // arrive as LB/RB) have no image and show as text.
  gtnx: {
    A: ['switch-a', 'A'],
    B: ['switch-b', 'B'],
    X: ['switch-x', 'X'],
    Y: ['switch-y', 'Y'],
    ...STICK_AND_DPAD('switch'),
  },
  generic: XBOX,
}

const KEYS: Record<string, Entry> = {
  '←': ['key-left', 'Left arrow key'],
  '→': ['key-right', 'Right arrow key'],
  '↑': ['key-up', 'Up arrow key'],
  '↓': ['key-down', 'Down arrow key'],
  Enter: ['key-enter', 'Enter key'],
  Q: ['key-q', 'Q key'],
  E: ['key-e', 'E key'],
  R: ['key-r', 'R key'],
}

/** Label inside a button-prompt chip: the connected pad's prompt image, a keyboard key, or the text itself. */
export function KeyLabel({ k }: { k: string }) {
  const lite = useLite()
  const dark = useDark()
  const pad = usePadInfo()
  if (k.includes('/')) {
    return (
      <span className="inline-flex items-center gap-0.5">
        {k.split('/').map((part) => (
          <KeyLabel key={part} k={part} />
        ))}
      </span>
    )
  }
  const hit = (pad.connected ? PAD[pad.kind][k] : undefined) ?? KEYS[k]
  if (!hit) return <>{k}</>
  const [file, name] = hit
  const ps4 = file.startsWith('ps-') && (dark || pad.model === 'DUALSHOCK 4')
  const src = ps4 ? `/prompts/lo/ps4-${file.slice(3)}.webp` : `/prompts/${lite ? 'lo' : 'hq'}/${file}.webp`
  return <img className="kx-prompt" src={src} alt={name} width={24} height={24} draggable={false} decoding="async" />
}
