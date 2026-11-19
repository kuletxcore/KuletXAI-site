import { describe, expect, it } from 'vitest'
import { isAllowedOstUrl, safeByteRange } from '#/lib/ost-rules'

describe('isAllowedOstUrl', () => {
  it('allows mp3s on the two platform music CDNs', () => {
    expect(isAllowedOstUrl('https://s3.isk0.ai/uploads/music/theme.mp3')).toBe(true)
    expect(isAllowedOstUrl('https://s3.alterworld.ai/uploads/audios/track-2.mp3')).toBe(true)
    expect(isAllowedOstUrl('https://media.kagesekai.ai/uploads/music/kage_01.mp3')).toBe(true)
  })

  it('rejects other hosts, paths, schemes and extensions', () => {
    expect(isAllowedOstUrl('https://evil.example/uploads/music/theme.mp3')).toBe(false)
    expect(isAllowedOstUrl('https://s3.isk0.ai/uploads/private/theme.mp3')).toBe(false)
    expect(isAllowedOstUrl('https://s3.isk0.ai/uploads/music/theme.mp4')).toBe(false)
    expect(isAllowedOstUrl('http://s3.isk0.ai/uploads/music/theme.mp3')).toBe(false)
    // No extra path segments or query strings can tag along
    expect(isAllowedOstUrl('https://s3.isk0.ai/uploads/music/../secret.mp3')).toBe(false)
    expect(isAllowedOstUrl('https://s3.isk0.ai/uploads/music/theme.mp3?x=1')).toBe(false)
    expect(isAllowedOstUrl('')).toBe(false)
  })
})

describe('safeByteRange', () => {
  it('forwards plain byte ranges', () => {
    expect(safeByteRange('bytes=0-1023')).toBe('bytes=0-1023')
    expect(safeByteRange('bytes=1000-')).toBe('bytes=1000-')
    expect(safeByteRange('bytes=-2048')).toBe('bytes=-2048')
    expect(safeByteRange('bytes=0-99,200-299')).toBe('bytes=0-99,200-299')
  })

  it('drops anything malformed or unexpected', () => {
    expect(safeByteRange(null)).toBeNull()
    expect(safeByteRange('bytes=abc')).toBeNull()
    expect(safeByteRange('items=0-10')).toBeNull()
    expect(safeByteRange('bytes=0-10\r\nX-Injected: 1')).toBeNull()
  })
})
