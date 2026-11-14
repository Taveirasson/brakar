import { describe, expect, it } from 'vitest'
import {
  HISTORY_SIZE,
  dailyHistory,
  loadHistory,
  recordHistory,
  shortDate,
} from './history'

function fakeStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v
    },
  }
}

describe('histórico', () => {
  it('mantém só as melhores fugas, da mais rápida para a mais lenta', () => {
    const storage = fakeStorage()

    for (const t of [90, 80, 70, 60, 50, 40, 100]) {
      recordHistory(t * 1000, 1, storage, '2026-11-14')
    }

    const list = loadHistory(storage)

    expect(list).toHaveLength(HISTORY_SIZE)
    expect(list.map((e) => e.timeMs / 1000)).toEqual([40, 50, 60, 70, 80])
  })

  it('devolve a posição ou null quando fica de fora', () => {
    const storage = fakeStorage()

    expect(recordHistory(50_000, 1, storage)).toBe(1)
    expect(recordHistory(60_000, 1, storage)).toBe(2)

    for (const t of [10, 20, 30, 40]) recordHistory(t * 1000, 1, storage)

    expect(recordHistory(999_000, 1, storage)).toBeNull()
  })

  it('lista os dias do desafio do mais recente para o mais antigo', () => {
    const days = dailyHistory({
      '2026-11-12': 1,
      '2026-11-14': 2,
      '2026-11-13': 3,
    })

    expect(days.map((d) => d.date)).toEqual([
      '2026-11-14',
      '2026-11-13',
      '2026-11-12',
    ])
    expect(shortDate('2026-11-14')).toBe('14/11')
  })
})
