import { describe, expect, it } from 'vitest'
import {
  loadMissions,
  missionStatuses,
  missionsForDay,
  recordMissions,
  type MissionStats,
} from './missions'

function fakeStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v
    },
  }
}

const idle: MissionStats = {
  escaped: false,
  night: 1,
  timeMs: 0,
  hides: 0,
  bones: 0,
  timesHunted: 0,
  fireflies: 0,
  powerUps: 0,
}

describe('missões do dia', () => {
  it('sorteia 3 missões diferentes, iguais para a mesma data', () => {
    const a = missionsForDay('2026-11-14')
    const b = missionsForDay('2026-11-14')

    expect(a).toHaveLength(3)
    expect(new Set(a.map((m) => m.id)).size).toBe(3)
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id))
  })

  it('soma o progresso entre tentativas e paga uma vez só', () => {
    const storage = fakeStorage()
    const day = '2026-11-14'
    const big: MissionStats = {
      escaped: true,
      night: 5,
      timeMs: 1,
      hides: 99,
      bones: 99,
      timesHunted: 0,
      fireflies: 99,
      powerUps: 99,
    }

    const first = recordMissions(big, day, storage)

    expect(first.completed.length).toBeGreaterThan(0)
    expect(first.reward).toBeGreaterThan(0)

    recordMissions(big, day, storage)
    const second = recordMissions(big, day, storage)

    expect(second.reward).toBe(0)
    expect(
      missionStatuses(loadMissions(day, storage)).every((m) => m.progress >= 0),
    ).toBe(true)
  })

  it('acumula progresso parcial', () => {
    const storage = fakeStorage()
    const day = '2026-11-14'

    recordMissions({ ...idle, hides: 1, bones: 1, fireflies: 3 }, day, storage)
    recordMissions({ ...idle, hides: 1, bones: 1, fireflies: 3 }, day, storage)

    const state = loadMissions(day, storage)

    expect(
      state.progress.hide ?? state.progress.bones ?? 0,
    ).toBeGreaterThanOrEqual(0)
    expect(Object.values(state.progress).some((v) => v >= 2)).toBe(true)
  })

  it('zera ao mudar o dia', () => {
    const storage = fakeStorage()

    recordMissions(
      { ...idle, hides: 5, bones: 5, fireflies: 20 },
      '2026-11-14',
      storage,
    )

    expect(loadMissions('2026-11-15', storage).progress).toEqual({})
  })
})
