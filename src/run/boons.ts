import type { ModifierEffects } from './modifiers'

/** Bênçãos: a cada noite (a partir da 2) o jogador escolhe 1 de 3; valem até o fim da corrida. */
export interface Boon {
  id: string
  name: string
  description: string
  effect?: Partial<ModifierEffects>
  /** Escudo pronto ao começar a noite. */
  startShield?: boolean
  /** Segundos extras de paz antes do Estouro acordar. */
  graceMs?: number
  /** Seta de vagalume/estrada sempre ligada. */
  compass?: boolean
  /** Multiplicador de velocidade do Pipoca. */
  speed?: number
}

export const BOONS: Boon[] = [
  {
    id: 'shield',
    name: 'Escudo da lua',
    description: 'Começa a noite com um escudo pronto',
    startShield: true,
  },
  {
    id: 'sleepy',
    name: 'Estouro sonolento',
    description: 'O Estouro demora 10 s a mais para acordar',
    graceMs: 10_000,
  },
  {
    id: 'eyes',
    name: 'Olhos de coruja',
    description: 'Você enxerga 25% mais longe',
    effect: { vision: 1.25 },
  },
  {
    id: 'paws',
    name: 'Patas leves',
    description: 'O Pipoca anda 8% mais rápido',
    speed: 1.08,
  },
  {
    id: 'cotton',
    name: 'Passos de algodão',
    description: 'O Estouro enxerga 15% menos',
    effect: { hunterSight: 0.85 },
  },
  {
    id: 'compass',
    name: 'Faro apurado',
    description: 'A seta dos vagalumes nunca some',
    compass: true,
  },
  {
    id: 'bones',
    name: 'Faro de ossos',
    description: '+2 ossos ao escapar de cada noite',
    effect: { bonusBones: 2 },
  },
]

export function findBoon(id: string): Boon | undefined {
  return BOONS.find((boon) => boon.id === id)
}

/** Sorteia até 3 bênçãos; evita repetir as já escolhidas enquanto houver pelo menos 3 novas. */
export function pickBoonChoices(
  owned: string[],
  random: () => number = Math.random,
  count = 3,
): Boon[] {
  const fresh = BOONS.filter((boon) => !owned.includes(boon.id))
  const pool = [...(fresh.length >= count ? fresh : BOONS)]
  const picked: Boon[] = []

  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(random() * pool.length), 1)[0])
  }

  return picked
}

export interface BoonSummary {
  effects: ModifierEffects
  startShield: boolean
  graceMs: number
  compass: boolean
  speed: number
}

/** Soma o efeito das bênçãos escolhidas sobre o efeito dos modificadores da noite. */
export function applyBoons(base: ModifierEffects, ids: string[]): BoonSummary {
  const summary: BoonSummary = {
    effects: { ...base },
    startShield: false,
    graceMs: 0,
    compass: false,
    speed: 1,
  }

  for (const id of ids) {
    const boon = findBoon(id)

    if (!boon) continue

    const effect = boon.effect ?? {}

    summary.effects.vision *= effect.vision ?? 1
    summary.effects.hunterSight *= effect.hunterSight ?? 1
    summary.effects.bonusBones += effect.bonusBones ?? 0
    summary.startShield ||= boon.startShield ?? false
    summary.graceMs += boon.graceMs ?? 0
    summary.compass ||= boon.compass ?? false
    summary.speed *= boon.speed ?? 1
  }

  return summary
}
