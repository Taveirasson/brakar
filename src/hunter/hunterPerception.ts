import { hasLineOfSight, type Point, type Segment } from '../vision/lineOfSight'

/** Menor que o afastamento da moita ao corredor: só encostando ele acha. */
export const HIDDEN_DETECTION_RADIUS = 16

export interface PerceptionInput {
  hunter: Point
  player: Point
  /** Raio de visão em pixels (exige linha de visão). */
  lightRadius: number
  /** Raio curto em pixels em que ele sente o jogador mesmo atrás de paredes. */
  darkRadius: number
  walls: readonly Segment[]
  /** Pipoca escondido numa moita. */
  hidden?: boolean
  /** Raio em pixels em que ele ainda percebe um jogador escondido. */
  hiddenRadius?: number
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function canPerceivePlayer(input: PerceptionInput): boolean {
  const distance = distanceBetween(input.hunter, input.player)

  if (input.hidden) {
    return distance <= (input.hiddenRadius ?? HIDDEN_DETECTION_RADIUS)
  }

  if (distance <= input.darkRadius) {
    return true
  }

  return (
    distance <= input.lightRadius &&
    hasLineOfSight(input.hunter, input.player, input.walls)
  )
}

export function isCaught(
  hunter: Point,
  player: Point,
  catchDistance: number,
): boolean {
  return distanceBetween(hunter, player) < catchDistance
}
