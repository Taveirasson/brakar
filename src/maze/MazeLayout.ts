import type { Point } from '../vision/lineOfSight'
import type { MazeCell } from './MazeGenerator'
import type { CellPosition } from './MazePathFinder'

export const TILE_SIZE = 32
// Cada célula do labirinto ocupa 3×3 tiles (interior 2×2 + faixa de árvores).
export const CELL_PITCH = 96
export const MOVEMENT_SCALE = 1.5

export type TileType = 'tree' | 'path'

// Grade indexada [linha][coluna] com (3n + 1) linhas × (3m + 1) colunas.
export function buildTileGrid(maze: MazeCell[][]): TileType[][] {
  const rows = maze.length
  const columns = maze[0]?.length ?? 0
  const grid: TileType[][] = Array.from({ length: 3 * rows + 1 }, () =>
    Array.from({ length: 3 * columns + 1 }, (): TileType => 'tree'),
  )

  for (const line of maze) {
    for (const cell of line) {
      const originRow = 3 * cell.row
      const originColumn = 3 * cell.column

      for (let dr = 1; dr <= 2; dr++) {
        for (let dc = 1; dc <= 2; dc++) {
          grid[originRow + dr][originColumn + dc] = 'path'
        }
      }

      if (!cell.walls.top) {
        grid[originRow][originColumn + 1] = 'path'
        grid[originRow][originColumn + 2] = 'path'
      }
      if (!cell.walls.left) {
        grid[originRow + 1][originColumn] = 'path'
        grid[originRow + 2][originColumn] = 'path'
      }
    }
  }

  return grid
}

export function cellCenter(cell: CellPosition): Point {
  return {
    x: cell.column * CELL_PITCH + (CELL_PITCH / 3) * 2,
    y: cell.row * CELL_PITCH + (CELL_PITCH / 3) * 2,
  }
}

// Assume labirinto quadrado (mazeSize × mazeSize); pontos fora são limitados.
export function cellAt(point: Point, mazeSize: number): CellPosition {
  const clamp = (value: number) =>
    Math.min(mazeSize - 1, Math.max(0, Math.floor(value / CELL_PITCH)))
  return { row: clamp(point.y), column: clamp(point.x) }
}

export function worldSize(mazeSize: number): number {
  return (3 * mazeSize + 1) * TILE_SIZE
}
