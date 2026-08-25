import Phaser from 'phaser'
import { MazeGenerator, type MazeCell } from '../maze/MazeGenerator'
import {
  findFarthestCell,
  type FarthestCellResult,
} from '../maze/MazePathFinder'
import { SCENE_KEYS } from '../config/sceneKeys'

const MAZE_ROWS = 18
const MAZE_COLUMNS = 25

const CELL_SIZE = 64
const WALL_THICKNESS = 5

const PLAYER_SIZE = 16
const PLAYER_SPEED = 110
const PLAYER_COLOR = 0x9b5de5

const EXIT_SIZE = 18

const WORLD_WIDTH = MAZE_COLUMNS * CELL_SIZE
const WORLD_HEIGHT = MAZE_ROWS * CELL_SIZE

const FLASHLIGHT_RADIUS = 200
const FLASHLIGHT_INNER_ANGLE = 30
const FLASHLIGHT_OUTER_ANGLE = 100
const FLASHLIGHT_COLOR = 0xffe6b3
const FLASHLIGHT_INTENSITY = 2.4

const AMBIENT_LIGHT_COLOR = 0x08060c

const FLASHLIGHT_RAY_COUNT = 181

const MINIMAP_CELL_SIZE = 8
const MINIMAP_PADDING = 12

const MINIMAP_BACKGROUND_COLOR = 0x09070f
const MINIMAP_FLOOR_COLOR = 0x79608f
const MINIMAP_WALL_COLOR = 0xc1aecf
const MINIMAP_PLAYER_COLOR = 0xf4d35e
const MINIMAP_EXIT_COLOR = 0x55ff88

type MovementKeys = {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
}

type WalllSegment = Phaser.Geom.Line

export class GameScene extends Phaser.Scene {
  private maze!: MazeCell[][]
  private walls!: Phaser.Physics.Arcade.StaticGroup

  private wallSegments: WalllSegment[] = []
  private visibillityMask!: Phaser.GameObjects.Graphics

  private player!: Phaser.Physics.Arcade.Sprite
  private exit!: Phaser.Physics.Arcade.Image
  private flashlight!: Phaser.GameObjects.Light

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: MovementKeys

  private exitInformation!: FarthestCellResult
  private playerFoundExit = false

  private minimapCamera!: Phaser.Cameras.Scene2D.Camera
  private minimapGraphics!: Phaser.GameObjects.Graphics

  private visitedCells = new Set<string>()
  private currentMapCellKey = ''

  constructor() {
    super(SCENE_KEYS.game)
  }

  create(): void {
    this.playerFoundExit = false

    this.configureLighting()
    this.generateMaze()
    this.createWorld()
    this.createMazeWalls()
    this.createExit()
    this.createPlayer()
    this.createFlashlight()
    this.createKeyboardControls()
    this.configureCollisions()
    this.configureCamera()
    this.createVisibilityMask()
    this.updateVisibilityMask()
    this.createMinimap()
    this.configurePauseControl()
  }

  update(): void {
    this.updatePlayerMovement()
    this.updateFlashlightPosition()
    this.updateFlashlightDirection()
    this.updateVisibilityMask()
    this.updateVisitedMap()
  }

  private generateMaze(): void {
    const generator = new MazeGenerator(MAZE_ROWS, MAZE_COLUMNS)

    this.maze = generator.generate()

    this.exitInformation = findFarthestCell(this.maze, 0, 0)
  }

  private createWorld(): void {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)

    this.createSquareTexture('floor', CELL_SIZE, 0x171120)

    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'floor')
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setLighting(true)
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

    floorGraphics.setLighting(true)
    floorGraphics.setDepth(-9)
  }

  private createMazeWalls(): void {
    this.wallSegments = []

    this.createSquareTexture('wall', WALL_THICKNESS, 0x5a4473)

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
    const wall = this.walls.create(x, y, 'wall') as Phaser.Physics.Arcade.Image

    wall.setDisplaySize(width, height)
    wall.setLighting(true)
    wall.refreshBody()

    this.createWallsSegment(x, y, width, height)
  }

  private createWallsSegment(
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    const wallsIsHorizontal = width > height

    if (wallsIsHorizontal) {
      this.wallSegments.push(
        new Phaser.Geom.Line(x - width / 2, y, x + width / 2, y),
      )
      return
    }

    this.wallSegments.push(
      new Phaser.Geom.Line(x, y - height / 2, x, y + height / 2),
    )
  }

  private createMinimap(): void {
    this.visitedCells.clear()
    this.currentMapCellKey = ''

    const minimapWidth = MAZE_COLUMNS * MINIMAP_CELL_SIZE
    const minimapHeight = MAZE_ROWS * MINIMAP_CELL_SIZE

    const minimapX = this.scale.width - minimapWidth - MINIMAP_PADDING

    const minimapY = MINIMAP_PADDING

    // Capturamos os objetos do mundo antes de criar o mapa.
    const worldObjects = [...this.children.list]

    this.minimapCamera = this.cameras.add(
      minimapX,
      minimapY,
      minimapWidth,
      minimapHeight,
      false,
      'minimap',
    )

    this.minimapCamera.setScroll(0, 0)
    this.minimapCamera.setBackgroundColor(MINIMAP_BACKGROUND_COLOR)

    this.minimapGraphics = this.add.graphics()
    this.minimapGraphics.setDepth(1000)

    // A câmera principal não desenha o mapa.
    this.cameras.main.ignore(this.minimapGraphics)

    // A câmera do mapa não desenha o mundo.
    this.minimapCamera.ignore(worldObjects)

    this.updateVisitedMap()
  }

  private getPlayerCell(): MazeCell {
    const row = Phaser.Math.Clamp(
      Math.floor(this.player.y / CELL_SIZE),
      0,
      MAZE_ROWS - 1,
    )

    const column = Phaser.Math.Clamp(
      Math.floor(this.player.x / CELL_SIZE),
      0,
      MAZE_COLUMNS - 1,
    )

    return this.maze[row][column]
  }

  private updateVisitedMap(): void {
    const currentCell = this.getPlayerCell()

    const cellKey = `${currentCell.row},${currentCell.column}`

    if (cellKey === this.currentMapCellKey) {
      return
    }

    this.currentMapCellKey = cellKey
    this.visitedCells.add(cellKey)

    this.drawMinimap(currentCell)
  }

  private drawMinimap(currentCell: MazeCell): void {
    this.minimapGraphics.clear()

    for (const row of this.maze) {
      for (const cell of row) {
        const cellKey = `${cell.row},${cell.column}`

        if (!this.visitedCells.has(cellKey)) {
          continue
        }

        this.drawMinimapCell(cell)
      }
    }

    this.drawMinimapBorder()
    this.drawMinimapExit()

    const playerX =
      currentCell.column * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2

    const playerY = currentCell.row * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2

    this.minimapGraphics.fillStyle(MINIMAP_PLAYER_COLOR, 1)

    this.minimapGraphics.fillCircle(playerX, playerY, MINIMAP_CELL_SIZE / 2)
  }

  private drawMinimapBorder(): void {
    const minimapWidth = MAZE_COLUMNS * MINIMAP_CELL_SIZE

    const minimapHeight = MAZE_ROWS * MINIMAP_CELL_SIZE

    this.minimapGraphics.lineStyle(1, MINIMAP_WALL_COLOR, 1)

    this.minimapGraphics.strokeRect(
      0.5,
      0.5,
      minimapWidth - 1,
      minimapHeight - 1,
    )
  }

  private drawMinimapExit(): void {
    const exitCell = this.exitInformation.cell

    const exitX = exitCell.column * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2

    const exitY = exitCell.row * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2

    this.minimapGraphics.fillStyle(MINIMAP_EXIT_COLOR, 1)

    this.minimapGraphics.fillCircle(exitX, exitY, MINIMAP_CELL_SIZE / 2)
  }

  private drawMinimapCell(cell: MazeCell): void {
    const x = cell.column * MINIMAP_CELL_SIZE
    const y = cell.row * MINIMAP_CELL_SIZE

    const right = x + MINIMAP_CELL_SIZE
    const bottom = y + MINIMAP_CELL_SIZE

    this.minimapGraphics.fillStyle(MINIMAP_FLOOR_COLOR, 1)

    this.minimapGraphics.fillRect(x, y, MINIMAP_CELL_SIZE, MINIMAP_CELL_SIZE)

    this.minimapGraphics.lineStyle(1, MINIMAP_WALL_COLOR, 1)

    this.minimapGraphics.beginPath()

    if (cell.walls.top) {
      this.minimapGraphics.moveTo(x, y)
      this.minimapGraphics.lineTo(right, y)
    }

    if (cell.walls.right) {
      this.minimapGraphics.moveTo(right, y)
      this.minimapGraphics.lineTo(right, bottom)
    }

    if (cell.walls.bottom) {
      this.minimapGraphics.moveTo(x, bottom)
      this.minimapGraphics.lineTo(right, bottom)
    }

    if (cell.walls.left) {
      this.minimapGraphics.moveTo(x, y)
      this.minimapGraphics.lineTo(x, bottom)
    }

    this.minimapGraphics.strokePath()
  }

  private createPlayer(): void {
    this.createSquareTexture('player', PLAYER_SIZE, PLAYER_COLOR)

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
    this.exit.setLighting(true)
    this.exit.setDepth(5)
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

    camera.setZoom(4)

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
      movementDirection.normalize()
      movementDirection.scale(PLAYER_SPEED)
    }

    this.player.setVelocity(movementDirection.x, movementDirection.y)
  }

  private updateFlashlightDirection(): void {
    const pointer = this.input.activePointer
    const camera = this.cameras.main

    pointer.updateWorldPoint(camera)

    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY,
    )

    if (distance < 4) {
      return
    }

    const direction = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY,
    )

    this.flashlight.setConeRotation(direction)
  }

  private handlePlayerFoundExit(): void {
    if (this.playerFoundExit) {
      return
    }

    this.playerFoundExit = true
    this.player.setVelocity(0, 0)

    this.physics.pause()

    this.cameras.main.flash(250, 244, 211, 94)

    this.time.delayedCall(300, () => {
      this.scene.pause()
      this.scene.run(SCENE_KEYS.victory)
    })
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

  private createFlashlight(): void {
    this.flashlight = this.lights.addLight(
      this.player.x,
      this.player.y,
      FLASHLIGHT_RADIUS,
      FLASHLIGHT_COLOR,
      FLASHLIGHT_INTENSITY,
    )

    this.flashlight.setCone(
      0,
      Phaser.Math.DegToRad(FLASHLIGHT_INNER_ANGLE),
      Phaser.Math.DegToRad(FLASHLIGHT_OUTER_ANGLE),
    )
  }

  private configureLighting(): void {
    this.lights.enable()
    this.lights.setAmbientColor(AMBIENT_LIGHT_COLOR)
  }

  private updateFlashlightPosition(): void {
    this.flashlight.x = this.player.x
    this.flashlight.y = this.player.y
  }

  private castVisibilityRay(angle: number): Phaser.Math.Vector2 {
    const startX = this.player.x
    const startY = this.player.y

    const endX = startX + Math.cos(angle) * FLASHLIGHT_RADIUS
    const endY = startY + Math.sin(angle) * FLASHLIGHT_RADIUS

    const ray = new Phaser.Geom.Line(startX, startY, endX, endY)

    const closestPoint = new Phaser.Math.Vector2(endX, endY)

    let closestDistanceSquared = FLASHLIGHT_RADIUS * FLASHLIGHT_RADIUS

    const intersection = new Phaser.Math.Vector2()

    for (const wallSegment of this.wallSegments) {
      const rayHitWalll = Phaser.Geom.Intersects.LineToLine(
        ray,
        wallSegment,
        intersection,
      )

      if (!rayHitWalll) {
        continue
      }

      const distanceSquared = Phaser.Math.Distance.Squared(
        startX,
        startY,
        intersection.x,
        intersection.y,
      )

      if (distanceSquared >= closestDistanceSquared) {
        continue
      }

      closestDistanceSquared = distanceSquared
      closestPoint.copy(intersection)
    }

    return closestPoint
  }

  private createVisibilityMask(): void {
    this.visibillityMask = this.make.graphics({ x: 0, y: 0 })

    const camera = this.cameras.main

    const maskFilter = camera.filters.internal.addMask(
      this.visibillityMask,
      false,
      camera,
      'world',
    )

    maskFilter.autoUpdate = true
  }

  private updateVisibilityMask(): void {
    const points: Phaser.Math.Vector2[] = [
      new Phaser.Math.Vector2(this.player.x, this.player.y),
    ]

    const flashlightDirection = this.flashlight.coneRotation

    const halfOuterAngle = Phaser.Math.DegToRad(FLASHLIGHT_OUTER_ANGLE / 2)

    const firstRayAngle = flashlightDirection - halfOuterAngle
    const totalAngle = halfOuterAngle * 2

    for (let index = 0; index < FLASHLIGHT_RAY_COUNT; index++) {
      const progress = index / (FLASHLIGHT_RAY_COUNT - 1)
      const rayAngle = firstRayAngle + totalAngle * progress

      points.push(this.castVisibilityRay(rayAngle))
    }

    this.visibillityMask.clear()
    this.visibillityMask.fillStyle(0xffffff, 1)

    this.visibillityMask.fillPoints(points, true)

    // this.visibillityMask.fillStyle(0xffffff, 0.5)
    this.visibillityMask.fillCircle(
      this.player.x,
      this.player.y,
      PLAYER_SIZE * 0.7,
    )
  }
}
