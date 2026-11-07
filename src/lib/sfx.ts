import { useSyncExternalStore } from 'react'

/**
 * UI sounds: nav/enter/back/tab are sample files from /sfx (decoded once), the boot swell is synthesized.
 * Audio needs a user gesture, so the context is created lazily and resumed on the first press.
 */

export type Sfx = 'nav' | 'enter' | 'back' | 'tab' | 'boot'

const STORAGE_KEY = 'kx_sound'
let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
const listeners = new Set<() => void>()

const FILES: Partial<Record<Sfx, string>> = {
  nav: '/sfx/nav.mp3',
  enter: '/sfx/enter.mp3',
  back: '/sfx/back.mp3',
  tab: '/sfx/tab_hub.mp3',
}
const VOLUME: Partial<Record<Sfx, number>> = { nav: 0.7, enter: 0.85, back: 0.8, tab: 0.8 }
const buffers: Partial<Record<Sfx, AudioBuffer>> = {}
const decoding: Partial<Record<Sfx, Promise<AudioBuffer | null>>> = {}
// Start downloading the sound files as soon as the page loads, so the very
// first tap already has the real sound (decoding waits for the AudioContext).
const bytes: Partial<Record<Sfx, Promise<ArrayBuffer | null>>> = {}
if (typeof window !== 'undefined') {
  for (const [name, url] of Object.entries(FILES) as [Sfx, string][]) {
    bytes[name] = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null)
  }
}
let loading = false

function loadSamples(c: AudioContext) {
  if (loading) return
  loading = true
  for (const name of Object.keys(FILES) as Sfx[]) {
    decoding[name] = (bytes[name] ?? Promise.resolve(null))
      .then((b) => (b ? c.decodeAudioData(b) : null))
      .then((buf) => {
        if (buf) buffers[name] = buf
        return buf
      })
      .catch(() => null)
  }
}

function playSample(c: AudioContext, name: Sfx) {
  const buf = buffers[name]
  if (!buf || !master) return false
  const src = c.createBufferSource()
  const g = c.createGain()
  src.buffer = buf
  g.gain.value = VOLUME[name] ?? 0.8
  src.connect(g).connect(master)
  src.start()
  return true
}

try {
  if (typeof window !== 'undefined') muted = localStorage.getItem(STORAGE_KEY) === 'off'
} catch {
  /* storage blocked: default to sound on */
}

function audio() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.6
    master.connect(ctx.destination)
    loadSamples(ctx)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Unlock audio on the first gesture so later sounds play instantly
if (typeof window !== 'undefined') {
  const unlock = () => {
    audio()
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

/** One enveloped oscillator note. */
function tone(c: AudioContext, out: AudioNode, opts: { type?: OscillatorType; from: number; to?: number; at?: number; dur: number; gain: number; attack?: number }) {
  const t = c.currentTime + (opts.at ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.from, t)
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t + opts.dur * 0.6)
  const a = opts.attack ?? 0.004
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(opts.gain, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur)
  osc.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + opts.dur + 0.05)
}

/** Short filtered-noise sweep (airy whoosh). */
function whoosh(c: AudioContext, out: AudioNode, dur: number, from: number, to: number, gain: number) {
  const t = c.currentTime
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.4
  bp.frequency.setValueAtTime(from, t)
  bp.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.35)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g).connect(out)
  src.start(t)
  src.stop(t + dur)
}

/** Soft feedback echo so chimes ring a little. */
function withEcho(c: AudioContext, delay = 0.11, feedback = 0.28, life = 2) {
  const input = c.createGain()
  const d = c.createDelay(1)
  const fb = c.createGain()
  const wet = c.createGain()
  d.delayTime.value = delay
  fb.gain.value = feedback
  wet.gain.value = 0.35
  input.connect(master!)
  input.connect(d)
  d.connect(fb).connect(d)
  d.connect(wet).connect(master!)
  // Tear the chain down once the echo has died away
  window.setTimeout(() => [input, d, fb, wet].forEach((n) => n.disconnect()), life * 1000)
  return input
}

export function play(name: Sfx) {
  if (muted) return
  const c = audio()
  if (!c || !master) return
  const asked = performance.now()
  const go = () => {
    if (performance.now() - asked > 700) return // too late to be the sound for that tap
    if (playSample(c, name)) return
    const pending = decoding[name]
    if (!pending) return synth(c, name)
    // The file is still decoding: wait briefly for it rather than playing a different sound
    let settled = false
    const fallback = window.setTimeout(() => {
      settled = true
      synth(c, name)
    }, 400)
    void pending.then((buf) => {
      if (settled) return
      settled = true
      clearTimeout(fallback)
      if (!buf || !playSample(c, name)) synth(c, name)
    })
  }
  // The first tap unlocks audio asynchronously; play as soon as it's running
  if (c.state === 'running') go()
  else void c.resume().then(go, () => {})
}

/** Generated stand-ins (and the start-up swell, which has no file). */
function synth(c: AudioContext, name: Sfx) {
  if (!master || muted) return
  switch (name) {
    case 'nav':
      tone(c, master, { type: 'sine', from: 1760, to: 1480, dur: 0.07, gain: 0.16 })
      tone(c, master, { type: 'triangle', from: 3520, dur: 0.035, gain: 0.03 })
      break
    case 'enter': {
      const out = withEcho(c)
      tone(c, out, { type: 'triangle', from: 1318.5, dur: 0.18, gain: 0.2 })
      tone(c, out, { type: 'sine', from: 1975.5, at: 0.07, dur: 0.32, gain: 0.18 })
      break
    }
    case 'back': {
      const out = withEcho(c, 0.09, 0.2)
      tone(c, out, { type: 'triangle', from: 1318.5, dur: 0.12, gain: 0.14 })
      tone(c, out, { type: 'sine', from: 987.8, at: 0.06, dur: 0.22, gain: 0.13 })
      break
    }
    case 'tab':
      whoosh(c, master, 0.24, 700, 2600, 0.09)
      tone(c, master, { type: 'sine', from: 1174.7, at: 0.05, dur: 0.12, gain: 0.08 })
      break
    case 'boot': {
      // Slow swelling pad (A major add9) with a bell shimmer on top
      const out = withEcho(c, 0.23, 0.35, 7)
      ;[220, 329.6, 440, 554.4, 659.3, 987.8].forEach((f, i) =>
        tone(c, out, { type: i < 3 ? 'sine' : 'triangle', from: f, dur: 4.2, gain: i < 3 ? 0.07 : 0.025, attack: 1.6 }),
      )
      ;[1760, 2217.5, 2637].forEach((f, i) => tone(c, out, { type: 'sine', from: f, at: 1.25 + i * 0.12, dur: 1.6, gain: 0.035 }))
      break
    }
  }
}

export function isMuted() {
  return muted
}

/** Shared AudioContext (created/resumed lazily; null on the server or before support). */
export function audioContext() {
  return audio()
}

/** The shared AudioContext if something already created it; never creates one. */
export function existingAudioContext() {
  return ctx
}

/** Run cb whenever mute changes. Returns an unsubscribe function. */
export function onMutedChange(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function setMuted(next: boolean) {
  muted = next
  try {
    localStorage.setItem(STORAGE_KEY, next ? 'off' : 'on')
  } catch {
    /* not persisted */
  }
  if (!next) audio()
  listeners.forEach((l) => l())
}

export function useMuted() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => muted,
    () => false,
  )
}
