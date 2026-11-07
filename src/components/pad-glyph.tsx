/**
 * Label inside a button-prompt chip. PlayStation face buttons are drawn as
 * shapes: the ✕ ○ □ △ characters come from whatever symbol font the device
 * has, so their size and weight change between Windows, macOS and phones.
 */
const PS_GLYPH: Record<string, { name: string; shape: React.ReactNode }> = {
  '✕': { name: 'Cross', shape: <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" /> },
  '○': { name: 'Circle', shape: <circle cx="12" cy="12" r="7.5" /> },
  '□': { name: 'Square', shape: <rect x="5" y="5" width="14" height="14" rx="1" /> },
  '△': { name: 'Triangle', shape: <path d="M12 3.75l8.5 14.75h-17z" /> },
}

export function KeyLabel({ k }: { k: string }) {
  const g = PS_GLYPH[k]
  if (!g) return <>{k}</>
  return (
    <svg viewBox="0 0 24 24" width="1.3em" height="1.3em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={g.name}>
      {g.shape}
    </svg>
  )
}
