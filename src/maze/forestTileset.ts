import type { TileType } from './MazeLayout'

export const FOREST_TEXTURE = 'forest'
export const FOREST_FRAME_COUNT = 13

// Frames 0-3 copas, 4-5 arbustos, 6-8 trilha, 9-10 trilha com tufo, 11-12 clareira.
export const FOREST_FRAMES = {
  tree: [0, 1, 2, 3, 4, 5],
  path: [6, 7, 8, 9, 10],
  clearing: [11, 12],
}

// Uma cor por frame, usada quando a textura da floresta não carrega.
export const FALLBACK_FRAME_COLORS: number[] = [
  ...Array<number>(4).fill(0x1e3b22),
  ...Array<number>(2).fill(0x284a2a),
  ...Array<number>(3).fill(0x4a3a28),
  ...Array<number>(2).fill(0x55432d),
  ...Array<number>(2).fill(0x6b8f4a),
]

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

export function tileFrameFor(
  type: TileType,
  row: number,
  column: number,
  isClearing: boolean,
): number {
  const frames = isClearing ? FOREST_FRAMES.clearing : FOREST_FRAMES[type]
  return frames[pickTileVariant(row, column, frames.length)]
}
