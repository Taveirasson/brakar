export interface HunterSettings {
  wanderSpeed: number
  investigateSpeed: number
  huntSpeed: number
  lightPerceptionRadiusCells: number
}

export const DEFAULT_HUNTER_SETTINGS: HunterSettings = {
  wanderSpeed: 50,
  investigateSpeed: 80,
  huntSpeed: 120,
  lightPerceptionRadiusCells: 5,
}

export const DARK_PERCEPTION_CELLS = 1.5

export const HUNTER_SIZE = 18
