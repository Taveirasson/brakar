import Phaser from 'phaser'
import type { MazeCell } from '../maze/MazeGenerator'
import type { CellPosition } from '../maze/MazePathFinder'
import type { Point } from '../vision/lineOfSight'
import { cellCenter } from '../maze/MazeLayout'
import { HunterBrain, type HunterState } from './HunterBrain'
import { HUNTER_SIZE, type HunterSettings } from './hunterSettings'

const HUNTER_TEXTURE = 'hunter'
const HUNTER_BODY_COLOR = 0x1a0f1f
const HUNTER_EYE_COLOR = 0xf2f2f2
const HUNTER_EYE_SIZE = 3

function createHunterTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(HUNTER_TEXTURE)) {
    return
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 })

  graphics.fillStyle(HUNTER_BODY_COLOR, 1)
  graphics.fillRect(0, 0, HUNTER_SIZE, HUNTER_SIZE)

  graphics.fillStyle(HUNTER_EYE_COLOR, 1)
  graphics.fillRect(4, 5, HUNTER_EYE_SIZE, HUNTER_EYE_SIZE)
  graphics.fillRect(
    HUNTER_SIZE - 4 - HUNTER_EYE_SIZE,
    5,
    HUNTER_EYE_SIZE,
    HUNTER_EYE_SIZE,
  )

  graphics.generateTexture(HUNTER_TEXTURE, HUNTER_SIZE, HUNTER_SIZE)
  graphics.destroy()
}

export class Hunter {
  private readonly brain: HunterBrain
  private readonly sprite: Phaser.GameObjects.Image
  private currentCell: CellPosition
  private targetCell: CellPosition

  constructor(
    scene: Phaser.Scene,
    maze: MazeCell[][],
    startCell: CellPosition,
    private readonly settings: HunterSettings,
  ) {
    createHunterTexture(scene)

    this.brain = new HunterBrain(maze)
    this.currentCell = startCell

    const start = cellCenter(startCell)

    this.sprite = scene.add.image(start.x, start.y, HUNTER_TEXTURE)
    this.sprite.setLighting(true)
    this.sprite.setDepth(9)

    this.targetCell = this.brain.nextCell(startCell)
  }

  get position(): Point {
    return { x: this.sprite.x, y: this.sprite.y }
  }

  get state(): HunterState {
    return this.brain.state
  }

  /** O objeto de cena, para que outras câmeras (como o minimapa) possam ignorá-lo. */
  get gameObject(): Phaser.GameObjects.Image {
    return this.sprite
  }

  update(
    deltaMs: number,
    playerCell: CellPosition,
    playerPosition: Point,
    perceivesPlayer: boolean,
  ): void {
    this.brain.update({
      deltaMs,
      hunterCell: this.currentCell,
      playerCell,
      perceivesPlayer,
    })

    let remaining = (this.currentSpeed() * deltaMs) / 1000

    if (this.brain.shouldChaseDirectly(this.currentCell, playerCell)) {
      // Jogador na mesma célula: vai direto até ele. Com passo de 3 tiles, a área
      // da célula inclui os tiles de abertura (topo e esquerda) e a árvore do
      // canto, então a linha reta pode visualmente roçar essa árvore. O caçador
      // não tem física e a captura não é afetada.
      this.moveToward(playerPosition, remaining)
      return
    }

    // Anda de centro em centro; se sobrar movimento ao chegar, segue para a próxima célula.
    while (remaining > 0) {
      const target = cellCenter(this.targetCell)
      const distance = this.moveToward(target, remaining)

      if (distance > remaining) {
        return
      }

      remaining -= distance
      this.currentCell = this.targetCell
      this.targetCell = this.brain.nextCell(this.currentCell)

      const standingStill =
        this.targetCell.row === this.currentCell.row &&
        this.targetCell.column === this.currentCell.column

      if (standingStill) {
        return
      }
    }
  }

  destroy(): void {
    this.sprite.destroy()
  }

  /**
   * Anda até `maxDistance` em direção a `target`, sem passar dele.
   * Retorna a distância que existia até o alvo antes de andar.
   */
  private moveToward(target: Point, maxDistance: number): number {
    const distance = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      target.x,
      target.y,
    )

    if (distance <= maxDistance) {
      this.sprite.setPosition(target.x, target.y)
      return distance
    }

    const angle = Phaser.Math.Angle.Between(
      this.sprite.x,
      this.sprite.y,
      target.x,
      target.y,
    )

    this.sprite.x += Math.cos(angle) * maxDistance
    this.sprite.y += Math.sin(angle) * maxDistance

    return distance
  }

  private currentSpeed(): number {
    switch (this.brain.state) {
      case 'wandering':
        return this.settings.wanderSpeed
      case 'investigating':
        return this.settings.investigateSpeed
      case 'hunting':
        return this.settings.huntSpeed
    }
  }
}
