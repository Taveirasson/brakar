import { describe, expect, it } from 'vitest'
import {
  ESTOURO_ANIMATIONS,
  PIPOCA_ANIMATIONS,
  estouroAnimationFor,
  INITIAL_FACING,
  animationForFacing,
  standingFrame,
  updateFacing,
} from './characterAnimationRules'

describe('animationForFacing', () => {
  it('direções retas: frente, costas e lados (esquerda espelhada)', () => {
    expect(animationForFacing({ h: 0, v: 1 })).toEqual({
      key: 'pipoca-walk-down',
      flipX: false,
    })
    expect(animationForFacing({ h: 0, v: -1 })).toEqual({
      key: 'pipoca-walk-up',
      flipX: false,
    })
    expect(animationForFacing({ h: 1, v: 0 })).toEqual({
      key: 'pipoca-walk-side',
      flipX: false,
    })
    expect(animationForFacing({ h: -1, v: 0 })).toEqual({
      key: 'pipoca-walk-side',
      flipX: true,
    })
  })

  it('diagonais (esquerda espelhada)', () => {
    expect(animationForFacing({ h: 1, v: 1 })).toEqual({
      key: 'pipoca-walk-diag-down',
      flipX: false,
    })
    expect(animationForFacing({ h: -1, v: 1 })).toEqual({
      key: 'pipoca-walk-diag-down',
      flipX: true,
    })
    expect(animationForFacing({ h: 1, v: -1 })).toEqual({
      key: 'pipoca-walk-diag-up',
      flipX: false,
    })
    expect(animationForFacing({ h: -1, v: -1 })).toEqual({
      key: 'pipoca-walk-diag-up',
      flipX: true,
    })
  })
})

describe('updateFacing', () => {
  it('começa olhando para baixo', () => {
    expect(INITIAL_FACING).toMatchObject({ h: 0, v: 1 })
  })

  it('segue as teclas apertadas', () => {
    expect(updateFacing(INITIAL_FACING, -1, 0, 16)).toMatchObject({
      h: -1,
      v: 0,
    })
    expect(updateFacing(INITIAL_FACING, 1, -1, 16)).toMatchObject({
      h: 1,
      v: -1,
    })
  })

  it('sem tecla apertada mantém a última direção (parado ou deslizando)', () => {
    const left = updateFacing(INITIAL_FACING, -1, 0, 16)
    expect(updateFacing(left, 0, 0, 500)).toMatchObject({ h: -1, v: 0 })
  })

  it('soltar as duas teclas da diagonal quase juntas mantém a diagonal', () => {
    let facing = updateFacing(INITIAL_FACING, 1, 1, 16)
    facing = updateFacing(facing, 0, 1, 40) // soltou a direita um pouco antes
    facing = updateFacing(facing, 0, 0, 16) // soltou a de baixo
    expect(facing).toMatchObject({ h: 1, v: 1 })
  })

  it('segurar só uma tecla da diagonal por mais tempo vira a direção reta', () => {
    let facing = updateFacing(INITIAL_FACING, 1, 1, 16)
    facing = updateFacing(facing, 0, 1, 50)
    facing = updateFacing(facing, 0, 1, 50)
    expect(facing).toMatchObject({ h: 0, v: 1 })
  })

  it('trocar para uma direção que não é parte da diagonal vira na hora', () => {
    let facing = updateFacing(INITIAL_FACING, 1, 1, 16)
    facing = updateFacing(facing, -1, 0, 16)
    expect(facing).toMatchObject({ h: -1, v: 0 })
  })
})

describe('standingFrame', () => {
  it('é o frame de pernas paradas (o segundo) da animação de andar', () => {
    expect(standingFrame('pipoca-walk-down')).toBe(1)
    expect(standingFrame('pipoca-walk-side')).toBe(9)
    expect(standingFrame('pipoca-walk-diag-up')).toBe(21)
  })
})

describe('estouroAnimationFor', () => {
  it('caçando usa hunt; vagando e investigando usam move', () => {
    expect(estouroAnimationFor('hunting')).toBe('estouro-hunt')
    expect(estouroAnimationFor('wandering')).toBe('estouro-move')
    expect(estouroAnimationFor('investigating')).toBe('estouro-move')
  })
})

describe('definições das animações', () => {
  it('seguem o layout das spritesheets (4 colunas por linha)', () => {
    expect(PIPOCA_ANIMATIONS).toEqual([
      { key: 'pipoca-walk-down', start: 0, end: 3, frameRate: 8 },
      { key: 'pipoca-walk-up', start: 4, end: 7, frameRate: 8 },
      { key: 'pipoca-walk-side', start: 8, end: 11, frameRate: 8 },
      { key: 'pipoca-idle', start: 12, end: 13, frameRate: 3 },
      { key: 'pipoca-walk-diag-down', start: 16, end: 19, frameRate: 8 },
      { key: 'pipoca-walk-diag-up', start: 20, end: 23, frameRate: 8 },
    ])
    expect(ESTOURO_ANIMATIONS).toEqual([
      { key: 'estouro-move', start: 0, end: 3, frameRate: 10 },
      { key: 'estouro-hunt', start: 4, end: 7, frameRate: 14 },
    ])
  })
})
