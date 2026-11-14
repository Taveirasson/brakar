import Phaser from 'phaser'
import { buildShareText, copyText } from '../run/share'
import { resetNight } from '../run/runState'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { formatTime, type Records } from '../run/records'
import { addBackdrop, addPanel, addText, THEME } from '../ui/theme'

export class GameOverScene extends Phaser.Scene {
  private night = 1
  private timeMs = 0
  private records?: Records

  constructor() {
    super(SCENE_KEYS.gameOver)
  }

  init(data: { night?: number; timeMs?: number; records?: Records }): void {
    this.night = data.night ?? 1
    this.timeMs = data.timeMs ?? 0
    this.records = data.records
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    addBackdrop(this, 0.88)
    addPanel(this, centerX, centerY, 580, 400, 0xc0504f)
    addText(
      this,
      centerX,
      centerY - 130,
      'O ESTOURO TE PEGOU',
      'heading',
      THEME.danger,
    )
    addText(
      this,
      centerX,
      centerY - 70,
      `Você não sobreviveu à noite ${this.night}.`,
      'body',
    )

    const best = this.records?.bestTimeMs
    addText(
      this,
      centerX,
      centerY - 22,
      [
        `Tempo na mata: ${formatTime(this.timeMs)}`,
        best ? `Melhor fuga: ${formatTime(best)}` : 'Você ainda não escapou.',
        `Recorde: noite ${this.records?.bestNight ?? this.night}`,
      ],
      'muted',
    )

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 60,
      label: 'TENTAR DE NOVO',
      onClick: () => {
        this.restartGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 125,
      label: 'VOLTAR AO MENU',
      onClick: () => {
        this.returnToMenu()
      },
    })

    this.input.keyboard?.once('keydown-R', () => this.restartGame())
    this.input.keyboard?.once('keydown-SPACE', () => this.restartGame())
    this.input.keyboard?.once('keydown-ENTER', () => this.restartGame())
    this.setupShare(
      addText(
        this,
        centerX,
        centerY + 178,
        'R: tentar de novo  ·  C: copiar resultado',
        'muted',
      ),
      false,
    )

    this.cameras.main.fadeIn(400, 5, 10, 7)
  }

  /** C ou clique: copia o resultado para compartilhar. */
  private setupShare(label: Phaser.GameObjects.Text, escaped: boolean): void {
    const share = async () => {
      const ok = await copyText(
        buildShareText(
          { night: this.night, timeMs: this.timeMs, escaped },
          window.location.href.split('?')[0],
        ),
      )

      label.setText(ok ? 'Resultado copiado!' : 'Não consegui copiar')
    }

    label.setInteractive({ useHandCursor: true })
    label.on('pointerdown', share)
    this.input.keyboard?.on('keydown-C', share)
  }

  private restartGame(): void {
    resetNight()
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.game)
  }

  private returnToMenu(): void {
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.menu)
  }
}
