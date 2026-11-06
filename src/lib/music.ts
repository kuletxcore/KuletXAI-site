import { useSyncExternalStore } from 'react'
import { audioContext, isMuted, onMutedChange } from './sfx'

/**
 * Console-style background music: one looping track per hub item, crossfaded
 * through Web Audio gain (so it fades on iOS too, where <audio>.volume is
 * read-only). Tracks remember where they were, like a console menu.
 * Browsers only allow playback after a user gesture, so the requested track
 * starts as soon as the audio context is running.
 */

const MAX_GAIN = 0.6
const VOL_KEY = 'kx_music_volume'
let level = 0.65 // slider position 0..1, remembered per device
try {
  if (typeof window !== 'undefined') {
    const saved = Number(localStorage.getItem(VOL_KEY))
    if (localStorage.getItem(VOL_KEY) !== null && saved >= 0 && saved <= 1) level = saved
  }
} catch {
  /* storage blocked: default level */
}
const volumeListeners = new Set<() => void>()
const gainFor = () => MAX_GAIN * level
const FADE_IN = 2.5
const FADE_OUT = 2.0

type Channel = { src: string; el: HTMLAudioElement; gain: GainNode }

const channels = new Map<string, Channel>()
let current: Channel | null = null
let wanted: string | null = null
let held = false
let wired = false

function channel(ctx: AudioContext, src: string) {
  let ch = channels.get(src)
  if (!ch) {
    const el = new Audio(src)
    el.loop = true
    el.preload = 'auto'
    const gain = ctx.createGain()
    gain.gain.value = 0
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination)
    ch = { src, el, gain }
    channels.set(src, ch)
  }
  return ch
}

function ramp(ch: Channel, to: number, secs: number) {
  const ctx = ch.gain.context
  const g = ch.gain.gain
  const now = ctx.currentTime
  g.cancelScheduledValues(now)
  g.setValueAtTime(g.value, now)
  g.linearRampToValueAtTime(to, now + secs)
}

function fadeOut(ch: Channel) {
  ramp(ch, 0, FADE_OUT)
  window.setTimeout(() => {
    if (current !== ch) ch.el.pause()
  }, FADE_OUT * 1000 + 80)
}

function apply() {
  const ctx = audioContext()
  if (!ctx) return
  if (!wired) {
    wired = true
    ctx.addEventListener('statechange', apply)
    onMutedChange(apply)
  }
  if (ctx.state !== 'running') return // starts on the first tap/click/key

  const target = held || isMuted() || ost.active ? null : wanted
  if (current && current.src === target) {
    if (current.el.paused) void current.el.play().catch(() => {})
    ramp(current, gainFor(), FADE_IN)
    return
  }
  if (current) fadeOut(current)
  current = null
  if (!target) return
  const next = channel(ctx, target)
  current = next
  void next.el.play().catch(() => {})
  ramp(next, gainFor(), FADE_IN)
}

/** Crossfade to this track (or to silence with null). */
export function setMusic(src: string | null) {
  wanted = src
  if (typeof window !== 'undefined') apply()
}

/* ── Soundtrack player (OST tab) ──
 * OST tracks live on IsekaiZero's CDN, which sends no CORS headers, so they
 * stream through this site's /api/ost pass-through. That keeps them
 * same-origin, so they run through Web Audio like the background music:
 * same volume slider, fades and mute (iOS included). While one plays, the
 * background music fades out; it fades back when the OST stops. */
const ost = { el: null as HTMLAudioElement | null, gain: null as GainNode | null, src: null as string | null, active: false, playing: false, onEnded: null as null | (() => void) }
const ostListeners = new Set<() => void>()
let ostSnapshot = { src: null as string | null, playing: false }
const ostEmit = () => {
  ostSnapshot = { src: ost.src, playing: ost.playing }
  ostListeners.forEach((l) => l())
}
const proxied = (src: string) => `/api/ost?u=${encodeURIComponent(src)}`

function rampGain(g: GainNode, to: number, secs: number) {
  const now = g.context.currentTime
  g.gain.cancelScheduledValues(now)
  g.gain.setValueAtTime(g.gain.value, now)
  g.gain.linearRampToValueAtTime(to, now + secs)
}

function ostElement() {
  if (!ost.el) {
    const el = new Audio()
    el.preload = 'auto'
    el.addEventListener('play', () => {
      ost.playing = true
      ostEmit()
    })
    el.addEventListener('pause', () => {
      ost.playing = false
      ostEmit()
    })
    el.addEventListener('ended', () => ost.onEnded?.())
    const ctx = audioContext()
    if (ctx) {
      ost.gain = ctx.createGain()
      ost.gain.gain.value = 0
      ctx.createMediaElementSource(el).connect(ost.gain).connect(ctx.destination)
    }
    // Mute pauses the OST; unmuting resumes it — but only if mute was what paused it
    let pausedByMute = false
    onMutedChange(() => {
      if (isMuted()) {
        if (!el.paused) {
          pausedByMute = true
          el.pause()
        }
      } else if (pausedByMute) {
        pausedByMute = false
        if (ost.active && ost.src) {
          void el.play().catch(() => {})
          ostFadeIn(0.6)
        }
      }
    })
    el.addEventListener('play', () => {
      pausedByMute = false
    })
    ost.el = el
  }
  return ost.el
}

function ostFadeIn(secs: number) {
  if (ost.gain) rampGain(ost.gain, gainFor(), secs)
  else if (ost.el) ost.el.volume = level // no Web Audio: best effort
}

/** Play an OST track (or toggle pause if it's already the current one). onEnded runs when it finishes. */
export function playOst(src: string, onEnded?: () => void) {
  if (typeof window === 'undefined') return
  const el = ostElement()
  ost.onEnded = onEnded ?? null
  if (ost.src === src) {
    if (el.paused) {
      void el.play().catch(() => {})
      ostFadeIn(0.4)
    } else {
      // short fade so pausing doesn't click
      if (ost.gain) rampGain(ost.gain, 0, 0.25)
      ost.playing = false
      ostEmit()
      window.setTimeout(() => el.pause(), 260)
    }
    return
  }
  ost.src = src
  ost.active = true
  if (ost.gain) rampGain(ost.gain, 0, 0.01)
  el.src = proxied(src)
  void el.play().catch(() => {})
  ostFadeIn(FADE_IN)
  ostEmit()
  apply()
}

/** Stop the OST (fading out) and bring the background music back. */
export function stopOst() {
  if (!ost.active) return
  const el = ost.el
  const stopping = ost.src
  if (ost.gain) rampGain(ost.gain, 0, FADE_OUT)
  window.setTimeout(() => {
    if (el && ost.src === null && stopping) el.pause()
  }, FADE_OUT * 1000 + 80)
  ost.src = null
  ost.active = false
  ost.onEnded = null
  ostEmit()
  apply()
}

export function useOstState() {
  return useSyncExternalStore(
    (cb) => {
      ostListeners.add(cb)
      return () => ostListeners.delete(cb)
    },
    () => ostSnapshot,
    () => ostSnapshot,
  )
}

let releaseTimer = 0

/** Hold music back (e.g. while the start screen and its startup sound play); release after delayMs. */
export function holdMusic(hold: boolean, delayMs = 0) {
  if (typeof window === 'undefined') return
  window.clearTimeout(releaseTimer)
  if (hold || delayMs <= 0) {
    held = hold
    apply()
    return
  }
  releaseTimer = window.setTimeout(() => {
    held = false
    apply()
  }, delayMs)
}

/** Music volume, 0..1 (independent of the UI sound effects). */
export function setMusicVolume(v: number) {
  level = Math.min(1, Math.max(0, v))
  try {
    localStorage.setItem(VOL_KEY, String(level))
  } catch {
    /* not persisted */
  }
  if (current) ramp(current, gainFor(), 0.12)
  if (ost.gain && ost.playing) rampGain(ost.gain, gainFor(), 0.12)
  else if (ost.el && !ost.gain) ost.el.volume = level
  volumeListeners.forEach((l) => l())
}

export function useMusicVolume() {
  return useSyncExternalStore(
    (cb) => {
      volumeListeners.add(cb)
      return () => volumeListeners.delete(cb)
    },
    () => level,
    () => 0.65,
  )
}
