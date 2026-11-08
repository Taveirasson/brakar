import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { GameScene } from './GameScene'

export class LockedExitScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.lockedExit)
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
      0.88,
    )

    this.add
      .rectangle(centerX, centerY, 580, 330, 0x171120)
      .setStrokeStyle(3, 0xf4d35e)

    this.add
      .text(centerX, centerY - 105, 'O CARRO JÁ SE FOI', {
        fontFamily: 'monospace',
        fontSize: '34px',
        color: '#f4d35e',
      })
      .setOrigin(0.5)

    this.add
      .text(
        centerX,
        centerY - 25,
        [
          'O farol sumiu entre as árvores e a mata apagou.',
          'Junte 3 vagalumes para clarear a trilha',
          'até a estrada. E fuja do Estouro.',
        ],
        {
          fontFamily: 'monospace',
          fontSize: '17px',
          color: '#ffffff',
          align: 'center',
          lineSpacing: 8,
        },
      )
      .setOrigin(0.5)

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
