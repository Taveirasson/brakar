import Phaser from 'phaser'
import { buildShareText, copyText } from '../run/share'
import { dateKey } from '../run/daily'
import { getGameMode, resetNight } from '../run/runState'
import { SCENE_KEYS } from '../config/sceneKeys'
import { setGameHudVisible } from '../ui/overlayHud'
import { createTextButton } from '../ui/createTextButton'
import { formatTime, type Records } from '../run/records'
import {
  addAchievements,
  isTouchDevice,
  addBackdrop,
  addPanel,
  addText,
  THEME,
} from '../ui/theme'

export class GameOverScene extends Phaser.Scene {
  private night = 1
  private timeMs = 0
  private bones?: { earned: number; total: number }
  private achievements: string[] = []
  private records?: Records
  private survival?: {
    total: number
    best: number
    isNewBest?: boolean
    nights?: number
  }

  constructor() {
    super(SCENE_KEYS.gameOver)
  }

  init(data: {
    night?: number
    timeMs?: number
    records?: Records
    achievements?: string[]
    bones?: { earned: number; total: number }
    survival?: {
      gained: number
      total: number
      best: number
      isNewBest?: boolean
      nights?: number
    }
  }): void {
    this.night = data.night ?? 1
    this.timeMs = data.timeMs ?? 0
    this.bones = data.bones
    this.achievements = data.achievements ?? []
    this.records = data.records
    this.survival = data.survival
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    setGameHudVisible(this, false)
    addBackdrop(this, 0.88)
    addPanel(this, centerX, centerY, 580, 440, 0xc0504f)

    if (this.bones) {
      addText(
        this,
        centerX + 270,
        centerY - 198,
        `+${this.bones.earned} ossos  (total ${this.bones.total})`,
        'muted',
        THEME.title,
      ).setOrigin(1, 0.5)
    }
    addText(
      this,
      centerX,
      centerY - 150,
      'O ESTOURO TE PEGOU',
      'heading',
      THEME.danger,
    )
    addText(
      this,
      centerX,
      centerY - 92,
      this.survival
        ? `Você sobreviveu a ${this.survival.nights ?? 0} ${this.survival.nights === 1 ? 'noite' : 'noites'}.`
        : getGameMode() === 'daily'
          ? 'Você não escapou do labirinto de hoje. Tente de novo!'
          : `Você não sobreviveu à noite ${this.night}.`,
      'body',
    )

    if (this.achievements.length > 0) {
      addAchievements(this, centerX, centerY + 34, this.achievements)
    }

    const best = this.records?.bestTimeMs
    addText(
      this,
      centerX,
      centerY - 30,
      this.survival
        ? [
            this.survival.isNewBest
              ? `NOVO RECORDE: ${this.survival.total} pontos`
              : `Pontuação: ${this.survival.total}`,
            `Recorde: ${this.survival.best} pontos`,
          ]
        : [
            `Tempo na mata: ${formatTime(this.timeMs)}`,
            best
              ? `Melhor fuga: ${formatTime(best)}`
              : 'Você ainda não escapou.',
            `Recorde: noite ${this.records?.bestNight ?? this.night}`,
          ],
      'muted',
    )

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 100,
      label: 'TENTAR DE NOVO',
      onClick: () => {
        this.restartGame()
      },
    })

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 160,
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
        centerY + 200,
        isTouchDevice()
          ? 'Toque aqui para copiar o resultado'
          : 'R: tentar de novo  ·  C: copiar resultado',
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
          {
            night: this.night,
            timeMs: this.timeMs,
            escaped,
            daily:
              getGameMode() === 'daily'
                ? { date: dateKey(), streak: 0 }
                : undefined,
          },
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
