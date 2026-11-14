import { describe, expect, it } from 'vitest'
import {
  applyDifficulty,
  getDifficulty,
  nextDifficulty,
  saveDifficulty,
} from './difficulty'
import { DEFAULT_HUNTER_SETTINGS } from '../hunter/hunterSettings'

describe('difficulty', () => {
  it('normal não muda nada', () => {
    expect(applyDifficulty(DEFAULT_HUNTER_SETTINGS, 'normal')).toEqual(
      DEFAULT_HUNTER_SETTINGS,
    )
  })

  it('fácil deixa o Estouro mais lento e míope; difícil o contrário', () => {
    const easy = applyDifficulty(DEFAULT_HUNTER_SETTINGS, 'easy')
    const hard = applyDifficulty(DEFAULT_HUNTER_SETTINGS, 'hard')

    expect(easy.huntSpeed).toBeLessThan(DEFAULT_HUNTER_SETTINGS.huntSpeed)
    expect(easy.lightPerceptionRadiusCells).toBeLessThan(
      DEFAULT_HUNTER_SETTINGS.lightPerceptionRadiusCells,
    )
    expect(hard.huntSpeed).toBeGreaterThan(DEFAULT_HUNTER_SETTINGS.huntSpeed)
  })

  it('a velocidade de caça tem teto abaixo da do Pipoca', () => {
    const fast = { ...DEFAULT_HUNTER_SETTINGS, huntSpeed: 9999 }

    expect(applyDifficulty(fast, 'hard').huntSpeed).toBeLessThan(110 * 1.5)
  })

  it('lê, salva e cicla a dificuldade', () => {
    let stored: string | null = null
    const storage = {
      getItem: () => stored,
      setItem: (_k: string, v: string) => {
        stored = v
      },
    }

    expect(getDifficulty(storage)).toBe('normal')
    saveDifficulty('hard', storage)
    expect(getDifficulty(storage)).toBe('hard')
    expect(nextDifficulty('easy')).toBe('normal')
    expect(nextDifficulty('hard')).toBe('easy')
  })
})
