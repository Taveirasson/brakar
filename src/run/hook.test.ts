import { describe, expect, it } from 'vitest'
import {
  averageFirstFirefly,
  loadHook,
  noteFirstFirefly,
  noteFirstRunEnd,
  noteRunStart,
} from './hook'

function fakeStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_k: string, v: string) => {
      value = v
    },
  }
}

describe('gancho', () => {
  it('só a 1ª partida de todas conta como primeira', () => {
    const storage = fakeStorage()

    expect(noteRunStart(storage)).toBe(true)
    expect(noteRunStart(storage)).toBe(false)
  })

  it('guarda o tempo até o 1º vagalume e o fim da 1ª partida', () => {
    const storage = fakeStorage()
    const first = noteRunStart(storage)

    noteFirstFirefly(8000, first, storage)
    noteFirstRunEnd(true, storage)
    noteFirstFirefly(4000, false, storage)

    const state = loadHook(storage)

    expect(state.firstRun).toEqual({ firstFireflyMs: 8000, escaped: true })
    expect(averageFirstFirefly(state)).toBe(6000)
  })

  it('sem dados não há média', () => {
    expect(averageFirstFirefly(loadHook(fakeStorage()))).toBeNull()
  })
})
