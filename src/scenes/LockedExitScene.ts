import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { GameScene } from './GameScene'
import { addBackdrop, addPanel, addText } from '../ui/theme'

export class LockedExitScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.lockedExit)
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    addBackdrop(this, 0.84)
    addPanel(this, centerX, centerY, 620, 340)
    addText(this, centerX, centerY - 110, 'O CARRO JÁ SE FOI', 'heading')
    addText(
      this,
      centerX,
      centerY - 25,
      [
        'O farol sumiu entre as árvores e a mata apagou.',
        'Junte 3 vagalumes para clarear a trilha',
        'até a estrada. E fuja do Estouro.',
      ],
      'body',
    )

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 100,
      label: 'PROCURAR VAGALUMES',
      onClick: () => {
        this.startSearch()
      },
    })
  }

  private startSearch(): void {
    const gameScene = this.scene.get(SCENE_KEYS.game) as GameScene

    gameScene.beginItemSearch()

    this.scene.resume(SCENE_KEYS.game)
    this.scene.stop()
  }
}
