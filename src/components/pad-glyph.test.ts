import { describe, expect, it } from 'vitest'
import { promptFor } from '#/components/pad-glyph'

const none = { connected: false, kind: 'generic' as const }
const sw = { connected: true, kind: 'switch' as const }
const ds4 = { connected: true, kind: 'playstation' as const, model: 'DUALSHOCK 4' }
const ds = { connected: true, kind: 'playstation' as const, model: 'DualSense' }
const full = { lite: false, dark: false }

describe('promptFor', () => {
  it('draws keyboard keys from the Xelu set at the size for the mode', () => {
    expect(promptFor('Esc', none, full)?.src).toBe('/prompts/hq/key-esc.webp')
    expect(promptFor('Esc', none, { lite: true, dark: false })?.src).toBe('/prompts/lo/key-esc.webp')
  })

  it('keeps a keyboard R as a key when a Switch pad is connected', () => {
    expect(promptFor('R', sw, full)?.src).toBe('/prompts/hq/switch-r.webp')
    expect(promptFor('R', sw, { ...full, keyboard: true })?.src).toBe('/prompts/hq/key-r.webp')
  })

  it('gives a DUALSHOCK 4 the PS4 set and a DualSense the PS5 set on light surfaces', () => {
    expect(promptFor('✕', ds4, full)?.src).toBe('/prompts/lo/ps4-cross.webp')
    expect(promptFor('✕', ds, full)?.src).toBe('/prompts/hq/ps-cross.webp')
    expect(promptFor('✕', ds, { lite: false, dark: true })?.src).toBe('/prompts/lo/ps4-cross.webp')
  })

  it('returns null for labels with no image, so they render as text', () => {
    expect(promptFor('/', none, full)).toBeNull()
    expect(promptFor('SL', { connected: true, kind: 'gtnx' }, full)).toBeNull()
  })
})
