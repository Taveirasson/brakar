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

// Movimento horizontal abaixo disso não muda o lado para onde o Pipoca olha.
const TURN_SPEED = 1

/**
 * O Pipoca sempre aparece na horizontal (visto de cima, olhando para um lado).
 * Andando para cima ou para baixo, ele continua virado para o último lado.
 */
export function pickPipocaAnimation(
  velocityX: number,
  velocityY: number,
  facingLeft: boolean,
): PipocaAnimation {
  const flipX = Math.abs(velocityX) >= TURN_SPEED ? velocityX < 0 : facingLeft

  if (Math.hypot(velocityX, velocityY) < IDLE_SPEED) {
    return { key: 'pipoca-idle', flipX: facingLeft }
  }

  return { key: 'pipoca-walk-side', flipX }
}

export function estouroAnimationFor(state: HunterState): string {
  return state === 'hunting' ? 'estouro-hunt' : 'estouro-move'
}
