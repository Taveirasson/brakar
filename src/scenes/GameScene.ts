import Phaser from 'phaser'
import { MazeGenerator, type MazeCell } from '../maze/MazeGenerator'
import {
  findFarthestCell,
  type FarthestCellResult,
} from '../maze/MazePathFinder'
import {
  CELL_PITCH,
  MOVEMENT_SCALE,
  TILE_SIZE,
  buildTileGrid,
  cellAt,
  cellCenter,
  isCellInterior,
  wallSegmentsFromGrid,
  worldSize,
  type TileType,
} from '../maze/MazeLayout'
import {
  FALLBACK_FRAME_COLORS,
  FOREST_FRAME_COUNT,
  FOREST_TEXTURE,
  TILESET_COLUMNS,
  exposedSides,
  groundFrameFor,
  tileFrameFor,
} from '../maze/forestTileset'
import { SCENE_KEYS } from '../config/sceneKeys'
import type { GamePhase } from '../config'
import { findItemCellsByQuadrant } from '../maze/MazeItemPlacement'
import type { NotificationScene } from './NotificationScene'
import { getSavedMazeSize } from '../config/mazeSettings'
import { castRay, type Segment } from '../vision/lineOfSight'
import { moonlightAt } from '../vision/moonlight'
import { Hunter } from '../hunter/Hunter'
import { GameEffects } from '../effects/GameEffects'
import { canPerceivePlayer, isCaught } from '../hunter/hunterPerception'
import {
  DARK_PERCEPTION_CELLS,
  DEFAULT_HUNTER_SETTINGS,
  HUNTER_SIZE,
  type HunterSettings,
} from '../hunter/hunterSettings'
import {
  PIPOCA_ANIMATIONS,
  PIPOCA_TEXTURE,
  IDLE_SPEED,
  INITIAL_FACING,
  animationForFacing,
  standingFrame,
  updateFacing,
  type FacingState,
} from '../characters/characterAnimationRules'
import {
  ensureAnimations,
  loadCharacterSprites,
} from '../characters/characterAnimations'
import {
  FIREFLY_COLOR,
  FIREFLY_TEXTURE,
  HEADLIGHT_COLOR,
  HEADLIGHTS_TEXTURE,
  createFireflyTexture,
  createHeadlightsTexture,
} from '../characters/forestProps'

const PLAYER_SIZE = 16
const PLAYER_SPEED = 110 * MOVEMENT_SCALE
const PLAYER_COLOR = 0x9b5de5

const EXIT_SIZE = 18

// Largura (em tiles) da mata decorativa em volta do labirinto.
const OUTER_FOREST_TILES = 7
const HEADLIGHT_LIGHT_RADIUS = 110
const HEADLIGHT_LIGHT_INTENSITY = 1.6

const FIREFLY_LIGHT_RADIUS = 48
const FIREFLY_LIGHT_INTENSITY = 1.2

const CATCH_DISTANCE = (PLAYER_SIZE + HUNTER_SIZE) / 2
const CATCH_EFFECT_MS = 400

const FLASHLIGHT_RADIUS = 200 * MOVEMENT_SCALE
// Folga (px) além do ponto de impacto para a copa da árvore ficar iluminada.
const FLASHLIGHT_CANOPY_BLEED = 8
const FLASHLIGHT_INNER_ANGLE = 30
const FLASHLIGHT_OUTER_ANGLE = 100
const FLASHLIGHT_COLOR = 0xffe6b3
const FLASHLIGHT_INTENSITY = 2.4

// Troca suave entre lanterna e luz da lua ao ligar/desligar a lanterna.
const MOON_TRANSITION_MS = 300

const FLASHLIGHT_RAY_COUNT = 181

const MINIMAP_CELL_SIZE = 8
const MINIMAP_PADDING = 12

const MINIMAP_BACKGROUND_COLOR = 0x07110a
const MINIMAP_FLOOR_COLOR = 0x5c4a35
const MINIMAP_WALL_COLOR = 0x8fbf7a
const MINIMAP_PLAYER_COLOR = 0xf4d35e
const MINIMAP_EXIT_COLOR = 0x55ff88

type MovementKeys = {
  up: Phaser.Input.Keyboard.Key
  down: Phaser.Input.Keyboard.Key
  left: Phaser.Input.Keyboard.Key
  right: Phaser.Input.Keyboard.Key
}

export class GameScene extends Phaser.Scene {
  private gamePhase: GamePhase = 'litExploration'

  private collectedItems = 0
  private readonly requiredItems = 3

  private mazeSize = 10
  private worldPixels = 0
  private maze!: MazeCell[][]
  private trees!: Phaser.Tilemaps.TilemapLayer

  private wallSegments: Segment[] = []
  private visibilityMask?: Phaser.GameObjects.Graphics
  private visibilityMaskCreated = false

  private player!: Phaser.Physics.Arcade.Sprite
  private usePipocaSprite = false
  private pipocaFacing: FacingState = INITIAL_FACING
  private inputDirection = { h: 0, v: 0 }
  private exit!: Phaser.Physics.Arcade.Image
  private exitBlink?: Phaser.Tweens.Tween
  private flashlight?: Phaser.GameObjects.Light

  private flashlightEnabled = false
  /** 0 = lanterna acesa (escuro), 1 = lanterna apagada (luz da lua). */
  private moonLevel = 0
  private moonTween?: Phaser.Tweens.Tween
  private flashlightToggleKey!: Phaser.Input.Keyboard.Key

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: MovementKeys

  private exitInformation!: FarthestCellResult
  private playerFoundExit = false

  private minimapCamera!: Phaser.Cameras.Scene2D.Camera
  private minimapGraphics!: Phaser.GameObjects.Graphics

  private hunter?: Hunter
  private effects?: GameEffects
  private readonly hunterSettings: HunterSettings = DEFAULT_HUNTER_SETTINGS

  private visitedCells = new Set<string>()
  private currentMapCellKey = ''

  constructor() {
    super(SCENE_KEYS.game)
  }

  preload(): void {
    this.load.spritesheet(FOREST_TEXTURE, 'assets/tiles/forest.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    })
    loadCharacterSprites(this)
  }

  create(): void {
    this.mazeSize = getSavedMazeSize()
    this.worldPixels = worldSize(this.mazeSize)
    this.playerFoundExit = false

    this.gamePhase = 'litExploration'
    this.collectedItems = 0
    this.visibilityMaskCreated = false

    this.flashlight = undefined
    this.flashlightEnabled = false
    this.moonLevel = 0
    this.moonTween = undefined
    this.visibilityMask = undefined
    this.visibilityMaskCreated = false

    this.hunter = undefined
    this.pipocaFacing = INITIAL_FACING
    this.inputDirection = { h: 0, v: 0 }

    this.configureLighting()
    this.generateMaze()
    this.createForest()
    this.createExit()
    this.createPlayer()
    this.createKeyboardControls()
    this.configureCollisions()
    this.configureCamera()
    this.createMinimap()
    this.effects = new GameEffects(
      this,
      this.player,
      this.minimapCamera,
      this.worldPixels,
    )
    this.configurePauseControl()
    this.startNotificationScene()
  }

  update(_time: number, delta: number): void {
    this.updatePlayerMovement()
    this.updatePlayerAnimation(delta)
    this.updateHunter(delta)
    this.effects?.update(this.hunter?.state === 'hunting')

    if (Phaser.Input.Keyboard.JustDown(this.flashlightToggleKey)) {
      this.toggleFlashlight()
    }

    if (this.visibilityMaskCreated) {
      this.updateFlashlightPosition()
      this.updateFlashlightDirection()
      this.updateVisibilityMask()
    }

    this.updateVisitedMap()
  }

  private generateMaze(): void {
    const generator = new MazeGenerator(this.mazeSize, this.mazeSize)

    this.maze = generator.generate()

    this.exitInformation = findFarthestCell(this.maze, 0, 0)
  }

  private ensureForestTexture(): void {
    if (this.textures.exists(FOREST_TEXTURE)) {
      return
    }

    // Falha ao carregar o tileset: pinta cada frame com uma cor sólida, na
    // mesma grade de colunas do tileset de verdade.
    const columns = TILESET_COLUMNS
    const rows = Math.ceil(FOREST_FRAME_COUNT / columns)
    const graphics = this.make.graphics({ x: 0, y: 0 })

    FALLBACK_FRAME_COLORS.forEach((color, index) => {
      graphics.fillStyle(color, 1)
      graphics.fillRect(
        (index % columns) * TILE_SIZE,
        Math.floor(index / columns) * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      )
    })

    graphics.generateTexture(
      FOREST_TEXTURE,
      columns * TILE_SIZE,
      rows * TILE_SIZE,
    )
    graphics.destroy()

    const texture = this.textures.get(FOREST_TEXTURE)

    for (let index = 0; index < FOREST_FRAME_COUNT; index++) {
      texture.add(
        index,
        0,
        (index % columns) * TILE_SIZE,
        Math.floor(index / columns) * TILE_SIZE,
        TILE_SIZE,
        TILE_SIZE,
      )
    }
  }

  private createForest(): void {
    this.physics.world.setBounds(0, 0, this.worldPixels, this.worldPixels)

    this.ensureForestTexture()

    const grid = buildTileGrid(this.maze)
    const size = grid.length
    const exitCell = this.exitInformation.cell

    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: size,
      height: size,
    })
    const tileset = map.addTilesetImage(FOREST_TEXTURE)

    if (!tileset) {
      throw new Error('não foi possível criar o tileset da floresta.')
    }

    const ground = map.createBlankLayer('ground', tileset, 0, 0)
    const trees = map.createBlankLayer('trees', tileset, 0, 0)

    if (!ground || !trees) {
      throw new Error('não foi possível criar as camadas da floresta.')
    }

    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        const isClearing = isCellInterior(row, column, exitCell)
        const isTree = grid[row][column] === 'tree'

        // o chão aparece entre as copas, com a sombra das árvores por cima
        ground.putTileAt(
          groundFrameFor(isTree, row, column, isClearing),
          column,
          row,
        )

        if (isTree) {
          const exposed = exposedSides(grid, row, column)
          trees.putTileAt(
            tileFrameFor('tree', row, column, false, exposed),
            column,
            row,
          )
        }
      }
    }

    ground.setDepth(-10).setLighting(true)
    trees.setDepth(-9).setLighting(true)
    trees.setCollisionByExclusion([-1])

    this.trees = trees
    this.wallSegments = wallSegmentsFromGrid(grid)

    this.createOuterForest(grid)
  }

  /**
   * Mata densa em volta do labirinto (só decoração, sem colisão), para a câmera
   * não mostrar o fundo preto perto das bordas. Uma segunda camada de copas,
   * deslocada meio tile, cobre os vãos entre as árvores.
   */
  private createOuterForest(grid: TileType[][]): void {
    const mazeTiles = grid.length
    const pad = OUTER_FOREST_TILES
    const total = mazeTiles + pad * 2
    const origin = -pad * TILE_SIZE

    const map = this.make.tilemap({
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
      width: total,
      height: total,
    })
    const tileset = map.addTilesetImage(FOREST_TEXTURE)
    const ground =
      tileset && map.createBlankLayer('outer-ground', tileset, origin, origin)
    const trees =
      tileset && map.createBlankLayer('outer-trees', tileset, origin, origin)
    const canopy =
      tileset &&
      map.createBlankLayer(
        'outer-canopy',
        tileset,
        origin + TILE_SIZE / 2,
        origin + TILE_SIZE / 2,
      )

    if (!ground || !trees || !canopy) {
      throw new Error('não foi possível criar a mata em volta do labirinto.')
    }

    const insideMaze = (row: number, column: number) =>
      row >= 0 && row < mazeTiles && column >= 0 && column < mazeTiles

    for (let row = 0; row < total; row++) {
      for (let column = 0; column < total; column++) {
        const mazeRow = row - pad
        const mazeColumn = column - pad

        if (insideMaze(mazeRow, mazeColumn)) {
          continue
        }

        ground.putTileAt(
          groundFrameFor(true, mazeRow, mazeColumn, false),
          column,
          row,
        )
        trees.putTileAt(
          tileFrameFor('tree', mazeRow, mazeColumn, false),
          column,
          row,
        )

        // o tile deslocado ocupa 2x2 tiles da grade: pode cobrir árvores da
        // borda do labirinto, mas nunca a trilha
        const overlapsPath = [0, 1].some((dr) =>
          [0, 1].some(
            (dc) =>
              insideMaze(mazeRow + dr, mazeColumn + dc) &&
              grid[mazeRow + dr][mazeColumn + dc] === 'path',
          ),
        )

        if (!overlapsPath) {
          canopy.putTileAt(
            tileFrameFor('tree', mazeRow + 50, mazeColumn + 50, false),
            column,
            row,
          )
        }
      }
    }

    ground.setDepth(-10).setLighting(true)
    trees.setDepth(-9).setLighting(true)
    canopy.setDepth(-9).setLighting(true)
  }

  private createMinimap(): void {
    this.visitedCells.clear()
    this.currentMapCellKey = ''

    const minimapWidth = this.mazeSize * MINIMAP_CELL_SIZE
    const minimapHeight = this.mazeSize * MINIMAP_CELL_SIZE

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
    const { row, column } = cellAt(this.player, this.mazeSize)

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
    const minimapWidth = this.mazeSize * MINIMAP_CELL_SIZE

    const minimapHeight = this.mazeSize * MINIMAP_CELL_SIZE

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
    this.usePipocaSprite = ensureAnimations(
      this,
      PIPOCA_TEXTURE,
      PIPOCA_ANIMATIONS,
    )

    if (!this.usePipocaSprite) {
      this.createSquareTexture('player', PLAYER_SIZE, PLAYER_COLOR)
    }

    const startPosition = this.getCellCenter(0, 0)

    this.player = this.physics.add.sprite(
      startPosition.x,
      startPosition.y,
      this.usePipocaSprite ? PIPOCA_TEXTURE : 'player',
    )

    // O frame do Pipoca tem 32 px, mas a hitbox continua do tamanho de antes (centralizada).
    this.player.setBodySize(PLAYER_SIZE - 2, PLAYER_SIZE - 2)

    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
    this.player.setDrag(500 * MOVEMENT_SCALE, 500 * MOVEMENT_SCALE)
  }

  private createExit(): void {
    createHeadlightsTexture(this)

    const exitCell = this.exitInformation.cell

    const exitPosition = this.getCellCenter(exitCell.row, exitCell.column)

    // O farol do carro brilha sozinho (sem setLighting) e pisca fraco enquanto
    // a saída está trancada.
    this.exit = this.physics.add.staticImage(
      exitPosition.x,
      exitPosition.y,
      HEADLIGHTS_TEXTURE,
    )
    this.exit.setDepth(5)
    ;(this.exit.body as Phaser.Physics.Arcade.StaticBody).setSize(
      EXIT_SIZE,
      EXIT_SIZE,
    )

    this.exitBlink = this.tweens.add({
      targets: this.exit,
      alpha: { from: 0.25, to: 0.7 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    })
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
    const center = cellCenter({ row, column })

    return new Phaser.Math.Vector2(center.x, center.y)
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

    this.flashlightToggleKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.F,
    )
  }

  private configureCollisions(): void {
    this.physics.add.collider(this.player, this.trees)

    this.physics.add.overlap(this.player, this.exit, () => {
      this.handlePlayerFoundExit()
    })
  }

  private configureCamera(): void {
    const camera = this.cameras.main

    camera.setZoom(4)

    camera.startFollow(this.player, true, 1, 1)
  }

  private updatePlayerAnimation(deltaMs: number): void {
    const body = this.player.body

    if (!this.usePipocaSprite || !body) {
      return
    }

    // a direção vem das teclas apertadas; deslizando ou parado, mantém a última
    this.pipocaFacing = updateFacing(
      this.pipocaFacing,
      this.inputDirection.h,
      this.inputDirection.v,
      deltaMs,
    )
    const animation = animationForFacing(this.pipocaFacing)

    this.player.setFlipX(animation.flipX)

    if (body.velocity.length() >= IDLE_SPEED) {
      this.player.anims.play(animation.key, true)
      return
    }

    // parado: em pé, olhando para a última direção em que andou
    this.player.anims.stop()
    this.player.setFrame(standingFrame(animation.key))
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

    this.inputDirection = { h: horizontalDirection, v: verticalDirection }

    const isMovingDiagonally =
      horizontalDirection !== 0 && verticalDirection !== 0
    const speed = isMovingDiagonally ? PLAYER_SPEED / Math.SQRT2 : PLAYER_SPEED

    if (horizontalDirection !== 0) {
      this.player.setVelocityX(horizontalDirection * speed)
    }

    if (verticalDirection !== 0) {
      this.player.setVelocityY(verticalDirection * speed)
    }
  }

  private updateFlashlightDirection(): void {
    if (!this.flashlight) {
      return
    }

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
    if (this.gamePhase === 'litExploration') {
      this.showLockedExitMessage()
      return
    }

    if (this.gamePhase === 'returningToExit') {
      if (this.isPlayerCaught()) {
        this.catchPlayer()
        return
      }

      this.finishGame()
    }

    if (this.playerFoundExit) {
      return
    }
  }

  private showLockedExitMessage(): void {
    if (this.gamePhase !== 'litExploration') {
      return
    }

    this.gamePhase = 'lockMessage'
    this.player.setVelocity(0, 0)

    this.scene.pause()
    this.scene.run(SCENE_KEYS.lockedExit)
  }

  private finishGame(): void {
    if (this.gamePhase === 'victory') {
      return
    }

    this.gamePhase = 'victory'
    this.effects?.stop()
    this.playerFoundExit = true
    this.player.setVelocity(0, 0)

    this.physics.pause()
    this.cameras.main.flash(250, 244, 211, 94)

    this.time.delayedCall(300, () => {
      this.clearNotifications()
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
    if (this.playerFoundExit || this.gamePhase === 'defeat') {
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
    this.lights.setAmbientColor(0xffffff)
  }

  private updateFlashlightPosition(): void {
    if (!this.flashlight) {
      return
    }
    this.flashlight.x = this.player.x
    this.flashlight.y = this.player.y
  }

  private castVisibilityRay(angle: number): Phaser.Math.Vector2 {
    const hit = castRay(
      { x: this.player.x, y: this.player.y },
      angle,
      FLASHLIGHT_RADIUS,
      this.wallSegments,
    )

    // O raio para exatamente na face da árvore, deixando o tile voltado para o
    // jogador fora do polígono de luz. Avança um pouco além do ponto de impacto
    // (só quando acertou parede) para a copa ficar iluminada.
    const distance = Math.hypot(hit.x - this.player.x, hit.y - this.player.y)
    const bleed = distance < FLASHLIGHT_RADIUS ? FLASHLIGHT_CANOPY_BLEED : 0

    return new Phaser.Math.Vector2(
      hit.x + Math.cos(angle) * bleed,
      hit.y + Math.sin(angle) * bleed,
    )
  }

  private createVisibilityMask(): void {
    this.visibilityMask = this.make.graphics({ x: 0, y: 0 })

    const camera = this.cameras.main

    const maskFilter = camera.filters.internal.addMask(
      this.visibilityMask,
      false,
      camera,
      'world',
    )

    maskFilter.autoUpdate = true
  }

  private updateVisibilityMask(): void {
    const visibilityMask = this.visibilityMask
    const flashlight = this.flashlight

    if (!visibilityMask || !flashlight) {
      return
    }

    visibilityMask.clear()

    const lighting = moonlightAt(this.moonLevel)

    visibilityMask.fillStyle(0xffffff, lighting.worldVisibility)

    // cobre também a mata em volta do labirinto
    const margin = OUTER_FOREST_TILES * TILE_SIZE
    visibilityMask.fillRect(
      -margin,
      -margin,
      this.worldPixels + margin * 2,
      this.worldPixels + margin * 2,
    )

    // visão em volta do Pipoca, com borda suave (círculos sobrepostos somam)
    for (const [scale, alpha] of [
      [1, 0.4],
      [0.65, 0.5],
      [0.35, 0.6],
    ]) {
      visibilityMask.fillStyle(0xffffff, alpha)
      visibilityMask.fillCircle(
        this.player.x,
        this.player.y,
        lighting.visionRadius * scale,
      )
    }

    if (!this.flashlightEnabled) {
      return
    }

    const points: Phaser.Math.Vector2[] = [
      new Phaser.Math.Vector2(this.player.x, this.player.y),
    ]

    const flashlightDirection = flashlight.coneRotation

    const halfOuterAngle = Phaser.Math.DegToRad(FLASHLIGHT_OUTER_ANGLE / 2)

    const firstRayAngle = flashlightDirection - halfOuterAngle

    const totalAngle = halfOuterAngle * 2

    for (let index = 0; index < FLASHLIGHT_RAY_COUNT; index++) {
      const progress = index / (FLASHLIGHT_RAY_COUNT - 1)

      const rayAngle = firstRayAngle + totalAngle * progress

      points.push(this.castVisibilityRay(rayAngle))
    }

    visibilityMask.fillStyle(0xffffff, 1)
    visibilityMask.fillPoints(points, true)

    visibilityMask.fillCircle(this.player.x, this.player.y, PLAYER_SIZE * 0.7)
  }

  public beginItemSearch(): void {
    if (this.gamePhase !== 'lockMessage') {
      return
    }

    this.gamePhase = 'searchingItems'
    this.collectedItems = 0

    this.turnFlashlightOn()
    this.turnOffWorldLights()
    this.resetMinimap()
    this.spawnRequiredItems()
    this.spawnHunter()
  }

  private spawnHunter(): void {
    const playerCell = this.getPlayerCell()

    const spawnCell = findFarthestCell(
      this.maze,
      playerCell.row,
      playerCell.column,
    ).cell

    this.hunter = new Hunter(this, this.maze, spawnCell, this.hunterSettings)

    // A câmera do minimapa só ignora o que já existia quando foi criada.
    this.minimapCamera.ignore(this.hunter.gameObject)
    this.effects?.attachHunter(this.hunter.gameObject)
  }

  private updateHunter(delta: number): void {
    const hunter = this.hunter

    if (!hunter) {
      return
    }

    const hunterIsActive =
      this.gamePhase === 'searchingItems' ||
      this.gamePhase === 'returningToExit'

    if (!hunterIsActive) {
      return
    }

    const perceivesPlayer = canPerceivePlayer({
      hunter: hunter.position,
      player: { x: this.player.x, y: this.player.y },
      flashlightOn: this.flashlightEnabled,
      lightRadius: this.hunterSettings.lightPerceptionRadiusCells * CELL_PITCH,
      darkRadius: DARK_PERCEPTION_CELLS * CELL_PITCH,
      walls: this.wallSegments,
    })

    hunter.update(
      delta,
      this.getPlayerCell(),
      { x: this.player.x, y: this.player.y },
      perceivesPlayer,
    )

    if (this.isPlayerCaught()) {
      this.catchPlayer()
    }
  }

  private isPlayerCaught(): boolean {
    if (!this.hunter) {
      return false
    }

    return isCaught(
      this.hunter.position,
      { x: this.player.x, y: this.player.y },
      CATCH_DISTANCE,
    )
  }

  private catchPlayer(): void {
    if (this.gamePhase === 'defeat' || this.gamePhase === 'victory') {
      return
    }

    this.gamePhase = 'defeat'
    this.effects?.stop()
    this.player.setVelocity(0, 0)

    this.physics.pause()
    this.cameras.main.shake(CATCH_EFFECT_MS, 0.01)
    this.cameras.main.flash(CATCH_EFFECT_MS, 180, 20, 30)

    this.time.delayedCall(CATCH_EFFECT_MS, () => {
      this.clearNotifications()
      this.scene.pause()
      this.scene.run(SCENE_KEYS.gameOver, { night: 1 })
    })
  }

  private turnFlashlightOn(): void {
    if (!this.flashlight) {
      this.createFlashlight()
    }

    this.flashlightEnabled = true

    this.flashlight?.setIntensity(FLASHLIGHT_INTENSITY)

    this.updateFlashlightDirection()
    this.updateFlashlightPosition()
  }

  private toggleFlashlight(): void {
    if (!this.flashlight) {
      return
    }

    if (
      this.gamePhase !== 'searchingItems' &&
      this.gamePhase !== 'returningToExit'
    ) {
      return
    }

    this.flashlightEnabled = !this.flashlightEnabled

    const intensity = this.flashlightEnabled ? FLASHLIGHT_INTENSITY : 0

    this.flashlight.setIntensity(intensity)

    this.fadeMoonlight(this.flashlightEnabled ? 0 : 1)
    this.updateVisibilityMask()
  }

  /** Lanterna apagada acende a luz da lua (e vice-versa), com transição suave. */
  private fadeMoonlight(target: number): void {
    this.moonTween?.stop()

    this.moonTween = this.tweens.add({
      targets: this,
      moonLevel: target,
      duration: MOON_TRANSITION_MS,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.lights.setAmbientColor(moonlightAt(this.moonLevel).ambientColor)
      },
    })
  }

  private turnOffWorldLights(): void {
    this.lights.setAmbientColor(moonlightAt(this.moonLevel).ambientColor)

    if (!this.visibilityMaskCreated) {
      this.createVisibilityMask()
      this.visibilityMaskCreated = true
    }

    this.updateVisibilityMask()

    this.cameras.main.flash(300, 255, 255, 255)
  }

  private resetMinimap(): void {
    this.visitedCells.clear()
    this.currentMapCellKey = ''

    const currentCell = this.getPlayerCell()

    this.visitedCells.add(`${currentCell.row},${currentCell.column}`)

    this.currentMapCellKey = `${currentCell.row},${currentCell.column}`

    this.drawMinimap(currentCell)
  }

  private spawnRequiredItems(): void {
    createFireflyTexture(this)

    const itemCells: MazeCell[] = findItemCellsByQuadrant(
      this.maze,
      this.exitInformation.cell,
    )

    for (const cell of itemCells) {
      const position = this.getCellCenter(cell.row, cell.column)

      // Vagalume: brilha sozinho, pulsa e flutua; a luz própria ilumina as copas em volta.
      const item = this.physics.add.staticImage(
        position.x,
        position.y,
        FIREFLY_TEXTURE,
      )
      item.setDepth(6)
      ;(item.body as Phaser.Physics.Arcade.StaticBody).setSize(12, 12)
      // Criado depois do minimapa: precisa ser ignorado por ele explicitamente.
      this.minimapCamera.ignore(item)

      const glow = this.lights.addLight(
        position.x,
        position.y,
        FIREFLY_LIGHT_RADIUS,
        FIREFLY_COLOR,
        FIREFLY_LIGHT_INTENSITY,
      )

      this.tweens.add({
        targets: item,
        alpha: { from: 0.55, to: 1 },
        y: position.y - 2,
        duration: 600 + Phaser.Math.Between(0, 300),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      this.physics.add.overlap(this.player, item, () => {
        this.collectItem(item, glow)
      })
    }
  }

  private collectItem(
    item: Phaser.Physics.Arcade.Image,
    glow: Phaser.GameObjects.Light,
  ): void {
    if (this.gamePhase !== 'searchingItems') {
      return
    }

    if (!item.active) {
      return
    }

    this.burstFirefly(item.x, item.y)
    this.tweens.killTweensOf(item)
    this.lights.removeLight(glow)
    item.destroy()
    this.collectedItems++

    if (this.collectedItems >= this.requiredItems) {
      this.unlockExit()
      return
    }

    this.showCollectedItemMessage()
  }

  private burstFirefly(x: number, y: number): void {
    const burst = this.add.particles(x, y, FIREFLY_TEXTURE, {
      speed: { min: 20, max: 60 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 10,
      emitting: false,
    })
    burst.setDepth(7)
    this.minimapCamera.ignore(burst)
    burst.explode(10)
    this.time.delayedCall(600, () => burst.destroy())
  }

  private showCollectedItemMessage(): void {
    this.showNotification(
      `VAGALUME ${this.collectedItems}/${this.requiredItems}`,
      '#d9ff6b',
      1000,
    )
  }

  private unlockExit(): void {
    this.gamePhase = 'returningToExit'

    // O farol acende de vez: para de piscar e passa a iluminar a clareira.
    this.exitBlink?.stop()
    this.exit.setAlpha(1)
    this.lights.addLight(
      this.exit.x,
      this.exit.y,
      HEADLIGHT_LIGHT_RADIUS,
      HEADLIGHT_COLOR,
      HEADLIGHT_LIGHT_INTENSITY,
    )

    this.cameras.main.flash(250, 255, 242, 176)

    this.showNotification(
      'O FAROL ACENDEU! CORRA PARA A ESTRADA',
      '#fff2b0',
      2200,
    )
  }

  /** Evita que um aviso pendente apareça por cima da tela de vitória ou derrota. */
  private clearNotifications(): void {
    const notificationScene = this.scene.get(
      SCENE_KEYS.notifications,
    ) as NotificationScene

    notificationScene.clear()
  }

  private startNotificationScene(): void {
    const notificationKey = SCENE_KEYS.notifications

    if (!this.scene.isActive(notificationKey)) {
      this.scene.launch(notificationKey)
      return
    }

    const notificationScene = this.scene.get(
      notificationKey,
    ) as NotificationScene

    notificationScene.clear()
    this.scene.bringToTop(notificationKey)
  }

  private showNotification(
    message: string,
    color: string,
    duration = 1600,
  ): void {
    const notificationKey = SCENE_KEYS.notifications

    const notificationScene = this.scene.get(
      notificationKey,
    ) as NotificationScene

    if (this.scene.isActive(notificationKey)) {
      this.scene.bringToTop(notificationKey)

      notificationScene.show(message, {
        color,
        duration,
      })

      return
    }

    notificationScene.events.once(Phaser.Scenes.Events.CREATE, () => {
      this.scene.bringToTop(notificationKey)

      notificationScene.show(message, {
        color,
        duration,
      })
    })

    this.scene.launch(notificationKey)
  }
}
