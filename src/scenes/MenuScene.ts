import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { addText, THEME } from '../ui/theme'
import {
  FOREST_TEXTURE,
  groundFrameFor,
  tileFrameFor,
} from '../maze/forestTileset'
import { TILE_SIZE } from '../maze/MazeLayout'
import {
  PIPOCA_ANIMATIONS,
  PIPOCA_TEXTURE,
} from '../characters/characterAnimationRules'
import {
  ensureAnimations,
  loadCharacterSprites,
} from '../characters/characterAnimations'
import {
  FIREFLY_TEXTURE,
  createFireflyTexture,
} from '../characters/forestProps'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu)
  }

  preload(): void {
    this.load.spritesheet(FOREST_TEXTURE, 'assets/tiles/forest.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE,
    })
    loadCharacterSprites(this)
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    this.createForestBackdrop()

    addText(this, centerX, centerY - 160, 'BRAKAR', 'title')
    addText(
      this,
      centerX,
      centerY - 108,
      'Ajude o Pipoca a voltar para casa',
      'body',
    )

    if (ensureAnimations(this, PIPOCA_TEXTURE, PIPOCA_ANIMATIONS)) {
      this.add
        .sprite(centerX, centerY - 35, PIPOCA_TEXTURE)
        .setScale(3)
        .play('pipoca-idle')
    }

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 60,
      label: 'INICIAR',
      onClick: () => {
        this.startGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 125,
      label: 'CONFIGURAÇÕES',
      onClick: () => {
        this.openConfigScene()
      },
    })
  }

  /** Copas de árvore escurecidas ao fundo, vinheta e vagalumes flutuando. */
  private createForestBackdrop(): void {
    const { width, height } = this.scale

    if (this.textures.exists(FOREST_TEXTURE)) {
      const size = TILE_SIZE * 2

      const rows = Math.ceil(height / size) + 1
      const columns = Math.ceil(width / size) + 1

      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          this.add
            .image(
              column * size,
              row * size,
              FOREST_TEXTURE,
              groundFrameFor(true, row, column, false),
            )
            .setOrigin(0)
            .setScale(2)
            .setTint(0x3a4a3e)
        }
      }

      // duas camadas de copas, a segunda deslocada meio tile, para cobrir os
      // vãos entre as árvores e não formar uma grade regular
      for (const offset of [0, size / 2]) {
        for (let row = -1; row < rows; row++) {
          for (let column = -1; column < columns; column++) {
            this.add
              .image(
                column * size + offset,
                row * size + offset,
                FOREST_TEXTURE,
                tileFrameFor('tree', row + offset, column, false),
              )
              .setOrigin(0)
              .setScale(2)
              .setTint(0x3a4a3e)
          }
        }
      }
    }

    // escurece tudo e abre uma clareira escura no centro para o texto respirar
    const shade = this.add.graphics()
    shade.fillStyle(THEME.backdrop, 0.55)
    shade.fillRect(0, 0, width, height)
    shade.fillStyle(THEME.backdrop, 0.6)
    shade.fillEllipse(width / 2, height / 2, 560, 470)

    createFireflyTexture(this)
    this.add.particles(0, 0, FIREFLY_TEXTURE, {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 4000,
      speedX: { min: -12, max: 12 },
      speedY: { min: -14, max: 6 },
      scale: { min: 0.6, max: 1.1 },
      alpha: { values: [0, 1, 0.4, 1, 0] },
      frequency: 260,
      maxAliveParticles: 22,
    })
  }

  private startGame(): void {
    this.scene.start(SCENE_KEYS.game)
  }

  private openConfigScene(): void {
    this.scene.stop(SCENE_KEYS.menu)
    this.scene.start(SCENE_KEYS.configuration)
  }
}
