import type { MazeCell, WallDirection } from './MazeGenerator'

const SIDES: Array<{
  rowChange: number
  columnChange: number
  wall: WallDirection
  opposite: WallDirection
}> = [
  { rowChange: -1, columnChange: 0, wall: 'top', opposite: 'bottom' },
  { rowChange: 0, columnChange: 1, wall: 'right', opposite: 'left' },
  { rowChange: 1, columnChange: 0, wall: 'bottom', opposite: 'top' },
  { rowChange: 0, columnChange: -1, wall: 'left', opposite: 'right' },
]

export interface BraidOptions {
  /** Chance de cada beco sem saída ganhar uma passagem extra (0 a 1). */
  deadEndChance: number
  /** Passagens extras abertas em paredes aleatórias. */
  extraOpenings: number
}

function closedWalls(cell: MazeCell): number {
  return Object.values(cell.walls).filter(Boolean).length
}

/** Paredes internas (com vizinho dentro da grade) ainda fechadas da célula. */
function closedInternalSides(maze: MazeCell[][], cell: MazeCell) {
  return SIDES.filter((side) => {
    const neighbor =
      maze[cell.row + side.rowChange]?.[cell.column + side.columnChange]

    return neighbor !== undefined && cell.walls[side.wall]
  })
}

function openBetween(
  maze: MazeCell[][],
  cell: MazeCell,
  side: (typeof SIDES)[number],
): void {
  const neighbor =
    maze[cell.row + side.rowChange][cell.column + side.columnChange]

  cell.walls[side.wall] = false
  neighbor.walls[side.opposite] = false
}

function pick<T>(values: T[], random: () => number): T {
  return values[
    Math.min(Math.floor(random() * values.length), values.length - 1)
  ]
}

/**
 * Transforma o labirinto perfeito (um só caminho entre dois pontos) em um com
 * ciclos: abre passagens em becos sem saída e em paredes aleatórias. Assim há
 * rotas alternativas e o Pipoca não fica preso numa ponta. Nunca fecha nada,
 * então tudo continua conectado.
 */
export function braidMaze(
  maze: MazeCell[][],
  options: BraidOptions,
  random: () => number = Math.random,
): void {
  for (const cell of maze.flat()) {
    if (closedWalls(cell) !== 3 || random() >= options.deadEndChance) {
      continue
    }

    const options_ = closedInternalSides(maze, cell)

    if (options_.length > 0) {
      openBetween(maze, cell, pick(options_, random))
    }
  }

  for (let i = 0; i < options.extraOpenings; i++) {
    const cell = pick(maze.flat(), random)
    const sides = closedInternalSides(maze, cell)

    if (sides.length > 0) {
      openBetween(maze, cell, pick(sides, random))
    }
  }
}

export function countDeadEnds(maze: MazeCell[][]): number {
  return maze.flat().filter((cell) => closedWalls(cell) === 3).length
}
