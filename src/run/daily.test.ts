import { describe, expect, it } from 'vitest'
import {
  activeStreak,
  dateKey,
  loadDaily,
  previousDateKey,
  recordDailyEscape,
} from './daily'
import { createSeededRandom, hashString } from './seed'

function fakeStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v
    },
  }
}

describe('seed', () => {
  it('mesma semente gera a mesma sequência; sementes diferentes divergem', () => {
    const a = createSeededRandom(123)
    const b = createSeededRandom(123)
    const c = createSeededRandom(124)
    const seqA = [a(), a(), a()]

    expect([b(), b(), b()]).toEqual(seqA)
    expect([c(), c(), c()]).not.toEqual(seqA)
    for (const value of seqA) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('hash de texto é estável e diferencia dias', () => {
    expect(hashString('2026-11-14')).toBe(hashString('2026-11-14'))
    expect(hashString('2026-11-14')).not.toBe(hashString('2026-11-15'))
  })
})

describe('daily', () => {
  it('formata a data e calcula o dia anterior (virada de mês)', () => {
    expect(dateKey(new Date(2026, 10, 14))).toBe('2026-11-14')
    expect(previousDateKey('2026-12-01')).toBe('2026-11-30')
    expect(previousDateKey('2026-01-01')).toBe('2025-12-31')
  })

  it('sequência cresce em dias seguidos e zera quando passa um dia', () => {
    const storage = fakeStorage()

    expect(recordDailyEscape(90000, '2026-11-10', storage).streak).toBe(1)
    expect(recordDailyEscape(80000, '2026-11-11', storage).streak).toBe(2)
    expect(recordDailyEscape(80000, '2026-11-13', storage).streak).toBe(1)
  })

  it('repetir no mesmo dia não aumenta a sequência e guarda o melhor tempo', () => {
    const storage = fakeStorage()

    recordDailyEscape(90000, '2026-11-10', storage)

    const worse = recordDailyEscape(95000, '2026-11-10', storage)
    const better = recordDailyEscape(70000, '2026-11-10', storage)

    expect(worse.isNewBest).toBe(false)
    expect(worse.streak).toBe(1)
    expect(better.isNewBest).toBe(true)
    expect(loadDaily(storage).best['2026-11-10']).toBe(70000)
  })

  it('activeStreak: vale hoje e ontem, não antes', () => {
    const state = { lastCompleted: '2026-11-12', streak: 4, best: {} }

    expect(activeStreak(state, '2026-11-12')).toBe(4)
    expect(activeStreak(state, '2026-11-13')).toBe(4)
    expect(activeStreak(state, '2026-11-14')).toBe(0)
  })

  it('dado corrompido vira estado vazio', () => {
    expect(loadDaily({ getItem: () => '{lixo' }).streak).toBe(0)
  })
})
