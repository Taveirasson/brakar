/** Power-ups do labirinto: pegos ao passar por cima, com efeito imediato. */
export type PowerUpId = 'shield' | 'speed' | 'map'

export interface PowerUp {
  id: PowerUpId
  name: string
  description: string
  color: number
  /** Duração do efeito em ms (escudo e mapa duram até serem usados/permanentes). */
  durationMs?: number
}

export const POWER_UPS: Record<PowerUpId, PowerUp> = {
  shield: {
    id: 'shield',
    name: 'Escudo',
    description: 'Absorve uma pegada do Estouro',
    color: 0x6bc5ff,
  },
  speed: {
    id: 'speed',
    name: 'Pata veloz',
    description: 'Mais rápido por 6 segundos',
    color: 0x9fe870,
    durationMs: 6000,
  },
  map: {
    id: 'map',
    name: 'Mapa da mata',
    description: 'Revela o labirinto no minimapa',
    color: 0xb48aff,
  },
}

export const POWER_UP_IDS = Object.keys(POWER_UPS) as PowerUpId[]

/** Bônus de velocidade do Pata veloz. */
export const SPEED_BOOST = 1.3

/** Tempo que o Estouro fica atordoado e que o Pipoca fica protegido depois do escudo. */
export const SHIELD_STUN_MS = 2500
export const SHIELD_GRACE_MS = 3000

/** Sorteia os tipos dos power-ups espalhados na noite, garantindo variedade. */
export function pickPowerUpTypes(
  count: number,
  random: () => number,
): PowerUpId[] {
  const types: PowerUpId[] = []

  while (types.length < count) {
    const round = [...POWER_UP_IDS]

    while (round.length > 0 && types.length < count) {
      const index = Math.min(
        Math.floor(random() * round.length),
        round.length - 1,
      )

      types.push(round.splice(index, 1)[0])
    }
  }

  return types
}
