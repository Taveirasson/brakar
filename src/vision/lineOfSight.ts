export interface Point {
  x: number
  y: number
}

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Retorna o parâmetro `t` (0..1) ao longo de `ray` onde ele cruza `wall`,
 * ou `null` se não houver interseção. Segmentos paralelos não se cruzam.
 */
function intersectionParameter(ray: Segment, wall: Segment): number | null {
  const rayDeltaX = ray.x2 - ray.x1
  const rayDeltaY = ray.y2 - ray.y1
  const wallDeltaX = wall.x2 - wall.x1
  const wallDeltaY = wall.y2 - wall.y1

  const denominator = rayDeltaX * wallDeltaY - rayDeltaY * wallDeltaX

  if (denominator === 0) {
    return null
  }

  const offsetX = wall.x1 - ray.x1
  const offsetY = wall.y1 - ray.y1

  const t = (offsetX * wallDeltaY - offsetY * wallDeltaX) / denominator
  const u = (offsetX * rayDeltaY - offsetY * rayDeltaX) / denominator

  if (t < 0 || t > 1 || u < 0 || u > 1) {
    return null
  }

  return t
}

export function castRay(
  origin: Point,
  angle: number,
  maxDistance: number,
  walls: readonly Segment[],
): Point {
  const ray: Segment = {
    x1: origin.x,
    y1: origin.y,
    x2: origin.x + Math.cos(angle) * maxDistance,
    y2: origin.y + Math.sin(angle) * maxDistance,
  }

  let closest = 1

  for (const wall of walls) {
    const t = intersectionParameter(ray, wall)

    if (t !== null && t < closest) {
      closest = t
    }
  }

  return {
    x: ray.x1 + (ray.x2 - ray.x1) * closest,
    y: ray.y1 + (ray.y2 - ray.y1) * closest,
  }
}

export function hasLineOfSight(
  from: Point,
  to: Point,
  walls: readonly Segment[],
): boolean {
  const sight: Segment = { x1: from.x, y1: from.y, x2: to.x, y2: to.y }

  return walls.every((wall) => intersectionParameter(sight, wall) === null)
}
