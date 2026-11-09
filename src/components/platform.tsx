/**
 * Platform marks styled after the PS5's chip beside a game's name: an outlined chip holding the platform's
 * white logo, plus icons for the tabs and buttons.
 */
export type Platform = 'isk' | 'kage' | 'trimz' | 'youtube'

const NAME: Record<Platform, string> = { isk: 'IsekaiZero', kage: 'KageSekai', trimz: 'Trimz', youtube: 'YouTube' }

/** Outlined chip with the platform's logotype (YouTube keeps a text label). */
export function PlatformChip({ platform }: { platform: Platform }) {
  return (
    <span className={`ps5-chip ps5-chip-${platform}`} title={NAME[platform]}>
      {platform === 'isk' ? (
        <img src="/brand/isk-wordmark-360.webp" alt="IsekaiZero" width={360} height={55} decoding="async" />
      ) : platform === 'kage' ? (
        <img src="/brand/kage-wordmark.webp" alt="KageSekai" width={219} height={72} decoding="async" />
      ) : platform === 'trimz' ? (
        <img
          src="/brand/trimz-wordmark-320.webp"
          srcSet="/brand/trimz-wordmark-320.webp 320w, /brand/trimz-wordmark-640.webp 640w"
          sizes="48px"
          alt="Trimz"
          width={320}
          height={136}
          decoding="async"
        />
      ) : (
        <>
          <YouTubeGlyph />
          <span>YouTube</span>
        </>
      )}
    </span>
  )
}

/** Square-ish app icon, sized by the surrounding font (1em tall by default). */
export function PlatformIcon({ platform, className = '' }: { platform: Exclude<Platform, 'kage'>; className?: string }) {
  if (platform === 'youtube') return <YouTubeGlyph className={`ps5-picon ${className}`} />
  const src = platform === 'isk' ? '/brand/isk-icon-64.webp' : '/brand/trimz-mark-64.webp'
  const w = platform === 'isk' ? 72 : 56
  return <img src={src} alt="" aria-hidden width={w} height={64} decoding="async" className={`ps5-picon ${className}`} />
}

function YouTubeGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" aria-hidden className={className}>
      <rect width="28" height="20" rx="5.5" fill="#ff0033" />
      <path d="M11.2 5.6v8.8l7.4-4.4z" fill="#fff" />
    </svg>
  )
}
