import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { formatTime, type Records } from '../run/records'
import { addBackdrop, addPanel, addText, THEME } from '../ui/theme'

export class VictoryScene extends Phaser.Scene {
  private timeMs = 0
  private records?: Records
  private isNewBest = false

  constructor() {
    super(SCENE_KEYS.victory)
  }

  init(data: {
    timeMs?: number
    records?: Records
    isNewBest?: boolean
  }): void {
    this.timeMs = data.timeMs ?? 0
    this.records = data.records
    this.isNewBest = data.isNewBest ?? false
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

    addText(
      this,
      centerX,
      centerY + 5,
      [
        this.isNewBest
          ? `NOVO RECORDE: ${formatTime(this.timeMs)}`
          : `Tempo: ${formatTime(this.timeMs)}`,
        `Melhor: ${formatTime(this.records?.bestTimeMs ?? this.timeMs)}  ·  Fugas: ${this.records?.escapes ?? 1}`,
      ],
      this.isNewBest ? 'body' : 'muted',
      this.isNewBest ? THEME.title : undefined,
    )

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 80,
      label: 'JOGAR NOVAMENTE',
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

    this.input.keyboard?.once('keydown-R', () => this.restartGame())
    this.input.keyboard?.once('keydown-SPACE', () => this.restartGame())
    this.input.keyboard?.once('keydown-ENTER', () => this.restartGame())

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
