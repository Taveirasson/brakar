import type { TileType } from './MazeLayout'

export const FOREST_TEXTURE = 'forest'

/**
 * Layout do tileset (public/assets/tiles/forest.png), grade de 16 colunas:
 * - linhas 0-7: árvores. Cada linha é um estilo+variante (4 estilos x 2
 *   variantes) e cada coluna é a combinação de lados expostos à trilha (0-15);
 * - linha 8: chão (trilha, trilha com tufo, clareira e chão de mata).
 */
export const TILESET_COLUMNS = 16
export const TREE_STYLE_COUNT = 4 // 0 copa grande, 1 arbusto, 2 frutinhas, 3 flores
export const TREE_VARIANT_COUNT = 2
export const TREE_FRAME_COUNT =
  TREE_STYLE_COUNT * TREE_VARIANT_COUNT * TILESET_COLUMNS
export const FOREST_FRAME_COUNT = TREE_FRAME_COUNT + TILESET_COLUMNS

const GROUND = TREE_FRAME_COUNT

export const FOREST_FRAMES = {
  path: [GROUND, GROUND + 1, GROUND + 2, GROUND + 3, GROUND + 4],
  clearing: [GROUND + 5, GROUND + 6],
  floor: [GROUND + 7, GROUND + 8],
}

/** Bits dos lados de uma árvore que dão para a trilha. */
export const EXPOSED = { top: 1, right: 2, bottom: 4, left: 8 } as const

// Uma cor por frame, usada quando a textura da floresta não carrega.
export const FALLBACK_FRAME_COLORS: number[] = Array.from(
  { length: FOREST_FRAME_COUNT },
  (_, frame) => {
    if (frame < TREE_FRAME_COUNT) return 0x2f5e33
    if (FOREST_FRAMES.clearing.includes(frame)) return 0x6b8f4a
    if (FOREST_FRAMES.floor.includes(frame)) return 0x3b2e20
    return 0x4a3a28
  },
)

// Variação determinística por posição (nunca Math.random).
export function pickTileVariant(
  row: number,
  column: number,
  count: number,
): number {
  let hash = Math.imul(row, 73856093) ^ Math.imul(column, 19349663)
  // Mistura final: sem ela os bits baixos dependem só dos bits baixos de
  // linha/coluna e a variação vira padrão regular (xadrez com count = 2).
  hash ^= hash >>> 15
  hash = Math.imul(hash, 0x2c1b3c6d)
  hash ^= hash >>> 12
  hash ^= hash >>> 16
  return (hash >>> 0) % count
}

/** Lados da árvore em (row, column) que dão para a trilha; fora da grade conta como árvore. */
export function exposedSides(
  grid: TileType[][],
  row: number,
  column: number,
): number {
  const isPath = (r: number, c: number) => grid[r]?.[c] === 'path'

  return (
    (isPath(row - 1, column) ? EXPOSED.top : 0) |
    (isPath(row, column + 1) ? EXPOSED.right : 0) |
    (isPath(row + 1, column) ? EXPOSED.bottom : 0) |
    (isPath(row, column - 1) ? EXPOSED.left : 0)
  )
}

/** Copa grande em metade dos tiles, arbusto em 30%, frutinhas e flores em 10% cada. */
export function pickTreeStyle(row: number, column: number): number {
  const roll = pickTileVariant(row + 101, column + 37, 10)
  if (roll < 5) return 0
  if (roll < 8) return 1
  return roll === 8 ? 2 : 3
}

export function treeFrame(
  style: number,
  variant: number,
  exposed: number,
): number {
  return (style * TREE_VARIANT_COUNT + variant) * TILESET_COLUMNS + exposed
}

export function tileFrameFor(
  type: TileType,
  row: number,
  column: number,
  isClearing: boolean,
  exposed = 0,
): number {
  if (type === 'tree') {
    const variant = pickTileVariant(row + 7, column + 3, TREE_VARIANT_COUNT)
    return treeFrame(pickTreeStyle(row, column), variant, exposed)
  }

  const frames = isClearing ? FOREST_FRAMES.clearing : FOREST_FRAMES.path
  return frames[pickTileVariant(row, column, frames.length)]
}

/** Chão de cada tile: chão de mata embaixo das árvores, trilha ou clareira no resto. */
export function groundFrameFor(
  underTree: boolean,
  row: number,
  column: number,
  isClearing: boolean,
): number {
  if (underTree) {
    const frames = FOREST_FRAMES.floor
    return frames[pickTileVariant(row, column, frames.length)]
  }

  return tileFrameFor('path', row, column, isClearing)
}
