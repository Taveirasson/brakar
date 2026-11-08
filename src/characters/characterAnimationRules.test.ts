import { describe, expect, it } from 'vitest'
import {
  ESTOURO_ANIMATIONS,
  PIPOCA_ANIMATIONS,
  estouroAnimationFor,
  pickPipocaAnimation,
} from './characterAnimationRules'

describe('pickPipocaAnimation', () => {
  it('parado usa idle sem espelhar', () => {
    expect(pickPipocaAnimation(0, 0)).toEqual({
      key: 'pipoca-idle',
      flipX: false,
    })
  })

  it('velocidade residual do drag conta como parado', () => {
    expect(pickPipocaAnimation(5, -4).key).toBe('pipoca-idle')
  })

  it('andando para baixo e para cima', () => {
    expect(pickPipocaAnimation(0, 165)).toEqual({
      key: 'pipoca-walk-down',
      flipX: false,
    })
    expect(pickPipocaAnimation(0, -165)).toEqual({
      key: 'pipoca-walk-up',
      flipX: false,
    })
  })

  it('andando para os lados espelha só para a esquerda', () => {
    expect(pickPipocaAnimation(165, 0)).toEqual({
      key: 'pipoca-walk-side',
      flipX: false,
    })
    expect(pickPipocaAnimation(-165, 0)).toEqual({
      key: 'pipoca-walk-side',
      flipX: true,
    })
  })

  it('na diagonal vale o eixo dominante; empate fica de lado', () => {
    expect(pickPipocaAnimation(50, 120).key).toBe('pipoca-walk-down')
    expect(pickPipocaAnimation(-117, -117)).toEqual({
      key: 'pipoca-walk-side',
      flipX: true,
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
