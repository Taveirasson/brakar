import { MOVEMENT_SCALE } from '../maze/MazeLayout'
import type { HunterSettings } from '../hunter/hunterSettings'

export type Difficulty = 'easy' | 'normal' | 'hard'

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard']

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'FÁCIL',
  normal: 'NORMAL',
  hard: 'DIFÍCIL',
}

const STORAGE_KEY = 'brakar-difficulty'

/** O Estouro nunca passa de 97% da velocidade do Pipoca, em nenhuma dificuldade. */
export const MAX_HUNT_SPEED = 107 * MOVEMENT_SCALE

const FACTORS: Record<Difficulty, { speed: number; sight: number }> = {
  easy: { speed: 0.85, sight: 0.75 },
  normal: { speed: 1, sight: 1 },
  hard: { speed: 1.12, sight: 1.2 },
}

export function getDifficulty(
  storage: Pick<Storage, 'getItem'> = localStorage,
): Difficulty {
  try {
    const value = storage.getItem(STORAGE_KEY)

    return DIFFICULTIES.find((difficulty) => difficulty === value) ?? 'normal'
  } catch {
    return 'normal'
  }
}

export function saveDifficulty(
  difficulty: Difficulty,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, difficulty)
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
}

export function nextDifficulty(current: Difficulty): Difficulty {
  return DIFFICULTIES[(DIFFICULTIES.indexOf(current) + 1) % DIFFICULTIES.length]
}

/** Ajusta velocidade e alcance de visão do Estouro conforme a dificuldade. */
export function applyDifficulty(
  settings: HunterSettings,
  difficulty: Difficulty,
): HunterSettings {
  const factor = FACTORS[difficulty]

  return {
    ...settings,
    wanderSpeed: settings.wanderSpeed * factor.speed,
    investigateSpeed: settings.investigateSpeed * factor.speed,
    huntSpeed: Math.min(settings.huntSpeed * factor.speed, MAX_HUNT_SPEED),
    lightPerceptionRadiusCells:
      settings.lightPerceptionRadiusCells * factor.sight,
  }
}
