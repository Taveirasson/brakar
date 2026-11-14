import { MAX_HUNT_SPEED } from '../config/difficulty'
import type { HunterSettings } from '../hunter/hunterSettings'
import type { WorldLighting } from '../vision/moonlight'

/** Modificadores de noite: variam a regra de cada noite e rendem mais ossos. */
export interface Modifier {
  id: string
  name: string
  description: string
  /** Ossos extras ao escapar com este modificador ativo. */
  bonusBones: number
  effect: Partial<ModifierEffects>
}

export interface ModifierEffects {
  vision: number
  worldVisibility: number
  darkAmbient: boolean
  hunterSpeed: number
  hunterSight: number
  mud: number
  noBones: boolean
  bonusBones: number
}

export const NEUTRAL_EFFECTS: ModifierEffects = {
  vision: 1,
  worldVisibility: 1,
  darkAmbient: false,
  hunterSpeed: 1,
  hunterSight: 1,
  mud: 1,
  noBones: false,
  bonusBones: 0,
}

export const MODIFIERS: Modifier[] = [
  {
    id: 'fog',
    name: 'Névoa densa',
    description: 'Você enxerga bem menos',
    bonusBones: 2,
    effect: { vision: 0.6 },
  },
  {
    id: 'newmoon',
    name: 'Lua nova',
    description: 'A mata está bem mais escura',
    bonusBones: 2,
    effect: { worldVisibility: 0.7, darkAmbient: true },
  },
  {
    id: 'swift',
    name: 'Estouro veloz',
    description: 'Ele corre mais rápido',
    bonusBones: 3,
    effect: { hunterSpeed: 1.12 },
  },
  {
    id: 'sharp',
    name: 'Faro aguçado',
    description: 'Ele te percebe de mais longe',
    bonusBones: 2,
    effect: { hunterSight: 1.35 },
  },
  {
    id: 'bog',
    name: 'Brejo',
    description: 'Poças de lama por toda parte',
    bonusBones: 1,
    effect: { mud: 2.5 },
  },
  {
    id: 'barren',
    name: 'Sem ossos',
    description: 'Nenhum osso para recuperar o fôlego',
    bonusBones: 4,
    effect: { noBones: true },
  },
  {
    id: 'fullmoon',
    name: 'Lua cheia',
    description: 'Noite clara: você enxerga mais longe',
    bonusBones: 0,
    effect: { vision: 1.4 },
  },
]

/**
 * Sorteia os modificadores da noite: nenhum na noite 1 (aprendizado), um nas
 * noites 2 e 3, dois a partir da 4. `force` garante ao menos um (desafio do dia).
 */
export function pickModifiers(
  night: number,
  random: () => number,
  force = false,
): Modifier[] {
  const count = night >= 4 ? 2 : night >= 2 || force ? 1 : 0
  const pool = [...MODIFIERS]
  const chosen: Modifier[] = []

  while (chosen.length < count && pool.length > 0) {
    const index = Math.min(Math.floor(random() * pool.length), pool.length - 1)

    chosen.push(pool.splice(index, 1)[0])
  }

  return chosen
}

/** Junta os efeitos (multiplicam) e soma o bônus de ossos. */
export function combineModifiers(modifiers: Modifier[]): ModifierEffects {
  const total: ModifierEffects = { ...NEUTRAL_EFFECTS }

  for (const modifier of modifiers) {
    const effect = modifier.effect

    total.vision *= effect.vision ?? 1
    total.worldVisibility *= effect.worldVisibility ?? 1
    total.hunterSpeed *= effect.hunterSpeed ?? 1
    total.hunterSight *= effect.hunterSight ?? 1
    total.mud *= effect.mud ?? 1
    total.darkAmbient ||= effect.darkAmbient ?? false
    total.noBones ||= effect.noBones ?? false
    total.bonusBones += modifier.bonusBones
  }

  return total
}

export function applyModifiersToHunter(
  settings: HunterSettings,
  effects: ModifierEffects,
): HunterSettings {
  return {
    ...settings,
    wanderSpeed: settings.wanderSpeed * effects.hunterSpeed,
    investigateSpeed: settings.investigateSpeed * effects.hunterSpeed,
    huntSpeed: Math.min(
      settings.huntSpeed * effects.hunterSpeed,
      MAX_HUNT_SPEED,
    ),
    lightPerceptionRadiusCells:
      settings.lightPerceptionRadiusCells * effects.hunterSight,
  }
}

const NEW_MOON_AMBIENT = 0x5a6a98

export function applyModifiersToLighting(
  lighting: WorldLighting,
  effects: ModifierEffects,
): WorldLighting {
  return {
    ambientColor: effects.darkAmbient
      ? NEW_MOON_AMBIENT
      : lighting.ambientColor,
    worldVisibility: Math.min(
      1,
      lighting.worldVisibility * effects.worldVisibility,
    ),
    visionRadius: lighting.visionRadius * effects.vision,
  }
}
