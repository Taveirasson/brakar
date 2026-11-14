import Phaser from 'phaser'
import { isMuted, toggleMuted } from '../audio/sfx'
import { resetNight } from '../run/runState'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { addBackdrop, addPanel, addText } from '../ui/theme'

export class PauseScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.pause)
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    addBackdrop(this, 0.78)
    addPanel(this, centerX, centerY + 20, 440, 410)
    addText(this, centerX, centerY - 125, 'PAUSADO', 'heading')

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY - 55,
      label: 'CONTINUAR',
      onClick: () => {
        this.resumeGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 10,
      label: 'REINICIAR',
      onClick: () => {
        this.restartGame()
      },
    })

    const soundLabel = () => (isMuted() ? 'SOM: DESLIGADO' : 'SOM: LIGADO')
    const soundButton = createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 75,
      label: soundLabel(),
      onClick: () => {
        toggleMuted()
        ;(soundButton.list[1] as Phaser.GameObjects.Text).setText(soundLabel())
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
    resetNight()
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.game)
  }
}
