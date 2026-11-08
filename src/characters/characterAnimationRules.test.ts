import { describe, expect, it } from 'vitest'
import {
  ESTOURO_ANIMATIONS,
  PIPOCA_ANIMATIONS,
  estouroAnimationFor,
  pickPipocaAnimation,
} from './characterAnimationRules'

describe('pickPipocaAnimation', () => {
  it('parado usa idle horizontal e mantém o lado em que estava', () => {
    expect(pickPipocaAnimation(0, 0, false)).toEqual({
      key: 'pipoca-idle',
      flipX: false,
    })
    expect(pickPipocaAnimation(0, 0, true)).toEqual({
      key: 'pipoca-idle',
      flipX: true,
    })
  })

  it('velocidade residual do drag conta como parado', () => {
    expect(pickPipocaAnimation(5, -4, false).key).toBe('pipoca-idle')
  })

  it('andando para os lados espelha só para a esquerda', () => {
    expect(pickPipocaAnimation(165, 0, true)).toEqual({
      key: 'pipoca-walk-side',
      flipX: false,
    })
    expect(pickPipocaAnimation(-165, 0, false)).toEqual({
      key: 'pipoca-walk-side',
      flipX: true,
    })
  })

  it('para cima e para baixo também usa o sprite horizontal, virado para o último lado', () => {
    expect(pickPipocaAnimation(0, 165, false)).toEqual({
      key: 'pipoca-walk-side',
      flipX: false,
    })
    expect(pickPipocaAnimation(0, -165, true)).toEqual({
      key: 'pipoca-walk-side',
      flipX: true,
    })
  })

  it('na diagonal o lado segue o movimento horizontal', () => {
    expect(pickPipocaAnimation(-50, 120, false)).toEqual({
      key: 'pipoca-walk-side',
      flipX: true,
    })
    expect(pickPipocaAnimation(50, -120, true)).toEqual({
      key: 'pipoca-walk-side',
      flipX: false,
    })
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
    ])
    expect(ESTOURO_ANIMATIONS).toEqual([
      { key: 'estouro-move', start: 0, end: 3, frameRate: 10 },
      { key: 'estouro-hunt', start: 4, end: 7, frameRate: 14 },
    ])
  })
})
