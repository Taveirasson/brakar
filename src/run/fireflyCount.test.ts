import { describe, expect, it } from 'vitest'
import { fireflyCount } from './fireflyCount'

describe('fireflyCount', () => {
  it('mantém 3 no padrão (10x10 normal) e em mapas pequenos', () => {
    expect(fireflyCount(10, 'normal')).toBe(3)
    expect(fireflyCount(8, 'easy')).toBe(3)
  })

  it('cresce com o tamanho do mapa', () => {
    expect(fireflyCount(16, 'normal')).toBe(5)
    expect(fireflyCount(20, 'normal')).toBe(7)
  })

  it('o modo difícil pede mais um', () => {
    expect(fireflyCount(10, 'hard')).toBe(4)
    expect(fireflyCount(20, 'hard')).toBe(8)
  })
})
