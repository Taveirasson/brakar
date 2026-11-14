import { describe, expect, it } from 'vitest'
import { canPerceivePlayer, isCaught } from './hunterPerception'

const base = {
  hunter: { x: 0, y: 0 },
  lightRadius: 320,
  darkRadius: 96,
  walls: [],
}
const wall2 = { x1: 64, y1: -50, x2: 64, y2: 50 }
const wall = { x1: 100, y1: -50, x2: 100, y2: 50 }

describe('canPerceivePlayer', () => {
  it('dentro do raio de visão', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 256, y: 0 },
      }),
    ).toBe(true)
  })

  it('fora do raio de visão', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 384, y: 0 },
      }),
    ).toBe(false)
  })

  it('com parede no meio', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 256, y: 0 },
        walls: [wall],
      }),
    ).toBe(false)
  })

  it('bem perto', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 64, y: 0 },
      }),
    ).toBe(true)
  })

  it('a duas células com parede, fora do raio curto', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 128, y: 0 },
        walls: [wall2],
      }),
    ).toBe(false)
  })

  it('perto ignora parede', () => {
    const closeWall = { x1: 40, y1: -50, x2: 40, y2: 50 }
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 64, y: 0 },
        walls: [closeWall],
      }),
    ).toBe(true)
  })
})

describe('isCaught', () => {
  it('captura abaixo da distância', () => {
    expect(isCaught({ x: 0, y: 0 }, { x: 16, y: 0 }, 17)).toBe(true)
  })

  it('não captura na distância exata', () => {
    expect(isCaught({ x: 0, y: 0 }, { x: 17, y: 0 }, 17)).toBe(false)
  })
})
