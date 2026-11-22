import { describe, expect, it, vi } from 'vitest'
import { agoLabel, clearSave, readSave, resumeSearch, saveLabel, writeSave } from '#/lib/save-state'

function mockStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  }
}

describe('save-state', () => {
  it('validates stored saves and rejects expired or malformed entries', () => {
    const storage = mockStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)

    const now = Date.now()
    writeSave({ slug: 'acolytes', section: 'cast', at: now })
    expect(readSave()).toEqual({ slug: 'acolytes', section: 'cast', at: now })

    // Invalid slug or NaN timestamp are rejected
    storage.setItem('kx_savestate', JSON.stringify({ slug: 'nope', at: now }))
    expect(readSave()).toBeNull()

    storage.setItem('kx_savestate', JSON.stringify({ slug: 'acolytes', at: Number.NaN }))
    expect(readSave()).toBeNull()

    // Expired (> 120 days) is rejected
    storage.setItem('kx_savestate', JSON.stringify({ slug: 'acolytes', at: now - 121 * 24 * 60 * 60 * 1000 }))
    expect(readSave()).toBeNull()

    // Unknown section falls back without crashing
    storage.setItem('kx_savestate', JSON.stringify({ slug: 'acolytes', section: 'unknown', at: now }))
    expect(readSave()).toEqual({ slug: 'acolytes', at: now })

    clearSave()
    expect(readSave()).toBeNull()
    vi.unstubAllGlobals()
  })

  it('builds labels, search params, and relative timestamps', () => {
    const now = Date.now()
    expect(saveLabel({ slug: 'acolytes', tab: 'trimz', at: now })).toBe('the series on Trimz')
    expect(saveLabel({ slug: 'acolytes', tab: 'youtube', at: now })).toBe('the videos')
    expect(saveLabel({ slug: 'acolytes', section: 'trophies', at: now })).toBe('the trophy list')

    expect(resumeSearch({ slug: 'acolytes', section: 'overview', at: now })).toEqual({})
    expect(resumeSearch({ slug: 'acolytes', section: 'ost', at: now })).toEqual({ section: 'ost' })
    expect(resumeSearch({ slug: 'acolytes', tab: 'youtube', at: now })).toEqual({ tab: 'youtube' })

    expect(agoLabel(now - 10_000)).toBe('just now')
    expect(agoLabel(now - 5 * 60_000)).toBe('5m ago')
    expect(agoLabel(now - 3 * 3600_000)).toBe('3h ago')
    expect(agoLabel(now - 3 * 24 * 3600_000)).toBe('3d ago')
  })
})
