import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'

export class GameOverScene extends Phaser.Scene {
  private night = 1

  constructor() {
    super(SCENE_KEYS.gameOver)
  }

  init(data: { night?: number }): void {
    this.night = data.night ?? 1
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    this.add.rectangle(
      centerX,
      centerY,
      this.scale.width,
      this.scale.height,
      0x09070f,
      0.9,
    )

    this.add
      .rectangle(centerX, centerY, 520, 390, 0x171120)
      .setStrokeStyle(3, 0x9b5de5)

    this.add
      .text(centerX, centerY - 130, 'VOCÊ FOI PEGO', {
        fontFamily: 'monospace',
        fontSize: '46px',
        color: '#ff5d73',
      })
      .setOrigin(0.5)

    this.add
      .text(
        centerX,
        centerY - 70,
        `Você não sobreviveu à noite ${this.night}.`,
        {
          fontFamily: 'monospace',
          fontSize: '18px',
          color: '#ffffff',
        },
      )
      .setOrigin(0.5)

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 45,
      label: 'TENTAR DE NOVO',
      onClick: () => {
        this.restartGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 115,
      label: 'VOLTAR AO MENU',
      onClick: () => {
        this.returnToMenu()
      },
    })

    this.cameras.main.fadeIn(400, 9, 7, 15)
  }

  private restartGame(): void {
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.game)
  }

  private returnToMenu(): void {
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.menu)
  }
}
