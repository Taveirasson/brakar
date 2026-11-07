import { hasLineOfSight, type Point, type Segment } from '../vision/lineOfSight'

export interface PerceptionInput {
  hunter: Point
  player: Point
  flashlightOn: boolean
  /** Raio em pixels com a lanterna ligada (exige linha de visão). */
  lightRadius: number
  /** Raio em pixels com a lanterna desligada (ignora paredes). */
  darkRadius: number
  walls: readonly Segment[]
}

function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function canPerceivePlayer(input: PerceptionInput): boolean {
  const distance = distanceBetween(input.hunter, input.player)

  if (!input.flashlightOn) {
    return distance <= input.darkRadius
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
