import { MOVEMENT_SCALE } from '../maze/MazeLayout'

export interface HunterSettings {
  wanderSpeed: number
  investigateSpeed: number
  huntSpeed: number
  lightPerceptionRadiusCells: number
}

export const DEFAULT_HUNTER_SETTINGS: HunterSettings = {
  wanderSpeed: 50 * MOVEMENT_SCALE,
  investigateSpeed: 80 * MOVEMENT_SCALE,
  huntSpeed: 120 * MOVEMENT_SCALE,
  lightPerceptionRadiusCells: 5,
}

export const DARK_PERCEPTION_CELLS = 1.5

export const HUNTER_SIZE = 18
