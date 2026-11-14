import { describe, expect, it } from 'vitest'
import { MazeGenerator } from './MazeGenerator'
import { braidMaze, countDeadEnds } from './mazeBraiding'
import { findPath } from './MazePathFinder'

describe('braidMaze', () => {
  it('reduz becos sem saída e mantém as paredes simétricas e tudo conectado', () => {
    const maze = new MazeGenerator(12, 12).generate()
    const before = countDeadEnds(maze)

    braidMaze(maze, { deadEndChance: 0.7, extraOpenings: 8 })

    expect(countDeadEnds(maze)).toBeLessThan(before)

    for (const cell of maze.flat()) {
      const right = maze[cell.row][cell.column + 1]
      const below = maze[cell.row + 1]?.[cell.column]

      if (right) expect(cell.walls.right).toBe(right.walls.left)
      if (below) expect(cell.walls.bottom).toBe(below.walls.top)
    }

    expect(
      findPath(maze, { row: 0, column: 0 }, { row: 11, column: 11 }).length,
    ).toBeGreaterThan(0)
  })

  it('não mexe nas paredes externas', () => {
    const maze = new MazeGenerator(6, 6).generate()

    braidMaze(maze, { deadEndChance: 1, extraOpenings: 50 })

    for (let i = 0; i < 6; i++) {
      expect(maze[0][i].walls.top).toBe(true)
      expect(maze[5][i].walls.bottom).toBe(true)
      expect(maze[i][0].walls.left).toBe(true)
      expect(maze[i][5].walls.right).toBe(true)
    }
  })
})
