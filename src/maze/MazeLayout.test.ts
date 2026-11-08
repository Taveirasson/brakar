import { describe, expect, it } from 'vitest'
import type { Segment } from '../vision/lineOfSight'
import {
  buildTileGrid,
  cellAt,
  cellCenter,
  isCellInterior,
  wallSegmentsFromGrid,
  worldSize,
} from './MazeLayout'
import { buildMaze, SERPENTINE_MAZE } from './testMaze'

describe('buildTileGrid', () => {
  // 2×2 com aberturas (0,0)-(0,1) e (0,1)-(1,1)
  const maze = buildMaze(2, 2, [
    [
      [0, 0],
      [0, 1],
    ],
    [
      [0, 1],
      [1, 1],
    ],
  ])
  const T = 'tree'
  const P = 'path'

  it('gera a grade 7×7 esperada', () => {
    expect(buildTileGrid(maze)).toEqual([
      [T, T, T, T, T, T, T],
      [T, P, P, P, P, P, T],
      [T, P, P, P, P, P, T],
      [T, T, T, T, P, P, T],
      [T, P, P, T, P, P, T],
      [T, P, P, T, P, P, T],
      [T, T, T, T, T, T, T],
    ])
  })

  it('cantos e borda externa são sempre árvore', () => {
    const grid = buildTileGrid(SERPENTINE_MAZE)
    expect(grid).toHaveLength(10)
    for (let i = 0; i < 10; i++) {
      expect([grid[0][i], grid[9][i], grid[i][0], grid[i][9]]).toEqual([
        T,
        T,
        T,
        T,
      ])
    }
    for (const r of [0, 3, 6, 9])
      for (const c of [0, 3, 6, 9]) expect(grid[r][c]).toBe(T)
  })
})

describe('cellCenter / cellAt', () => {
  it('centro da célula', () => {
    expect(cellCenter({ row: 0, column: 0 })).toEqual({ x: 64, y: 64 })
    expect(cellCenter({ row: 2, column: 1 })).toEqual({ x: 160, y: 256 })
  })

  it('ida e volta em todas as células de 3×3', () => {
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 3; column++)
        expect(cellAt(cellCenter({ row, column }), 3)).toEqual({ row, column })
  })

  it('cellAt na abertura e nas bordas da célula', () => {
    expect(cellAt({ x: 96, y: 64 }, 3)).toEqual({ row: 0, column: 1 }) // tile de abertura entre (0,0) e (0,1)
    expect(cellAt({ x: 95.9, y: 64 }, 3)).toEqual({ row: 0, column: 0 })
    expect(cellAt({ x: 10, y: 10 }, 3)).toEqual({ row: 0, column: 0 }) // sobre árvore do canto
  })

  it('cellAt limita pontos fora do mundo', () => {
    expect(cellAt({ x: -50, y: 9999 }, 3)).toEqual({ row: 2, column: 0 })
  })
})

describe('worldSize', () => {
  it('(3n + 1) · 32', () => {
    expect(worldSize(8)).toBe(800)
    expect(worldSize(10)).toBe(992)
    expect(worldSize(20)).toBe(1952)
  })
})

describe('wallSegmentsFromGrid', () => {
  const P = 'path',
    T = 'tree'
  const len = (s: Segment) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1)

  it('árvore isolada no meio de uma clareira murada', () => {
    const segments = wallSegmentsFromGrid([
      [T, T, T, T, T],
      [T, P, P, P, T],
      [T, P, T, P, T],
      [T, P, P, P, T],
      [T, T, T, T, T],
    ])
    // horizontais y=32,64,96,128 e depois verticais x=32,64,96,128
    expect(segments.map(len)).toEqual([96, 32, 32, 96, 96, 32, 32, 96])
    expect(segments[1]).toEqual({ x1: 64, y1: 64, x2: 96, y2: 64 })
  })

  it('corredor gera segmentos unidos, não um por tile', () => {
    const segments = wallSegmentsFromGrid([
      [T, T, T, T, T, T],
      [T, P, P, P, P, T],
      [T, T, T, T, T, T],
    ])
    expect(segments.map(len)).toEqual([128, 128, 32, 32])
  })

  it('grade só de árvore não gera segmentos', () => {
    expect(
      wallSegmentsFromGrid([
        [T, T],
        [T, T],
      ]),
    ).toEqual([])
  })
})

describe('isCellInterior', () => {
  const cell = { row: 1, column: 2 }

  it('é verdadeiro para os 4 tiles do interior 2×2 da célula', () => {
    expect(isCellInterior(4, 7, cell)).toBe(true)
    expect(isCellInterior(4, 8, cell)).toBe(true)
    expect(isCellInterior(5, 7, cell)).toBe(true)
    expect(isCellInterior(5, 8, cell)).toBe(true)
  })

  it('é falso para as aberturas e para tiles fora da célula', () => {
    expect(isCellInterior(3, 7, cell)).toBe(false)
    expect(isCellInterior(4, 6, cell)).toBe(false)
    expect(isCellInterior(6, 7, cell)).toBe(false)
  })
})
