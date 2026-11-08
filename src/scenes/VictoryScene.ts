import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { addBackdrop, addPanel, addText } from '../ui/theme'

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.victory)
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    addBackdrop(this, 0.88)
    addPanel(this, centerX, centerY, 580, 400)
    addText(this, centerX, centerY - 130, 'PIPOCA ESCAPOU', 'heading')
    addText(
      this,
      centerX,
      centerY - 70,
      'O Pipoca chegou à beira da estrada.',
      'body',
    )
    addText(
      this,
      centerX,
      centerY - 38,
      'Mas o carro já tinha seguido... e a mata continua.',
      'muted',
    )

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

    this.cameras.main.fadeIn(400, 5, 10, 7)
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
