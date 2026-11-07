import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { isMuted } from '#/lib/sfx'
import { holdMusic } from '#/lib/music'
import { useLite } from '#/lib/perf'

/**
 * Console-style start screen: black curtain, the PS5 WebGL scene and wordmark
 * fade in together with the startup sound, hold, then fade out to the hub.
 * Plays once per browser session, never on a reload, and any key or click skips it.
 */

const SESSION_KEY = 'kx_boot_seen'
const FADE_IN = 2.2
const HOLD_UNTIL_MS = 6000
const FADE_OUT = 1.5
const FAST_OUT = 0.28
const CURTAIN_OUT = 0.9
const FAST_CURTAIN = 0.3
const EASE = [0.4, 0, 0.2, 1] as const

// waiting: the browser blocked the startup sound; hold on black until a press starts it
type Phase = 'off' | 'curtain' | 'waiting' | 'playing' | 'leaving' | 'lifting'

/** Inline script for <head>: blacks out the page and tries to start the startup sound before
 * first paint. The element has to live in the document. A detached Audio() plus a seek aborts
 * the one gesture-less play() browsers allow on a direct /stories/* load. If the browser blocks
 * it (no click on the site yet), the start screen waits for a press instead (see 'waiting'). */
export const BOOT_HEAD_SCRIPT = `try{if(typeof window.__kxBoot!=='boolean'){var n=performance.getEntriesByType('navigation')[0];window.__kxBoot=!sessionStorage.getItem('${SESSION_KEY}')&&!(n&&n.type==='reload');if(window.__kxBoot){document.documentElement.classList.add('kx-boot');if(localStorage.getItem('kx_sound')!=='off'){var a=document.createElement('audio');a.id='kx-boot-audio';a.src='/sfx/ps5-startup.mp3';a.preload='auto';a.autoplay=true;a.volume=1;a.setAttribute('playsinline','');a.style.display='none';document.documentElement.appendChild(a);window.__kxBootAudio=a;window.__kxBootHeard=false;a.addEventListener('playing',function(){window.__kxBootHeard=true});var p=a.play();if(p&&p.catch)p.catch(function(){})}}}}catch(e){}`

declare global {
  interface Window {
    __kxBoot?: boolean
    __kxBootActive?: boolean
    __kxBootAudio?: HTMLAudioElement
    __kxBootHeard?: boolean
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

export function BootScreen({ wordmark = 'KuletX AI' }: { wordmark?: string }) {
  const [phase, setPhase] = useState<Phase>('off')
  const [fast, setFast] = useState(false)
  const reduce = useReducedMotion()
  const lite = useLite()
  const timers = useRef<number[]>([])
  const decision = useRef<boolean | null>(null)
  const startup = useRef<HTMLAudioElement | null>(null)
  const blocked = useRef(false)
  const phaseRef = useRef<Phase>('off')
  phaseRef.current = phase
  const armStartup = useCallback(() => {
    if (isMuted()) {
      window.__kxBootAudio?.pause()
      return null
    }
    if (!startup.current) {
      const early = window.__kxBootAudio
      if (early) startup.current = early
      else {
        const audio = document.createElement('audio')
        audio.src = '/sfx/ps5-startup.mp3'
        audio.preload = 'auto'
        audio.autoplay = true
        audio.volume = 1
        audio.setAttribute('playsinline', '')
        document.documentElement.appendChild(audio)
        audio.addEventListener('playing', () => {
          window.__kxBootHeard = true
        })
        startup.current = audio
        window.__kxBootAudio = audio
      }
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

  // Fade the scene in now and leave after the hold
  const begin = useCallback(() => {
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'curtain' ? 'playing' : p)), 250))
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'playing' ? 'leaving' : p)), 250 + HOLD_UNTIL_MS))
  }, [])

  useIsoLayoutEffect(() => {
    if (decision.current === null) decision.current = decideBoot()
    document.documentElement.classList.remove('kx-boot')
    if (!decision.current) return
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* private mode: boot may replay, that's fine */
    }
    setPhase((p) => (p === 'off' ? 'curtain' : p))
    // Keep the hub's music back from the very first frame (its effect runs after this one)
    holdMusic(true)
    const audio = armStartup()
    let live = true
    if (!audio) begin() // sound off: nothing to wait for
    else
      void soundAllowed(audio).then((ok) => {
        if (!live) return
        // Let the black curtain paint, then start the synced fade-in. When the
        // browser blocked the sound, wait for a press so they start together.
        if (ok) begin()
        else setPhase((p) => (p === 'curtain' ? 'waiting' : p))
      })
    return () => {
      live = false
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [armStartup, begin])

  // Lets other input (the gamepad) know the start screen is up
  useEffect(() => {
    window.__kxBootActive = phase === 'curtain' || phase === 'waiting' || phase === 'playing' || phase === 'leaving'
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
    // First render, before the start screen has shown: keep holding
    if (decision.current && !started.current) return
    const audio = startup.current
    if (audio && !audio.paused && !audio.ended) {
      const release = () => holdMusic(false)
      audio.addEventListener('ended', release, { once: true })
      return () => audio.removeEventListener('ended', release)
    }
    holdMusic(false)
  }, [phase])

  const skip = useCallback(() => {
    const audio = startup.current ?? window.__kxBootAudio
    // Waiting for a press: this one starts the sound and the intro together
    if (phaseRef.current === 'waiting') {
      blocked.current = false
      if (audio) void audio.play().catch(() => {})
      setPhase('curtain')
      begin()
      return
    }
    // The sound was still blocked after all: this press starts it instead of skipping
    if (audio && blocked.current && !window.__kxBootHeard) {
      blocked.current = false
      void audio.play().catch(() => {})
      return
    }
    audio?.pause()
    setFast(true)
    setPhase((p) => (p === 'curtain' || p === 'playing' ? 'leaving' : p))
  }, [begin])

  // Any key (except Tab) or click skips; capture so the hub doesn't also react
  useEffect(() => {
    if (phase === 'off' || phase === 'lifting') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return
      e.preventDefault()
      e.stopImmediatePropagation()
      skip()
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
  const sceneVisible = phase === 'playing'

  return (
    <div className="kx-boot-root" aria-hidden={phase === 'lifting'}>
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

      {/* Browser blocked the sound: a console-style "press to start" */}
      <AnimatePresence>
        {phase === 'waiting' && (
          <motion.p
            key="start"
            className="kx-boot-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 'Tap to start' : 'Press any key or click to start'}
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
            onClick={skip}
            initial={{ opacity: 0 }}
            animate={{ opacity: sceneVisible ? 1 : 0 }}
            transition={{ duration: sceneVisible ? FADE_IN : outDur, ease: EASE }}
            onAnimationComplete={() => {
              if (phase === 'leaving') setPhase('lifting')
            }}
          >
            {!reduce && !lite && <UnicornStage />}
            <motion.h1
              className="kx-boot-title"
              initial={{ opacity: 0, scale: 0.96, filter: 'blur(6px)' }}
              animate={sceneVisible ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : { opacity: 0 }}
              transition={{ duration: sceneVisible ? FADE_IN : outDur, ease: EASE, delay: sceneVisible ? 0.35 : 0 }}
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

const UNICORN_SRC = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.30/dist/unicornStudio.umd.js'

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
