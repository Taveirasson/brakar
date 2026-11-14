import { describe, expect, it } from 'vitest'
import { castRay, hasLineOfSight } from './lineOfSight'

const wall = { x1: 50, y1: 0, x2: 50, y2: 100 }

describe('castRay', () => {
  it('para na parede', () => {
    const hit = castRay({ x: 0, y: 50 }, 0, 200, [wall])
    expect(hit.x).toBeCloseTo(50)
    expect(hit.y).toBeCloseTo(50)
  })

  it('vai até o alcance máximo sem parede', () => {
    const hit = castRay({ x: 0, y: 50 }, 0, 200, [])
    expect(hit.x).toBeCloseTo(200)
    expect(hit.y).toBeCloseTo(50)
  })

  it('usa a parede mais próxima', () => {
    const near = { x1: 30, y1: 0, x2: 30, y2: 100 }
    expect(castRay({ x: 0, y: 50 }, 0, 200, [wall, near]).x).toBeCloseTo(30)
  })
})

describe('hasLineOfSight', () => {
  it('bloqueado por parede no meio', () => {
    expect(hasLineOfSight({ x: 0, y: 50 }, { x: 100, y: 50 }, [wall])).toBe(
      false,
    )
  })

  it('livre antes da parede', () => {
    expect(hasLineOfSight({ x: 0, y: 50 }, { x: 40, y: 50 }, [wall])).toBe(true)
  })

  it('segmentos paralelos não bloqueiam', () => {
    expect(hasLineOfSight({ x: 60, y: 0 }, { x: 60, y: 100 }, [wall])).toBe(
      true,
    )
  })
})
