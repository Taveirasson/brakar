/** Fôlego da corrida: gasta correndo, recupera andando ou parado. */
export interface StaminaState {
  /** 0 (vazio) a 1 (cheio). */
  value: number
  /** Esgotado: só volta a correr depois de recuperar um pouco. */
  exhausted: boolean
}

export const SPRINT_MULTIPLIER = 1.55
export const SPRINT_DRAIN_PER_SECOND = 1 / 2.6
export const REGEN_PER_SECOND = 1 / 4.5
export const RESUME_THRESHOLD = 0.3

export const FULL_STAMINA: StaminaState = { value: 1, exhausted: false }

export function stepStamina(
  state: StaminaState,
  deltaMs: number,
  wantsSprint: boolean,
  isMoving: boolean,
): { state: StaminaState; sprinting: boolean } {
  const seconds = deltaMs / 1000
  const sprinting =
    wantsSprint && isMoving && !state.exhausted && state.value > 0

  if (sprinting) {
    const value = Math.max(0, state.value - SPRINT_DRAIN_PER_SECOND * seconds)

    return { state: { value, exhausted: value === 0 }, sprinting: true }
  }

  const value = Math.min(1, state.value + REGEN_PER_SECOND * seconds)

  return {
    state: {
      value,
      exhausted: state.exhausted && value < RESUME_THRESHOLD,
    },
    sprinting: false,
  }
}
