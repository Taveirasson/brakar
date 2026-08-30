import type { MazeCell } from './MazeGenerator'

type MazeQuaqrant = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

const MAZE_QUADRANTS: MazeQuaqrant[] = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
]

function getCellQuadrant(
  cell: MazeCell,
  totalRows: number,
  totalColumns: number,
): MazeQuaqrant {
  const middleRow = Math.ceil(totalRows / 2)
  const middleColumn = Math.ceil(totalColumns / 2)

  const isTop = cell.row < middleRow
  const isLeft = cell.column < middleColumn

  if (isTop && isLeft) {
    return 'topLeft'
  }

  if (isTop && !isLeft) {
    return 'topRight'
  }

  if (!isTop && isLeft) {
    return 'bottomLeft'
  }

  return 'bottomRight'
}

function isDeadEnd(cell: MazeCell): boolean {
  const wallCount = Object.values(cell.walls).filter(
    (wallExists) => wallExists,
  ).length

  return wallCount === 3
}

function pickRandomCell(cells: MazeCell[]): MazeCell {
  const randomIndex = Math.floor(Math.random() * cells.length)

  const selectedCell = cells[randomIndex]

  if (!selectedCell) {
    throw new Error('Não foi possível selecionar uma célula.')
  }

  return selectedCell
}

export function findItemCellsByQuadrant(
  maze: MazeCell[][],
  exitCell: MazeCell,
): MazeCell[] {
  const totalRows = maze.length
  const totalColumns = maze[0]?.length ?? 0

  if (totalRows === 0 || totalColumns === 0) {
    throw new Error('O labirinto está vazio.')
  }

  const exitQuadrant = getCellQuadrant(exitCell, totalRows, totalColumns)

  const itemQuadrants = MAZE_QUADRANTS.filter(
    (quadrant) => quadrant !== exitQuadrant,
  )

  const allCells = maze.flat()
  const selectedCells: MazeCell[] = []

  for (const quadrant of itemQuadrants) {
    const quadrantCells = allCells.filter((cell) => {
      const cellQuadrant = getCellQuadrant(cell, totalRows, totalColumns)

      const isInitialCell = cell.row === 0 && cell.column === 0

      return cellQuadrant === quadrant && !isInitialCell
    })

    if (quadrantCells.length === 0) {
      throw new Error(`A parte ${quadrant} não possui células disponíveis.`)
    }

    const deadEndCells = quadrantCells.filter((cell) => isDeadEnd(cell))

    const candidates = deadEndCells.length > 0 ? deadEndCells : quadrantCells

    const selectedCell = pickRandomCell(candidates)

    selectedCells.push(selectedCell)
  }

  return selectedCells
}
