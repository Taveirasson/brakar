import Phaser from 'phaser'
import { MazeGenerator, type MazeCell } from '../maze/MazeGenerator'
import {
  findFarthestCell,
  type FarthestCellResult,
} from '../maze/MazePathFinder'
import { SCENE_KEYS } from '../config/sceneKeys'

const MAZE_ROWS = 18
const MAZE_COLUMNS = 25

const CELL_SIZE = 32
const WALL_THICKNESS = 4

const PLAYER_SIZE = 14
const PLAYER_SPEED = 100

const EXIT_SIZE = 16

const WORLD_WIDTH = MAZE_COLUMNS * CELL_SIZE
const WORLD_HEIGHT = MAZE_ROWS * CELL_SIZE

type MovementKeys = {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  private maze!: MazeCell[][]
  private walls!: Phaser.Physics.Arcade.StaticGroup

  private player!: Phaser.Physics.Arcade.Sprite
  private exit!: Phaser.Physics.Arcade.Image

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: MovementKeys

  private exitInformation!: FarthestCellResult

  private playerFoundExit = false

  constructor() {
    super(SCENE_KEYS.game)
  }

  create(): void {
    this.generateMaze()
    this.createWorld()
    this.createMazeWalls()
    this.createExit()
    this.createPlayer()
    this.createKeyboardControls()
    this.configureCollisions()
    this.configureCamera()
    this.configurePauseControl()
  }

  update(): void {
    this.updatePlayerMovement()
  }

  private generateMaze(): void {
    const generator = new MazeGenerator(MAZE_ROWS, MAZE_COLUMNS)

    this.maze = generator.generate()

    this.exitInformation = findFarthestCell(this.maze, 0, 0)
  }

  private createWorld(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.add
      .rectangle(
        WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        0x171120,
      )
      .setDepth(-10)

    this.drawFloorDetails()
  }

  private drawFloorDetails(): void {
    const floorGraphics = this.add.graphics()

    floorGraphics.fillStyle(0x20172c, 1)

    for (let row = 0; row < MAZE_ROWS; row++) {
      for (let column = 0; column < MAZE_COLUMNS; column++) {
        const shouldDrawTile = (row + column) % 2 === 0

        if (!shouldDrawTile) {
          continue
        }

        floorGraphics.fillRect(
          column * CELL_SIZE,
          row * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
        )
      }
    }

    floorGraphics.setDepth(-9)
  }

  private createMazeWalls(): void {
    this.walls = this.physics.add.staticGroup()

    for (const row of this.maze) {
      for (const cell of row) {
        this.createCellWalls(cell)
      }
    }
  }

  private createCellWalls(cell: MazeCell): void {
    const centerX = cell.column * CELL_SIZE + CELL_SIZE / 2

    const centerY = cell.row * CELL_SIZE + CELL_SIZE / 2

    const leftX = cell.column * CELL_SIZE

    const rightX = (cell.column + 1) * CELL_SIZE

    const topY = cell.row * CELL_SIZE

    const bottomY = (cell.row + 1) * CELL_SIZE

    if (cell.walls.top) {
      this.createWall(centerX, topY, CELL_SIZE, WALL_THICKNESS)
    }

    if (cell.walls.left) {
      this.createWall(leftX, centerY, WALL_THICKNESS, CELL_SIZE)
    }

    const isLastColumn = cell.column === MAZE_COLUMNS - 1

    if (isLastColumn && cell.walls.right) {
      this.createWall(rightX, centerY, WALL_THICKNESS, CELL_SIZE)
    }

    const isLastRow = cell.row === MAZE_ROWS - 1

    if (isLastRow && cell.walls.bottom) {
      this.createWall(centerX, bottomY, CELL_SIZE, WALL_THICKNESS)
    }
  }

  private createWall(
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const wall = this.add.rectangle(x, y, width, height, 0x5a4473)
    this.walls.add(wall)
  }

  private createPlayer(): void {
    this.createSquareTexture('player', PLAYER_SIZE, 0x9b5de5)

    const startPosition = this.getCellCenter(0, 0)

    this.player = this.physics.add.sprite(
      startPosition.x,
      startPosition.y,
      'player',
    )

    this.player.setBodySize(PLAYER_SIZE - 2, PLAYER_SIZE - 2)

    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
  }

  private createExit(): void {
    this.createSquareTexture('exit', EXIT_SIZE, 0xf4d35e)

    const exitCell = this.exitInformation.cell

    const exitPosition = this.getCellCenter(exitCell.row, exitCell.column)

    this.exit = this.physics.add.staticImage(
      exitPosition.x,
      exitPosition.y,
      'exit',
    )

    this.exit.setDepth(5)
    console.log(
      'Saída:',
      exitCell.row,
      exitCell.column,
      'Distância:',
      this.exitInformation.distance,
    )
  }

  private createSquareTexture(
    textureName: string,
    size: number,
    color: number,
  ) {
    if (this.textures.exists(textureName)) {
      return
    }

    const graphics = this.make.graphics({ x: 0, y: 0 })

    graphics.fillStyle(color, 1)
    graphics.fillRect(0, 0, size, size)

    graphics.generateTexture(textureName, size, size)

    graphics.destroy()
  }

  private getCellCenter(row: number, column: number): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      column * CELL_SIZE + CELL_SIZE / 2,
      row * CELL_SIZE + CELL_SIZE / 2,
    )
  }

  private createKeyboardControls(): void {
    if (!this.input.keyboard) {
      throw new Error('o teclado não está disponível.')
    }

    this.cursorKeys = this.input.keyboard.createCursorKeys()

    this.wasdKeys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as MovementKeys
  }

  private configureCollisions(): void {
    this.physics.add.collider(this.player, this.walls)

    this.physics.add.overlap(this.player, this.exit, () => {
      this.handlePlayerFoundExit()
    })
  }

  private configureCamera(): void {
    const camera = this.cameras.main

    camera.setZoom(3)

    camera.startFollow(this.player, true, 1, 1)
  }

  private updatePlayerMovement(): void {
    if (this.playerFoundExit) {
      this.player.setVelocity(0, 0)
      return
    }

    const movingLeft = this.cursorKeys.left.isDown || this.wasdKeys.left.isDown

    const movingRight =
      this.cursorKeys.right.isDown || this.wasdKeys.right.isDown

    const movingUp = this.cursorKeys.up.isDown || this.wasdKeys.up.isDown

    const movingDown = this.cursorKeys.down.isDown || this.wasdKeys.down.isDown

    const horizontalDirection = Number(movingRight) - Number(movingLeft)

    const verticalDirection = Number(movingDown) - Number(movingUp)

    const movementDirection = new Phaser.Math.Vector2(
      horizontalDirection,
      verticalDirection,
    )

    if (movementDirection.lengthSq() > 0) {
      movementDirection.normalize().scale(PLAYER_SPEED)
    }

    this.player.setVelocity(movementDirection.x, movementDirection.y)
  }

  private handlePlayerFoundExit(): void {
    if (this.playerFoundExit) {
      return
    }

    this.playerFoundExit = true
    this.player.setVelocity(0, 0)

    this.physics.pause()

    this.add
      .text(this.player.x, this.player.y - 24, 'Você encontrou a saída!', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#ffffff',
        backgroundColor: '#20172c',
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(100)
  }

  private configurePauseControl(): void {
    const keyboard = this.input.keyboard

    if (!keyboard) {
      return
    }

    keyboard.on('keydown-ESC', this.pauseGame, this)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown-ESC', this.pauseGame, this)
    })
  }

  private pauseGame(): void {
    if (this.playerFoundExit) {
      return
    }

    this.player.setVelocity(0, 0)

    this.scene.pause()
    this.scene.run(SCENE_KEYS.pause)
  }
}
