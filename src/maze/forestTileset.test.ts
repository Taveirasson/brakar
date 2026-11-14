import { describe, expect, it } from 'vitest'
import type { TileType } from './MazeLayout'
import {
  EXPOSED,
  FALLBACK_FRAME_COLORS,
  FOREST_FRAME_COUNT,
  FOREST_FRAMES,
  TREE_FRAME_COUNT,
  exposedSides,
  groundFrameFor,
  pickTileVariant,
  pickTreeStyle,
  tileFrameFor,
  treeFrame,
} from './forestTileset'

const T: TileType = 'tree'
const P: TileType = 'path'

describe('pickTileVariant', () => {
  it('é determinístico e fica no intervalo', () => {
    for (let r = 0; r < 30; r++)
      for (let c = 0; c < 30; c++) {
        const v = pickTileVariant(r, c, 4)
        expect(v).toBe(pickTileVariant(r, c, 4))
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(4)
      }
  })

  it('varia ao longo da grade', () => {
    const seen = new Set<number>()
    for (let c = 0; c < 30; c++) seen.add(pickTileVariant(5, c, 4))
    expect(seen.size).toBeGreaterThan(1)
  })

  it('com 2 variantes não vira xadrez', () => {
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

describe('exposedSides', () => {
  it('árvore cercada de trilha expõe os 4 lados', () => {
    const grid = [
      [P, P, P],
      [P, T, P],
      [P, P, P],
    ]
    expect(exposedSides(grid, 1, 1)).toBe(
      EXPOSED.top | EXPOSED.right | EXPOSED.bottom | EXPOSED.left,
    )
  })

  it('árvore vizinha e borda da grade não contam como expostas', () => {
    const grid = [
      [T, T, P],
      [T, P, P],
    ]
    // (0,0): acima e à esquerda é fora da grade, à direita e abaixo é árvore
    expect(exposedSides(grid, 0, 0)).toBe(0)
    // (0,1): só a direita e embaixo dão para a trilha
    expect(exposedSides(grid, 0, 1)).toBe(EXPOSED.right | EXPOSED.bottom)
  })
})

describe('frames de árvore', () => {
  it('treeFrame segue a grade: estilo e variante por linha, lados expostos por coluna', () => {
    expect(treeFrame(0, 0, 0)).toBe(0)
    expect(treeFrame(0, 1, 5)).toBe(21)
    expect(treeFrame(3, 1, 15)).toBe(TREE_FRAME_COUNT - 1)
  })

  it('pickTreeStyle: copa grande na metade dos tiles e todos os estilos aparecem', () => {
    const counts = [0, 0, 0, 0]
    for (let r = 0; r < 40; r++)
      for (let c = 0; c < 40; c++) counts[pickTreeStyle(r, c)]++
    const total = 40 * 40
    expect(counts[0] / total).toBeGreaterThan(0.4)
    expect(counts[0] / total).toBeLessThan(0.6)
    for (const count of counts) expect(count).toBeGreaterThan(0)
  })

  it('tileFrameFor de árvore usa os lados expostos', () => {
    const frame = tileFrameFor('tree', 3, 7, false, 15)
    expect(frame % 16).toBe(15)
    expect(frame).toBeLessThan(TREE_FRAME_COUNT)
  })
})

describe('frames de chão', () => {
  it('trilha, clareira e chão de mata vêm dos grupos certos', () => {
    expect(FOREST_FRAMES.path).toContain(tileFrameFor('path', 3, 7, false))
    expect(FOREST_FRAMES.clearing).toContain(tileFrameFor('path', 3, 7, true))
    expect(FOREST_FRAMES.floor).toContain(groundFrameFor(true, 3, 7, false))
    expect(FOREST_FRAMES.path).toContain(groundFrameFor(false, 3, 7, false))
    expect(FOREST_FRAMES.clearing).toContain(groundFrameFor(false, 3, 7, true))
  })

  it('frames de chão ficam depois dos de árvore e dentro do tileset', () => {
    const ground = [
      ...FOREST_FRAMES.path,
      ...FOREST_FRAMES.clearing,
      ...FOREST_FRAMES.floor,
    ]
    for (const frame of ground) {
      expect(frame).toBeGreaterThanOrEqual(TREE_FRAME_COUNT)
      expect(frame).toBeLessThan(FOREST_FRAME_COUNT)
    }
  })

  it('há uma cor de fallback por frame', () => {
    expect(FALLBACK_FRAME_COLORS).toHaveLength(FOREST_FRAME_COUNT)
  })
})
