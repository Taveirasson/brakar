import { describe, expect, it } from 'vitest'
import { HunterBrain } from './HunterBrain'
import type { CellPosition } from '../maze/MazePathFinder'
import { SERPENTINE_MAZE } from '../maze/testMaze'

const ORIGIN: CellPosition = { row: 0, column: 0 }
const FAR_CORNER: CellPosition = { row: 2, column: 2 }

function tick(
  brain: HunterBrain,
  ms: number,
  perceives: boolean,
  hunterCell: CellPosition = ORIGIN,
  playerCell: CellPosition = FAR_CORNER,
): void {
  brain.update({
    deltaMs: ms,
    hunterCell,
    playerCell,
    perceivesPlayer: perceives,
  })
}

function reachHunting(
  brain: HunterBrain,
  playerCell: CellPosition = FAR_CORNER,
): void {
  tick(brain, 16, true, ORIGIN, playerCell)
  tick(brain, 600, false, ORIGIN, playerCell)
  tick(brain, 16, true, ORIGIN, playerCell)
}

const cell = (position: CellPosition) => ({
  row: position.row,
  column: position.column,
})

describe('HunterBrain', () => {
  it('começa vagando', () => {
    expect(new HunterBrain(SERPENTINE_MAZE).state).toBe('wandering')
  })

  it('vagando que percebe passa a investigar', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    tick(brain, 16, true)
    expect(brain.state).toBe('investigating')
  })

  it('investigando não escala antes de 600 ms', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    tick(brain, 16, true)
    tick(brain, 500, false)
    tick(brain, 16, true)
    expect(brain.state).toBe('investigating')
  })

  it('investigando escala a caçando depois de 600 ms', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    reachHunting(brain)
    expect(brain.state).toBe('hunting')
  })

  it('caçando continua até 2999 ms sem perceber', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    reachHunting(brain)
    tick(brain, 2999, false)
    expect(brain.state).toBe('hunting')
  })

  it('caçando volta a investigar aos 3000 ms', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    reachHunting(brain)
    tick(brain, 3000, false)
    expect(brain.state).toBe('investigating')
  })

  it('perceber de novo zera o tempo perdido', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    reachHunting(brain)
    tick(brain, 2000, false)
    tick(brain, 16, true)
    tick(brain, 2000, false)
    expect(brain.state).toBe('hunting')
  })

  it('investigando espera 2000 ms no alvo e volta a vagar', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    tick(brain, 16, true)
    tick(brain, 2000, false, FAR_CORNER)
    expect(brain.state).toBe('wandering')
  })

  it('investigando fora do alvo não volta a vagar', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    tick(brain, 16, true)
    tick(brain, 5000, false, ORIGIN)
    expect(brain.state).toBe('investigating')
  })

  it('caçando segue o caminho do labirinto', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    reachHunting(brain, { row: 1, column: 0 })
    expect(cell(brain.nextCell(ORIGIN))).toEqual({ row: 0, column: 1 })
  })

  it('no alvo devolve a própria célula', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE)
    tick(brain, 16, true, ORIGIN, { row: 1, column: 1 })
    expect(cell(brain.nextCell({ row: 1, column: 1 }))).toEqual({
      row: 1,
      column: 1,
    })
  })

  it('wandering não volta para trás', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE, () => 0)
    expect(cell(brain.nextCell(ORIGIN))).toEqual({ row: 0, column: 1 })
    expect(cell(brain.nextCell({ row: 0, column: 1 }))).toEqual({
      row: 0,
      column: 2,
    })
  })

  it('wandering volta do beco sem saída', () => {
    const brain = new HunterBrain(SERPENTINE_MAZE, () => 0)
    brain.nextCell({ row: 0, column: 1 })
    expect(cell(brain.nextCell(ORIGIN))).toEqual({ row: 0, column: 1 })
  })
})
