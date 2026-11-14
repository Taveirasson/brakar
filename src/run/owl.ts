/** Coruja: pousa na mata e pia quando o Pipoca passa perto, atraindo o Estouro. */
export const OWL_MIN_NIGHT = 2
/** Distância (px) em que ela nota o Pipoca. */
export const OWL_NOTICE_RADIUS = 110
/** Tempo (ms) até ela poder piar de novo, já pousada em outro lugar. */
export const OWL_COOLDOWN_MS = 14_000

export function owlActive(night: number, mode: string): boolean {
  return mode !== 'daily' && night >= OWL_MIN_NIGHT
}

/** Ela só pia se o Pipoca está perto, não está escondido e o descanso passou. */
export function owlShouldHoot(input: {
  distance: number
  hidden: boolean
  cooldownMs: number
}): boolean {
  return (
    !input.hidden &&
    input.cooldownMs <= 0 &&
    input.distance <= OWL_NOTICE_RADIUS
  )
}
