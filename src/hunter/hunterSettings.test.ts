import { describe, expect, it } from 'vitest'
import {
  DEFAULT_HUNTER_SETTINGS,
  MAX_HUNT_SPEED,
  hunterSettingsForNight,
} from './hunterSettings'

describe('hunterSettingsForNight', () => {
  it('noite 1 usa os valores base', () => {
    expect(hunterSettingsForNight(1)).toEqual(DEFAULT_HUNTER_SETTINGS)
  })

  it('acelera a cada noite, mas a caçada tem teto', () => {
    expect(hunterSettingsForNight(3).wanderSpeed).toBeGreaterThan(
      DEFAULT_HUNTER_SETTINGS.wanderSpeed,
    )
    expect(hunterSettingsForNight(99).huntSpeed).toBe(MAX_HUNT_SPEED)
  })
})
