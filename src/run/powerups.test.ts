import { describe, expect, it } from 'vitest'
import { POWER_UP_IDS, pickPowerUpTypes } from './powerups'
import { createSeededRandom } from './seed'

describe('pickPowerUpTypes', () => {
  it('devolve a quantidade pedida', () => {
    expect(pickPowerUpTypes(5, createSeededRandom(1))).toHaveLength(5)
    expect(pickPowerUpTypes(0, createSeededRandom(1))).toHaveLength(0)
  })

  it('com 3 itens sai um de cada tipo (variedade garantida)', () => {
    const types = pickPowerUpTypes(3, createSeededRandom(99))

    expect([...types].sort()).toEqual([...POWER_UP_IDS].sort())
  })

  it('mesma semente, mesma lista', () => {
    expect(pickPowerUpTypes(4, createSeededRandom(5))).toEqual(
      pickPowerUpTypes(4, createSeededRandom(5)),
    )
  })
})
