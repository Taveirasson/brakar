import type { MazeCell } from './MazeGenerator'

type Coordinate = [number, number]

export function buildMaze(
  rows: number,
  columns: number,
  openings: Array<[Coordinate, Coordinate]>,
): MazeCell[][] {
  const maze: MazeCell[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => ({
      row,
      column,
      visited: true,
      walls: { top: true, right: true, bottom: true, left: true },
    })),
  )

  for (const [[rowA, columnA], [rowB, columnB]] of openings) {
    const cellA = maze[rowA][columnA]
    const cellB = maze[rowB][columnB]

    if (rowB === rowA + 1 && columnB === columnA) {
      cellA.walls.bottom = false
      cellB.walls.top = false
    } else if (rowB === rowA - 1 && columnB === columnA) {
      cellA.walls.top = false
      cellB.walls.bottom = false
    } else if (columnB === columnA + 1 && rowB === rowA) {
      cellA.walls.right = false
      cellB.walls.left = false
    } else if (columnB === columnA - 1 && rowB === rowA) {
      cellA.walls.left = false
      cellB.walls.right = false
    } else {
      throw new Error('As células da abertura precisam ser vizinhas.')
    }
  }

  return maze
}

export const SERPENTINE_MAZE: MazeCell[][] = buildMaze(3, 3, [
  [
    [0, 0],
    [0, 1],
  ],
  [
    [0, 1],
    [0, 2],
  ],
  [
    [0, 2],
    [1, 2],
  ],
  [
    [1, 2],
    [1, 1],
  ],
  [
    [1, 1],
    [1, 0],
  ],
  [
    [1, 0],
    [2, 0],
  ],
  [
    [2, 0],
    [2, 1],
  ],
  [
    [2, 1],
    [2, 2],
  ],
])
