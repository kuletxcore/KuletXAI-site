import type { PadKind } from '#/lib/gamepad'
import { useDark } from '#/lib/dark'
import { useLite } from '#/lib/perf'

// Button prompts by Nicolae "Xelu" Berbece (CC0). Full mode gets the 256px set, lite the 100px one.
// Dark surfaces swap PlayStation buttons for the coloured PS4 set, which only exists at 100px.

const FIXED: Record<string, [file: string, name: string]> = {
  '✕': ['ps-cross', 'Cross'],
  '○': ['ps-circle', 'Circle'],
  '□': ['ps-square', 'Square'],
  '△': ['ps-triangle', 'Triangle'],
  L1: ['ps-l1', 'L1'],
  R1: ['ps-r1', 'R1'],
  L: ['ps-stick', 'Left stick'],
  A: ['xbox-a', 'A'],
  B: ['xbox-b', 'B'],
  X: ['xbox-x', 'X'],
  Y: ['xbox-y', 'Y'],
  LB: ['xbox-lb', 'LB'],
  RB: ['xbox-rb', 'RB'],
  LS: ['xbox-stick', 'Left stick'],
  '←': ['key-left', 'Left arrow key'],
  '→': ['key-right', 'Right arrow key'],
  '↑': ['key-up', 'Up arrow key'],
  '↓': ['key-down', 'Down arrow key'],
  Enter: ['key-enter', 'Enter key'],
  Q: ['key-q', 'Q key'],
  E: ['key-e', 'E key'],
  R: ['key-r', 'R key'],
}

const DPAD: Record<string, [dir: string, name: string]> = {
  '◀': ['left', 'D-pad left'],
  '▶': ['right', 'D-pad right'],
  '▲': ['up', 'D-pad up'],
  '▼': ['down', 'D-pad down'],
}

function resolve(k: string, pad: PadKind) {
  const d = DPAD[k]
  if (d) return [`${pad === 'playstation' ? 'ps' : 'xbox'}-${d[0]}`, d[1]] as const
  return FIXED[k]
}

/** Label inside a button-prompt chip: the matching prompt image, or the text itself when there is none. */
export function KeyLabel({ k, pad = 'playstation' }: { k: string; pad?: PadKind }) {
  const lite = useLite()
  const dark = useDark()
  if (k.includes('/')) {
    return (
      <span className="inline-flex items-center gap-0.5">
        {k.split('/').map((part) => (
          <KeyLabel key={part} k={part} pad={pad} />
        ))}
      </span>
    )
  }
  const hit = resolve(k, pad)
  if (!hit) return <>{k}</>
  const [file, name] = hit
  const ps4 = dark && file.startsWith('ps-')
  const src = ps4 ? `/prompts/lo/ps4-${file.slice(3)}.webp` : `/prompts/${lite ? 'lo' : 'hq'}/${file}.webp`
  return <img className="kx-prompt" src={src} alt={name} width={24} height={24} draggable={false} decoding="async" />
}
