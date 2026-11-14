import Phaser from 'phaser'
import { applyDifficulty, getDifficulty } from '../config/difficulty'
import { dateKey, recordDailyEscape } from '../run/daily'
import { createSeededRandom, hashString } from '../run/seed'
import { braidMaze } from '../maze/mazeBraiding'
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
import type { HudScene } from './HudScene'
import type { NotificationScene } from './NotificationScene'
import { getSavedMazeSize } from '../config/mazeSettings'
import type { Segment } from '../vision/lineOfSight'
import {
  FULL_STAMINA,
  SPRINT_MULTIPLIER,
  stepStamina,
  type StaminaState,
} from '../player/stamina'
import { hidingSpotOffset, pickHidingCells } from '../maze/HidingSpotPlacement'
import { FONT_FAMILY } from '../ui/theme'
import { touchInput } from '../input/touchInput'
import { sfx, toggleMuted } from '../audio/sfx'
import { addBones, bonesForRun, loadWallet } from '../run/wallet'
import { skinTint } from '../run/shopItems'
import {
  addScore,
  getGameMode,
  getNight,
  getScore,
  type GameMode,
} from '../run/runState'
import { unlockAchievements } from '../run/achievements'
import { recordMissions } from '../run/missions'
import { recordHistory } from '../run/history'
import { OWL_COOLDOWN_MS, owlActive, owlShouldHoot } from '../run/owl'
import {
  Tutorial,
  isTutorialDone,
  markTutorialDone,
  type TutorialEvent,
} from '../run/tutorial'
import {
  loadSurvivalBest,
  recordSurvival,
  scoreForNight,
} from '../run/survival'
import { loadRecords, recordCaught, recordEscape } from '../run/records'
import { NIGHT_LIGHTING } from '../vision/moonlight'
import {
  POWER_UPS,
  SHIELD_GRACE_MS,
  SHIELD_STUN_MS,
  SPEED_BOOST,
  pickPowerUpTypes,
  type PowerUpId,
} from '../run/powerups'
import {
  applyModifiersToHunter,
  applyModifiersToLighting,
  combineModifiers,
  NEUTRAL_EFFECTS,
  pickModifiers,
  type Modifier,
  type ModifierEffects,
} from '../run/modifiers'
import { Hunter } from '../hunter/Hunter'
import { GameEffects } from '../effects/GameEffects'
import { canPerceivePlayer, isCaught } from '../hunter/hunterPerception'
import {
  DARK_PERCEPTION_CELLS,
  DEFAULT_HUNTER_SETTINGS,
  hunterSettingsForNight,
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
  createBoneTexture,
  createPowerUpTextures,
  powerUpTextureKey,
  createGlowTexture,
  GLOW_TEXTURE,
  BONE_TEXTURE,
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
const CATCH_EFFECT_MS = 1000
const DANGER_RADIUS_CELLS = 5
// Moitas: dentro deste raio (px) do centro o Pipoca some, se não estiver correndo
// e o Estouro não estiver colado nele.
const HIDING_RADIUS = 26
const HIDING_MIN_HUNTER_DISTANCE = CELL_PITCH
const HIDING_SPOTS_PER_CELL_ROW = 0.6
const BUSH_SCALE = 1.25
const POWER_UPS_PER_CELL_ROW = 0.3
const DAILY_MAZE_SIZE = 10
const SURVIVAL_MAZE_SIZE = 8

// Pipoca com medo: treme quando o Estouro chega perto.
const FEAR_DANGER = 0.55
const FEAR_MAX_ANGLE = 5
const EXIT_GLOW_LOCKED_SCALE = 1.1
const EXIT_GLOW_OPEN_SCALE = 3.2

// Labirinto: metade dos becos ganha saída e há passagens extras nas paredes.
const DEAD_END_OPEN_CHANCE = 0.5
const EXTRA_OPENINGS_PER_ROW = 0.8
const ALERT_OFFSET_Y = 18

const TIPS_KEY = 'brakar-tips-seen'
const TIPS_MAX_RUNS = 2

// Lama: poças que freiam o Pipoca (um pouco) e o Estouro (muito).
const MUD_CELLS_PER_CELL_ROW = 0.7
const MUD_HALF_SIZE = CELL_PITCH / 3
const MUD_PLAYER_SPEED = 0.7
const MUD_HUNTER_SPEED = 0.45

// Ossos: devolvem o fôlego todo.
const BONES_PER_CELL_ROW = 0.4

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
  private exitGlow?: Phaser.GameObjects.Image

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasdKeys!: MovementKeys
  private sprintKey!: Phaser.Input.Keyboard.Key
  private sprinting = false
  private hidingSpots: Phaser.GameObjects.Image[] = []
  private hidden = false
  private mudCells: MazeCell[] = []
  private hides = 0
  private bonesCollected = 0
  private timesHunted = 0
  private powerUpsCollected = 0
  private tutorial?: Tutorial
  private owl?: Phaser.GameObjects.Image
  private owlCooldownMs = 0
  private lastHunterState = ''
  private alertMarker?: Phaser.GameObjects.Text
  private stamina: StaminaState = FULL_STAMINA

  private exitInformation!: FarthestCellResult
  private playerFoundExit = false
  /** Tempo de jogo acumulado (não conta pausas nem telas por cima). */
  private elapsedMs = 0

  private minimapCamera!: Phaser.Cameras.Scene2D.Camera
  private minimapGraphics!: Phaser.GameObjects.Graphics

  private hunter?: Hunter
  private effects?: GameEffects
  private hunterSettings: HunterSettings = DEFAULT_HUNTER_SETTINGS
  private night = 1
  private mode: GameMode = 'normal'
  private random: () => number = Math.random
  private modifiers: Modifier[] = []
  private shieldActive = false
  private shieldRing?: Phaser.GameObjects.Arc
  private speedUntil = 0
  private graceUntil = 0
  private effects_: ModifierEffects = NEUTRAL_EFFECTS
  private lighting = NIGHT_LIGHTING

  private visitedCells = new Set<string>()
  /** Vagalumes, ossos e moitas já vistos, para aparecerem no minimapa. */
  private minimapMarkers: Array<{
    cell: MazeCell
    color: number
    object: Phaser.GameObjects.GameObject
  }> = []
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
    this.mode = getGameMode()
    this.mazeSize =
      this.mode === 'daily'
        ? DAILY_MAZE_SIZE
        : this.mode === 'survival'
          ? SURVIVAL_MAZE_SIZE
          : getSavedMazeSize()
    this.random =
      this.mode === 'daily'
        ? createSeededRandom(hashString(`brakar-${dateKey()}`))
        : Math.random
    this.worldPixels = worldSize(this.mazeSize)
    this.playerFoundExit = false
    this.elapsedMs = 0
    this.stamina = FULL_STAMINA
    this.sprinting = false
    this.hidingSpots = []
    this.hidden = false
    this.mudCells = []
    this.minimapMarkers = []
    this.shieldActive = false
    this.shieldRing = undefined
    this.speedUntil = 0
    this.graceUntil = 0
    this.hides = 0
    this.bonesCollected = 0
    this.timesHunted = 0
    this.powerUpsCollected = 0
    this.tutorial = undefined
    this.owl = undefined
    this.owlCooldownMs = 0
    this.lastHunterState = ''
    this.alertMarker = undefined
    this.night = this.mode === 'daily' ? 1 : getNight()
    this.modifiers = pickModifiers(
      this.night,
      this.random,
      this.mode === 'daily',
    )
    this.effects_ = combineModifiers(this.modifiers)
    this.lighting = applyModifiersToLighting(NIGHT_LIGHTING, this.effects_)
    this.hunterSettings = applyModifiersToHunter(
      applyDifficulty(
        hunterSettingsForNight(this.night),
        this.mode === 'daily' ? 'normal' : getDifficulty(),
      ),
      this.effects_,
    )

    this.gamePhase = 'litExploration'
    this.collectedItems = 0
    this.visibilityMaskCreated = false

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
    this.createMud()
    this.effects = new GameEffects(
      this,
      this.player,
      this.minimapCamera,
      this.worldPixels,
    )
    this.configurePauseControl()
    this.cameras.main.fadeIn(500, 5, 10, 7)
    this.startHud()
    this.startNotificationScene()
  }

  update(_time: number, delta: number): void {
    if (this.gamePhase !== 'victory' && this.gamePhase !== 'defeat') {
      this.elapsedMs += delta
    }

    this.updatePlayerMovement(delta)
    this.updatePlayerAnimation(delta)
    this.updateHiding()
    this.updateHunter(delta)
    this.updateOwl(delta)
    this.effects?.update(this.hunter?.state === 'hunting')

    if (this.visibilityMaskCreated) {
      this.updateVisibilityMask()
    }

    this.updateVisitedMap()
    this.updateHud()
  }

  private generateMaze(): void {
    const generator = new MazeGenerator(
      this.mazeSize,
      this.mazeSize,
      this.random,
    )

    this.maze = generator.generate()

    // ciclos e passagens extras: rotas alternativas para fugir do Estouro
    braidMaze(
      this.maze,
      {
        deadEndChance: DEAD_END_OPEN_CHANCE,
        extraOpenings: Math.round(this.mazeSize * EXTRA_OPENINGS_PER_ROW),
      },
      this.random,
    )

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

    // a camada de copas é deslocada meio tile para baixo/direita: sem cobrir a
    // última linha/coluna do labirinto, sobraria um vão ralo na borda inferior
    // e direita (a esquerda e o topo já ficam cobertos pelo tile vizinho)
    const lastTile = mazeTiles - 1

    for (let row = 0; row < total; row++) {
      for (let column = 0; column < total; column++) {
        const mazeRow = row - pad
        const mazeColumn = column - pad
        const isMaze = insideMaze(mazeRow, mazeColumn)

        if (isMaze && mazeRow !== lastTile && mazeColumn !== lastTile) {
          continue
        }

        if (!isMaze) {
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
        }

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

    this.drawMinimapMarkers()
    this.drawMinimapBorder()
    this.drawMinimapExit()

    const playerX =
      currentCell.column * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2

    const playerY = currentCell.row * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2

    this.minimapGraphics.fillStyle(MINIMAP_PLAYER_COLOR, 1)

    this.minimapGraphics.fillCircle(playerX, playerY, MINIMAP_CELL_SIZE / 2)
  }

  /** Pontinhos de itens e moitas, só nas células já visitadas e enquanto existirem. */
  private drawMinimapMarkers(): void {
    for (const marker of this.minimapMarkers) {
      if (
        !marker.object.active ||
        !this.visitedCells.has(`${marker.cell.row},${marker.cell.column}`)
      ) {
        continue
      }

      this.minimapGraphics.fillStyle(marker.color, 1)
      this.minimapGraphics.fillCircle(
        marker.cell.column * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2,
        marker.cell.row * MINIMAP_CELL_SIZE + MINIMAP_CELL_SIZE / 2,
        MINIMAP_CELL_SIZE / 4,
      )
    }
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

    if (this.usePipocaSprite) {
      this.player.setTint(skinTint(loadWallet().skin))
    }

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

    // halo do farol: fraco enquanto a saída está trancada, forte depois de
    // destrancar (serve de guia para achar a estrada de longe)
    createGlowTexture(this)
    this.exitGlow = this.add
      .image(exitPosition.x, exitPosition.y, GLOW_TEXTURE)
      .setDepth(4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(EXIT_GLOW_LOCKED_SCALE)
      .setAlpha(0.18)

    this.tweens.add({
      targets: this.exitGlow,
      alpha: { from: 0.1, to: 0.3 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
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

    this.input.keyboard.on('keydown-M', () => {
      toggleMuted()
    })

    this.sprintKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
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

  private updatePlayerMovement(delta = 16): void {
    if (this.playerFoundExit) {
      this.player.setVelocity(0, 0)
      return
    }

    const movingLeft =
      this.cursorKeys.left.isDown ||
      this.wasdKeys.left.isDown ||
      touchInput.h < 0

    const movingRight =
      this.cursorKeys.right.isDown ||
      this.wasdKeys.right.isDown ||
      touchInput.h > 0

    const movingUp =
      this.cursorKeys.up.isDown || this.wasdKeys.up.isDown || touchInput.v < 0

    const movingDown =
      this.cursorKeys.down.isDown ||
      this.wasdKeys.down.isDown ||
      touchInput.v > 0

    const horizontalDirection = Number(movingRight) - Number(movingLeft)

    const verticalDirection = Number(movingDown) - Number(movingUp)

    this.inputDirection = { h: horizontalDirection, v: verticalDirection }

    const isMovingDiagonally =
      horizontalDirection !== 0 && verticalDirection !== 0
    const step = stepStamina(
      this.stamina,
      delta,
      this.sprintKey.isDown || touchInput.sprint,
      horizontalDirection !== 0 || verticalDirection !== 0,
    )

    this.stamina = step.state
    this.sprinting = step.sprinting

    if (horizontalDirection !== 0 || verticalDirection !== 0) {
      this.tutorialEvent('moved')

      if (step.sprinting) this.tutorialEvent('sprinted')
    }

    const mudFactor = this.isInMud(this.player.x, this.player.y)
      ? MUD_PLAYER_SPEED
      : 1
    const topSpeed =
      PLAYER_SPEED *
      (step.sprinting ? SPRINT_MULTIPLIER : 1) *
      (this.elapsedMs < this.speedUntil ? SPEED_BOOST : 1) *
      mudFactor
    const speed = isMovingDiagonally ? topSpeed / Math.SQRT2 : topSpeed

    if (horizontalDirection !== 0) {
      this.player.setVelocityX(horizontalDirection * speed)
    }

    if (verticalDirection !== 0) {
      this.player.setVelocityY(verticalDirection * speed)
    }
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
    sfx.stopDrone()
    sfx.victory()
    this.effects?.stop()
    this.playerFoundExit = true
    this.player.setVelocity(0, 0)

    const timeMs = Math.round(this.elapsedMs)
    const daily = this.mode === 'daily' ? recordDailyEscape(timeMs) : undefined
    const survival =
      this.mode === 'survival' ? this.survivalEscape(timeMs) : undefined
    const result =
      daily || survival ? undefined : recordEscape(timeMs, this.night)
    if (this.mode === 'normal') {
      recordHistory(timeMs, this.night)
    }

    const missions = this.missionReward(true, timeMs)
    const achievements = this.earnAchievements(true, timeMs)
    const bones = this.bankBones(true, missions.reward)

    this.physics.pause()
    this.cameras.main.flash(250, 244, 211, 94)

    this.time.delayedCall(300, () => {
      this.clearNotifications()
      this.scene.pause()
      this.scene.run(SCENE_KEYS.victory, {
        timeMs,
        night: this.night,
        ...result,
        achievements: [...achievements, ...missions.titles],
        bones,
        mode: this.mode,
        survival,
        daily: daily && {
          streak: daily.streak,
          isNewBest: daily.isNewBest,
          bestMs: daily.state.best[dateKey()],
        },
      })
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

  private configureLighting(): void {
    this.lights.enable()
    this.lights.setAmbientColor(0xffffff)
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

    if (!visibilityMask) {
      return
    }

    visibilityMask.clear()

    visibilityMask.fillStyle(0xffffff, this.lighting.worldVisibility)

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
        this.lighting.visionRadius * scale,
      )
    }
  }

  public beginItemSearch(): void {
    if (this.gamePhase !== 'lockMessage') {
      return
    }

    this.gamePhase = 'searchingItems'
    this.collectedItems = 0

    this.turnOffWorldLights()
    sfx.startDrone()
    this.resetMinimap()
    const itemCells = this.spawnRequiredItems()
    const bushCells = this.spawnHidingSpots(itemCells)
    const boneCells = this.spawnBones([...itemCells, ...bushCells])
    this.spawnPowerUps([...itemCells, ...bushCells, ...boneCells])
    this.spawnHunter()
    this.spawnOwl()
    this.announceModifiers()
    this.startTutorial()
    this.showTips()
  }

  /** Avisa os modificadores da noite (e o bônus de ossos por eles). */
  private announceModifiers(): void {
    for (const modifier of this.modifiers) {
      this.showNotification(
        `${modifier.name.toUpperCase()}: ${modifier.description}` +
          (modifier.bonusBones > 0 ? `  (+${modifier.bonusBones} ossos)` : ''),
        '#ffd36a',
        2600,
      )
    }
  }

  /** Tutorial interativo: só na noite 1 do modo normal, até o jogador concluir. */
  private startTutorial(): void {
    if (this.mode === 'normal' && this.night === 1 && !isTutorialDone()) {
      this.tutorial = new Tutorial()
    }
  }

  private tutorialEvent(event: TutorialEvent): void {
    this.tutorial?.report(event)
  }

  private updateTutorial(): void {
    if (!this.tutorial) return

    const hud = this.scene.get(SCENE_KEYS.hud) as HudScene
    const step = this.tutorial.current()

    if (!step) {
      markTutorialDone()
      this.tutorial = undefined
      hud.setTutorial(null)
      this.showNotification('MUITO BEM! AGORA ACHE A SAÍDA', '#9fe870', 2200)

      return
    }

    hud.setTutorial(
      this.sys.game.device.input.touch ? step.touchText : step.text,
    )
  }

  /** Dicas nas duas primeiras partidas; depois o jogador já sabe jogar. */
  private showTips(): void {
    if (this.night !== 1 || this.tutorial) {
      return
    }

    let seen = 0

    try {
      seen = Number(localStorage.getItem(TIPS_KEY)) || 0
      localStorage.setItem(TIPS_KEY, String(seen + 1))
    } catch {
      // sem armazenamento: mostra sempre
    }

    if (seen >= TIPS_MAX_RUNS) {
      return
    }

    this.showNotification('O ESTOURO ESTÁ SOLTO! FUJA DELE', '#ff9b9b', 2400)
    this.showNotification('SHIFT CORRE, MAS O FÔLEGO ACABA', '#9fe870', 2400)
    this.showNotification(
      'MOITAS ESCONDEM · OSSOS DÃO FÔLEGO · LAMA FREIA',
      '#f2ead3',
      2800,
    )
  }

  /** Moitas nos corredores: o Pipoca some dentro delas e o Estouro perde o rastro. */
  private spawnHidingSpots(itemCells: MazeCell[]): MazeCell[] {
    const cells = pickHidingCells(
      this.maze,
      [
        { row: 0, column: 0 },
        this.exitInformation.cell,
        ...itemCells,
        ...this.mudCells,
      ],
      Math.max(3, Math.round(this.mazeSize * HIDING_SPOTS_PER_CELL_ROW)),
      this.random,
    )

    for (const cell of cells) {
      const center = this.getCellCenter(cell.row, cell.column)
      const offset = hidingSpotOffset(cell)

      const bush = this.add
        .image(
          center.x + offset.x,
          center.y + offset.y,
          FOREST_TEXTURE,
          tileFrameFor('tree', cell.row + 5, cell.column + 9, false, 15),
        )
        .setDepth(11)
        .setScale(BUSH_SCALE)
        .setTint(0xb4d890)
        .setLighting(true)

      this.minimapCamera.ignore(bush)
      this.hidingSpots.push(bush)
      this.minimapMarkers.push({ cell, color: 0x4f9a48, object: bush })
    }

    return cells
  }

  /** Poças de lama nos corredores: freiam o Pipoca e, mais ainda, o Estouro. */
  private createMud(): void {
    const cells = pickHidingCells(
      this.maze,
      [{ row: 0, column: 0 }, this.exitInformation.cell],
      Math.max(
        3,
        Math.round(this.mazeSize * MUD_CELLS_PER_CELL_ROW * this.effects_.mud),
      ),
      this.random,
    )

    this.mudCells = cells

    const mud = this.add.graphics().setDepth(-8)

    for (const cell of cells) {
      const center = this.getCellCenter(cell.row, cell.column)

      mud.fillStyle(0x0d0905, 0.8)
      mud.fillEllipse(
        center.x,
        center.y,
        MUD_HALF_SIZE * 2,
        MUD_HALF_SIZE * 1.8,
      )
      mud.fillStyle(0x1b120a, 0.95)
      mud.fillEllipse(
        center.x,
        center.y,
        MUD_HALF_SIZE * 1.6,
        MUD_HALF_SIZE * 1.4,
      )
      mud.fillStyle(0x2b1e12, 0.8)
      mud.fillEllipse(
        center.x - 5,
        center.y - 4,
        MUD_HALF_SIZE * 0.8,
        MUD_HALF_SIZE * 0.5,
      )
    }

    this.minimapCamera.ignore(mud)
  }

  private isInMud(x: number, y: number): boolean {
    return this.mudCells.some((cell) => {
      const center = this.getCellCenter(cell.row, cell.column)

      return (
        Math.abs(x - center.x) <= MUD_HALF_SIZE &&
        Math.abs(y - center.y) <= MUD_HALF_SIZE
      )
    })
  }

  /** Ossos nos corredores: devolvem o fôlego todo. */
  private spawnBones(usedCells: MazeCell[]): MazeCell[] {
    if (this.effects_.noBones) {
      return []
    }

    createBoneTexture(this)

    const cells = pickHidingCells(
      this.maze,
      [
        { row: 0, column: 0 },
        this.exitInformation.cell,
        ...usedCells,
        ...this.mudCells,
      ],
      Math.max(2, Math.round(this.mazeSize * BONES_PER_CELL_ROW)),
      this.random,
    )

    for (const cell of cells) {
      const position = this.getCellCenter(cell.row, cell.column)
      const bone = this.physics.add.staticImage(
        position.x,
        position.y,
        BONE_TEXTURE,
      )

      bone.setDepth(6).setLighting(true)
      this.minimapMarkers.push({ cell, color: 0xf2ead3, object: bone })
      ;(bone.body as Phaser.Physics.Arcade.StaticBody).setSize(16, 16)
      this.minimapCamera.ignore(bone)

      this.tweens.add({
        targets: bone,
        angle: { from: -12, to: 12 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      this.physics.add.overlap(this.player, bone, () => {
        this.collectBone(bone)
      })
    }

    return cells
  }

  /** Power-ups espalhados nos corredores: escudo, pata veloz e mapa da mata. */
  private spawnPowerUps(usedCells: MazeCell[]): void {
    createPowerUpTextures(
      this,
      Object.values(POWER_UPS).map((powerUp) => ({
        id: powerUp.id,
        color: powerUp.color,
      })),
    )

    const cells = pickHidingCells(
      this.maze,
      [
        { row: 0, column: 0 },
        this.exitInformation.cell,
        ...usedCells,
        ...this.mudCells,
      ],
      Math.max(2, Math.round(this.mazeSize * POWER_UPS_PER_CELL_ROW)),
      this.random,
    )
    const types = pickPowerUpTypes(cells.length, this.random)

    cells.forEach((cell, index) => {
      const powerUp = POWER_UPS[types[index]]
      const position = this.getCellCenter(cell.row, cell.column)
      const orb = this.physics.add.staticImage(
        position.x,
        position.y,
        powerUpTextureKey(powerUp.id),
      )

      orb.setDepth(6)
      ;(orb.body as Phaser.Physics.Arcade.StaticBody).setSize(16, 16)
      this.minimapCamera.ignore(orb)
      this.minimapMarkers.push({ cell, color: powerUp.color, object: orb })

      this.tweens.add({
        targets: orb,
        scale: { from: 0.9, to: 1.2 },
        y: position.y - 2,
        duration: 650,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })

      this.physics.add.overlap(this.player, orb, () => {
        this.collectPowerUp(powerUp.id, orb)
      })
    })
  }

  private collectPowerUp(
    id: PowerUpId,
    orb: Phaser.Physics.Arcade.Image,
  ): void {
    if (!orb.active) {
      return
    }

    const powerUp = POWER_UPS[id]

    this.powerUpsCollected++
    this.tweens.killTweensOf(orb)
    sfx.unlock()
    this.hopForJoy()
    this.burstFirefly(orb.x, orb.y)
    orb.destroy()

    if (id === 'shield') {
      this.activateShield()
    } else if (id === 'speed') {
      this.speedUntil = this.elapsedMs + (powerUp.durationMs ?? 6000)
    } else {
      for (const cell of this.maze.flat()) {
        this.visitedCells.add(`${cell.row},${cell.column}`)
      }
    }

    this.drawMinimap(this.getPlayerCell())
    this.showNotification(
      `${powerUp.name.toUpperCase()}! ${powerUp.description}`,
      '#' + powerUp.color.toString(16).padStart(6, '0'),
      1800,
    )
  }

  private activateShield(): void {
    this.shieldActive = true
    this.shieldRing?.destroy()
    this.shieldRing = this.add
      .circle(this.player.x, this.player.y, 20, 0x6bc5ff, 0.12)
      .setStrokeStyle(2, 0x9fe0ff, 0.9)
      .setDepth(11)
    this.minimapCamera.ignore(this.shieldRing)
    this.tweens.add({
      targets: this.shieldRing,
      scale: { from: 0.92, to: 1.08 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
  }

  /** O escudo absorve a captura: some, o Estouro fica atordoado e o Pipoca, protegido. */
  private useShield(): void {
    this.shieldActive = false
    this.graceUntil = this.elapsedMs + SHIELD_GRACE_MS
    this.hunter?.stun(SHIELD_STUN_MS)
    sfx.alert()
    this.cameras.main.flash(250, 140, 200, 255)
    this.cameras.main.shake(200, 0.008)

    if (this.shieldRing) {
      const ring = this.shieldRing

      this.tweens.killTweensOf(ring)
      this.tweens.add({
        targets: ring,
        scale: 4,
        alpha: 0,
        duration: 400,
        onComplete: () => ring.destroy(),
      })
      this.shieldRing = undefined
    }

    this.showNotification('O ESCUDO SE QUEBROU! CORRA!', '#6bc5ff', 2000)
  }

  private collectBone(bone: Phaser.Physics.Arcade.Image): void {
    if (!bone.active) {
      return
    }

    this.tweens.killTweensOf(bone)
    sfx.pickup()
    this.hopForJoy()
    this.burstFirefly(bone.x, bone.y)
    bone.destroy()
    this.drawMinimap(this.getPlayerCell())
    this.bonesCollected++
    this.stamina = FULL_STAMINA
    this.showNotification('OSSO! FÔLEGO RECUPERADO', '#f2ead3', 1200)
  }

  private updateHiding(): void {
    if (this.hidingSpots.length === 0 || this.gamePhase === 'defeat') {
      return
    }

    const inBush = this.hidingSpots.find(
      (bush) =>
        Phaser.Math.Distance.Between(
          bush.x,
          bush.y,
          this.player.x,
          this.player.y,
        ) <= HIDING_RADIUS,
    )

    const hunterDistance = this.hunter
      ? Phaser.Math.Distance.Between(
          this.hunter.position.x,
          this.hunter.position.y,
          this.player.x,
          this.player.y,
        )
      : Infinity

    const canHide =
      !!inBush &&
      !this.sprinting &&
      (this.hidden || hunterDistance >= HIDING_MIN_HUNTER_DISTANCE)

    if (canHide && !this.hidden) {
      this.hides++
      this.tutorialEvent('hid')
      this.hunter?.loseTrack()
      sfx.rustle()
      this.tweens.add({
        targets: inBush,
        angle: { from: -6, to: 6 },
        duration: 70,
        yoyo: true,
        repeat: 2,
        onComplete: () => inBush.setAngle(0),
      })
    }

    this.hidden = canHide
    this.player.setAlpha(canHide ? 0.4 : 1)
  }

  /** Coruja a partir da noite 2: pia se o Pipoca passa perto e o Estouro vai conferir. */
  private spawnOwl(): void {
    if (!owlActive(this.night, this.mode)) {
      return
    }

    if (!this.textures.exists('owl')) {
      const g = this.make.graphics({ x: 0, y: 0 })

      g.fillStyle(0x6b4a2b, 1)
      g.fillEllipse(11, 13, 16, 18)
      g.fillStyle(0x8c6a42, 1)
      g.fillTriangle(4, 6, 8, 2, 9, 8)
      g.fillTriangle(18, 6, 14, 2, 13, 8)
      g.fillStyle(0xffd36a, 1)
      g.fillCircle(8, 10, 3)
      g.fillCircle(14, 10, 3)
      g.fillStyle(0x1a1208, 1)
      g.fillCircle(8, 10, 1.2)
      g.fillCircle(14, 10, 1.2)
      g.generateTexture('owl', 22, 24)
      g.destroy()
    }

    this.owl = this.add.image(0, 0, 'owl').setDepth(12)
    this.minimapCamera.ignore(this.owl)
    this.perchOwl()
    this.showNotification(
      'UMA CORUJA VIGIA A MATA: ELA DENUNCIA QUEM PASSA PERTO',
      '#d9b27a',
      2600,
    )
  }

  /** Pousa a coruja numa célula do labirinto longe do início e da saída. */
  private perchOwl(): void {
    const owl = this.owl

    if (!owl) {
      return
    }

    const [cell] = pickHidingCells(
      this.maze,
      [{ row: 0, column: 0 }, this.exitInformation.cell],
      1,
      Math.random,
    )

    if (!cell) {
      return
    }

    const position = this.getCellCenter(cell.row, cell.column)

    owl.setPosition(position.x, position.y).setAlpha(0)
    this.tweens.add({ targets: owl, alpha: 1, duration: 600 })
  }

  private updateOwl(delta: number): void {
    const owl = this.owl

    if (!owl || !owl.active || this.hunter === undefined) {
      return
    }

    this.owlCooldownMs -= delta

    const distance = Phaser.Math.Distance.Between(
      owl.x,
      owl.y,
      this.player.x,
      this.player.y,
    )

    if (
      owl.alpha < 1 ||
      !owlShouldHoot({
        distance,
        hidden: this.hidden,
        cooldownMs: this.owlCooldownMs,
      })
    ) {
      return
    }

    this.owlCooldownMs = OWL_COOLDOWN_MS
    sfx.hoot()
    this.showNotification('UH-UH! A CORUJA TE DENUNCIOU', '#d9b27a', 1600)
    this.hunter.hearNoise(this.getPlayerCell())
    this.tweens.add({
      targets: owl,
      y: owl.y - 40,
      alpha: 0,
      duration: 500,
      onComplete: () => this.time.delayedCall(2500, () => this.perchOwl()),
    })
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

    hunter.speedMultiplier = this.isInMud(hunter.position.x, hunter.position.y)
      ? MUD_HUNTER_SPEED
      : 1

    const perceivesPlayer = canPerceivePlayer({
      hunter: hunter.position,
      player: { x: this.player.x, y: this.player.y },
      lightRadius: this.hunterSettings.lightPerceptionRadiusCells * CELL_PITCH,
      darkRadius: DARK_PERCEPTION_CELLS * CELL_PITCH,
      walls: this.wallSegments,
      hidden: this.hidden,
    })

    hunter.update(
      delta,
      this.getPlayerCell(),
      { x: this.player.x, y: this.player.y },
      perceivesPlayer,
    )

    if (hunter.state === 'hunting' && this.lastHunterState !== 'hunting') {
      this.timesHunted++
      this.showAlert('!', '#ff5a5a')
      sfx.alert()
    } else if (
      hunter.state === 'investigating' &&
      this.lastHunterState === 'wandering'
    ) {
      this.showAlert('?', '#ffd75a')
    }

    if (this.alertMarker?.active) {
      this.alertMarker.setPosition(
        hunter.position.x,
        hunter.position.y - ALERT_OFFSET_Y,
      )
    }

    this.lastHunterState = hunter.state

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

    if (this.elapsedMs < this.graceUntil) {
      return
    }

    if (this.shieldActive) {
      this.useShield()

      return
    }

    this.gamePhase = 'defeat'
    sfx.stopDrone()
    sfx.caught()
    const timeMs = Math.round(this.elapsedMs)
    const survival = this.mode === 'survival' ? this.survivalOver() : undefined
    const records =
      this.mode === 'normal' ? recordCaught(this.night) : loadRecords()
    const missions = this.missionReward(false, timeMs)
    const achievements = this.earnAchievements(false, timeMs)
    const bones = this.bankBones(false, missions.reward)
    this.effects?.stop()
    this.player.setVelocity(0, 0)

    this.physics.pause()
    this.explodeAt(this.player.x, this.player.y)
    this.cameras.main.shake(CATCH_EFFECT_MS * 0.6, 0.014)
    this.cameras.main.flash(CATCH_EFFECT_MS * 0.5, 255, 200, 140)

    this.time.delayedCall(CATCH_EFFECT_MS, () => {
      this.clearNotifications()
      this.scene.pause()
      this.scene.run(SCENE_KEYS.gameOver, {
        night: this.night,
        timeMs,
        records,
        achievements: [...achievements, ...missions.titles],
        bones,
        mode: this.mode,
        survival,
      })
    })
  }

  /** Soma os pontos da noite vencida na corrida de sobrevivência. */
  private survivalEscape(timeMs: number): {
    gained: number
    total: number
    best: number
  } {
    const gained = scoreForNight({
      night: this.night,
      timeMs,
      bones: this.bonesCollected,
      hides: this.hides,
    })
    const total = addScore(gained)

    return { gained, total, best: Math.max(total, loadSurvivalBest().score) }
  }

  /** Fim da corrida de sobrevivência: guarda o recorde. */
  private survivalOver(): {
    gained: number
    total: number
    best: number
    isNewBest: boolean
    nights: number
  } {
    const total = getScore()
    const nights = this.night - 1
    const result = recordSurvival(total, nights)

    return {
      gained: 0,
      total,
      best: result.best.score,
      isNewBest: result.isNewBest,
      nights,
    }
  }

  /** "!" quando o Estouro começa a caçar, "?" quando ele ouve algo: dá tempo de reagir. */
  private showAlert(symbol: string, color: string): void {
    this.alertMarker?.destroy()

    const marker = this.add
      .text(0, 0, symbol, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        color,
        stroke: '#050a07',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setScale(0.6)

    this.minimapCamera.ignore(marker)
    this.alertMarker = marker

    this.tweens.add({
      targets: marker,
      scale: { from: 0.6, to: 1.1 },
      duration: 160,
      yoyo: true,
    })
    this.tweens.add({
      targets: marker,
      alpha: 0,
      delay: 700,
      duration: 300,
      onComplete: () => marker.destroy(),
    })
  }

  /** O Estouro explode: bola de fogo, faíscas, onda de choque e o Pipoca some. */
  private explodeAt(x: number, y: number): void {
    this.hunter?.gameObject.setVisible(false)
    this.tweens.add({
      targets: this.player,
      alpha: 0,
      scale: 1.4,
      duration: 250,
    })

    const sparks = this.add.particles(x, y, FIREFLY_TEXTURE, {
      speed: { min: 60, max: 260 },
      scale: { start: 2, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 500, max: 900 },
      tint: [0xfff2b0, 0xffb43c, 0xff5a2a, 0xc0201c],
      blendMode: 'ADD',
      emitting: false,
    })

    sparks.setDepth(30)
    this.minimapCamera.ignore(sparks)
    sparks.explode(60)
    this.time.delayedCall(1000, () => sparks.destroy())

    const fireball = this.add
      .image(x, y, GLOW_TEXTURE)
      .setDepth(29)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xff7a2a)
      .setScale(0.3)

    this.minimapCamera.ignore(fireball)
    this.tweens.add({
      targets: fireball,
      scale: 4.5,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.Out',
      onComplete: () => fireball.destroy(),
    })

    const shock = this.add.graphics({ x, y }).setDepth(30)

    shock.lineStyle(1.2, 0xfff2b0, 1)
    shock.strokeCircle(0, 0, 8)
    shock.setBlendMode(Phaser.BlendModes.ADD)
    this.minimapCamera.ignore(shock)
    this.tweens.add({
      targets: shock,
      scale: 10,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.Out',
      onComplete: () => shock.destroy(),
    })
  }

  /** Soma a tentativa às missões do dia e devolve os títulos das concluídas (com recompensa). */
  private missionReward(
    escaped: boolean,
    timeMs: number,
  ): { titles: string[]; reward: number } {
    const update = recordMissions({
      escaped,
      night: this.night,
      timeMs,
      hides: this.hides,
      bones: this.bonesCollected,
      timesHunted: this.timesHunted,
      fireflies: this.collectedItems,
      powerUps: this.powerUpsCollected,
    })

    return {
      titles: update.completed.map((m) => `Missão: ${m.title} (+${m.reward})`),
      reward: update.reward,
    }
  }

  /** Guarda na carteira os ossos desta tentativa (coletados + bônus de fuga + missões). */
  private bankBones(
    escaped: boolean,
    missionBones = 0,
  ): { earned: number; total: number } {
    const earned =
      bonesForRun(this.bonesCollected, escaped, this.night) +
      (escaped ? this.effects_.bonusBones : 0) +
      missionBones
    const wallet = addBones(earned)

    return { earned, total: wallet.bones }
  }

  /** Confere as conquistas da tentativa e devolve os títulos das novas. */
  private earnAchievements(escaped: boolean, timeMs: number): string[] {
    return unlockAchievements({
      escaped,
      night: this.night,
      timeMs,
      hides: this.hides,
      bones: this.bonesCollected,
      timesHunted: this.timesHunted,
    }).map((achievement) => achievement.title)
  }

  private turnOffWorldLights(): void {
    this.lights.setAmbientColor(this.lighting.ambientColor)

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

  private spawnRequiredItems(): MazeCell[] {
    createFireflyTexture(this)

    const itemCells: MazeCell[] = findItemCellsByQuadrant(
      this.maze,
      this.exitInformation.cell,
      this.random,
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
      this.minimapMarkers.push({ cell, color: 0xd9ff6b, object: item })
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

    return itemCells
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

    sfx.pickup()
    this.hopForJoy()
    this.burstFirefly(item.x, item.y)
    this.tweens.killTweensOf(item)
    this.lights.removeLight(glow)
    item.destroy()
    this.drawMinimap(this.getPlayerCell())
    this.collectedItems++
    this.tutorialEvent('firefly')

    if (this.collectedItems >= this.requiredItems) {
      this.unlockExit()
      return
    }

    this.showCollectedItemMessage()
  }

  /** Explosão de coleta: anel que se expande, faíscas aditivas e um clarão. */
  private burstFirefly(x: number, y: number): void {
    const burst = this.add.particles(x, y, FIREFLY_TEXTURE, {
      speed: { min: 40, max: 120 },
      scale: { start: 1.3, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 650,
      quantity: 18,
      blendMode: 'ADD',
      emitting: false,
    })

    burst.setDepth(7)
    this.minimapCamera.ignore(burst)
    burst.explode(18)
    this.time.delayedCall(800, () => burst.destroy())

    const ring = this.add.graphics({ x, y }).setDepth(7)

    ring.lineStyle(1.5, 0xfff2b0, 1)
    ring.strokeCircle(0, 0, 6)
    ring.setBlendMode(Phaser.BlendModes.ADD)
    this.minimapCamera.ignore(ring)
    this.tweens.add({
      targets: ring,
      scale: 5,
      alpha: 0,
      duration: 450,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    })

    const flash = this.add
      .image(x, y, GLOW_TEXTURE)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.2)

    this.minimapCamera.ignore(flash)
    this.tweens.add({
      targets: flash,
      scale: 0.7,
      alpha: 0,
      duration: 350,
      ease: 'Sine.Out',
      onComplete: () => flash.destroy(),
    })
  }

  private showCollectedItemMessage(): void {
    this.showNotification(
      `VAGALUME ${this.collectedItems}/${this.requiredItems}`,
      '#d9ff6b',
      1000,
    )
  }

  private unlockExit(): void {
    sfx.unlock()
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

    if (this.exitGlow) {
      this.tweens.killTweensOf(this.exitGlow)
      this.exitGlow.setAlpha(0.7)
      this.tweens.add({
        targets: this.exitGlow,
        scale: { from: EXIT_GLOW_LOCKED_SCALE, to: EXIT_GLOW_OPEN_SCALE },
        duration: 600,
        ease: 'Back.Out',
        onComplete: () => {
          this.tweens.add({
            targets: this.exitGlow,
            alpha: { from: 0.55, to: 0.9 },
            scale: EXIT_GLOW_OPEN_SCALE * 1.1,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        },
      })
    }

    this.cameras.main.flash(250, 255, 242, 176)

    this.showNotification(
      'O FAROL ACENDEU! CORRA PARA A ESTRADA',
      '#fff2b0',
      2200,
    )
  }

  private startHud(): void {
    this.scene.launch(SCENE_KEYS.hud)
    this.scene.bringToTop(SCENE_KEYS.hud)

    // botão de pausa do HUD (toque): não existe ESC no celular
    const hud = this.scene.get(SCENE_KEYS.hud)

    hud.events.on('pause-request', this.pauseGame, this)

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      hud.events.off('pause-request', this.pauseGame, this)
      sfx.stopDrone()
      this.scene.stop(SCENE_KEYS.hud)
    })
  }

  private updateHud(): void {
    if (!this.scene.isActive(SCENE_KEYS.hud)) {
      return
    }

    const hud = this.scene.get(SCENE_KEYS.hud) as HudScene
    const searching =
      this.gamePhase === 'searchingItems' ||
      this.gamePhase === 'returningToExit'

    hud.setTime(this.elapsedMs)
    this.updateTutorial()
    hud.setNight(
      this.night,
      this.mode === 'daily',
      this.mode === 'survival' ? getScore() : undefined,
    )
    this.shieldRing?.setPosition(this.player.x, this.player.y)
    hud.setPowerUps(
      this.shieldActive,
      Math.max(0, this.speedUntil - this.elapsedMs),
    )
    hud.setModifiers(this.modifiers.map((modifier) => modifier.name))
    hud.setHidden(this.hidden)
    hud.setStamina(this.stamina.value, this.stamina.exhausted)
    hud.setFireflies(this.collectedItems, searching ? this.requiredItems : null)
    const danger = this.dangerLevel()

    hud.setDanger(danger)
    this.updateFear(danger)
  }

  /** Treme (rotação aleatória pequena) quando o perigo passa de FEAR_DANGER. */
  private updateFear(danger: number): void {
    if (danger > FEAR_DANGER && this.gamePhase !== 'defeat') {
      const strength = (danger - FEAR_DANGER) / (1 - FEAR_DANGER)

      this.player.setAngle(
        Phaser.Math.FloatBetween(-1, 1) * FEAR_MAX_ANGLE * (0.4 + strength),
      )
    } else if (this.player.angle !== 0 && this.gamePhase !== 'defeat') {
      this.player.setAngle(0)
    }
  }

  /** Pulinho de alegria ao pegar um vagalume ou osso. */
  private hopForJoy(): void {
    this.tweens.killTweensOf(this.player)
    this.player.setScale(1)
    this.tweens.add({
      targets: this.player,
      scaleX: 1.22,
      scaleY: 1.22,
      duration: 110,
      yoyo: true,
      ease: 'Quad.Out',
      onComplete: () => this.player.setScale(1),
    })
  }

  /** Proximidade do Estouro: 0 longe, 1 encostando; caçando nunca fica abaixo de 0,35. */
  private dangerLevel(): number {
    const hunter = this.hunter

    if (!hunter || this.gamePhase === 'defeat') {
      return 0
    }

    const distance = Phaser.Math.Distance.Between(
      hunter.position.x,
      hunter.position.y,
      this.player.x,
      this.player.y,
    )
    const byDistance = 1 - distance / (DANGER_RADIUS_CELLS * CELL_PITCH)

    return Math.max(byDistance, hunter.state === 'hunting' ? 0.35 : 0)
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
