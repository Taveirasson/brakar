import { describe, expect, it } from 'vitest'
import { MazeGenerator } from './MazeGenerator'
import {
  HIDING_SPOT_OFFSET,
  hidingSpotOffset,
  pickHidingCells,
} from './HidingSpotPlacement'

describe('pickHidingCells', () => {
  const maze = new MazeGenerator(10, 10).generate()

  it('devolve a quantidade pedida, sem repetir e sem becos', () => {
    const cells = pickHidingCells(maze, [], 6)
    const keys = new Set(cells.map((cell) => `${cell.row},${cell.column}`))

    expect(cells).toHaveLength(6)
    expect(keys.size).toBe(6)

    for (const cell of cells) {
      const open = Object.values(cell.walls).filter((wall) => !wall).length

      expect(open).toBeGreaterThanOrEqual(2)
    }
  })

  it('respeita as células excluídas', () => {
    const excluded = maze.flat().slice(0, 40)
    const cells = pickHidingCells(maze, excluded, 6)

    for (const cell of cells) {
      expect(
        excluded.some((e) => e.row === cell.row && e.column === cell.column),
      ).toBe(false)
    }
  })
})

describe('hidingSpotOffset', () => {
  it('fica num canto da célula e é estável', () => {
    const offset = hidingSpotOffset({ row: 3, column: 4 })

    expect(Math.abs(offset.x)).toBe(HIDING_SPOT_OFFSET)
    expect(Math.abs(offset.y)).toBe(HIDING_SPOT_OFFSET)
    expect(hidingSpotOffset({ row: 3, column: 4 })).toEqual(offset)
  })
})
