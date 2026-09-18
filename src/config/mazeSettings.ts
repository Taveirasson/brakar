export const MAZE_SIZES = [8, 10, 16, 20]
export type MazeSize = (typeof MAZE_SIZES)[number]

const STORAGE_KEY = 'brakar-maze-size'

export function getSavedMazeSize(): MazeSize {
  const value = Number(localStorage.getItem(STORAGE_KEY))
  return MAZE_SIZES.find((size) => size === value) ?? 10
}

export function saveMazeSize(size: MazeSize): void {
  localStorage.setItem(STORAGE_KEY, String(size))
}
