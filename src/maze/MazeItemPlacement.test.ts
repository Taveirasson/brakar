import { describe, expect, it } from 'vitest'
import { MazeGenerator } from './MazeGenerator'
import { findNearStartCell, pathDistances } from './MazeItemPlacement'

describe('findNearStartCell', () => {
  it('acha uma célula a 3-5 passos do início, fora das excluídas', () => {
    const maze = new MazeGenerator(10, 10).generate()
    const distances = pathDistances(maze, { row: 0, column: 0 })

    for (let i = 0; i < 20; i++) {
      const cell = findNearStartCell(maze, [{ row: 9, column: 9 }])

      expect(cell).toBeDefined()

      const steps = distances.get(`${cell!.row},${cell!.column}`) ?? 0

      expect(steps).toBeGreaterThanOrEqual(3)
      expect(steps).toBeLessThanOrEqual(5)
    }
  })
})
