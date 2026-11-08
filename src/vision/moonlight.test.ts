import { describe, expect, it } from 'vitest'
import { DARK_LIGHTING, MOON_LIGHTING, moonlightAt } from './moonlight'

describe('moonlightAt', () => {
  it('nível 0 (lanterna acesa) é o escuro de sempre', () => {
    expect(moonlightAt(0)).toEqual(DARK_LIGHTING)
    expect(DARK_LIGHTING).toEqual({
      ambientColor: 0x40334f,
      worldVisibility: 0.45,
      visionRadius: 28,
    })
  })

  it('nível 1 (lanterna apagada) é a luz da lua: mais clara e com visão maior', () => {
    expect(moonlightAt(1)).toEqual(MOON_LIGHTING)
    expect(MOON_LIGHTING.worldVisibility).toBeGreaterThan(0.7)
    expect(MOON_LIGHTING.visionRadius).toBeGreaterThanOrEqual(88)
  })

  it('no meio do caminho interpola cada canal de cor e os números', () => {
    const half = moonlightAt(0.5)
    const channel = (color: number, shift: number) => (color >> shift) & 0xff
    for (const shift of [16, 8, 0]) {
      const expected = Math.round(
        (channel(DARK_LIGHTING.ambientColor, shift) +
          channel(MOON_LIGHTING.ambientColor, shift)) /
          2,
      )
      expect(channel(half.ambientColor, shift)).toBe(expected)
    }
    expect(half.worldVisibility).toBeCloseTo(
      (DARK_LIGHTING.worldVisibility + MOON_LIGHTING.worldVisibility) / 2,
    )
    expect(half.visionRadius).toBeCloseTo(
      (DARK_LIGHTING.visionRadius + MOON_LIGHTING.visionRadius) / 2,
    )
  })

  it('limita o nível entre 0 e 1', () => {
    expect(moonlightAt(-2)).toEqual(DARK_LIGHTING)
    expect(moonlightAt(3)).toEqual(MOON_LIGHTING)
  })
})
