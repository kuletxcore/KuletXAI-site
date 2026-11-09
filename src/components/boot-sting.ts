/**
 * The burst after "Click to continue", fitted to the console's own capture, whose audio is the continue sound.
 * Each frame is a pure function of t (seconds since the sound started), so a dropped frame never puts it out of step.
 */

export type StingClock = () => number | null

type Profile = {
  atmoScale: number // resolution of the soft-light canvas, relative to CSS pixels
  fieldW: number // the beam's light is worked out at most this wide, then scaled up
  maxDpr: number
  pale: number
  gold: number
  orbs: number
  specks: number
  motes: number
  drifters: number
  sprite: number // size of the soft-disc and gold sprites
  fps: number // 0 = every frame
  streaks: boolean
}

const HQ: Profile = { atmoScale: 0.5, fieldW: 480, maxDpr: 1.5, pale: 14, gold: 180, orbs: 6, specks: 1100, motes: 520, drifters: 14, sprite: 128, fps: 0, streaks: true }
// Phones in full mode: the same burst on a screen a sixth the size, so less dust keeps the same density
const PHONE: Profile = { atmoScale: 0.35, fieldW: 360, maxDpr: 1.25, pale: 12, gold: 130, orbs: 5, specks: 700, motes: 320, drifters: 10, sprite: 96, fps: 0, streaks: true }
// Lite: a quarter-resolution light pass, about a third of the dust, 30 fps
const LITE: Profile = { atmoScale: 0.25, fieldW: 240, maxDpr: 1, pale: 9, gold: 80, orbs: 3, specks: 360, motes: 170, drifters: 6, sprite: 64, fps: 30, streaks: false }

type RGB = readonly [number, number, number]

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const smooth = (a: number, b: number, t: number) => {
  const x = clamp01((t - a) / (b - a))
  return x * x * (3 - 2 * x)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

/** Small seeded PRNG so the burst looks the same every time */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** Roughly normal, mean 0, spread 1 */
const gauss = (rand: () => number) => (rand() + rand() + rand() + rand() - 2) * 1.732

// Timeline, measured from the capture

/** Navy: in with the press; after the hit it eases off, then drains to black just before the beam */
const navyIn = (t: number) => smooth(0, 0.45, t)
const navyOut = (t: number) => (1 - 0.34 * clamp01((t - 2.48) / 0.37)) * (1 - clamp01((t - 2.84) / 0.17) ** 1.6)
/** The beam snaps on at 2.96 and opens up over a second and a half */
const beamLevel = (t: number) => (t <= 2.96 ? 0 : Math.min(1, 0.8 * Math.sqrt(t - 2.96)))
/** The gold pulls into focus */
const focusAt = (t: number) => smooth(2.84, 3.45, t)
/** ...and just before that its colour turns from orange to cream */
const warmAt = (t: number) => smooth(2.8, 3.05, t)

// The lit room, fitted to the console's frames (u, v are screen fractions; values 0–255): a warm source above
// the top left cut by a diagonal edge on the right, a cool haze on the floor, walls fading from grey to navy
const SU = 0.1445
const SV = -0.032
function lightAt(u: number, v: number, A: number, out: [number, number, number]) {
  const dx = (u - SU) * A
  const dy = v - SV
  const d = Math.sqrt(dx * dx + dy * dy)
  const right = 1 - smooth(-1, 1, (u - (0.3072 + 0.7184 * v)) / (0.0854 + 0.2365 * v))
  const left = smooth(-1, 1, (u - (0.0862 - 0.0763 * v)) / 0.0992)
  // Soft shafts. They're aimed from a point well above the screen and kept off the
  // source itself, so they read as broad rays rather than a star.
  const th = Math.atan2(dx, v + 0.22)
  const shafts = 1 + (0.06 * Math.sin(17 * th + 1.3) + 0.045 * Math.sin(29 * th + 4.1) + 0.03 * Math.sin(47 * th + 2.2)) * smooth(0.03, 0.3, d) * Math.exp(-d / 0.7)
  const hd2 = dx * dx + v * v
  const beam = (21.38 / (d + 0.103)) * right * left * shafts + 4.39 * Math.exp(-hd2 / 0.04264)
  const hu = (u - 0.2005) / 0.3016
  const hv = (v - 0.8828) / 0.1138
  const haze = 35.6 * Math.exp(-hu * hu - hv * hv)
  const s = smooth(0, 1.267, u)
  const amb = 33.56 + (15.39 - 33.56) * s
  out[0] = amb * (1 - 0.18 * s) + beam + haze * 0.84
  out[1] = amb * (1 - 0.05 * s) + beam * 0.85 + haze * 0.93
  out[2] = amb * (1.16 + 0.44 * s) + beam * 0.82 + haze
  return out
}

/** The room, worked out small and scaled up (it's all soft light), with a little grain so it doesn't band */
function buildRoom(aw: number, ah: number, w: number, h: number, fieldW: number) {
  const A = Math.max(1, w / h)
  const fw = Math.max(8, Math.min(fieldW, aw))
  const fh = Math.max(8, Math.round((fw * ah) / aw))
  const field = document.createElement('canvas')
  field.width = fw
  field.height = fh
  const room = document.createElement('canvas')
  room.width = aw
  room.height = ah
  const f = field.getContext('2d')
  const g = room.getContext('2d')
  if (!f || !g) return room
  const img = f.createImageData(fw, fh)
  const px = img.data
  const c: [number, number, number] = [0, 0, 0]
  for (let y = 0; y < fh; y++) {
    const v = (y + 0.5) / fh
    for (let x = 0; x < fw; x++) {
      lightAt((x + 0.5) / fw, v, A, c)
      const i = (y * fw + x) * 4
      px[i] = c[0]
      px[i + 1] = c[1]
      px[i + 2] = c[2]
      px[i + 3] = 255
    }
  }
  f.putImageData(img, 0, 0)
  g.imageSmoothingEnabled = true
  g.imageSmoothingQuality = 'high'
  g.drawImage(field, 0, 0, aw, ah)
  const out = g.getImageData(0, 0, aw, ah)
  const d = out.data
  let seed = 7
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const n = ((seed >> 16) & 3) - 1.5
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  g.putImageData(out, 0, 0)
  return room
}

// Sprites, each worked out once from a radial profile (rho: 0 at the centre, 1 at the edge). Colour is stored
// at full strength and `gain` scales it down as it's drawn, so the faint navy and grey keep their precision

type Sprite = { img: HTMLCanvasElement; gain: number }

function radial(size: number, rgb: RGB, prof: (rho: number) => number): Sprite {
  const img = document.createElement('canvas')
  img.width = img.height = size
  const m = Math.max(rgb[0], rgb[1], rgb[2], 1)
  const g = img.getContext('2d')
  if (g) {
    const data = g.createImageData(size, size)
    const px = data.data
    const h = size / 2
    const R = (rgb[0] / m) * 255
    const G = (rgb[1] / m) * 255
    const B = (rgb[2] / m) * 255
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const rho = Math.hypot(x + 0.5 - h, y + 0.5 - h) / h
        const i = (y * size + x) * 4
        px[i] = R
        px[i + 1] = G
        px[i + 2] = B
        px[i + 3] = rho >= 1 ? 0 : Math.round(clamp01(prof(rho)) * 255)
      }
    }
    g.putImageData(data, 0, 0)
  }
  return { img, gain: m / 255 }
}

/** A defocused disc: flat, a touch darker in the middle, with a soft edge e (a fraction of the radius) */
const discProfile = (e: number, centre: number) => (rho: number) => (centre + (1 - centre) * rho ** 3) * (1 - smooth(1 - e, 1, rho))
/** The capture's gold bokeh: bright through the middle, rolling off to a soft rim */
const bokehProfile = (rho: number) => Math.exp(-((rho / 0.68) ** 3)) * (1 - smooth(0.85, 1, rho))
/** In focus: a bright point with a little glow */
const pointProfile = (rho: number) => (Math.exp(-((rho / 0.3) ** 2)) + 0.14 * Math.exp(-((rho / 0.6) ** 2))) * (1 - smooth(0.75, 1, rho))

// Bokeh discs in a 1920×1080 design frame, cover-fitted to the screen: x, y are fractions of the frame, r of its height

// Each navy disc drifts in a straight line from its first values (at 0s) to its second
// (at 3s) and brightens from lo to full by 2.5s. c is its colour at full strength.
type Navy = { x: [number, number]; y: [number, number]; r: [number, number]; c: RGB; lo: number }
const NAVY: Navy[] = [
  { x: [0.559, 0.508], y: [0.737, 0.554], r: [0.825, 0.916], c: [0, 15.6, 26.3], lo: 0.53 },
  { x: [0.687, 0.595], y: [0.335, 0.413], r: [0.663, 0.791], c: [0, 13.9, 21.5], lo: 0.56 },
  { x: [0.619, 0.579], y: [0.997, 0.831], r: [0.656, 0.761], c: [0, 4.2, 6.5], lo: 1 },
]

// Grey discs: position and radius at 2.45s with their change per second, colour, edge softness, and the times
// they're fully in (tb) and gone (tg). Brightest first, since lite draws only the first few
type Pale = { x: number; y: number; vx: number; vy: number; r: number; vr: number; c: RGB; e: number; tb: number; tg: number }
const PALE: Pale[] = [
  { x: -0.131, y: -0.172, vx: -0.386, vy: 0.377, r: 0.453, vr: -1.497, c: [9.4, 20.9, 21.3], e: 0.22, tb: 2.267, tg: 2.554 },
  { x: 0.133, y: 0.808, vx: -0.053, vy: -0.183, r: 0.547, vr: 0.925, c: [0, 2.6, 4.7], e: 0.22, tb: 2.159, tg: 2.692 },
  { x: 0.367, y: 0.168, vx: 0.13, vy: 0.113, r: 0.234, vr: -0.14, c: [19, 12.3, 8.2], e: 0.22, tb: 2.222, tg: 2.851 },
  { x: 0.572, y: 0.313, vx: 0.129, vy: -0.355, r: 0.222, vr: -0.174, c: [20.4, 13.6, 10.4], e: 0.21, tb: 2.247, tg: 2.775 },
  { x: 0.108, y: 0.858, vx: -0.613, vy: -0.657, r: 0.284, vr: -0.348, c: [5.5, 11.8, 9.6], e: 0.2, tb: 2.314, tg: 2.554 },
  { x: 0.546, y: 0.121, vx: -0.103, vy: 0.7, r: 0.241, vr: 0.118, c: [12.6, 15.6, 12.2], e: 0.21, tb: 2.269, tg: 2.768 },
  { x: 0.507, y: 0.535, vx: 0.358, vy: 0.426, r: 0.212, vr: -0.493, c: [18.4, 19, 16.4], e: 0.19, tb: 2.448, tg: 2.825 },
  { x: 0.457, y: 0.746, vx: 0.25, vy: 0.781, r: 0.262, vr: -0.271, c: [11.6, 9.7, 8.2], e: 0.21, tb: 2.357, tg: 2.848 },
  { x: 0.953, y: 0.561, vx: -0.082, vy: 0.522, r: 0.376, vr: -1.5, c: [5, 4.2, 4.1], e: 0.14, tb: 2.174, tg: 2.673 },
  { x: 0.682, y: 0.771, vx: 0.518, vy: 1.5, r: 0.208, vr: 0.024, c: [9.7, 13.5, 14.2], e: 0.21, tb: 2.433, tg: 2.718 },
  { x: 0.465, y: 0.783, vx: 0.289, vy: 0.559, r: 0.199, vr: -0.225, c: [8.1, 12, 9.8], e: 0.2, tb: 2.54, tg: 2.88 },
  { x: 0.659, y: 0.752, vx: 0.877, vy: -0.628, r: 0.25, vr: -0.838, c: [6.3, 6.4, 5.4], e: 0.19, tb: 2.198, tg: 2.536 },
  { x: 0.348, y: 0.116, vx: 0.072, vy: 0.188, r: 0.163, vr: -0.028, c: [13.4, 13.9, 12.2], e: 0.18, tb: 2.423, tg: 2.877 },
  { x: 0.425, y: 0.365, vx: -0.325, vy: 0.026, r: 0.154, vr: -0.206, c: [14.2, 14.6, 12.6], e: 0.15, tb: 2.421, tg: 2.942 },
]
const paleLevel = (p: Pale, t: number) => smooth(p.tb - 0.12, p.tb + 0.08, t) * (1 - smooth(p.tg - 0.18, p.tg, t))

// Dust: positions are fractions of the screen; sizes are CSS pixels at 1080p, scaled to the screen

type Gold = { hu: number; hv: number; born: number; rb: number; rf: number; a: number; col: number; vx: number; vy: number; wa: number; wf: number; ph: number; end: number; fd: number }
type Orb = { u: number; v: number; r: number; on: number; off: number; vx: number; vy: number }
type Speck = { u: number; v: number; born: number; die: number; a: number; size: number; tint: number; vx: number; vy: number; tau: number }
type Mote = { u: number; v: number; born: number; end: number; a: number; r: number; soft: boolean; bright: boolean; vx: number; vy: number; wa: number; wf: number; ph: number; tw: number }
type Drifter = { u: number; v: number; born: number; r: number; a: number; vx: number; vy: number; beam: boolean }

// The gold cloud's centre: it bursts out from here and drifts up and to the right
const GU = 0.66
const GV = 0.45

// The gold's four kinds, as counted in the capture: small dim orange bokeh, medium ones, a few big faint discs
// that swell and fade before the focus pull, and bright cream sparks (sprite radii in pixels at 1080p)
const G_HAZE = 0
const G_MID = 1
const G_BIG = 2
const G_SPARK = 3

function makeGold(n: number, rand: () => number): Gold[] {
  const out: Gold[] = []
  for (let i = 0; i < n; i++) {
    const b = rand()
    const col = b < 0.52 ? G_HAZE : b < 0.76 ? G_MID : b < 0.85 ? G_BIG : G_SPARK
    // A few stay on, dimly, to the end
    const keep = col !== G_BIG && rand() < 0.07
    // A band leaning from the top right down towards the middle
    let hv = GV + gauss(rand) * 0.3
    while (hv < -0.04 || hv > 1.04) hv = GV + gauss(rand) * 0.3
    let hu = GU + gauss(rand) * 0.09 + (GV - hv) * 0.22
    while (hu < 0.34 || hu > 1.04) hu = GU + gauss(rand) * 0.09 + (GV - hv) * 0.22
    const rb = col === G_HAZE ? 8 + rand() * 6 : col === G_MID ? 13 + rand() * 7 : col === G_BIG ? 25 + rand() * 10 : 9 + rand() * 3
    const a = col === G_HAZE ? 0.12 + rand() * 0.1 : col === G_MID ? 0.28 + rand() * 0.32 : col === G_BIG ? 0.17 + rand() * 0.13 : 0.9 + rand() * 0.3
    out.push({
      hu,
      hv,
      born: 2.52 + 0.14 * rand() ** 1.6,
      rb,
      rf: col === G_SPARK ? 5 + rand() * 2 : 5 + rand() * 3,
      a: keep ? a * 0.6 : a,
      col,
      vx: -0.01 + rand() * 0.035,
      vy: -(0.004 + rand() * 0.03),
      wa: 0.002 + rand() * 0.004,
      wf: 0.4 + rand() * 0.9,
      ph: rand() * 6.28,
      // The big discs are gone before the pull ends; the rest thin out by about 4s
      end: keep ? Infinity : col === G_BIG ? 2.92 + rand() * 0.16 : 3.25 + rand() * 0.85,
      fd: col === G_BIG ? 0.25 : 0.5,
    })
  }
  return out
}

// [u, v, radius, on, off]: the bright flares as the gold comes into focus
const ORBS: [number, number, number, number, number][] = [
  [0.745, 0.16, 44, 2.92, 3.32],
  [0.7, 0.09, 30, 2.9, 3.28],
  [0.795, 0.045, 27, 2.8, 3.1],
  [0.67, 0.17, 22, 3.0, 3.5],
  [0.785, 0.12, 16, 2.95, 3.2],
  [0.6, 0.15, 13, 3.08, 3.6],
]

function makeOrbs(n: number, rand: () => number): Orb[] {
  return ORBS.slice(0, n).map(([u, v, r, on, off]) => ({ u, v, r, on, off, vx: (rand() - 0.6) * 0.03, vy: -0.01 - rand() * 0.02 }))
}

function makeSpecks(n: number, rand: () => number): Speck[] {
  const out: Speck[] = []
  for (let i = 0; i < n; i++) {
    const u = clamp(0.3 + gauss(rand) * 0.19, -0.01, 1.01)
    const v = -0.01 + rand() * 1.02
    // Thrown outward from the middle, at all sorts of speeds
    const ang = Math.atan2(v - 0.48, (u - 0.52) * 1.78) + (rand() - 0.5) * 2.2
    const speed = 30 + rand() ** 1.5 * 200
    const tc = rand()
    const sz = rand()
    out.push({
      u,
      v,
      born: 2.5 + rand() * 0.1,
      // The far left clears first; nearer the middle they hang on into the beam
      die: 2.95 + rand() * 0.35 + 0.45 * clamp01((u - 0.08) / 0.35) * rand() ** 0.8,
      a: 0.35 + rand() ** 1.2 * 0.65,
      // Fine points, slightly bigger ones, and out-of-focus grey discs
      size: sz < 0.5 ? 0 : sz < 0.72 ? 1 : 2,
      tint: tc < 0.85 ? 0 : tc < 0.93 ? 1 : 2,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      tau: 0.25 + rand() * 0.35,
    })
  }
  return out
}

/** The dust left hanging after the hit: a fine, faint scatter right across the room,
 * a little thicker on the left, with a few bright points that catch the beam */
function makeMotes(n: number, rand: () => number): Mote[] {
  const out: Mote[] = []
  for (let i = 0; i < n; i++) {
    const bright = rand() < 0.16
    const soft = !bright && rand() < 0.06
    out.push({
      u: bright ? 0.03 + rand() ** 1.3 * 0.6 : rand() ** 0.85 * 1.04 - 0.02,
      v: bright ? 0.02 + rand() * 0.8 : -0.02 + rand() * 1.04,
      born: 2.95 + rand() * 0.35,
      end: rand() < 0.4 ? Infinity : 3.6 + rand() * 2,
      a: bright ? 0.85 + rand() * 0.15 : soft ? 0.06 + rand() * 0.06 : 0.15 + rand() ** 1.5 * 0.3,
      r: bright ? 10 + rand() * 4 : soft ? 8 + rand() * 5 : 5 + rand() * 3,
      soft,
      bright,
      vx: -6 + rand() * 16,
      vy: -8 + rand() * 14,
      wa: 2 + rand() * 6,
      wf: 0.25 + rand() * 0.6,
      ph: rand() * 6.28,
      tw: 1 + rand() * 2.5,
    })
  }
  return out
}

/** Big soft motes close to the lens, late on: some floating up along the bottom, and a
 * few faint ones hanging in the beam (alternating, so lite gets both) */
function makeDrifters(n: number, rand: () => number): Drifter[] {
  const out: Drifter[] = []
  for (let i = 0; i < n; i++) {
    const beam = i % 2 === 1
    out.push(
      beam
        ? { u: 0.04 + rand() * 0.36, v: 0.08 + rand() * 0.67, born: 3.9 + rand() * 0.7, r: 12 + rand() * 22, a: 0.05 + rand() * 0.05, vx: -0.004 + rand() * 0.01, vy: -(0.003 + rand() * 0.008), beam }
        : { u: 0.03 + rand() ** 1.4 * 0.85, v: 0.78 + rand() * 0.2, born: 4.2 + rand() * 0.8, r: 10 + rand() * 10, a: 0.25 + rand() * 0.2, vx: -0.004 + rand() * 0.01, vy: -(0.006 + rand() * 0.01), beam },
    )
  }
  return out
}

/** A radial-gradient sprite (for the orbs) */
function gradSprite(size: number, stops: [number, string][]) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  if (!g) return c
  const r = size / 2
  const grad = g.createRadialGradient(r, r, 0, r, r, r)
  for (const [at, col] of stops) grad.addColorStop(at, col)
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  return c
}

// Each kind's colour at the hit and once it has turned cream, as measured: the fainter
// the bokeh, the redder it reads
const GOLD_FROM: RGB[] = [
  [255, 140, 97],
  [255, 165, 115],
  [255, 150, 105],
  [255, 232, 196],
]
const GOLD_TO: RGB[] = [
  [255, 196, 138],
  [255, 214, 156],
  [255, 206, 146],
  [255, 242, 220],
]
const WARM_WHITE: RGB = [255, 242, 226]
// The gold's sprites are worked out at steps through this stretch of time (colour turn,
// then focus pull); the frame picks the step for its t
const STEP_T0 = 2.75
const STEP_T1 = 3.45
const STEPS = 14
const stepAt = (t: number) => Math.round(clamp01((t - STEP_T0) / (STEP_T1 - STEP_T0)) * (STEPS - 1))

/** One kind of gold at each step: orange turning cream, then (except the big discs) sharpening to a warm point */
function goldSprites(col: number, size: number): HTMLCanvasElement[] {
  const out: HTMLCanvasElement[] = []
  for (let s = 0; s < STEPS; s++) {
    const ts = lerp(STEP_T0, STEP_T1, s / (STEPS - 1))
    const f = col === G_BIG ? 0 : focusAt(ts)
    const w = warmAt(ts)
    const a = GOLD_FROM[col]
    const b = GOLD_TO[col]
    const mix = (j: number) => lerp(lerp(a[j], b[j], w), WARM_WHITE[j], f * 0.4)
    const c: RGB = [mix(0), mix(1), mix(2)]
    out.push(radial(size, c, (rho) => lerp(bokehProfile(rho), pointProfile(rho), f)).img)
  }
  return out
}

const SPECK_RGB = ['rgb(226,233,245)', 'rgb(244,204,214)', 'rgb(190,232,236)']
const SPECK_W = [1.2, 1.9, 5.5] // line width per size
const SPECK_A = [1, 1, 0.42] // the discs are fainter

/**
 * Draw the burst into two canvases until the returned cleanup runs.
 * clock() gives seconds since the sound started, or null before it starts.
 */
export function runSting(atmo: HTMLCanvasElement, dust: HTMLCanvasElement, clock: StingClock, opts: { lite: boolean; still: boolean }) {
  const phone = window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) <= 520
  const P = opts.lite ? LITE : phone ? PHONE : HQ
  const still = opts.still
  const actx = atmo.getContext('2d', { alpha: false })
  const dctx = dust.getContext('2d')
  if (!actx || !dctx) return () => {}

  const rand = rng(20201112)
  const gold = makeGold(P.gold, rand)
  const orbs = makeOrbs(P.orbs, rand)
  const specks = makeSpecks(P.specks, rand)
  const motes = makeMotes(P.motes, rand)
  const drifters = makeDrifters(P.drifters, rand)
  const pale = PALE.slice(0, P.pale)

  // The navy is needed straight away; the rest is worked out a piece at a time while it plays
  const navySpr = NAVY.map((d) => radial(256, d.c, discProfile(0.15, 0.95)))
  let paleSpr: Sprite[] | null = null
  const goldSpr: HTMLCanvasElement[][] = []
  let pointSpr: HTMLCanvasElement | null = null
  let glintSpr: HTMLCanvasElement | null = null
  let softSpr: HTMLCanvasElement | null = null
  let hazeSpr: HTMLCanvasElement | null = null
  let orbSpr: HTMLCanvasElement | null = null
  const makePale = () => pale.map((p) => radial(P.sprite, p.c, discProfile(p.e, 1)))
  const goldSize = P.sprite / 2
  const makeDust = () => {
    pointSpr = radial(32, [255, 234, 210], pointProfile).img
    glintSpr = radial(32, [255, 226, 178], pointProfile).img
    softSpr = radial(32, [255, 172, 112], bokehProfile).img
    hazeSpr = radial(64, [255, 228, 204], bokehProfile).img
    // Warm cream, as the capture's flares read
    orbSpr = gradSprite(64, [
      [0, 'rgba(255,248,232,1)'],
      [0.5, 'rgba(255,238,204,0.96)'],
      [0.72, 'rgba(255,222,176,0.7)'],
      [0.88, 'rgba(255,204,156,0.22)'],
      [1, 'rgba(255,196,146,0)'],
    ])
  }

  let w = 0
  let h = 0
  let aw = 0
  let ah = 0
  let dpr = 1
  let room: HTMLCanvasElement | null = null

  const fit = () => {
    w = Math.max(1, atmo.clientWidth || window.innerWidth)
    h = Math.max(1, atmo.clientHeight || window.innerHeight)
    aw = Math.max(16, Math.round(w * P.atmoScale))
    ah = Math.max(9, Math.round(h * P.atmoScale))
    atmo.width = aw
    atmo.height = ah
    dpr = Math.min(window.devicePixelRatio || 1, P.maxDpr)
    dust.width = Math.max(1, Math.round(w * dpr))
    dust.height = Math.max(1, Math.round(h * dpr))
    room = null // rebuilt on the next frame
  }
  fit()
  let resizeRaf = 0
  const onResize = () => {
    cancelAnimationFrame(resizeRaf)
    resizeRaf = requestAnimationFrame(fit)
  }
  window.addEventListener('resize', onResize)

  /** One piece of set-up per frame, well before it's needed */
  const prep = (t: number) => {
    if (!room && t > 0.6) room = buildRoom(aw, ah, w, h, P.fieldW)
    else if (!paleSpr && t > 1.0) paleSpr = makePale()
    else if (goldSpr.length < GOLD_FROM.length && t > 1.3) goldSpr.push(goldSprites(goldSpr.length, goldSize))
    else if (!pointSpr && t > 1.8) makeDust()
  }

  const drawAtmo = (t: number) => {
    const q = P.atmoScale
    actx.globalCompositeOperation = 'source-over'
    actx.globalAlpha = 1
    actx.fillStyle = '#000'
    actx.fillRect(0, 0, aw, ah)

    const L = beamLevel(t)
    if (L > 0.002) {
      if (!room) room = buildRoom(aw, ah, w, h, P.fieldW)
      actx.globalAlpha = L
      actx.drawImage(room, 0, 0)
    }

    // Cover-fit the 1920×1080 design frame
    const s = Math.max(w / 1920, h / 1080)
    const ox = (w - 1920 * s) / 2
    const oy = (h - 1080 * s) / 2
    actx.globalCompositeOperation = 'lighter'

    const level = navyIn(t) * navyOut(t)
    if (level > 0.002) {
      const k = still ? 0.5 : Math.min(t, 3) / 3
      const ramp = clamp01(t / 2.5)
      for (let i = 0; i < NAVY.length; i++) {
        const d = NAVY[i]
        const sp = navySpr[i]
        const x = (ox + lerp(d.x[0], d.x[1], k) * 1920 * s) * q
        const y = (oy + lerp(d.y[0], d.y[1], k) * 1080 * s) * q
        const r = lerp(d.r[0], d.r[1], k) * 1080 * s * q
        actx.globalAlpha = Math.min(1, level * lerp(d.lo, 1, ramp) * sp.gain)
        actx.drawImage(sp.img, x - r, y - r, r * 2, r * 2)
      }
    }

    if (t > 2.0 && t < 3.0) {
      if (!paleSpr) paleSpr = makePale()
      const dt = still ? 0 : t - 2.45
      for (let i = 0; i < pale.length; i++) {
        const p = pale[i]
        const a = paleLevel(p, t) * paleSpr[i].gain
        if (a < 0.002) continue
        const r = Math.max(0.02, p.r + p.vr * dt) * 1080 * s * q
        const x = (ox + (p.x + p.vx * dt) * 1920 * s) * q
        const y = (oy + (p.y + p.vy * dt) * 1080 * s) * q
        actx.globalAlpha = Math.min(1, a)
        actx.drawImage(paleSpr[i].img, x - r, y - r, r * 2, r * 2)
      }
    }
  }

  // Specks are drawn in batches: one path per colour, size and brightness band
  const BANDS = 4
  const speckPaths: number[][] = Array.from({ length: SPECK_RGB.length * SPECK_W.length * BANDS }, () => [])
  const speckAt = (p: Speck, t: number, k: number, out: [number, number]) => {
    const age = Math.max(0, t - p.born)
    const go = still ? 0 : p.tau * (1 - Math.exp(-age / p.tau))
    out[0] = p.u * w + p.vx * go * k
    out[1] = p.v * h + p.vy * go * k
  }
  const s0: [number, number] = [0, 0]
  const s1: [number, number] = [0, 0]
  const lit: [number, number, number] = [0, 0, 0]

  const drawDust = (t: number) => {
    dctx.setTransform(1, 0, 0, 1, 0, 0)
    dctx.globalCompositeOperation = 'source-over'
    dctx.globalAlpha = 1
    dctx.clearRect(0, 0, dust.width, dust.height)
    if (t < 2.49) return
    while (goldSpr.length < GOLD_FROM.length) goldSpr.push(goldSprites(goldSpr.length, goldSize))
    if (!pointSpr) makeDust()
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    dctx.globalCompositeOperation = 'lighter'
    const k = Math.min(1.35, Math.max(0.62, Math.sqrt(w * h) / 1440)) // dot size scale
    const A = Math.max(1, w / h)
    const L = beamLevel(t)

    // White specks: a fine spray over the left, gone as the beam comes up
    if (t < 3.85) {
      for (const b of speckPaths) b.length = 0
      for (const p of specks) {
        const age = t - p.born
        if (age < 0 || t > p.die + 0.3) continue
        const a = p.a * clamp01(age / 0.05) * (1 - clamp01((t - p.die) / 0.3))
        if (a < 0.03) continue
        speckAt(p, t, k, s1)
        if (s1[0] < -4 || s1[1] < -4 || s1[0] > w + 4 || s1[1] > h + 4) continue
        let x0 = s1[0]
        let y0 = s1[1]
        if (P.streaks && !still) {
          // A short smear where it's still moving fast, like the camera's shutter
          speckAt(p, t - 1 / 30, k, s0)
          if (Math.abs(s1[0] - s0[0]) + Math.abs(s1[1] - s0[1]) > 1.2) {
            x0 = s0[0]
            y0 = s0[1]
          }
        }
        const band = Math.min(BANDS - 1, Math.floor(a * BANDS))
        speckPaths[(p.tint * SPECK_W.length + p.size) * BANDS + band].push(x0, y0, s1[0], s1[1])
      }
      dctx.lineCap = 'round'
      for (let i = 0; i < speckPaths.length; i++) {
        const seg = speckPaths[i]
        if (!seg.length) continue
        const band = i % BANDS
        const size = Math.floor(i / BANDS) % SPECK_W.length
        dctx.globalAlpha = ((band + 0.6) / BANDS) * SPECK_A[size]
        dctx.strokeStyle = SPECK_RGB[Math.floor(i / (BANDS * SPECK_W.length))]
        dctx.lineWidth = SPECK_W[size] * Math.max(0.8, k)
        dctx.beginPath()
        for (let j = 0; j < seg.length; j += 4) {
          // A dot is a zero-length line with round caps
          dctx.moveTo(seg[j], seg[j + 1])
          dctx.lineTo(seg[j + 2] + (seg[j] === seg[j + 2] && seg[j + 1] === seg[j + 3] ? 0.01 : 0), seg[j + 3])
        }
        dctx.stroke()
      }
    }

    // Gold: bursts open on the hit, pulls into focus, then drifts and thins out, catching the beam
    const focus = still ? 1 : focusAt(t)
    const step = still ? STEPS - 1 : stepAt(t)
    const swell = still ? 1 : smooth(2.75, 3.1, t)
    for (const p of gold) {
      const age = t - p.born
      if (age < 0 || t > p.end + p.fd) continue
      const bloom = still ? 1 : 1 - Math.exp(-age / 0.07)
      const burst = still ? 1 : 0.62 + 0.38 * (1 - Math.exp(-age / 0.2)) + 0.05 * age
      const drift = still ? 0 : age
      const u = GU + (p.hu - GU) * burst + p.vx * drift + (still ? 0 : Math.sin(t * p.wf + p.ph) * p.wa)
      const v = GV + (p.hv - GV) * burst + p.vy * drift + (still ? 0 : Math.cos(t * p.wf * 0.8 + p.ph) * p.wa)
      const x = u * w
      const y = v * h
      const open = p.rb * (0.35 + 0.65 * bloom)
      // The big discs swell as they fade; the rest pull in to a point
      const r = (p.col === G_BIG ? open * (1 + 0.5 * swell) : lerp(open, p.rf, focus)) * k
      if (x < -r || y < -r || x > w + r || y > h + r) continue
      // Pulling into focus gathers the same light into a point, so it brightens as it shrinks
      let a = p.a * clamp01(age / 0.05) * (p.col === G_BIG ? 1 : lerp(1, 1.9, focus)) * (1 - clamp01((t - p.end) / p.fd))
      if (L > 0.01) {
        lightAt(u, v, A, lit)
        a *= 1 + 0.8 * L * clamp01((lit[0] - 40) / 90)
      }
      if (a < 0.02) continue
      dctx.globalAlpha = Math.min(1, a)
      dctx.drawImage(goldSpr[p.col][step], x - r, y - r, r * 2, r * 2)
    }

    // A few bright flares as the gold sharpens
    if (orbSpr) {
      for (const o of orbs) {
        if (t < o.on || t > o.off) continue
        const a = smooth(o.on, o.on + 0.1, t) * (1 - smooth(o.off - 0.28, o.off, t))
        if (a < 0.02) continue
        const age = still ? 0 : t - o.on
        const r = o.r * k * (0.55 + 0.45 * smooth(o.on, o.on + 0.14, t)) * (1 - 0.3 * smooth(o.on + 0.15, o.off, t))
        dctx.globalAlpha = a
        dctx.drawImage(orbSpr, (o.u + o.vx * age) * w - r, (o.v + o.vy * age) * h - r, r * 2, r * 2)
      }
    }

    // The dust left hanging, brighter where the beam catches it
    if (t > 2.9 && pointSpr && glintSpr && hazeSpr) {
      for (const m of motes) {
        const age = t - m.born
        if (age < 0 || t > m.end + 0.6) continue
        const dx = still ? 0 : m.vx * age + Math.sin(t * m.wf + m.ph) * m.wa
        const dy = still ? 0 : m.vy * age + Math.cos(t * m.wf * 0.7 + m.ph) * m.wa
        let x = m.u * w + dx * k
        let y = m.v * h + dy * k
        // Wrap round at the edges
        x = ((x % (w + 20)) + w + 20) % (w + 20) - 10
        y = ((y % (h + 20)) + h + 20) % (h + 20) - 10
        lightAt(x / w, y / h, A, lit)
        const catchLight = L * clamp01((lit[0] - 25) / 70)
        const shine = m.bright ? 0.5 + 0.5 * catchLight : 0.6 + 0.4 * catchLight
        const a = m.a * smooth(0, 0.4, age) * (1 - clamp01((t - m.end) / 0.6)) * shine * ((m.bright ? 0.88 : 0.75) + (m.bright ? 0.12 : 0.25) * Math.sin(t * m.tw + m.ph))
        if (a < 0.02) continue
        dctx.globalAlpha = Math.min(1, a)
        const r = m.r * k
        dctx.drawImage(m.soft ? hazeSpr : m.bright ? glintSpr : pointSpr, x - r, y - r, r * 2, r * 2)
      }
    }

    // Big soft motes near the lens, late on
    if (softSpr && hazeSpr) {
      for (const d of drifters) {
        const age = t - d.born
        if (age < 0) continue
        const go = still ? 0 : age
        const r = d.r * k
        const x = (d.u + d.vx * go) * w
        const y = (d.v + d.vy * go) * h
        let a = d.a * smooth(0, d.beam ? 1.2 : 0.9, age)
        if (d.beam) a *= 0.4 + 0.6 * L * clamp01((lightAt(x / w, y / h, A, lit)[0] - 30) / 80)
        if (a < 0.01) continue
        dctx.globalAlpha = a
        dctx.drawImage(d.beam ? hazeSpr : softSpr, x - r, y - r, r * 2, r * 2)
      }
    }
  }

  let raf = 0
  let last = -1
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (P.fps && last >= 0 && now - last < 1000 / P.fps - 2) return
    last = now
    const t = clock()
    if (t === null) {
      // Not started yet: hold on black
      actx.globalAlpha = 1
      actx.globalCompositeOperation = 'source-over'
      actx.fillStyle = '#000'
      actx.fillRect(0, 0, aw, ah)
      return
    }
    prep(t)
    drawAtmo(t)
    drawDust(t)
  }
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    cancelAnimationFrame(resizeRaf)
    window.removeEventListener('resize', onResize)
  }
}
