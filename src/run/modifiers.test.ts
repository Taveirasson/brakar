import { describe, expect, it } from 'vitest'
import {
  MODIFIERS,
  NEUTRAL_EFFECTS,
  applyModifiersToHunter,
  applyModifiersToLighting,
  combineModifiers,
  pickModifiers,
} from './modifiers'
import { DEFAULT_HUNTER_SETTINGS } from '../hunter/hunterSettings'
import { NIGHT_LIGHTING } from '../vision/moonlight'
import { createSeededRandom } from './seed'

const find = (id: string) => MODIFIERS.find((m) => m.id === id)!

describe('pickModifiers', () => {
  it('noite 1: nenhum; noites 2-3: um; a partir da 4: dois distintos', () => {
    const random = createSeededRandom(7)

    expect(pickModifiers(1, random)).toHaveLength(0)
    expect(pickModifiers(2, random)).toHaveLength(1)
    expect(pickModifiers(3, random)).toHaveLength(1)

    const two = pickModifiers(5, random)

    expect(two).toHaveLength(2)
    expect(two[0].id).not.toBe(two[1].id)
  })

  it('force garante um mesmo na noite 1 e é determinístico com a mesma semente', () => {
    const a = pickModifiers(1, createSeededRandom(42), true)
    const b = pickModifiers(1, createSeededRandom(42), true)

    expect(a).toHaveLength(1)
    expect(a[0].id).toBe(b[0].id)
  })
})

describe('combineModifiers', () => {
  it('sem modificadores é neutro', () => {
    expect(combineModifiers([])).toEqual(NEUTRAL_EFFECTS)
  })

  it('multiplica efeitos e soma o bônus', () => {
    const effects = combineModifiers([find('fog'), find('swift')])

    expect(effects.vision).toBeCloseTo(0.6)
    expect(effects.hunterSpeed).toBeCloseTo(1.12)
    expect(effects.bonusBones).toBe(5)
  })
})

describe('aplicação', () => {
  it('Estouro veloz acelera, mas respeita o teto', () => {
    const effects = combineModifiers([find('swift')])
    const settings = applyModifiersToHunter(DEFAULT_HUNTER_SETTINGS, effects)

    expect(settings.wanderSpeed).toBeGreaterThan(
      DEFAULT_HUNTER_SETTINGS.wanderSpeed,
    )

    const huge = applyModifiersToHunter(
      { ...DEFAULT_HUNTER_SETTINGS, huntSpeed: 9999 },
      effects,
    )

    expect(huge.huntSpeed).toBeLessThan(9999)
  })

  it('névoa reduz a visão; lua nova escurece', () => {
    const fog = applyModifiersToLighting(
      NIGHT_LIGHTING,
      combineModifiers([find('fog')]),
    )
    const dark = applyModifiersToLighting(
      NIGHT_LIGHTING,
      combineModifiers([find('newmoon')]),
    )

    expect(fog.visionRadius).toBeLessThan(NIGHT_LIGHTING.visionRadius)
    expect(dark.worldVisibility).toBeLessThan(NIGHT_LIGHTING.worldVisibility)
    expect(dark.ambientColor).not.toBe(NIGHT_LIGHTING.ambientColor)
  })
})
