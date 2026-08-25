import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.victory)
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
      .text(centerX, centerY - 130, 'VOCÊ ESCAPOU', {
        fontFamily: 'monospace',
        fontSize: '46px',
        color: '#f4d35e',
      })
      .setOrigin(0.5)

    this.add
      .text(centerX, centerY - 70, 'Você encontrou a saída do labirinto.', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    this.add
      .text(
        centerX,
        centerY - 35,
        'Mas talvez alguma coisa tenha saído com você...',
        {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#a999b5',
        },
      )
      .setOrigin(0.5)

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 45,
      label: 'JOGAR NOVAMENTE',
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
