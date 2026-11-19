import { describe, expect, it } from 'vitest'
import { PAD_LABEL, kindOf, modelOf } from '#/lib/gamepad'

describe('kindOf', () => {
  it('reads Xbox before PlayStation, since Xbox names also say "Wireless Controller"', () => {
    expect(kindOf('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')).toBe('xbox')
  })

  it('spots DualSense and DUALSHOCK 4 from vendor id, name and product id', () => {
    expect(kindOf('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toBe('playstation')
    expect(kindOf('DualSense Wireless Controller')).toBe('playstation')
    expect(kindOf('054c-05c4-Wireless Controller')).toBe('playstation')
    expect(kindOf('Sony Interactive Entertainment Wireless Controller')).toBe('playstation')
  })

  it('spots Switch pads and generic fallbacks', () => {
    expect(kindOf('Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)')).toBe('switch')
    expect(kindOf('Nintendo Switch Joy-Con')).toBe('switch')
    expect(kindOf('Some Random Pad')).toBe('generic')
  })

  it('treats GT NX halves as split mode, not Xbox', () => {
    expect(kindOf('GT NX Controller-L')).toBe('gtnx')
    expect(kindOf('GT NX Controller-R')).toBe('gtnx')
    // The bare combined name is not split mode
    expect(kindOf('GT NX Controller')).toBe('generic')
  })
})

describe('modelOf', () => {
  it('only names Sony models', () => {
    expect(modelOf('DualSense Edge Wireless Controller')).toBe('DualSense Edge')
    expect(modelOf('Wireless Controller (Vendor: 054c Product: 0ce6)')).toBe('DualSense')
    expect(modelOf('Wireless Controller (Vendor: 054c Product: 05c4)')).toBe('DUALSHOCK 4')
    expect(modelOf('Xbox Wireless Controller')).toBeUndefined()
  })
})

describe('PAD_LABEL', () => {
  it('keeps Switch face buttons positional and GT NX on split letters', () => {
    expect(PAD_LABEL.switch.a).toBe('B')
    expect(PAD_LABEL.switch.b).toBe('A')
    expect(PAD_LABEL.gtnx.lb).toBe('SL')
    expect(PAD_LABEL.playstation.a).toBe('✕')
  })
})
