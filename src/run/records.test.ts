import { describe, expect, it } from 'vitest'
import { formatTime, loadRecords, recordCaught, recordEscape } from './records'

function fakeStorage(initial?: string) {
  let value = initial ?? null

  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
  }
}

describe('records', () => {
  it('começa vazio e ignora dado corrompido', () => {
    expect(loadRecords(fakeStorage()).bestTimeMs).toBeNull()
    expect(loadRecords(fakeStorage('{lixo')).escapes).toBe(0)
  })

  it('primeira fuga é recorde; só tempo menor bate o recorde', () => {
    const storage = fakeStorage()

    expect(recordEscape(90000, 1, storage).isNewBest).toBe(true)
    expect(recordEscape(95000, 1, storage).isNewBest).toBe(false)

    const result = recordEscape(80000, 2, storage)

    expect(result.isNewBest).toBe(true)
    expect(result.records).toEqual({
      bestTimeMs: 80000,
      escapes: 3,
      caught: 0,
      bestNight: 2,
    })
  })

  it('conta capturas', () => {
    const storage = fakeStorage()

    recordCaught(3, storage)

    const result = recordCaught(1, storage)

    expect(result.caught).toBe(2)
    expect(result.bestNight).toBe(3)
  })

  it('formata o tempo', () => {
    expect(formatTime(83500)).toBe('1:23.5')
    expect(formatTime(5000)).toBe('0:05.0')
  })
})
