import { describe, expect, it } from 'vitest'
import { joystickDirection } from './touchInput'

describe('joystickDirection', () => {
  it('zona morta: deslocamento pequeno não move', () => {
    expect(joystickDirection(5, -5, 60)).toEqual({ h: 0, v: 0 })
  })

  it('direções cardeais e diagonais', () => {
    expect(joystickDirection(50, 0, 60)).toEqual({ h: 1, v: 0 })
    expect(joystickDirection(-50, 0, 60)).toEqual({ h: -1, v: 0 })
    expect(joystickDirection(0, -50, 60)).toEqual({ h: 0, v: -1 })
    expect(joystickDirection(40, 40, 60)).toEqual({ h: 1, v: 1 })
  })

  it('um eixo pequeno com o outro grande vira só um eixo', () => {
    expect(joystickDirection(55, 8, 60)).toEqual({ h: 1, v: 0 })
  })
})
