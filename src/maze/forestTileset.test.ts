import { describe, expect, it } from 'vitest'
import {
  FALLBACK_FRAME_COLORS,
  FOREST_FRAME_COUNT,
  FOREST_FRAMES,
  pickTileVariant,
  tileFrameFor,
} from './forestTileset'

describe('forestTileset', () => {
  it('pickTileVariant é determinístico e fica no intervalo', () => {
    for (let r = 0; r < 30; r++)
      for (let c = 0; c < 30; c++) {
        const v = pickTileVariant(r, c, 4)
        expect(v).toBe(pickTileVariant(r, c, 4))
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(4)
      }
  })

  it('pickTileVariant varia ao longo da grade', () => {
    const seen = new Set<number>()
    for (let c = 0; c < 30; c++) seen.add(pickTileVariant(5, c, 4))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('tileFrameFor escolhe o grupo certo', () => {
    expect(FOREST_FRAMES.tree).toContain(tileFrameFor('tree', 3, 7, false))
    expect(FOREST_FRAMES.path).toContain(tileFrameFor('path', 3, 7, false))
    expect(FOREST_FRAMES.clearing).toContain(tileFrameFor('path', 3, 7, true))
  })

  it('há uma cor de fallback por frame', () => {
    expect(FALLBACK_FRAME_COLORS).toHaveLength(FOREST_FRAME_COUNT)
  })

  it('pickTileVariant com 2 variantes não vira xadrez', () => {
    let checker = true
    const counts = [0, 0]
    for (let r = 0; r < 20; r++)
      for (let c = 0; c < 20; c++) {
        const v = pickTileVariant(r, c, 2)
        counts[v]++
        if (v !== (r + c) % 2) checker = false
      }
    expect(checker).toBe(false)
    expect(counts[0]).toBeGreaterThanOrEqual(120)
    expect(counts[1]).toBeGreaterThanOrEqual(120)
  })
})
