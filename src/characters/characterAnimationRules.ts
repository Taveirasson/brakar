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
export const IDLE_SPEED = 10

// Tempo para aceitar a troca de uma diagonal para uma das suas direções retas:
// ninguém solta duas teclas exatamente juntas, e sem essa folga o Pipoca pararia
// olhando reto depois de andar na diagonal.
const RELEASE_GRACE_MS = 90

/** Direção para onde o Pipoca olha: h e v valem -1, 0 ou 1. */
export interface Facing {
  h: number
  v: number
}

export interface FacingState extends Facing {
  pendingH: number
  pendingV: number
  pendingMs: number
}

export const INITIAL_FACING: FacingState = {
  h: 0,
  v: 1,
  pendingH: 0,
  pendingV: 0,
  pendingMs: 0,
}

/**
 * Atualiza a direção a partir das teclas apertadas (inputH/inputV em -1, 0, 1).
 * Sem tecla apertada, mantém a última direção (parado ou deslizando).
 */
export function updateFacing(
  state: FacingState,
  inputH: number,
  inputV: number,
  deltaMs: number,
): FacingState {
  const settled = (h: number, v: number): FacingState => ({
    h,
    v,
    pendingH: 0,
    pendingV: 0,
    pendingMs: 0,
  })

  if (inputH === 0 && inputV === 0) {
    return settled(state.h, state.v)
  }

  if (inputH === state.h && inputV === state.v) {
    return settled(state.h, state.v)
  }

  const wasDiagonal = state.h !== 0 && state.v !== 0
  const isPartOfDiagonal =
    (inputH === 0 && inputV === state.v) || (inputV === 0 && inputH === state.h)

  if (!wasDiagonal || !isPartOfDiagonal) {
    return settled(inputH, inputV)
  }

  const samePending = inputH === state.pendingH && inputV === state.pendingV
  const pendingMs = (samePending ? state.pendingMs : 0) + deltaMs

  if (pendingMs >= RELEASE_GRACE_MS) {
    return settled(inputH, inputV)
  }

  return { ...state, pendingH: inputH, pendingV: inputV, pendingMs }
}

/** Animação de andar para uma direção (as da esquerda são as da direita espelhadas). */
export function animationForFacing(facing: Facing): {
  key: string
  flipX: boolean
} {
  const flipX = facing.h < 0

  if (facing.h !== 0 && facing.v !== 0) {
    return {
      key: facing.v > 0 ? 'pipoca-walk-diag-down' : 'pipoca-walk-diag-up',
      flipX,
    }
  }

  if (facing.h !== 0) {
    return { key: 'pipoca-walk-side', flipX }
  }

  return {
    key: facing.v < 0 ? 'pipoca-walk-up' : 'pipoca-walk-down',
    flipX: false,
  }
}

/** Frame de pernas paradas (o segundo da passada) de uma animação de andar. */
export function standingFrame(key: string): number {
  const definition = PIPOCA_ANIMATIONS.find(
    (animation) => animation.key === key,
  )

  if (!definition) {
    throw new Error(`animação desconhecida: ${key}`)
  }

  return definition.start + 1
}

export function estouroAnimationFor(state: HunterState): string {
  return state === 'hunting' ? 'estouro-hunt' : 'estouro-move'
}
