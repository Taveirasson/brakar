import { describe, expect, it } from 'vitest'
import { FULL_STAMINA, stepStamina, type StaminaState } from './stamina'

describe('stepStamina', () => {
  it('correr gasta fôlego', () => {
    const result = stepStamina(FULL_STAMINA, 1000, true, true)

    expect(result.sprinting).toBe(true)
    expect(result.state.value).toBeLessThan(1)
  })

  it('parado não corre e recupera', () => {
    const half: StaminaState = { value: 0.5, exhausted: false }
    const result = stepStamina(half, 1000, true, false)

    expect(result.sprinting).toBe(false)
    expect(result.state.value).toBeGreaterThan(0.5)
  })

  it('esvazia, fica esgotado e só volta a correr depois de recuperar', () => {
    let state = FULL_STAMINA

    while (!state.exhausted) {
      state = stepStamina(state, 100, true, true).state
    }

    expect(state.value).toBe(0)
    expect(state.exhausted).toBe(true)
    expect(stepStamina(state, 100, true, true).sprinting).toBe(false)

    for (let i = 0; i < 60; i++) {
      state = stepStamina(state, 100, false, true).state
    }

    expect(state.exhausted).toBe(false)
    expect(stepStamina(state, 100, true, true).sprinting).toBe(true)
  })

  it('nunca passa de 1', () => {
    expect(stepStamina(FULL_STAMINA, 5000, false, false).state.value).toBe(1)
  })
})
