import { useSyncExternalStore } from 'react'
import { audioContext, existingAudioContext, isMuted, onMutedChange } from './sfx'

/**
 * Console-style background music: one looping track per hub item, faded through Web Audio gain (iOS ignores
 * <audio>.volume). Switching items stops the old track, so each starts from the top; mute, the OST and holds only pause it.
 * Playback starts once a user gesture has started the audio context.
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
// Selection changes, timed from a PS5 home screen capture: the music reacts 0.4s after a move (later moves don't
// restart that), the old track fades out alone over 0.7s, then the selected one starts at once
const SWITCH_DELAY = 0.4
const SWITCH_FADE_OUT = 0.7
const SWITCH_FADE_IN = 0.05

type Channel = { src: string; el: HTMLAudioElement; gain: GainNode }

const channels = new Map<string, Channel>()
let current: Channel | null = null
let wanted: string | null = null
let held = false
let wired = false
let switchTimer = 0
let switchingFrom: Channel | null = null
let lastSrc: string | null = null // the track that played last: only it may resume mid-song
const wantedListeners = new Set<() => void>()
const setWanted = (src: string | null) => {
  if (src === wanted) return
  wanted = src
  wantedListeners.forEach((l) => l())
}

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

/** Pause, or stop (pause and rewind) when another item's track is taking over. */
function halt(ch: Channel, stop: boolean) {
  ch.el.pause()
  if (stop && ch.el.currentTime > 0) ch.el.currentTime = 0
}

function fadeOut(ch: Channel, stop = false) {
  ramp(ch, 0, FADE_OUT)
  window.setTimeout(() => {
    if (current !== ch) halt(ch, stop)
  }, FADE_OUT * 1000 + 80)
}

/** Play a channel, from the top unless it is the track that was playing before a pause. */
function start(ch: Channel) {
  if (ch.src !== lastSrc && ch.el.currentTime > 0) ch.el.currentTime = 0
  lastSrc = ch.src
  if (ch.el.paused) void ch.el.play().catch(() => {})
}

// Creating the AudioContext takes tens of milliseconds, so music asks for it in idle time
// rather than in the middle of the start screen's first frame (the first tap creates it anyway)
let audioSoon = false
function startAudioSoon() {
  if (audioSoon || typeof window === 'undefined') return
  audioSoon = true
  const run = () => {
    audioContext()
    apply()
  }
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: 1000 })
  else window.setTimeout(run, 200)
}

const blocked = () => level === 0 || held || isMuted() || ost.active || mediaHolds.size > 0

/** Volume at 0 stops the music outright: every track paused and rewound, so it starts from the top when raised. */
function stopMusic() {
  for (const ch of channels.values()) {
    ch.gain.gain.cancelScheduledValues(0)
    ch.gain.gain.value = 0
    ch.el.pause()
    if (ch.el.currentTime > 0) ch.el.currentTime = 0
  }
  current = null
}

/** Mute, the start screen, the OST player and card videos: these fade the music in and out gently. */
function apply() {
  const ctx = existingAudioContext()
  if (!ctx) return startAudioSoon()
  if (!wired) {
    wired = true
    ctx.addEventListener('statechange', apply)
    onMutedChange(apply)
  }
  if (ctx.state !== 'running') return // starts on the first tap/click/key

  if (level === 0) return stopMusic()
  if (blocked()) {
    if (current) fadeOut(current)
    current = null
    return
  }
  if (switchTimer || switchingFrom) return // a selection switch is under way and starts the wanted track itself
  if (current && current.src === wanted) {
    if (current.el.paused) void current.el.play().catch(() => {})
    ramp(current, gainFor(), FADE_IN)
    return
  }
  if (current) fadeOut(current, true)
  current = null
  if (!wanted) return
  const next = channel(ctx, wanted)
  current = next
  start(next)
  ramp(next, gainFor(), FADE_IN)
}

function beginSwitch() {
  switchTimer = 0
  const ctx = existingAudioContext()
  if (!ctx || ctx.state !== 'running' || blocked()) return apply()
  const from = current
  if (from?.src === wanted) return
  if (!from) return startWanted(ctx)
  switchingFrom = from
  ramp(from, 0, SWITCH_FADE_OUT)
  window.setTimeout(() => {
    switchingFrom = null
    if (current === from) current = null
    halt(from, from.src !== wanted)
    startWanted(ctx)
  }, SWITCH_FADE_OUT * 1000)
}

/** The selected item's track (whatever is selected now, not when the switch began), straight in. */
function startWanted(ctx: AudioContext) {
  if (ctx.state !== 'running' || blocked()) return apply()
  if (current && current.src !== wanted) fadeOut(current, true)
  if (!wanted) {
    current = null
    return
  }
  const next = channel(ctx, wanted)
  current = next
  start(next)
  ramp(next, gainFor(), SWITCH_FADE_IN)
}

/**
 * Music for the highlighted item, switched like the PS5 home screen (or silence with null).
 * keepIfNone: an item with no music of its own leaves the current track playing, as the console does.
 */
export function setMusic(src: string | null, { keepIfNone = false } = {}) {
  if (src === null && keepIfNone) {
    if (current && !switchingFrom) setWanted(current.src)
    return
  }
  setWanted(src)
  if (typeof window === 'undefined' || switchTimer || switchingFrom) return
  if ((current?.src ?? null) === wanted) return
  switchTimer = window.setTimeout(beginSwitch, SWITCH_DELAY * 1000)
}

/** The track the hub wants playing (also while muted or held back), for the "now playing" line. */
export function useWantedMusic() {
  return useSyncExternalStore(
    (cb) => {
      wantedListeners.add(cb)
      return () => wantedListeners.delete(cb)
    },
    () => wanted,
    () => null,
  )
}

// Soundtrack player: OST files stream through /api/ost (IsekaiZero's CDN sends no CORS headers) so Web Audio can give
// them the music's volume, fades and mute. The background music fades out while one plays and back when it stops
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
    // Mute pauses the OST; unmuting resumes it, but only if mute was what paused it
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

/** The OST stops with the music at volume 0, rewound so a later play starts the track over. */
function stopOstNow() {
  if (!ost.active) return
  const el = ost.el
  if (ost.gain) rampGain(ost.gain, 0, 0.01)
  if (el) {
    el.pause()
    el.currentTime = 0
  }
  ost.src = null
  ost.active = false
  ost.onEnded = null
  ostEmit()
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

// Other media on the page (e.g. a video inside a story card): while any plays with sound, the background music
// fades out and an OST track pauses; both come back when it stops
const mediaHolds = new Set<object>()
let ostPausedForMedia = false

export function holdForMedia(token: object, playing: boolean) {
  if (typeof window === 'undefined') return
  const had = mediaHolds.size > 0
  if (playing) mediaHolds.add(token)
  else mediaHolds.delete(token)
  const has = mediaHolds.size > 0
  if (has === had) return
  const el = ost.el
  if (has && el && !el.paused) {
    ostPausedForMedia = true
    if (ost.gain) rampGain(ost.gain, 0, 0.3)
    window.setTimeout(() => {
      if (mediaHolds.size > 0) el.pause()
    }, 320)
  } else if (!has && ostPausedForMedia) {
    ostPausedForMedia = false
    if (el && ost.active && ost.src && !isMuted()) {
      void el.play().catch(() => {})
      ostFadeIn(0.8)
    }
  }
  apply()
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
  const was = level
  level = Math.min(1, Math.max(0, v))
  try {
    localStorage.setItem(VOL_KEY, String(level))
  } catch {
    /* not persisted */
  }
  if (level === 0 || was === 0) {
    if (level === 0) stopOstNow()
    apply() // stops the music at 0, starts it again from the top when raised
  } else if (current && current !== switchingFrom) ramp(current, gainFor(), 0.12)
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
