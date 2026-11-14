import { describe, expect, it } from 'vitest'
import { OWL_NOTICE_RADIUS, owlActive, owlShouldHoot } from './owl'

describe('coruja', () => {
  it('só aparece a partir da noite 2 e fora do desafio do dia', () => {
    expect(owlActive(1, 'normal')).toBe(false)
    expect(owlActive(2, 'normal')).toBe(true)
    expect(owlActive(3, 'survival')).toBe(true)
    expect(owlActive(5, 'daily')).toBe(false)
  })

  it('pia só perto, sem esconderijo e sem descanso', () => {
    const base = {
      distance: OWL_NOTICE_RADIUS - 1,
      hidden: false,
      cooldownMs: 0,
    }

    expect(owlShouldHoot(base)).toBe(true)
    expect(owlShouldHoot({ ...base, distance: OWL_NOTICE_RADIUS + 1 })).toBe(
      false,
    )
    expect(owlShouldHoot({ ...base, hidden: true })).toBe(false)
    expect(owlShouldHoot({ ...base, cooldownMs: 500 })).toBe(false)
  })
})
