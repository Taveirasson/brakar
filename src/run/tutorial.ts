/** Tutorial interativo da primeira partida: cada passo some quando o jogador faz a ação. */
export type TutorialEvent = 'moved' | 'sprinted' | 'firefly' | 'hid'

export interface TutorialStep {
  event: TutorialEvent
  text: string
  touchText: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    event: 'moved',
    text: 'USE WASD OU AS SETAS PARA ANDAR',
    touchText: 'USE O JOYSTICK PARA ANDAR',
  },
  {
    event: 'sprinted',
    text: 'SEGURE SHIFT PARA CORRER',
    touchText: 'SEGURE CORRER PARA DISPARAR',
  },
  {
    event: 'firefly',
    text: 'PEGUE UM VAGALUME AMARELO',
    touchText: 'PEGUE UM VAGALUME AMARELO',
  },
  {
    event: 'hid',
    text: 'ENTRE NUMA MOITA (SEM CORRER) PARA SE ESCONDER',
    touchText: 'ENTRE NUMA MOITA (SEM CORRER) PARA SE ESCONDER',
  },
]

const STORAGE_KEY = 'brakar-tutorial-done'

export function isTutorialDone(
  storage: Pick<Storage, 'getItem'> = localStorage,
): boolean {
  try {
    return storage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markTutorialDone(
  storage: Pick<Storage, 'setItem'> = localStorage,
): void {
  try {
    storage.setItem(STORAGE_KEY, '1')
  } catch {
    // sem armazenamento: o tutorial volta na próxima vez
  }
}

/** Marca eventos em qualquer ordem; o passo atual é o primeiro ainda não feito. */
export class Tutorial {
  private readonly done = new Set<TutorialEvent>()

  report(event: TutorialEvent): void {
    this.done.add(event)
  }

  current(): TutorialStep | undefined {
    return TUTORIAL_STEPS.find((step) => !this.done.has(step.event))
  }

  get finished(): boolean {
    return this.current() === undefined
  }
}
