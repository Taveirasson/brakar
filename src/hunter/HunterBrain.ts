import type { MazeCell } from '../maze/MazeGenerator'
import {
  findPath,
  getOpenNeighbors,
  type CellPosition,
} from '../maze/MazePathFinder'

export type HunterState = 'wandering' | 'investigating' | 'hunting'

/** Tempo mínimo investigando antes de uma nova percepção virar caçada. */
export const INVESTIGATE_CONFIRM_MS = 600
/** Tempo caçando sem perceber o jogador até voltar a investigar. */
export const LOSE_TRACK_MS = 3000
/** Tempo parado no alvo da investigação até voltar a vagar. */
export const INVESTIGATE_WAIT_MS = 2000

export interface HunterBrainInput {
  deltaMs: number
  hunterCell: CellPosition
  playerCell: CellPosition
  perceivesPlayer: boolean
}

function sameCell(a: CellPosition, b: CellPosition): boolean {
  return a.row === b.row && a.column === b.column
}

export class HunterBrain {
  private currentState: HunterState = 'wandering'
  private target?: CellPosition
  private timeInState = 0
  private timeWithoutPlayer = 0
  private waitAtTarget = 0
  private previousCell?: CellPosition

  constructor(
    private readonly maze: MazeCell[][],
    private readonly random: () => number = Math.random,
  ) {}

  get state(): HunterState {
    return this.currentState
  }

  update(input: HunterBrainInput): void {
    this.timeInState += input.deltaMs

    switch (this.currentState) {
      case 'wandering':
        if (input.perceivesPlayer) {
          this.enterState('investigating')
          this.target = input.playerCell
        }
        return

      case 'investigating':
        if (input.perceivesPlayer) {
          this.target = input.playerCell
          this.waitAtTarget = 0

          if (this.timeInState >= INVESTIGATE_CONFIRM_MS) {
            this.enterState('hunting')
          }
          return
        }

        if (this.target && sameCell(input.hunterCell, this.target)) {
          this.waitAtTarget += input.deltaMs

          if (this.waitAtTarget >= INVESTIGATE_WAIT_MS) {
            this.enterState('wandering')
            this.target = undefined
          }
        }
        return

      case 'hunting':
        if (input.perceivesPlayer) {
          this.target = input.playerCell
          this.timeWithoutPlayer = 0
          return
        }

        this.timeWithoutPlayer += input.deltaMs

        if (this.timeWithoutPlayer >= LOSE_TRACK_MS) {
          this.enterState('investigating')
        }
        return
    }
  }

  /**
   * Caçando e na mesma célula do jogador: o caçador deve ir até a posição
   * real dele, e não parar no centro da célula (senão encostar na parede
   * deixaria o jogador fora do alcance da captura).
   */
  shouldChaseDirectly(
    hunterCell: CellPosition,
    playerCell: CellPosition,
  ): boolean {
    return this.currentState === 'hunting' && sameCell(hunterCell, playerCell)
  }

  nextCell(hunterCell: CellPosition): CellPosition {
    const cameFrom = this.previousCell
    this.previousCell = hunterCell

    if (this.currentState !== 'wandering' && this.target) {
      return findPath(this.maze, hunterCell, this.target)[1] ?? hunterCell
    }

    const neighbors = getOpenNeighbors(this.maze, hunterCell)

    if (neighbors.length === 0) {
      return hunterCell
    }

    const forward = cameFrom
      ? neighbors.filter((neighbor) => !sameCell(neighbor, cameFrom))
      : neighbors
    const options = forward.length > 0 ? forward : neighbors

    const index = Math.min(
      Math.floor(this.random() * options.length),
      options.length - 1,
    )

    return options[index]
  }

  /** Jogador sumiu de vista (escondido): a caçada vira investigação na hora. */
  loseTrack(): void {
    if (this.currentState === 'hunting') {
      this.enterState('investigating')
    }
  }

  private enterState(state: HunterState): void {
    this.currentState = state
    this.timeInState = 0
    this.timeWithoutPlayer = 0
    this.waitAtTarget = 0
  }
}
