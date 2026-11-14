import { MOVEMENT_SCALE } from '../maze/MazeLayout'

export interface HunterSettings {
  wanderSpeed: number
  investigateSpeed: number
  huntSpeed: number
  lightPerceptionRadiusCells: number
}

export const DEFAULT_HUNTER_SETTINGS: HunterSettings = {
  wanderSpeed: 50 * MOVEMENT_SCALE,
  investigateSpeed: 70 * MOVEMENT_SCALE,
  huntSpeed: 95 * MOVEMENT_SCALE,
  lightPerceptionRadiusCells: 4,
}

export const DARK_PERCEPTION_CELLS = 1.5

export const HUNTER_SIZE = 18

/** Cada noite o Estouro fica um pouco mais rápido, sem nunca passar o Pipoca. */
export const NIGHT_SPEED_GAIN = 0.05
export const MAX_HUNT_SPEED = 106 * MOVEMENT_SCALE

/** Segundos de paz antes do Estouro acordar: mais generoso na noite 1, que ensina o jogo. */
export function hunterGraceMs(night: number): number {
  return night <= 1 ? 12_000 : 8_000
}

export function hunterSettingsForNight(
  night: number,
  base: HunterSettings = DEFAULT_HUNTER_SETTINGS,
): HunterSettings {
  const factor = 1 + NIGHT_SPEED_GAIN * Math.max(0, night - 1)

  return {
    ...base,
    wanderSpeed: base.wanderSpeed * factor,
    investigateSpeed: base.investigateSpeed * factor,
    huntSpeed: Math.min(base.huntSpeed * factor, MAX_HUNT_SPEED),
  }
}
