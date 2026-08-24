import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.pause)
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
      0.8,
    )

    this.add
      .text(centerX, centerY - 80, 'JOGO PAUSADO', {
        fontFamily: 'monospace',
        fontSize: '42px',
        color: '#ffffff',
      })
      .setOrigin(0.5)

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY,
      label: 'CONTINUAR',
      onClick: () => {
        this.resumeGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 70,
      label: 'REINICIAR',
      onClick: () => {
        this.restartGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 140,
      label: 'VOLTAR AO MENU',
      onClick: () => {
        this.returnToMenu()
      },
    })

    this.configureKeyboard()
  }

  private configureKeyboard(): void {
    if (!this.input.keyboard) {
      return
    }

    this.input.keyboard.once('keydown-ESC', () => {
      this.resumeGame()
    })
  }

  private resumeGame(): void {
    this.scene.resume(SCENE_KEYS.game)
    this.scene.stop()
  }

  private returnToMenu(): void {
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.menu)
  }

  private restartGame(): void {
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.game)
  }
}
