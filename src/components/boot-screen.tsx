import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { play as sfx } from '#/lib/sfx'
import { holdMusic } from '#/lib/music'

/**
 * Console-style start screen: black curtain, aurora + particles fade in with the
 * wordmark, holds, then fades out to reveal the hub. Plays once per browser
 * session, never on a reload, and any key or click skips it.
 */

const SESSION_KEY = 'kx_boot_seen'
const FADE_IN = 2.2
const HOLD_UNTIL_MS = 6000
const FADE_OUT = 1.5
const FAST_OUT = 0.28
const CURTAIN_OUT = 0.9
const FAST_CURTAIN = 0.3
const EASE = [0.4, 0, 0.2, 1] as const

type Phase = 'off' | 'curtain' | 'playing' | 'leaving' | 'lifting'

/** Inline script for <head>: blacks out the page before first paint when the boot will run. */
export const BOOT_HEAD_SCRIPT = `try{if(typeof window.__kxBoot!=='boolean'){var n=performance.getEntriesByType('navigation')[0];window.__kxBoot=!sessionStorage.getItem('${SESSION_KEY}')&&!(n&&n.type==='reload');if(window.__kxBoot)document.documentElement.classList.add('kx-boot')}}catch(e){}`

declare global {
  interface Window {
    __kxBoot?: boolean
    __kxBootActive?: boolean
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
  const timers = useRef<number[]>([])
  const decision = useRef<boolean | null>(null)

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
    // Let the black curtain paint, then start the synced fade-in
    timers.current.push(window.setTimeout(() => setPhase('playing'), 250))
    timers.current.push(window.setTimeout(() => setPhase((p) => (p === 'playing' ? 'leaving' : p)), 250 + HOLD_UNTIL_MS))
    const ids = timers.current
    return () => {
      ids.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  // Lets other input (the gamepad) know the start screen is up
  useEffect(() => {
    window.__kxBootActive = phase === 'curtain' || phase === 'playing' || phase === 'leaving'
    return () => {
      window.__kxBootActive = false
    }
  }, [phase])

  // Startup swell as the scene fades in (plays if the browser allows audio yet)
  const swellAt = useRef(0)
  useEffect(() => {
    if (phase === 'playing') {
      swellAt.current = performance.now()
      sfx('boot')
    }
  }, [phase])

  // Background music waits for the start screen, then for the swell to ring out
  const SWELL_MS = 4600
  useEffect(() => {
    if (phase === 'curtain') holdMusic(true)
    if (phase === 'off') holdMusic(false, swellAt.current ? Math.max(0, SWELL_MS - (performance.now() - swellAt.current)) : 0)
  }, [phase])

  const skip = useCallback(() => {
    setFast(true)
    setPhase((p) => (p === 'curtain' || p === 'playing' ? 'leaving' : p))
  }, [])

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
            <Aurora still={!!reduce} />
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
              {typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 'Tap anywhere to skip' : 'Press any key or click to skip'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Soft drifting light ribbons + twinkling dust, drawn on a 2D canvas. */
function Aurora({ still }: { still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let w = 0
    let h = 0
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = w < 600 ? 40 : 80
    const dust = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.4 + 0.4,
      speed: Math.random() * 0.006 + 0.002,
      phase: Math.random() * Math.PI * 2,
      twinkle: Math.random() * 1.5 + 0.5,
    }))

    // Each ribbon is a wide, blurred band following a slow sine path
    const ribbons = [
      { y: 0.42, amp: 0.12, freq: 1.3, speed: 0.05, width: 0.16, alpha: 0.13, hue: '200,215,255' },
      { y: 0.55, amp: 0.09, freq: 0.9, speed: -0.035, width: 0.1, alpha: 0.1, hue: '255,255,255' },
      { y: 0.3, amp: 0.07, freq: 1.8, speed: 0.025, width: 0.07, alpha: 0.07, hue: '120,170,255' },
    ]

    const start = performance.now()
    const draw = (now: number) => {
      const t = (now - start) / 1000
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#030508'
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.filter = `blur(${Math.round(Math.max(w, h) * 0.035)}px)`
      ctx.globalCompositeOperation = 'lighter'
      for (const rb of ribbons) {
        ctx.beginPath()
        const steps = 40
        for (let i = 0; i <= steps; i++) {
          const px = (i / steps) * (w * 1.2) - w * 0.1
          const py = (rb.y + Math.sin((i / steps) * Math.PI * rb.freq + t * rb.speed * 6) * rb.amp + Math.sin(t * 0.2 + i * 0.05) * 0.02) * h
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.strokeStyle = `rgba(${rb.hue},${rb.alpha})`
        ctx.lineWidth = rb.width * h
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      ctx.restore()

      for (const p of dust) {
        const y = (((p.y - t * p.speed) % 1) + 1) % 1
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * p.twinkle + p.phase))
        ctx.beginPath()
        ctx.arc(p.x * w, y * h, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`
        ctx.fill()
      }

      if (!still) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [still])

  return <canvas ref={ref} className="kx-boot-canvas" />
}
