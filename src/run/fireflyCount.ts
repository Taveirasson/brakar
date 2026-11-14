import type { Difficulty } from '../config/difficulty'

export const BASE_FIREFLIES = 3

/** Vagalumes extras pelo tamanho da mata (lado do labirinto): mapas grandes pedem mais viagens. */
function sizeBonus(mazeSize: number): number {
  if (mazeSize <= 10) return 0
  if (mazeSize <= 16) return 2

  return 4
}

/** Quantos vagalumes juntar: cresce com o mapa e com a dificuldade (padrão 10x10 normal = 3). */
export function fireflyCount(mazeSize: number, difficulty: Difficulty): number {
  return BASE_FIREFLIES + sizeBonus(mazeSize) + (difficulty === 'hard' ? 1 : 0)
}
