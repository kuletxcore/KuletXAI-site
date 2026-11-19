import { describe, expect, it } from 'vitest'
import { pickNext } from '#/lib/spatial'

const box = (left: number, top: number, width = 100, height = 40) => ({ left, top, width, height, right: left + width, bottom: top + height })

describe('pickNext', () => {
  // A 3x2 grid of buttons, 20px gaps
  const grid = [box(0, 0), box(120, 0), box(240, 0), box(0, 60), box(120, 60), box(240, 60)]

  it('moves to the neighbour in each direction', () => {
    expect(pickNext(grid[4], grid, 'up')).toBe(1)
    expect(pickNext(grid[1], grid, 'down')).toBe(4)
    expect(pickNext(grid[4], grid, 'left')).toBe(3)
    expect(pickNext(grid[4], grid, 'right')).toBe(5)
  })

  it('returns -1 at an edge', () => {
    expect(pickNext(grid[0], grid, 'up')).toBe(-1)
    expect(pickNext(grid[2], grid, 'right')).toBe(-1)
  })

  it('prefers a wide control directly below over a lined-up one far away', () => {
    const from = box(300, 0, 60, 40)
    const wide = box(0, 60, 400, 40)
    const far = box(300, 600, 60, 40)
    expect(pickNext(from, [far, wide], 'down')).toBe(1)
  })

  it('never moves backwards past the current control', () => {
    expect(pickNext(box(0, 100), [box(0, 0)], 'down')).toBe(-1)
  })
})
