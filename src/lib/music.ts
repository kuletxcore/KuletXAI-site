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
const FADE_IN = 1.4
const FADE_OUT = 1.0

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

  const target = held || isMuted() ? null : wanted
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
