import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.menu)
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    this.add
      .text(centerX, centerY - 100, 'BRAKAR', {
        fontFamily: 'monospace',
        fontSize: '64px',
        color: '#9b5de5',
      })
      .setOrigin(0.5)

    this.add
      .text(centerX, centerY - 35, 'Ajude o Pipoca a voltar para casa', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY,
      label: 'INICIAR',
      onClick: () => {
        this.startGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 50,
      label: 'Configurações',
      onClick: () => {
        this.openConfigScene()
      },
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
