import type { MazeCell, WallDirection } from './MazeGenerator'

interface SearchDirection {
  rowChange: number
  columnChange: number
  wall: WallDirection
}

export interface FarthestCellResult {
  cell: MazeCell
  distance: number
}

const SEARCH_DIRECTIONS: SearchDirection[] = [
  {
    rowChange: -1,
    columnChange: 0,
    wall: 'top',
  },
  {
    rowChange: 0,
    columnChange: 1,
    wall: 'right',
  },
  {
    rowChange: 1,
    columnChange: 0,
    wall: 'bottom',
  },
  {
    rowChange: 0,
    columnChange: -1,
    wall: 'left',
  },
]

export function findFarthestCell(
  maze: MazeCell[][],
  startRow: number,
  startColumn: number,
): FarthestCellResult {
  const totalRows = maze.length
  const totalColumns = maze[0]?.length ?? 0

  const startCell = maze[startRow]?.[startColumn]

  if (!startCell) {
    throw new Error('A célula inicial não existe no labirinto.')
  }

  const distances = Array.from({ length: totalRows }, () =>
    Array.from({ length: totalColumns }, () => -1),
  )

  const searchQueue: MazeCell[] = [startCell]

  let queueIndex = 0

  distances[startRow][startColumn] = 0

  let farthestCell = startCell
  let farthestDistance = 0

  while (queueIndex < searchQueue.length) {
    const currentCell = searchQueue[queueIndex]

    queueIndex++

    const currentDistance = distances[currentCell.row][currentCell.column]

    for (const direction of SEARCH_DIRECTIONS) {
      const wallExists = currentCell.walls[direction.wall]

      if (wallExists) {
        continue
      }

      const neighborRow = currentCell.row + direction.rowChange

      const neighborColumn = currentCell.column + direction.columnChange

      const neighborCell = maze[neighborRow]?.[neighborColumn]

      if (!neighborCell) {
        continue
      }

      const neighborWasVisited = distances[neighborRow][neighborColumn] !== -1

      if (neighborWasVisited) {
        continue
      }

      const neighborDistance = currentDistance + 1

      distances[neighborRow][neighborColumn] = neighborDistance

      searchQueue.push(neighborCell)

      if (neighborDistance > farthestDistance) {
        farthestDistance = neighborDistance

        farthestCell = neighborCell
      }
    }
  }

  return {
    cell: farthestCell,
    distance: farthestDistance,
  }
}
