import type { HunterState } from '../hunter/HunterBrain'

export const PIPOCA_TEXTURE = 'pipoca'
export const ESTOURO_TEXTURE = 'estouro'
export const CHARACTER_FRAME_SIZE = 32

export interface AnimationDefinition {
  key: string
  start: number
  end: number
  frameRate: number
}

// Layout documentado em public/assets/sprites/README.md (4 frames por linha).
export const PIPOCA_ANIMATIONS: AnimationDefinition[] = [
  { key: 'pipoca-walk-down', start: 0, end: 3, frameRate: 8 },
  { key: 'pipoca-walk-up', start: 4, end: 7, frameRate: 8 },
  { key: 'pipoca-walk-side', start: 8, end: 11, frameRate: 8 },
  { key: 'pipoca-idle', start: 12, end: 13, frameRate: 3 },
  { key: 'pipoca-walk-diag-down', start: 16, end: 19, frameRate: 8 },
  { key: 'pipoca-walk-diag-up', start: 20, end: 23, frameRate: 8 },
]

export const ESTOURO_ANIMATIONS: AnimationDefinition[] = [
  { key: 'estouro-move', start: 0, end: 3, frameRate: 10 },
  { key: 'estouro-hunt', start: 4, end: 7, frameRate: 14 },
]

// Abaixo disso o Pipoca está só deslizando pelo drag: conta como parado.
const IDLE_SPEED = 10

export interface PipocaAnimation {
  key: string
  flipX: boolean
}

// tan(22,5°): o movimento conta como diagonal quando o eixo menor tem pelo menos
// essa fração do eixo maior (faixa de 45° em volta de cada diagonal).
const DIAGONAL_RATIO = Math.tan(Math.PI / 8)

/**
 * Oito direções vistas de cima: frente, costas, lados e as quatro diagonais.
 * As direções para a esquerda usam o sprite da direita espelhado.
 */
export function pickPipocaAnimation(
  velocityX: number,
  velocityY: number,
): PipocaAnimation {
  if (Math.hypot(velocityX, velocityY) < IDLE_SPEED) {
    return { key: 'pipoca-idle', flipX: false }
  }

  const absX = Math.abs(velocityX)
  const absY = Math.abs(velocityY)
  const flipX = velocityX < 0

  if (Math.min(absX, absY) >= Math.max(absX, absY) * DIAGONAL_RATIO) {
    return {
      key: velocityY > 0 ? 'pipoca-walk-diag-down' : 'pipoca-walk-diag-up',
      flipX,
    }
  }

  if (absX >= absY) {
    return { key: 'pipoca-walk-side', flipX }
  }

  return {
    key: velocityY > 0 ? 'pipoca-walk-down' : 'pipoca-walk-up',
    flipX: false,
  }
}

export function estouroAnimationFor(state: HunterState): string {
  return state === 'hunting' ? 'estouro-hunt' : 'estouro-move'
}
