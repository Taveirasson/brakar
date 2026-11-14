import { pickTileVariant } from './forestTileset'
import type { MazeCell } from './MazeGenerator'
import type { CellPosition } from './MazePathFinder'

/**
 * Distância do canto da moita ao centro da célula. Maior que a distância de
 * captura, para o Estouro não pegar o Pipoca só por passar no corredor.
 */
export const HIDING_SPOT_OFFSET = 22

function openSides(cell: MazeCell): number {
  return Object.values(cell.walls).filter((wall) => !wall).length
}

/** Deslocamento fixo (por célula) do canto onde a moita fica. */
export function hidingSpotOffset(cell: CellPosition): {
  x: number
  y: number
} {
  const corner = pickTileVariant(cell.row, cell.column, 4)

  return {
    x: corner % 2 === 0 ? -HIDING_SPOT_OFFSET : HIDING_SPOT_OFFSET,
    y: corner < 2 ? -HIDING_SPOT_OFFSET : HIDING_SPOT_OFFSET,
  }
}

/**
 * Escolhe células para as moitas: corredores (não becos, onde ficam os
 * vagalumes), longe das células excluídas e espalhadas entre si.
 */
export function pickHidingCells(
  maze: MazeCell[][],
  excluded: CellPosition[],
  count: number,
  random: () => number = Math.random,
): MazeCell[] {
  const isExcluded = (cell: MazeCell) =>
    excluded.some(
      (other) => other.row === cell.row && other.column === cell.column,
    )

  const pool = maze
    .flat()
    .filter((cell) => openSides(cell) >= 2 && !isExcluded(cell))

  const chosen: MazeCell[] = []

  for (const minSpacing of [3, 2, 1]) {
    while (chosen.length < count && pool.length > 0) {
      const candidates = pool.filter((cell) =>
        chosen.every(
          (other) =>
            Math.abs(other.row - cell.row) +
              Math.abs(other.column - cell.column) >=
            minSpacing,
        ),
      )

      if (candidates.length === 0) {
        break
      }

      const index = Math.min(
        Math.floor(random() * candidates.length),
        candidates.length - 1,
      )

      chosen.push(candidates[index])
    }
  }

  return chosen
}
