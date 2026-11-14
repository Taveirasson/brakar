import { describe, expect, it } from 'vitest'
import { BOONS, applyBoons, pickBoonChoices } from './boons'
import { NEUTRAL_EFFECTS } from './modifiers'

describe('bênçãos', () => {
  it('sorteia 3 diferentes e evita as já escolhidas', () => {
    const owned = ['shield', 'eyes']
    const choices = pickBoonChoices(owned)

    expect(choices).toHaveLength(3)
    expect(new Set(choices.map((b) => b.id)).size).toBe(3)
    expect(choices.some((b) => owned.includes(b.id))).toBe(false)
  })

  it('volta a oferecer todas quando restam menos de 3 novas', () => {
    const owned = BOONS.slice(0, BOONS.length - 2).map((b) => b.id)

    expect(pickBoonChoices(owned)).toHaveLength(3)
  })

  it('soma os efeitos das bênçãos', () => {
    const summary = applyBoons(NEUTRAL_EFFECTS, [
      'eyes',
      'sleepy',
      'bones',
      'paws',
    ])

    expect(summary.effects.vision).toBeCloseTo(1.25)
    expect(summary.effects.bonusBones).toBe(2)
    expect(summary.graceMs).toBe(10_000)
    expect(summary.speed).toBeCloseTo(1.08)
    expect(summary.startShield).toBe(false)
    expect(applyBoons(NEUTRAL_EFFECTS, ['shield', 'compass']).startShield).toBe(
      true,
    )
  })
})
