export type WallDirection = 'top' | 'right' | 'bottom' | 'left'

export interface MazeWalls {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

export interface MazeCell {
  row: number
  column: number
  visited: boolean
  walls: MazeWalls
}

interface DirectionInformation {
  rowChange: number
  columnChange: number
  wall: WallDirection
  oppositeWall: WallDirection
}

interface AvailableNeighbor {
  cell: MazeCell
  wall: WallDirection
  oppositeWall: WallDirection
}

const DIRECTIONS: DirectionInformation[] = [
  { rowChange: -1, columnChange: 0, wall: 'top', oppositeWall: 'bottom' },
  { rowChange: 0, columnChange: 1, wall: 'right', oppositeWall: 'left' },
  { rowChange: 1, columnChange: 0, wall: 'bottom', oppositeWall: 'top' },
  { rowChange: 0, columnChange: -1, wall: 'left', oppositeWall: 'right' },
]

export class MazeGenerator {
  constructor(
    private readonly rows: number,
    private readonly columns: number,
    private readonly random: () => number = Math.random,
  ) {
    if (rows < 1 || columns < 1) {
      throw new Error(
        'O labirinto precisa ter pelo menos uma linha e uma coluna.',
      )
    }
  }

  public generate(): MazeCell[][] {
    const grid = this.createClosedGrid()
    const initialCell = grid[0]?.[0]

    if (!initialCell) {
      throw new Error('Não foi possível encontrar a célula inicial.')
    }

    const cellStack: MazeCell[] = [initialCell]

    initialCell.visited = true

    while (cellStack.length > 0) {
      const currentCell = cellStack[cellStack.length - 1]

      const availableNeighbors = this.findUnvisitedNeighbors(grid, currentCell)

      if (availableNeighbors.length === 0) {
        cellStack.pop()
        continue
      }

      const selectedNeighbor = this.pickRandom(availableNeighbors)

      currentCell.walls[selectedNeighbor.wall] = false

      selectedNeighbor.cell.walls[selectedNeighbor.oppositeWall] = false

      selectedNeighbor.cell.visited = true

      cellStack.push(selectedNeighbor.cell)
    }

    return grid
  }

  private createClosedGrid(): MazeCell[][] {
    return Array.from({ length: this.rows }, (_, row) =>
      Array.from({ length: this.columns }, (_, column): MazeCell => ({
        row,
        column,
        visited: false,
        walls: { top: true, right: true, bottom: true, left: true },
      })),
    )
  }

  private findUnvisitedNeighbors(
    grid: MazeCell[][],
    cell: MazeCell,
  ): AvailableNeighbor[] {
    const neighbors: AvailableNeighbor[] = []

    for (const direction of DIRECTIONS) {
      const neighborRow = cell.row + direction.rowChange

      const neighborColumn = cell.column + direction.columnChange

      const rowIsOutside = neighborRow < 0 || neighborRow >= this.rows
      const columnIsOutside =
        neighborColumn < 0 || neighborColumn >= this.columns

      if (rowIsOutside || columnIsOutside) {
        continue
      }

      const neighborCell = grid[neighborRow][neighborColumn]

      if (neighborCell.visited) {
        continue
      }

      neighbors.push({
        cell: neighborCell,
        wall: direction.wall,
        oppositeWall: direction.oppositeWall,
      })
    }

    return neighbors
  }

  private pickRandom<T>(values: T[]): T {
    const randomIndex = Math.floor(this.random() * values.length)

    const selectedValue = values[randomIndex]

    if (selectedValue === undefined) {
      throw new Error('Não foi possível escolher um elemento aleatório.')
    }

    return selectedValue
  }
}
