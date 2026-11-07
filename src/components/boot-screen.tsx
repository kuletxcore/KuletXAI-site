import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { isMuted } from '#/lib/sfx'
import { holdMusic } from '#/lib/music'
import { useLite } from '#/lib/perf'

/**
 * Console-style start screen: black curtain, the PS5 WebGL scene and wordmark
 * fade in together with the startup sound, hold, then fade out to the hub.
 * Plays once per browser session, never on a reload, and any key or click skips it.
 *
 * A direct /stories link has no click yet, so the browser will not play the
 * startup. That load opens on a black screen with one line, the PS5 continue
 * sting under it, and no button. The press bursts particles, then the KuletX
 * intro fades in over them. Coming from the homepage already has a click, so
 * that path starts the intro immediately.
 */

const SESSION_KEY = 'kx_boot_seen'
const FADE_IN = 2.2
const HOLD_UNTIL_MS = 6000
const FADE_OUT = 1.5
const FAST_OUT = 0.28
const CURTAIN_OUT = 0.9
const FAST_CURTAIN = 0.3
const EASE = [0.4, 0, 0.2, 1] as const
const BURST_MS = 880 // particles own the frame, then the intro fades in over them
const BURST_MS_LITE = 420

type Phase = 'off' | 'curtain' | 'waiting' | 'burst' | 'playing' | 'leaving' | 'lifting'
type BootMode = 'direct' | 'nav' | 'no'

/** Set once per page load so a hydration remount does not drop the direct-load screen. */
let bootMode: BootMode | null = null

/** Inline script for <head>. On a direct load it blacks the page out and starts the
 * continue sting (not the startup). The element has to live in the document. */
export const BOOT_HEAD_SCRIPT = `try{if(typeof window.__kxBoot!=='boolean'){var n=performance.getEntriesByType('navigation')[0];window.__kxBoot=!sessionStorage.getItem('${SESSION_KEY}')&&!(n&&n.type==='reload');if(window.__kxBoot){document.documentElement.classList.add('kx-boot');window.__kxBootDirect=true;if(localStorage.getItem('kx_sound')!=='off'){var a=document.createElement('audio');a.id='kx-continue-audio';a.src='/sfx/ps5-continue.mp3';a.preload='auto';a.autoplay=true;a.volume=0.9;a.setAttribute('playsinline','');a.style.display='none';document.documentElement.appendChild(a);window.__kxContinueAudio=a;var p=a.play();if(p&&p.catch)p.catch(function(){})}}}}catch(e){}`

declare global {
  interface Window {
    __kxBoot?: boolean
    __kxBootDirect?: boolean
    __kxBootActive?: boolean
    __kxBootAudio?: HTMLAudioElement
    __kxContinueAudio?: HTMLAudioElement
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

function takeBoot(): BootMode {
  if (bootMode) return bootMode
  if (!decideBoot()) return (bootMode = 'no')
  const direct = window.__kxBootDirect === true
  window.__kxBootDirect = false
  return (bootMode = direct ? 'direct' : 'nav')
}

function armContinue() {
  if (isMuted()) return
  let audio = window.__kxContinueAudio
  if (!audio) {
    audio = document.createElement('audio')
    audio.src = '/sfx/ps5-continue.mp3'
    audio.preload = 'auto'
    audio.autoplay = true
    audio.volume = 0.9
    audio.setAttribute('playsinline', '')
    audio.style.display = 'none'
    document.documentElement.appendChild(audio)
    window.__kxContinueAudio = audio
  }
  if (audio.paused) void audio.play().catch(() => {})
}

function fadeContinue(instant: boolean) {
  const audio = window.__kxContinueAudio
  if (!audio || audio.paused) return
  if (instant) {
    audio.pause()
    return
  }
  const from = audio.volume
  const t0 = performance.now()
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / 420)
    audio.volume = from * (1 - k)
    if (k < 1) requestAnimationFrame(step)
    else {
      audio.pause()
      audio.volume = from
    }
  }
  step()
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
  const liteRef = useRef(lite)
  liteRef.current = lite || !!reduce
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
      audio.src = '/sfx/ps5-startup.mp3'
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

  // Direct load: the press is the gesture. Particles first, then the intro.
  const launch = useCallback(() => {
    fadeContinue(liteRef.current)
    blocked.current = false
    const audio = armStartup()
    if (audio && audio.paused) void audio.play().catch(() => {})
    const wait = liteRef.current ? BURST_MS_LITE : BURST_MS
    setPhase('burst')
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'burst' ? 'playing' : p)), wait))
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'playing' ? 'leaving' : p)), wait + HOLD_UNTIL_MS))
  }, [armStartup])

  useIsoLayoutEffect(() => {
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
      setPhase((p) => (p === 'off' ? 'waiting' : p))
      armContinue()
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
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [armStartup, begin])

  // Lets other input (the gamepad) know the start screen is up
  useEffect(() => {
    window.__kxBootActive = phase === 'curtain' || phase === 'waiting' || phase === 'burst' || phase === 'playing' || phase === 'leaving'
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
    holdMusic(false)
  }, [phase])

  const skip = useCallback(() => {
    const audio = startup.current ?? window.__kxBootAudio
    if (phaseRef.current === 'waiting') {
      launch()
      return
    }
    // The sound was still blocked after all: this press starts it instead of skipping
    if (audio && blocked.current && !window.__kxBootHeard) {
      blocked.current = false
      void audio.play().catch(() => {})
      return
    }
    audio?.pause()
    fadeContinue(true)
    setFast(true)
    setPhase((p) => (p === 'curtain' || p === 'burst' || p === 'playing' ? 'leaving' : p))
  }, [launch])

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
  const fadeIn = lite || reduce ? 0.7 : FADE_IN
  const sceneVisible = phase === 'playing'
  const bursting = phase === 'burst' || phase === 'playing' || phase === 'leaving'
  const line = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 'Tap to continue' : 'Click to continue'

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

      {bursting && (
        <div className={`kx-burst ${phase === 'burst' ? '' : 'is-out'}`}>
          {lite || reduce ? <div className="kx-burst-lite" /> : <BurstCanvas />}
          {!lite && !reduce && <span className="kx-boot-ray" />}
        </div>
      )}

      <AnimatePresence>
        {phase === 'waiting' && (
          <motion.div
            key="continue"
            className="kx-boot-continue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <p>{line}</p>
            <div className="kx-boot-emblem">
              <span className="kx-boot-ring" />
              <img src="/brand/kx-boot.webp" alt="" width={500} height={500} />
            </div>
          </motion.div>
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
            transition={{ duration: sceneVisible ? fadeIn : outDur, ease: EASE }}
            onAnimationComplete={() => {
              if (phase === 'leaving') setPhase('lifting')
            }}
          >
            {!reduce && !lite && <UnicornStage />}
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

const UNICORN_SRC = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.30/dist/unicornStudio.umd.js'

/** Particles thrown out from the middle of the screen, then left to drift. Full mode only. */
function BurstCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d', { alpha: true })
    if (!canvas || !ctx) return
    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 32
    const sg = sprite.getContext('2d')
    if (!sg) return
    const glow = sg.createRadialGradient(16, 16, 0, 16, 16, 16)
    glow.addColorStop(0, 'rgba(255,248,236,1)')
    glow.addColorStop(0.4, 'rgba(255,232,196,0.45)')
    glow.addColorStop(1, 'rgba(255,232,196,0)')
    sg.fillStyle = glow
    sg.fillRect(0, 0, 32, 32)

    let w = 0
    let h = 0
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
    const fit = () => {
      w = canvas.clientWidth || window.innerWidth
      h = canvas.clientHeight || window.innerHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    type Dot = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; orb: boolean }
    const count = w < 700 ? 70 : 130
    const dots: Dot[] = []
    const cx = w / 2
    const cy = h * 0.48
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2
      const speed = 40 + Math.random() ** 0.45 * (w < 700 ? 280 : 460)
      const orb = i < (w < 700 ? 4 : 9)
      dots.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 30,
        life: 0,
        max: 1.4 + Math.random() * 2.1,
        r: orb ? 7 + Math.random() * 16 : 0.5 + Math.random() * 1.8,
        orb,
      })
    }
    let last = performance.now()
    const draw = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000)
      last = now
      ctx.clearRect(0, 0, w, h)
      let alive = 0
      for (const d of dots) {
        d.life += dt
        if (d.life >= d.max) continue
        alive++
        d.vy += 8 * dt
        d.vx *= 0.985
        d.vy *= 0.985
        d.x += d.vx * dt
        d.y += d.vy * dt
        const fade = Math.min(1, d.life / 0.12) * (1 - d.life / d.max)
        if (d.orb) {
          ctx.globalAlpha = fade * 0.85
          ctx.drawImage(sprite, d.x - d.r, d.y - d.r, d.r * 2, d.r * 2)
        } else {
          ctx.globalAlpha = fade
          ctx.fillStyle = '#fff6e8'
          ctx.fillRect(d.x, d.y, d.r, d.r)
        }
      }
      ctx.globalAlpha = 1
      if (alive) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="kx-burst-canvas" />
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
