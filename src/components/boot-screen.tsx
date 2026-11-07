import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { audioContext, isMuted } from '#/lib/sfx'
import { holdMusic } from '#/lib/music'
import { useLite } from '#/lib/perf'
import { runSting } from '#/components/boot-sting'

/**
 * Console-style start screen, once per browser session (never on a reload; any key or click skips it).
 * A direct /stories link powers on like the console: KX mark, "Click to continue", the burst, then the intro and startup sound.
 */

const SESSION_KEY = 'kx_boot_seen'
const FADE_IN = 2.2
const HOLD_UNTIL_MS = 6000
const FADE_OUT = 1.5
const FAST_OUT = 0.28
const CURTAIN_OUT = 0.9
const FAST_CURTAIN = 0.3
const EASE = [0.4, 0, 0.2, 1] as const
const MARK_MS = 1500 // KX mark on black, like the console logo at power-on

const STING_SRC = '/sfx/ps5-continue.mp3'
const STARTUP_SRC = '/sfx/ps5-startup.mp3'
// The burst is timed from the moment the continue sound reaches 0.094s in (the
// file opens with a little silence), so playback starts there
const STING_SKIP = 0.094
const STING_LEN = 6.338 // played length after the skip; used only if the file can't be decoded
const STING_GAIN = 0.9
const UNICORN_SRC = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.30/dist/unicornStudio.umd.js'

// mark, waiting: direct load, before the press. sting: the burst after it.
type Phase = 'off' | 'curtain' | 'mark' | 'waiting' | 'sting' | 'playing' | 'leaving' | 'lifting'
type BootMode = 'direct' | 'nav' | 'no'

/** Set once per page load so a hydration remount does not drop the direct-load screen. */
let bootMode: BootMode | null = null

/** Inline script for <head>. On a direct load it blacks the page out before first paint,
 * preloads the KX mark, and starts downloading both sounds so the press has them ready. */
export const BOOT_HEAD_SCRIPT = `try{if(typeof window.__kxBoot!=='boolean'){var n=performance.getEntriesByType('navigation')[0];window.__kxBoot=!sessionStorage.getItem('${SESSION_KEY}')&&!(n&&n.type==='reload');if(window.__kxBoot){document.documentElement.classList.add('kx-boot');window.__kxBootDirect=true;var l=document.createElement('link');l.rel='preload';l.as='image';l.href='/brand/kx-mark.webp';document.head.appendChild(l);if(localStorage.getItem('kx_sound')!=='off'){var b=window.__kxBootBytes={};['${STING_SRC}','${STARTUP_SRC}'].forEach(function(u){b[u]=fetch(u).then(function(r){return r.ok?r.arrayBuffer():null}).catch(function(){return null})})}}}}catch(e){}`

declare global {
  interface Window {
    __kxBoot?: boolean
    __kxBootDirect?: boolean
    __kxBootActive?: boolean
    __kxBootAudio?: HTMLAudioElement
    __kxBootHeard?: boolean
    __kxBootBytes?: Record<string, Promise<ArrayBuffer | null>>
    __kxStingT?: number // dev only: freeze the burst at this time (for frame checks)
    UnicornStudio?: {
      isInitialized?: boolean
      init?: () => Promise<unknown>
      unbindEvents?: () => void
      destroy?: () => void
    }
    __kxUnicorn?: Promise<unknown>
  }
}

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function decideBoot() {
  // Full page load: the head script already decided (first visit, not a reload)
  if (typeof window.__kxBoot === 'boolean') {
    const v = window.__kxBoot
    window.__kxBoot = false
    return v
  }
  // In-site navigation: once per session
  try {
    return !sessionStorage.getItem(SESSION_KEY)
  } catch {
    return false
  }
}

function takeBoot(): BootMode {
  if (bootMode) return bootMode
  if (!decideBoot()) return (bootMode = 'no')
  const direct = window.__kxBootDirect === true
  window.__kxBootDirect = false
  return (bootMode = direct ? 'direct' : 'nav')
}

// Both sounds go through Web Audio: the press unlocks it, the continue sound starts at once and the startup
// sound is scheduled to the sample where it ends, so the picture can follow one clock

function soundBytes(src: string) {
  const cache = (window.__kxBootBytes ??= {})
  return (cache[src] ??= fetch(src)
    .then((r) => (r.ok ? r.arrayBuffer() : null))
    .catch(() => null))
}

function decode(ctx: AudioContext, bytes: ArrayBuffer | null) {
  return new Promise<AudioBuffer | null>((resolve) => {
    if (!bytes) return resolve(null)
    try {
      // Callback form for older Safari; slice because decoding detaches the buffer
      const p = ctx.decodeAudioData(bytes.slice(0), resolve, () => resolve(null)) as Promise<AudioBuffer> | undefined
      p?.catch(() => resolve(null))
    } catch {
      resolve(null)
    }
  })
}

type BootSound = {
  /** Seconds since the continue sound started (follows the audio clock); null until it starts */
  time: () => number | null
  stop: (fade?: number) => void
  /** performance.now() time the startup sound ends, or 0 if it isn't playing */
  startupEndsAt: () => number
  /** False when the burst runs without sound (muted, or audio unavailable) */
  audible: () => boolean
}

function startBootSounds(onEnd: () => void): BootSound {
  let done = false
  const finish = () => {
    if (done) return
    done = true
    onEnd()
  }
  const press = performance.now()
  const ctx = isMuted() ? null : audioContext()
  let len = STING_LEN
  let at = 0 // context time the continue sound starts
  let scheduled = false
  let free = false // running on the page clock instead of the audio clock
  let perf0 = 0
  let anchored = false
  let dead = false
  let startupEnd = 0
  const nodes: AudioBufferSourceNode[] = []
  const gains: GainNode[] = []
  const timers: number[] = []

  const silence = (fade: number) => {
    if (!ctx) return
    const now = ctx.currentTime
    for (const g of gains) {
      g.gain.cancelScheduledValues(now)
      g.gain.setValueAtTime(g.gain.value, now)
      g.gain.linearRampToValueAtTime(0, now + fade)
    }
    for (const n of nodes) {
      try {
        n.stop(now + fade + 0.05)
      } catch {
        /* never started */
      }
    }
  }

  // No usable audio: run the burst on the page clock, silently
  const goFree = (from: number) => {
    if (free || done) return
    free = true
    perf0 = from
    silence(0.05)
    nodes.length = 0
    timers.push(window.setTimeout(finish, Math.max(0, len * 1000 - (performance.now() - from))))
  }

  const running = () => !!ctx && ctx.state === 'running' && scheduled && ctx.currentTime >= at - 0.1

  if (!ctx) goFree(press)
  else {
    // The picture waits for the sound, but not for long
    timers.push(
      window.setTimeout(() => {
        if (!running()) goFree(performance.now())
      }, 1200),
    )
    void soundBytes(STING_SRC)
      .then((b) => decode(ctx, b))
      .then((buf) => {
        if (dead || free) return
        if (!buf) return goFree(performance.now())
        const skip = Math.min(STING_SKIP, buf.duration / 2)
        len = buf.duration - skip
        const src = ctx.createBufferSource()
        src.buffer = buf
        const g = ctx.createGain()
        g.gain.value = STING_GAIN
        src.connect(g).connect(ctx.destination)
        at = ctx.currentTime + 0.03
        src.start(at, skip)
        src.onended = finish
        nodes.push(src)
        gains.push(g)
        scheduled = true
        // In case the end event never comes (suspended context, background tab)
        timers.push(window.setTimeout(finish, (at - ctx.currentTime + len) * 1000 + 1500))
        return soundBytes(STARTUP_SRC)
          .then((b) => decode(ctx, b))
          .then((sb) => {
            if (!sb || dead || free) return
            const when = at + len
            if (ctx.currentTime > when + 1.5) return // far too late to belong to the intro
            const s = ctx.createBufferSource()
            s.buffer = sb
            const sg = ctx.createGain()
            sg.gain.value = 1
            s.connect(sg).connect(ctx.destination)
            const start = Math.max(when, ctx.currentTime)
            s.start(start)
            s.onended = () => {
              startupEnd = 0
            }
            nodes.push(s)
            gains.push(sg)
            startupEnd = performance.now() + (start - ctx.currentTime + sb.duration) * 1000
          })
      })
  }

  return {
    time() {
      const now = performance.now()
      if (free) return (now - perf0) / 1000
      if (!ctx || !scheduled) return null
      const lat = ctx.outputLatency || ctx.baseLatency || 0
      const audioT = ctx.currentTime - at - lat
      if (audioT < 0 && !anchored) return null
      // Follow the page clock between audio clock updates (they come in chunks),
      // and snap back to the audio whenever the two drift apart
      if (!anchored || Math.abs((now - perf0) / 1000 - audioT) > 0.05) {
        perf0 = now - audioT * 1000
        anchored = true
      }
      return Math.max(0, (now - perf0) / 1000)
    },
    stop(fade = 0.25) {
      dead = true
      silence(fade)
      startupEnd = 0
      timers.forEach(clearTimeout)
    },
    startupEndsAt: () => startupEnd,
    audible: () => !free,
  }
}

export function BootScreen({ wordmark = 'KuletX AI' }: { wordmark?: string }) {
  const [phase, setPhase] = useState<Phase>('off')
  const [fast, setFast] = useState(false)
  const reduce = useReducedMotion()
  const lite = useLite()
  const timers = useRef<number[]>([])
  const decision = useRef<BootMode | null>(null)
  const startup = useRef<HTMLAudioElement | null>(null)
  const blocked = useRef(false)
  const sound = useRef<BootSound | null>(null)
  const launched = useRef(false)
  const alive = useRef(true)
  const phaseRef = useRef<Phase>('off')
  phaseRef.current = phase
  const armStartup = useCallback(() => {
    if (isMuted()) {
      window.__kxBootAudio?.pause()
      return null
    }
    if (!startup.current) {
      const audio = document.createElement('audio')
      audio.id = 'kx-boot-audio'
      audio.src = STARTUP_SRC
      audio.preload = 'auto'
      audio.volume = 1
      audio.setAttribute('playsinline', '')
      audio.style.display = 'none'
      document.documentElement.appendChild(audio)
      audio.addEventListener('playing', () => {
        window.__kxBootHeard = true
      })
      startup.current = audio
      window.__kxBootAudio = audio
    }
    const audio = startup.current
    audio.volume = 1
    if (audio.paused)
      void audio.play().catch((e: unknown) => {
        if ((e as Error)?.name === 'NotAllowedError') blocked.current = true
      })
    return audio
  }, [])

  // Can the startup sound play without a press? A blocked play() rejects at once;
  // anything still pending after a moment is just loading, so treat it as allowed.
  const soundAllowed = (audio: HTMLAudioElement) =>
    new Promise<boolean>((resolve) => {
      if (window.__kxBootHeard || !audio.paused) return resolve(true)
      const id = window.setTimeout(() => resolve(true), 500)
      audio.play().then(
        () => {
          clearTimeout(id)
          resolve(true)
        },
        (e: unknown) => {
          clearTimeout(id)
          resolve((e as Error)?.name !== 'NotAllowedError')
        },
      )
    })

  // In-site: fade the scene in now and leave after the hold
  const begin = useCallback(() => {
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'curtain' ? 'playing' : p)), 250))
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'playing' ? 'leaving' : p)), 250 + HOLD_UNTIL_MS))
  }, [])

  // The press: play the continue sound and the burst, then the intro once the sound ends
  const launch = useCallback(() => {
    if (launched.current) return
    launched.current = true
    // A startup sound the browser blocked on the homepage path: the burst owns the sound now
    const el = startup.current
    if (el) {
      el.pause()
      el.currentTime = 0
    }
    startup.current = null
    blocked.current = false
    const bootSound = startBootSounds(() => {
      if (!alive.current) return
      // Audio unavailable: try the startup on its own (the press counts as a click)
      if (!bootSound.audible() && !isMuted()) armStartup()
      setPhase((p) => (p === 'sting' ? 'playing' : p))
      timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'playing' ? 'leaving' : p)), HOLD_UNTIL_MS))
    })
    sound.current = bootSound
    setPhase('sting')
  }, [armStartup])

  useIsoLayoutEffect(() => {
    alive.current = true
    if (decision.current === null) decision.current = takeBoot()
    document.documentElement.classList.remove('kx-boot')
    const mode = decision.current
    if (!mode || mode === 'no') return
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* private mode: boot may replay, that's fine */
    }
    holdMusic(true)
    let live = true
    if (mode === 'direct') {
      setPhase((p) => (p === 'off' ? 'mark' : p))
      timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'mark' ? 'waiting' : p)), MARK_MS))
      // Fetch the WebGL scene's script while the screen waits; it starts after the press
      if (!document.querySelector(`link[href="${UNICORN_SRC}"]`)) {
        const l = document.createElement('link')
        l.rel = 'preload'
        l.as = 'script'
        l.href = UNICORN_SRC
        document.head.appendChild(l)
      }
      if (!isMuted()) {
        void soundBytes(STING_SRC)
        void soundBytes(STARTUP_SRC)
      }
    } else {
      setPhase((p) => (p === 'off' ? 'curtain' : p))
      const audio = armStartup()
      if (!audio) begin()
      else
        void soundAllowed(audio).then((ok) => {
          if (!live) return
          if (ok) begin()
          else setPhase('waiting')
        })
    }
    return () => {
      live = false
      alive.current = false
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [armStartup, begin])

  // Lets other input (the gamepad) know the start screen is up
  useEffect(() => {
    window.__kxBootActive = phase !== 'off' && phase !== 'lifting'
    return () => {
      window.__kxBootActive = false
    }
  }, [phase])

  // Hub music waits until the start screen is gone, and until the startup sound ends
  const started = useRef(false)
  useEffect(() => {
    if (phase !== 'off') {
      started.current = true
      holdMusic(true)
      return
    }
    if (started.current) bootMode = 'no'
    // First render, before the start screen has shown: keep holding
    if (decision.current && decision.current !== 'no' && !started.current) return
    const audio = startup.current
    if (audio && !audio.paused && !audio.ended) {
      const release = () => holdMusic(false)
      audio.addEventListener('ended', release, { once: true })
      return () => audio.removeEventListener('ended', release)
    }
    const left = (sound.current?.startupEndsAt() ?? 0) - performance.now()
    holdMusic(false, left > 0 ? left + 60 : 0)
  }, [phase])

  const skip = useCallback(
    (key?: string) => {
      const ph = phaseRef.current
      // Waiting for a press (or still on the mark): this one starts it all
      if (ph === 'mark' || ph === 'waiting') {
        launch()
        return
      }
      // The burst plays through, like the console; Escape still skips everything
      if (ph === 'sting' && key !== 'Escape') return
      const audio = startup.current ?? window.__kxBootAudio
      // The sound was still blocked after all: this press starts it instead of skipping
      if (audio && blocked.current && !window.__kxBootHeard) {
        blocked.current = false
        void audio.play().catch(() => {})
        return
      }
      audio?.pause()
      sound.current?.stop(0.25)
      setFast(true)
      setPhase((p) => (p === 'curtain' || p === 'sting' || p === 'playing' ? 'leaving' : p))
    },
    [launch],
  )

  // Any key or click skips (or starts); capture so the hub doesn't also react.
  // Browser shortcuts and held-down keys are left alone.
  useEffect(() => {
    if (phase === 'off' || phase === 'lifting') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey || /^F\d{1,2}$/.test(e.key)) return
      if (e.key === 'Shift' || e.key === 'CapsLock') return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.repeat) return
      skip(e.key)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [phase, skip])

  // Safety nets in case an animation is interrupted and never reports completion
  useEffect(() => {
    if (phase === 'leaving') {
      const id = window.setTimeout(() => setPhase('lifting'), (fast ? FAST_OUT : FADE_OUT) * 1000 + 120)
      return () => clearTimeout(id)
    }
    if (phase === 'lifting') {
      const id = window.setTimeout(() => setPhase('off'), (fast ? FAST_CURTAIN : CURTAIN_OUT) * 1000 + 120)
      return () => clearTimeout(id)
    }
  }, [phase, fast])

  if (phase === 'off') return null

  const outDur = fast ? FAST_OUT : FADE_OUT
  const curtainDur = fast ? FAST_CURTAIN : CURTAIN_OUT
  const fadeIn = lite || reduce ? 0.7 : FADE_IN
  const sceneVisible = phase === 'playing'
  const stingOn = launched.current && (phase === 'sting' || phase === 'playing' || (phase === 'leaving' && fast))
  // The WebGL scene only runs once it's about to be seen (it renders every frame)
  const stageOn = !reduce && !lite && phase !== 'mark' && phase !== 'waiting'
  const line = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 'Tap to continue' : 'Click to continue'

  return (
    <div className="kx-boot-root" data-phase={phase} aria-hidden={phase === 'lifting'}>
      {/* Solid black curtain under the scene; lifts last to reveal the hub */}
      <motion.div
        className="kx-boot-curtain"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === 'lifting' ? 0 : 1 }}
        transition={{ duration: curtainDur, ease: EASE }}
        onAnimationComplete={() => {
          if (phase === 'lifting') setPhase('off')
        }}
      />

      {stingOn && sound.current && <StingLayer sound={sound.current} lite={lite} still={!!reduce} phase={phase} fast={fast} />}

      {/* Direct link: the KX mark on black, like the console logo at power-on */}
      <AnimatePresence>
        {phase === 'mark' && (
          <motion.img
            key="mark"
            src="/brand/kx-mark.webp"
            alt=""
            className="kx-boot-mark"
            width={240}
            height={224}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.32, ease: EASE } }}
            transition={{ duration: 0.45, ease: EASE }}
          />
        )}
      </AnimatePresence>

      {/* Then one line on black, where the console shows its health notice */}
      <AnimatePresence>
        {phase === 'waiting' && (
          <motion.p
            key="continue"
            className="kx-boot-continue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.85, delay: 0.3, ease: EASE } }}
            transition={{ duration: 0.45, delay: 0.38, ease: EASE }}
          >
            {line}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase !== 'lifting' && (
          <motion.div
            key="scene"
            className="kx-boot-screen"
            role="dialog"
            aria-label={`${wordmark} start screen`}
            onClick={() => skip()}
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneVisible ? 1 : 0 }}
            transition={{ duration: sceneVisible ? fadeIn : outDur, ease: EASE }}
            onAnimationComplete={() => {
              if (phase === 'leaving') setPhase('lifting')
            }}
          >
            {stageOn && <UnicornStage />}
            <motion.h1
              className="kx-boot-title"
              initial={lite || reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
              animate={sceneVisible ? (lite || reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }) : { opacity: 0 }}
              transition={{ duration: sceneVisible ? fadeIn : outDur, ease: EASE, delay: sceneVisible && !lite && !reduce ? 0.35 : 0 }}
            >
              <img src="/brand/kuletx-ai-1200.webp" alt={wordmark} className="kx-boot-logo" width={1200} height={412} />
            </motion.h1>
            <motion.p
              className="kx-boot-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: sceneVisible ? 0.8 : 0 }}
              transition={{ duration: 0.6, delay: sceneVisible ? 1.2 : 0 }}
            >
              Press any key or click to skip
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * The burst: soft light under the intro, dust over it. The light holds until the scene covers it and the dust
 * keeps drifting over the KuletX scene before it fades, so the hand-over has no seam.
 */
function StingLayer({ sound, lite, still, phase, fast }: { sound: BootSound; lite: boolean; still: boolean; phase: Phase; fast: boolean }) {
  const atmo = useRef<HTMLCanvasElement>(null)
  const dust = useRef<HTMLCanvasElement>(null)
  const opts = useRef({ lite, still })
  useEffect(() => {
    if (!atmo.current || !dust.current) return
    const clock = import.meta.env.DEV ? () => window.__kxStingT ?? sound.time() : sound.time
    return runSting(atmo.current, dust.current, clock, opts.current)
  }, [sound])
  const out = phase !== 'sting'
  const quick = fast ? FAST_OUT : 0.6
  // Lite has no WebGL scene to cover the light, so it simply fades out under the wordmark
  const atmoOut = phase === 'leaving' ? `opacity ${quick}s linear` : lite || still ? 'opacity 1.4s ease 0.2s' : 'opacity 1.6s ease 1.2s'
  const dustOut = phase === 'leaving' ? `opacity ${quick}s linear` : 'opacity 3s ease-in 0.8s'
  return (
    <>
      <canvas ref={atmo} className="kx-sting-atmo" aria-hidden style={{ opacity: out ? 0 : 1, transition: out ? atmoOut : 'none' }} />
      <canvas ref={dust} className="kx-sting-dust" aria-hidden style={{ opacity: out ? 0 : 1, transition: out ? dustOut : 'none' }} />
    </>
  )
}

function loadUnicorn() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.__kxUnicorn) return window.__kxUnicorn
  window.__kxUnicorn = new Promise((resolve) => {
    const finish = () => {
      const us = window.UnicornStudio
      if (!us?.init || us.isInitialized) {
        resolve(null)
        return
      }
      us.init()
        .then((scenes) => {
          us.isInitialized = true
          resolve(scenes)
        })
        .catch(() => resolve(null))
    }
    if (window.UnicornStudio?.init) {
      finish()
      return
    }
    const script = document.createElement('script')
    script.src = UNICORN_SRC
    script.onload = () => finish()
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
  return window.__kxUnicorn
}

function stopUnicorn() {
  const us = window.UnicornStudio
  if (!us?.isInitialized) return
  try {
    us.destroy?.()
  } catch {
    /* already gone */
  }
  us.isInitialized = false
  window.__kxUnicorn = undefined
}

/** WebGL startup scene from the PS5 boot (Unicorn Studio). Fades with the wordmark. */
function UnicornStage() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const project = ref.current
    if (!project) return
    const mobile = window.matchMedia('(max-width: 880px)').matches
    project.setAttribute('data-us-dpi', mobile ? '0.8' : '1')
    project.setAttribute('data-us-fps', mobile ? '30' : '35')
    project.setAttribute('data-us-disablemobile', 'false')
    let alive = true
    void loadUnicorn().then(() => {
      if (!alive) stopUnicorn() // closed while it was still loading
    })
    // The scene renders every frame until destroyed, even after its canvas is
    // gone, so shut it down as soon as the start screen closes
    return () => {
      alive = false
      stopUnicorn()
    }
  }, [])
  return (
    <div className="kx-boot-stage" aria-hidden>
      <div className="kx-boot-studio">
        <div
          ref={ref}
          data-us-project="N9XzvQXu7fA5SY2ewADJ"
          data-us-dpi="1"
          data-us-fps="35"
          data-us-scale="1"
          data-us-production="true"
          data-us-lazyload="false"
          data-us-disablemouse="true"
          data-us-disablemobile="false"
        />
      </div>
      <div className="kx-boot-noise" />
    </div>
  )
}
