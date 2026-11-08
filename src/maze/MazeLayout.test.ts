import { describe, expect, it } from 'vitest'
import { buildTileGrid, cellAt, cellCenter, worldSize } from './MazeLayout'
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
