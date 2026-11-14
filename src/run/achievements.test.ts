import { describe, expect, it } from 'vitest'
import { loadEarned, unlockAchievements, type RunStats } from './achievements'

function fakeStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v
    },
  }
}

const base: RunStats = {
  escaped: false,
  night: 1,
  timeMs: 120_000,
  hides: 0,
  bones: 0,
  timesHunted: 1,
}

describe('unlockAchievements', () => {
  it('nada a desbloquear numa tentativa fraca', () => {
    expect(unlockAchievements(base, fakeStorage())).toEqual([])
  })

  it('fuga rápida e sem ser caçado dá três conquistas, só uma vez', () => {
    const storage = fakeStorage()
    const run = { ...base, escaped: true, timeMs: 60_000, timesHunted: 0 }
    const first = unlockAchievements(run, storage).map((a) => a.id)

    expect(first).toEqual(['first-escape', 'ghost', 'lightning'])
    expect(unlockAchievements(run, storage)).toEqual([])
    expect(loadEarned(storage)).toHaveLength(3)
  })

  it('conta moitas e ossos mesmo sem fugir', () => {
    const ids = unlockAchievements(
      { ...base, hides: 3, bones: 3, night: 3 },
      fakeStorage(),
    ).map((a) => a.id)

    expect(ids).toEqual(['bushman', 'bone-collector', 'night-owl'])
  })
})
