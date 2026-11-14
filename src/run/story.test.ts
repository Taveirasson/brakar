import { describe, expect, it } from 'vitest'
import { epilogueForNight } from './story'

describe('epilogueForNight', () => {
  it('noite 1 mantém o epílogo original', () => {
    expect(epilogueForNight(1).headline).toContain('beira da estrada')
  })

  it('noites diferentes têm textos diferentes', () => {
    expect(epilogueForNight(2)).not.toEqual(epilogueForNight(1))
    expect(epilogueForNight(3)).not.toEqual(epilogueForNight(2))
  })

  it('nunca devolve vazio, mesmo em noites muito altas ou inválidas', () => {
    for (const night of [0, -3, 6, 7, 8, 99, 1.5]) {
      const text = epilogueForNight(night)

      expect(text.headline.length).toBeGreaterThan(0)
      expect(text.detail.length).toBeGreaterThan(0)
    }
  })
})
