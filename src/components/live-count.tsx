import { formatCount, useCountUp } from '#/lib/isk-stats'

/** A count that ticks up to the new value when live stats arrive. */
export function LiveCount({ value, compact }: { value: number; compact?: boolean }) {
  const shown = useCountUp(value)
  return (
    <span className="tabular-nums">{compact && shown >= 10_000 ? `${(shown / 1000).toFixed(1)}K` : formatCount(shown)}</span>
  )
}

/** Small pulsing "live" dot (still in Lite mode and with reduced motion). */
export function LiveDot({ className = '' }: { className?: string }) {
  return <span className={`kx-live-dot ${className}`} aria-hidden />
}
