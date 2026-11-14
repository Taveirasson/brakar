import { describe, expect, it } from 'vitest'
import { NIGHT_LIGHTING } from './moonlight'

describe('NIGHT_LIGHTING', () => {
  it('é a luz da lua: clara o bastante e com visão ampla em volta do Pipoca', () => {
    expect(NIGHT_LIGHTING.worldVisibility).toBeGreaterThan(0.7)
    expect(NIGHT_LIGHTING.visionRadius).toBeGreaterThanOrEqual(88)
  })
})
