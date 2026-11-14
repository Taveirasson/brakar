import { describe, expect, it } from 'vitest'
import { findPath, getOpenNeighbors } from './MazePathFinder'
import { SERPENTINE_MAZE } from './testMaze'

const toPairs = (cells: { row: number; column: number }[]) =>
  cells.map((cell) => [cell.row, cell.column])

describe('getOpenNeighbors', () => {
  it('retorna só vizinhos sem parede', () => {
    expect(
      toPairs(getOpenNeighbors(SERPENTINE_MAZE, { row: 0, column: 0 })),
    ).toEqual([[0, 1]])
    expect(
      toPairs(getOpenNeighbors(SERPENTINE_MAZE, { row: 1, column: 1 })),
    ).toEqual([
      [1, 2],
      [1, 0],
    ])
  })
})

describe('findPath', () => {
  it('percorre o labirinto inteiro do início ao fim', () => {
    expect(
      toPairs(
        findPath(SERPENTINE_MAZE, { row: 0, column: 0 }, { row: 2, column: 2 }),
      ),
    ).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 1],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ])
  })

  it('respeita paredes em vez de ir direto', () => {
    expect(
      toPairs(
        findPath(SERPENTINE_MAZE, { row: 0, column: 0 }, { row: 1, column: 0 }),
      ),
    ).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 1],
      [1, 0],
    ])
  })

  it('origem igual ao destino retorna só a origem', () => {
    expect(
      toPairs(
        findPath(SERPENTINE_MAZE, { row: 1, column: 1 }, { row: 1, column: 1 }),
      ),
    ).toEqual([[1, 1]])
  })
})
