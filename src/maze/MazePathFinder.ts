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

export interface CellPosition {
  row: number
  column: number
}

export function getOpenNeighbors(
  maze: MazeCell[][],
  cell: CellPosition,
): MazeCell[] {
  const currentCell = maze[cell.row]?.[cell.column]

  if (!currentCell) {
    return []
  }

  const neighbors: MazeCell[] = []

  for (const direction of SEARCH_DIRECTIONS) {
    if (currentCell.walls[direction.wall]) {
      continue
    }

    const neighborCell =
      maze[cell.row + direction.rowChange]?.[
        cell.column + direction.columnChange
      ]

    if (neighborCell) {
      neighbors.push(neighborCell)
    }
  }

  return neighbors
}

export function findPath(
  maze: MazeCell[][],
  from: CellPosition,
  to: CellPosition,
): MazeCell[] {
  const startCell = maze[from.row]?.[from.column]
  const targetCell = maze[to.row]?.[to.column]

  if (!startCell || !targetCell) {
    return []
  }

  const previous = new Map<MazeCell, MazeCell | null>([[startCell, null]])
  const searchQueue: MazeCell[] = [startCell]
  let queueIndex = 0

  while (queueIndex < searchQueue.length) {
    const currentCell = searchQueue[queueIndex]
    queueIndex++

    if (currentCell === targetCell) {
      break
    }

    for (const neighborCell of getOpenNeighbors(maze, currentCell)) {
      if (previous.has(neighborCell)) {
        continue
      }

      previous.set(neighborCell, currentCell)
      searchQueue.push(neighborCell)
    }
  }

  if (!previous.has(targetCell)) {
    return []
  }

  const path: MazeCell[] = []
  let step: MazeCell | null = targetCell

  while (step) {
    path.unshift(step)
    step = previous.get(step) ?? null
  }

  return path
}

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

    for (const neighborCell of getOpenNeighbors(maze, currentCell)) {
      const neighborRow = neighborCell.row
      const neighborColumn = neighborCell.column

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
