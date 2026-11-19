// The hub's chrome: the sound and settings menu, the clock, the share button and the shared icon set.
import { useEffect, useRef, useState } from 'react'
import { setDark, useDark } from '#/lib/dark'
import { play as sfx, setMuted, useMuted } from '#/lib/sfx'
import { setPerfMode, useLite, usePerfMode } from '#/lib/perf'
import type { LiteReason } from '#/lib/perf'
import { setMusicVolume, useMusicVolume } from '#/lib/music'
import type { Track } from '#/data/music'

export function SoundMenu({ nowPlaying }: { nowPlaying: Track | null }) {
  const muted = useMuted()
  const volume = useMusicVolume()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Sound and graphics settings"
        aria-expanded={open}
        title={muted ? 'Sound: off' : 'Sound: on'}
      >
        {muted ? (
          <svg {...iconProps}>
            <path d="M11 5L6 9H2v6h4l5 4z" />
            <path d="M23 9l-6 6M17 9l6 6" />
          </svg>
        ) : (
          <svg {...iconProps}>
            <path d="M11 5L6 9H2v6h4l5 4z" />
            <path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14" />
          </svg>
        )}
      </button>
      {open && (
        <div className="ps5-glass fixed inset-x-4 top-16 z-50 !bg-[#0b0d12]/90 p-4 text-sm md:absolute md:inset-x-auto md:top-11 md:right-0 md:w-72" role="dialog" aria-label="Sound and graphics settings">
          <label className="flex min-h-11 items-center justify-between gap-3">
            <span className="font-semibold">Sound</span>
            <button
              type="button"
              role="switch"
              aria-checked={!muted}
              onClick={() => {
                setMuted(!muted)
                if (muted) window.setTimeout(() => sfx('nav'), 30)
              }}
              className={`relative h-6 w-11 rounded-full transition-colors ${muted ? 'bg-white/20' : 'bg-white'}`}
            >
              <span className={`absolute top-0.5 size-5 rounded-full transition-all ${muted ? 'left-0.5 bg-white/70' : 'left-[22px] bg-black'}`} />
            </button>
          </label>
          <div className={`mt-4 ${muted ? 'opacity-40' : ''}`}>
            <div className="flex items-center justify-between">
              <label htmlFor="kx-music-volume" className="font-semibold">
                Music volume
              </label>
              <span className="text-xs tabular-nums text-white/60">{Math.round(volume * 100)}%</span>
            </div>
            <input
              id="kx-music-volume"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(volume * 100)}
              onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
              disabled={muted}
              className="ps5-range mt-2 w-full"
            />
          </div>
          <GraphicsSwitch />
          <DarkSwitch />
          <div className="mt-4 border-t border-white/10 pt-3 text-xs text-white/60">
            {nowPlaying ? (
              <>
                <p>
                  {volume === 0 ? 'Stopped (volume at 0):' : 'Now playing:'}{' '}
                  <a href={nowPlaying.trackUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:underline">
                    {nowPlaying.title}
                  </a>
                </p>
                {nowPlaying.ost && (
                  <p className="mt-1">
                    From{' '}
                    <a href={nowPlaying.ost.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:underline">
                      {nowPlaying.ost.title}
                    </a>
                  </p>
                )}
              </>
            ) : (
              <p>No background music here.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const AUTO_LITE_NOTE: Record<LiteReason, string> = {
  gpu: 'Turned on automatically: this graphics chip struggles with video and blur.',
  memory: 'Turned on automatically: this device has little memory to spare.',
  cpu: 'Turned on automatically: this device has a low-power processor.',
  fps: 'Turned on automatically: the hub ran slowly here twice.',
  data: 'On while Data Saver is on.',
}

export function GraphicsSwitch() {
  const lite = useLite()
  const { mode, reason, autoLite } = usePerfMode()
  const note =
    autoLite && reason
      ? AUTO_LITE_NOTE[reason]
      : lite
        ? 'Still backgrounds, no blur or motion effects.'
        : 'For older PCs: still backgrounds, no blur or motion effects.'
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <label className="flex min-h-11 items-center justify-between gap-3">
        <span className="font-semibold">Lite graphics</span>
        <button
          type="button"
          role="switch"
          aria-checked={lite}
          onClick={() => {
            sfx('nav')
            setPerfMode(lite ? 'full' : 'lite')
          }}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${lite ? 'bg-white' : 'bg-white/20'}`}
        >
          <span className={`absolute top-0.5 size-5 rounded-full transition-all ${lite ? 'left-[22px] bg-black' : 'left-0.5 bg-white/70'}`} />
        </button>
      </label>
      <p className="mt-1.5 text-xs text-white/55">
        {note}
        {mode !== 'auto' && (
          <>
            {' '}
            <button type="button" className="underline underline-offset-2 hover:text-white" onClick={() => setPerfMode('auto')}>
              Use automatic
            </button>
          </>
        )}
      </p>
    </div>
  )
}

export function DarkSwitch() {
  const dark = useDark()
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <label className="flex min-h-11 items-center justify-between gap-3">
        <span className="font-semibold">Dark surfaces</span>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          onClick={() => {
            sfx('nav')
            setDark(!dark)
          }}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${dark ? 'bg-white' : 'bg-white/20'}`}
        >
          <span className={`absolute top-0.5 size-5 rounded-full transition-all ${dark ? 'left-[22px] bg-black' : 'left-0.5 bg-white/70'}`} />
        </button>
      </label>
      <p className="mt-1.5 text-xs text-white/55">Darker glass and button prompts in their console colors.</p>
    </div>
  )
}

export function Clock() {
  const [now, setNow] = useState<string | null>(null)
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])
  // A fixed slot whether or not the time has arrived, so the chrome never reflows once it does
  return (
    <span className="hidden min-w-16 text-right text-lg font-semibold tabular-nums md:inline">
      {now ? <time suppressHydrationWarning>{now}</time> : null}
    </span>
  )
}

export function ShareButton() {
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ url, title: document.title })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1600)
      }
    } catch {
      /* share sheet dismissed */
    }
  }
  return (
    <button type="button" onClick={share} className="ps5-round relative" aria-label="Share this page" title="Share">
      <ShareIcon />
      {copied && (
        <span className="absolute -top-9 rounded-full bg-white px-2.5 py-1 text-xs font-bold whitespace-nowrap text-black">Link copied</span>
      )}
    </button>
  )
}

export const iconProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
export const PlayIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 4l15 8-15 8z" />
  </svg>
)
export const CardIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 15l5-5 4 4 3-3 6 6" />
    <circle cx="9" cy="8.5" r="1.2" fill="currentColor" />
  </svg>
)
export const ShareIcon = () => (
  <svg {...iconProps}>
    <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" />
    <path d="M12 3v12M7 8l5-5 5 5" />
  </svg>
)
export const YtIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="5" width="20" height="14" rx="4" />
    <path d="M10 9l5 3-5 3z" fill="currentColor" />
  </svg>
)
export const PadIcon = () => (
  <svg {...iconProps}>
    <path d="M6 9h4M8 7v4M15 10h.01M18 8h.01" />
    <path d="M17.3 5H6.7a4 4 0 00-3.95 3.4l-.9 6.1A3 3 0 004.8 18c.9 0 1.7-.5 2.2-1.2L8 15h8l1 1.8c.5.7 1.3 1.2 2.2 1.2a3 3 0 002.95-3.5l-.9-6.1A4 4 0 0017.3 5z" />
  </svg>
)
export const HomeIcon = () => (
  <svg {...iconProps}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
)
export const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
