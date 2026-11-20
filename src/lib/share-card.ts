import { storyPlatformName } from '#/data/content'
import type { Story, TrimzSeries } from '#/data/content'
import type { YtVideo } from '#/data/youtube'
import { ytThumb } from '#/data/youtube'

// Draws a 1080x1350 share poster for a world: its cover, its rating, its hook and its live numbers.
// Everything happens on the visitor's device; nothing is uploaded.

export type CardStats = { messages: number; likes: number; saves: number; chats: number }
export type SeriesStats = { episodes: number; views: number }
type Stat = { icon?: string; value: number; label: string }
type CardSpec = { art: string[]; accent: string; rating?: Story['rating']; where: string; title: string; hook: string; tags: string[]; stats: Stat[] }

// The site's highlight colour, for the numbers on the card
const HIGHLIGHT = '#5a6faa'

const W = 1080
const H = 1350

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    // YouTube thumbnails are cross-origin; their CDN allows it, and without this the canvas could not be saved
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

const ready = async (spec: string) => {
  try {
    await document.fonts.load(spec)
  } catch {
    /* the fallback face still draws */
  }
  return spec
}

/** object-fit: cover, centred. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  // Clip to the box: a cover taller than it would otherwise run on under the text
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  ctx.restore()
}

/** Splits text to fit a width, at most `rows` lines, with an ellipsis when it doesn't all fit. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, max: number, rows: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let row = ''
  let i = 0
  for (; i < words.length; i++) {
    const next = row ? `${row} ${words[i]}` : words[i]
    if (ctx.measureText(next).width > max && row) {
      lines.push(row)
      row = words[i]
      if (lines.length === rows) {
        i++
        break
      }
    } else row = next
  }
  const leftover = i < words.length
  if (lines.length < rows && row) lines.push(row)
  if (leftover && lines.length) {
    let last = lines[lines.length - 1]
    while (last.includes(' ') && ctx.measureText(`${last}…`).width > max) last = last.replace(/\s+\S*$/, '')
    lines[lines.length - 1] = `${last}…`
  }
  return lines
}

/** Draws the lines and returns the y of the next free line. */
function drawLines(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, line: number) {
  for (const text of lines) {
    ctx.fillText(text, x, y)
    y += line
  }
  return y
}

const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n))

/** The world's card: its cover, rating, platform, hook, tags and live numbers. */
export function renderStoryCard(story: Story, stats: CardStats) {
  return renderCard({
    art: [story.cover],
    accent: story.accent,
    rating: story.rating,
    where: storyPlatformName(story),
    title: story.title,
    hook: `\u201c${story.hook}\u201d`,
    tags: story.tags.slice(0, 3),
    stats: [
      { icon: '\u2665', value: stats.likes, label: 'likes' },
      { icon: '\u2605', value: stats.saves, label: 'saves' },
      { icon: '\u2709', value: stats.chats, label: 'chats' },
      { value: stats.messages, label: 'messages' },
    ],
  })
}

/** A Trimz series card: its poster and summary, with the parent world's accent and rating. */
export function renderSeriesCard(series: TrimzSeries, story: Story, stats: SeriesStats) {
  return renderCard({
    art: [series.poster],
    accent: story.accent,
    rating: story.rating,
    where: 'Trimz',
    title: series.title,
    hook: series.summary,
    tags: ['AI anime', 'series', `from ${story.title.split(':')[0]}`],
    stats: [
      { value: stats.episodes, label: stats.episodes === 1 ? 'episode' : 'episodes' },
      { icon: '\u25b6', value: stats.views, label: 'views' },
    ],
  })
}

/** A YouTube video's card: its thumbnail and title, plus the world it belongs to when it's from one. */
export function renderVideoCard(video: YtVideo, story: Story | undefined, views: number) {
  return renderCard({
    // Not every video has a maxres thumbnail; hqdefault always exists
    art: [ytThumb(video.id, 'maxresdefault'), ytThumb(video.id, 'hqdefault')],
    accent: story?.accent ?? HIGHLIGHT,
    rating: story?.rating,
    where: 'YouTube',
    title: video.title,
    hook: story ? `From @kuletxai: outslopping the competition. Part of ${story.title}.` : 'From @kuletxai: outslopping the competition.',
    tags: [video.short ? 'Short' : 'Episode', 'YouTube', ...(story ? [`from ${story.title.split(':')[0]}`] : [])],
    stats: [{ icon: '\u25b6', value: views, label: 'views' }],
  })
}

async function renderCard(card: CardSpec): Promise<string> {
  await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')

  const mono = await ready('30px "Obel Mono"')
  const gamer = await ready('26px StrongGamer')
  const pixel = await ready('64px HeadUpDaisy')

  ctx.fillStyle = '#050806'
  ctx.fillRect(0, 0, W, H)

  // Art across the top, dissolved into the ground
  const artH = 760
  let img: HTMLImageElement | null = null
  for (const src of card.art) {
    img = await loadImage(src)
    // YouTube answers a missing maxres thumbnail with a 120x90 placeholder, so treat tiny images as missing
    if (img && img.naturalWidth > 200) break
  }
  if (img) drawCover(ctx, img, 0, 0, W, artH)
  const fade = ctx.createLinearGradient(0, artH * 0.35, 0, artH)
  fade.addColorStop(0, 'rgba(5,8,6,0)')
  fade.addColorStop(0.75, 'rgba(5,8,6,0.7)')
  fade.addColorStop(1, 'rgba(5,8,6,1)')
  ctx.fillStyle = fade
  ctx.fillRect(0, artH * 0.35, W, artH * 0.65)

  // The world's accent, as the rule under the art
  ctx.fillStyle = card.accent
  ctx.fillRect(0, artH, W, 12)

  // Rating, in the site's traffic light, and where it plays
  // The rating keeps the site's traffic-light colours: they mark the rating everywhere, they aren't a highlight
  const badge = card.rating === 'SFW' ? '#00ff66' : card.rating === '18+' ? '#e5162b' : '#ffb800'
  ctx.font = gamer
  ctx.textBaseline = 'middle'
  if (card.rating) {
    const bw = ctx.measureText(card.rating).width + 40
    ctx.fillStyle = badge
    ctx.fillRect(64, 64, bw, 56)
    ctx.fillStyle = card.rating === '18+' ? '#ffffff' : '#050806'
    ctx.fillText(card.rating, 84, 93)
  }
  // The platform label sits on a dark plate so it reads over any art, including a thumbnail's own lettering
  const where = `ON ${card.where.toUpperCase()}`
  const ww = ctx.measureText(where).width
  ctx.fillStyle = 'rgba(5,8,6,0.72)'
  ctx.fillRect(W - 64 - ww - 20, 64, ww + 40, 56)
  ctx.fillStyle = 'rgba(215,245,223,0.95)'
  ctx.textAlign = 'right'
  ctx.fillText(where, W - 64, 93)
  ctx.textAlign = 'left'

  // Title
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#d7f5df'
  ctx.font = pixel
  let y = drawLines(ctx, wrapLines(ctx, card.title, W - 128, 2), 64, artH + 102, 72)

  // Hook
  ctx.font = mono
  ctx.fillStyle = '#8fb399'
  y = drawLines(ctx, wrapLines(ctx, card.hook, W - 128, 2), 64, y + 12, 38)

  // Tags, in the mono face: the pixel face has no proper # and spaces its capitals unevenly
  ctx.font = '24px "Obel Mono"'
  ctx.fillStyle = 'rgba(143,179,153,0.85)'
  ctx.fillText(wrapLines(ctx, card.tags.map((t) => `#${t}`).join('  '), W - 128, 1)[0] ?? '', 64, y + 10)

  // Live numbers in equal columns, each shrunk to fit its column
  const statsY = H - 196
  ctx.fillStyle = 'rgba(29,51,36,1)'
  ctx.fillRect(64, statsY - 46, W - 128, 2)
  const colW = (W - 128) / card.stats.length
  ctx.fillStyle = HIGHLIGHT
  card.stats.forEach((st, i) => {
    const text = `${st.icon ? `${st.icon} ` : ''}${short(st.value)} ${st.label.toUpperCase()}`
    let size = 30
    ctx.font = `${size}px "Obel Mono"`
    while (ctx.measureText(text).width > colW - 16 && size > 18) {
      size -= 1
      ctx.font = `${size}px "Obel Mono"`
    }
    ctx.fillText(text, 64 + i * colW, statsY)
  })

  // Footer: the logo and the address this card was made on
  const logo = await loadImage('/brand/kuletx-ai-1200.webp')
  const logoH = 96
  const kw = logo ? (logo.naturalWidth / logo.naturalHeight) * logoH : 0
  if (logo) ctx.drawImage(logo, 56, H - 84 - logoH * 0.78, kw, logoH)
  const host = window.location.host.toUpperCase()
  let hostSize = 26
  ctx.font = `${hostSize}px StrongGamer`
  // Long preview hosts shrink rather than run into the wordmark
  while (ctx.measureText(host).width > W - 128 - kw - 220 && hostSize > 14) ctx.font = `${--hostSize}px StrongGamer`
  ctx.fillStyle = 'rgba(143,179,153,0.85)'
  ctx.textAlign = 'right'
  ctx.fillText(host, W - 64, H - 92)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}
