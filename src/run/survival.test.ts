import { describe, expect, it } from 'vitest'
import { loadSurvivalBest, recordSurvival, scoreForNight } from './survival'

function fakeStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v
    },
  }
}

describe('sobrevivência', () => {
  it('pontua mais por noite alta, ossos e rapidez', () => {
    const slow = scoreForNight({
      night: 1,
      timeMs: 120_000,
      bones: 0,
      hides: 0,
    })
    const fast = scoreForNight({ night: 1, timeMs: 30_000, bones: 0, hides: 0 })

    expect(slow).toBe(100)
    expect(fast).toBeGreaterThan(slow)
    expect(
      scoreForNight({ night: 3, timeMs: 120_000, bones: 2, hides: 1 }),
    ).toBe(100 + 50 + 30 + 5)
  })

  it('guarda só o melhor resultado', () => {
    const storage = fakeStorage()

    expect(recordSurvival(300, 3, storage).isNewBest).toBe(true)
    expect(recordSurvival(200, 5, storage).isNewBest).toBe(false)
    expect(loadSurvivalBest(storage)).toEqual({ score: 300, nights: 5 })
  })
})
