import { storyPlatformName } from '#/data/content'
import type { Story } from '#/data/content'

// Draws a 1080x1350 share poster for a world: its cover, its rating, its hook and its live numbers.
// Everything happens on the visitor's device; nothing is uploaded.

export type CardStats = { messages: number; likes: number; saves: number; chats: number }

const W = 1080
const H = 1350

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.decoding = 'async'
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
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
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

export async function renderStoryCard(story: Story, stats: CardStats): Promise<string> {
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

  // Cover art across the top, dissolved into the ground
  const artH = 760
  const img = await loadImage(story.cover)
  if (img) drawCover(ctx, img, 0, 0, W, artH)
  const fade = ctx.createLinearGradient(0, artH * 0.35, 0, artH)
  fade.addColorStop(0, 'rgba(5,8,6,0)')
  fade.addColorStop(0.75, 'rgba(5,8,6,0.7)')
  fade.addColorStop(1, 'rgba(5,8,6,1)')
  ctx.fillStyle = fade
  ctx.fillRect(0, artH * 0.35, W, artH * 0.65)

  // The world's accent, as the rule under the art
  ctx.fillStyle = story.accent
  ctx.fillRect(0, artH, W, 12)

  // Rating, in the site's traffic light, and where it plays
  const badge = story.rating === 'SFW' ? '#00ff66' : story.rating === '18+' ? '#e5162b' : '#ffb800'
  const badgeInk = story.rating === '18+' ? '#ffffff' : '#050806'
  ctx.font = gamer
  ctx.textBaseline = 'middle'
  const bw = ctx.measureText(story.rating).width + 40
  ctx.fillStyle = badge
  ctx.fillRect(64, 64, bw, 56)
  ctx.fillStyle = badgeInk
  ctx.fillText(story.rating, 84, 93)

  ctx.fillStyle = 'rgba(215,245,223,0.92)'
  ctx.textAlign = 'right'
  ctx.fillText(`ON ${storyPlatformName(story).toUpperCase()}`, W - 64, 93)
  ctx.textAlign = 'left'

  // Title
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#d7f5df'
  ctx.font = pixel
  let y = drawLines(ctx, wrapLines(ctx, story.title, W - 128, 2), 64, artH + 102, 72)

  // Hook
  ctx.font = mono
  ctx.fillStyle = '#8fb399'
  y = drawLines(ctx, wrapLines(ctx, `“${story.hook}”`, W - 160, 2), 64, y + 12, 38)

  // Tags
  ctx.font = gamer
  ctx.fillStyle = 'rgba(143,179,153,0.85)'
  ctx.fillText(story.tags.map((t) => `#${t}`).join('   ').toUpperCase(), 64, y + 14)
  y += 14

  // Live numbers, over a hairline
  const statsY = Math.max(y + 64, H - 196)
  ctx.fillStyle = 'rgba(29,51,36,1)'
  ctx.fillRect(64, statsY - 46, W - 128, 2)
  const row = [
    `\u2665 ${short(stats.likes)} LIKES`,
    `\u2605 ${short(stats.saves)} SAVES`,
    `\u2709 ${short(stats.chats)} CHATS`,
    `${short(stats.messages)} MESSAGES`,
  ].join('     ')
  ctx.font = mono
  ctx.fillStyle = '#00ff66'
  ctx.fillText(row, 64, statsY)

  // Footer
  ctx.font = pixel
  ctx.fillStyle = '#d7f5df'
  ctx.fillText('KULETX', 64, H - 84)
  const kw = ctx.measureText('KULETX').width
  ctx.fillStyle = '#00ff66'
  ctx.fillText(' AI', 64 + kw, H - 84)
  ctx.font = gamer
  ctx.fillStyle = 'rgba(143,179,153,0.85)'
  ctx.textAlign = 'right'
  ctx.fillText('KULETXAI.WHOP.SITE', W - 64, H - 92)
  ctx.textAlign = 'left'

  return canvas.toDataURL('image/png')
}
