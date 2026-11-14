import type { MazeCell } from './MazeGenerator'
import { getOpenNeighbors, type CellPosition } from './MazePathFinder'

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

function pickRandomCell(cells: MazeCell[], random: () => number): MazeCell {
  const randomIndex = Math.floor(random() * cells.length)

  const selectedCell = cells[randomIndex]

  if (!selectedCell) {
    throw new Error('Não foi possível selecionar uma célula.')
  }

  return selectedCell
}

export function findItemCellsByQuadrant(
  maze: MazeCell[][],
  exitCell: MazeCell,
  random: () => number = Math.random,
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

    const selectedCell = pickRandomCell(candidates, random)

    selectedCells.push(selectedCell)
  }

  return selectedCells
}

/** Distância em passos pelo labirinto a partir de uma célula (busca em largura). */
export function pathDistances(
  maze: MazeCell[][],
  from: CellPosition,
): Map<string, number> {
  const distances = new Map<string, number>([[`${from.row},${from.column}`, 0]])
  const queue: CellPosition[] = [from]

  for (let index = 0; index < queue.length; index++) {
    const current = queue[index]
    const base = distances.get(`${current.row},${current.column}`) ?? 0

    for (const next of getOpenNeighbors(maze, current)) {
      const key = `${next.row},${next.column}`

      if (!distances.has(key)) {
        distances.set(key, base + 1)
        queue.push(next)
      }
    }
  }

  return distances
}

/**
 * Célula para o primeiro vagalume: perto do início (primeira recompensa em
 * segundos). Prefere becos; devolve undefined se não houver célula na faixa.
 */
export function findNearStartCell(
  maze: MazeCell[][],
  excluded: CellPosition[],
  random: () => number = Math.random,
  minSteps = 3,
  maxSteps = 5,
): MazeCell | undefined {
  const distances = pathDistances(maze, { row: 0, column: 0 })
  const candidates = maze.flat().filter((cell) => {
    const steps = distances.get(`${cell.row},${cell.column}`) ?? Infinity

    return (
      steps >= minSteps &&
      steps <= maxSteps &&
      !excluded.some((e) => e.row === cell.row && e.column === cell.column)
    )
  })
  const deadEnds = candidates.filter((cell) => isDeadEnd(cell))
  const pool = deadEnds.length > 0 ? deadEnds : candidates

  return pool.length > 0 ? pickRandomCell(pool, random) : undefined
}

/**
 * Células extras de vagalume quando o mapa pede mais que os 3 do começo: espalhadas
 * (afastadas entre si, do início e da saída), preferindo becos. Se o espaçamento
 * não couber, ele diminui até achar células.
 */
export function findExtraItemCells(
  maze: MazeCell[][],
  taken: CellPosition[],
  count: number,
  random: () => number = Math.random,
): MazeCell[] {
  const extra: MazeCell[] = []
  const all = maze.flat()
  const spacingFor = (spacing: number) =>
    all.filter(
      (cell) =>
        !(cell.row === 0 && cell.column === 0) &&
        [...taken, ...extra].every(
          (other) =>
            Math.abs(other.row - cell.row) +
              Math.abs(other.column - cell.column) >=
            spacing,
        ),
    )

  while (extra.length < count) {
    let pool: MazeCell[] = []

    for (let spacing = 4; spacing >= 1 && pool.length === 0; spacing--) {
      pool = spacingFor(spacing)
    }

    if (pool.length === 0) break

    const deadEnds = pool.filter((cell) => isDeadEnd(cell))

    extra.push(pickRandomCell(deadEnds.length > 0 ? deadEnds : pool, random))
  }

  return extra
}
