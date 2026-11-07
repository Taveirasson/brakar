import { describe, expect, it } from 'vitest'
import { canPerceivePlayer, isCaught } from './hunterPerception'

const base = {
  hunter: { x: 0, y: 0 },
  lightRadius: 320,
  darkRadius: 96,
  walls: [],
}
const wall = { x1: 100, y1: -50, x2: 100, y2: 50 }

describe('canPerceivePlayer', () => {
  it('lanterna ligada dentro do raio', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 256, y: 0 },
        flashlightOn: true,
      }),
    ).toBe(true)
  })

  it('lanterna ligada fora do raio', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 384, y: 0 },
        flashlightOn: true,
      }),
    ).toBe(false)
  })

  it('lanterna ligada com parede no meio', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 256, y: 0 },
        flashlightOn: true,
        walls: [wall],
      }),
    ).toBe(false)
  })

  it('lanterna desligada bem perto', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 64, y: 0 },
        flashlightOn: false,
      }),
    ).toBe(true)
  })

  it('lanterna desligada a duas células', () => {
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 128, y: 0 },
        flashlightOn: false,
      }),
    ).toBe(false)
  })

  it('lanterna desligada perto ignora parede', () => {
    const closeWall = { x1: 40, y1: -50, x2: 40, y2: 50 }
    expect(
      canPerceivePlayer({
        ...base,
        player: { x: 64, y: 0 },
        flashlightOn: false,
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
