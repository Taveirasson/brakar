import Phaser from 'phaser'
import { buildShareText, copyText } from '../run/share'
import { epilogueForNight } from '../run/story'
import { dateKey } from '../run/daily'
import { nextNight, type GameMode } from '../run/runState'
import { SCENE_KEYS } from '../config/sceneKeys'
import { createTextButton } from '../ui/createTextButton'
import { formatTime, type Records } from '../run/records'
import { addBackdrop, addPanel, addText, THEME } from '../ui/theme'

export class VictoryScene extends Phaser.Scene {
  private timeMs = 0
  private records?: Records
  private isNewBest = false
  private night = 1
  private achievements: string[] = []
  private mode: GameMode = 'normal'
  private bones?: { earned: number; total: number }
  private survival?: { gained: number; total: number; best: number }
  private daily?: { streak: number; isNewBest: boolean; bestMs?: number }

  constructor() {
    super(SCENE_KEYS.victory)
  }

  init(data: {
    timeMs?: number
    records?: Records
    isNewBest?: boolean
    night?: number
    achievements?: string[]
    mode?: GameMode
    bones?: { earned: number; total: number }
    survival?: {
      gained: number
      total: number
      best: number
      isNewBest?: boolean
      nights?: number
    }
    daily?: { streak: number; isNewBest: boolean; bestMs?: number }
  }): void {
    this.timeMs = data.timeMs ?? 0
    this.records = data.records
    this.isNewBest = data.isNewBest ?? false
    this.night = data.night ?? 1
    this.achievements = data.achievements ?? []
    this.mode = data.mode ?? 'normal'
    this.bones = data.bones
    this.daily = data.daily
    this.survival = data.survival
  }

  create(): void {
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    addBackdrop(this, 0.88)
    // confete entre o fundo escuro e o painel
    this.launchConfetti()
    addPanel(this, centerX, centerY, 580, 400)

    if (this.bones) {
      addText(
        this,
        centerX + 270,
        centerY - 178,
        `+${this.bones.earned} ossos  (total ${this.bones.total})`,
        'muted',
        THEME.title,
      ).setOrigin(1, 0.5)
    }
    addText(
      this,
      centerX,
      centerY - 130,
      this.isDaily ? 'DESAFIO CONCLUÍDO' : `NOITE ${this.night} SUPERADA`,
      'heading',
    )
    addText(
      this,
      centerX,
      centerY - 70,
      this.isDaily
        ? 'Você escapou do labirinto de hoje.'
        : epilogueForNight(this.night).headline,
      'body',
    )
    addText(
      this,
      centerX,
      centerY - 38,
      this.isDaily
        ? 'Amanhã a mata muda. Volte para manter a sequência.'
        : epilogueForNight(this.night).detail,
      'muted',
    )

    addText(
      this,
      centerX,
      centerY + 5,
      this.statLines(),
      this.highlightsBest ? 'body' : 'muted',
      this.highlightsBest ? THEME.title : undefined,
    )

    if (this.achievements.length > 0) {
      addText(
        this,
        centerX,
        centerY + 42,
        `🏆 ${this.achievements.join('  ·  ')}`,
        'muted',
        THEME.title,
      )
    }

    createTextButton({
      scene: this,
      x: centerX,
      y: centerY + 80,
      label: this.isDaily ? 'MELHORAR O TEMPO' : `NOITE ${this.night + 1}`,
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
    this.setupShare(
      addText(this, centerX, centerY + 182, 'C: copiar resultado', 'muted'),
      true,
    )

    this.cameras.main.fadeIn(400, 5, 10, 7)
  }

  private get isDaily(): boolean {
    return this.mode === 'daily'
  }

  private get highlightsBest(): boolean {
    return this.isDaily ? (this.daily?.isNewBest ?? false) : this.isNewBest
  }

  private statLines(): string[] {
    if (this.isDaily) {
      const streak = this.daily?.streak ?? 1

      return [
        this.daily?.isNewBest
          ? `MELHOR DE HOJE: ${formatTime(this.timeMs)}`
          : `Tempo: ${formatTime(this.timeMs)}`,
        `Melhor de hoje: ${formatTime(this.daily?.bestMs ?? this.timeMs)}  ·  🔥 ${streak} ${streak === 1 ? 'dia' : 'dias'}`,
      ]
    }

    if (this.survival) {
      return [
        `+${this.survival.gained} pontos  ·  Tempo: ${formatTime(this.timeMs)}`,
        `Total: ${this.survival.total}  ·  Recorde: ${this.survival.best}`,
      ]
    }

    return [
      this.isNewBest
        ? `NOVO RECORDE: ${formatTime(this.timeMs)}`
        : `Tempo: ${formatTime(this.timeMs)}`,
      `Melhor: ${formatTime(this.records?.bestTimeMs ?? this.timeMs)}  ·  Fugas: ${this.records?.escapes ?? 1}`,
    ]
  }

  /** Chuva de confete colorido caindo atrás do painel. */
  private launchConfetti(): void {
    const key = 'confetti'

    if (!this.textures.exists(key)) {
      const graphics = this.make.graphics({ x: 0, y: 0 })

      graphics.fillStyle(0xffffff, 1)
      graphics.fillRect(0, 0, 6, 3)
      graphics.generateTexture(key, 6, 3)
      graphics.destroy()
    }

    const emitter = this.add.particles(0, 0, key, {
      x: { min: 0, max: this.scale.width },
      y: -10,
      lifespan: 4200,
      speedY: { min: 90, max: 190 },
      speedX: { min: -50, max: 50 },
      gravityY: 40,
      rotate: { min: 0, max: 360 },
      scale: { min: 0.9, max: 1.8 },
      tint: [0xf4d35e, 0x9fe870, 0xff6b6b, 0x6bc5ff, 0xffffff],
      alpha: { start: 1, end: 0.2 },
      frequency: 45,
      maxAliveParticles: 90,
    })

    emitter.setDepth(0)
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
            daily: this.isDaily
              ? { date: dateKey(), streak: this.daily?.streak ?? 1 }
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
    if (!this.isDaily) {
      nextNight()
    }

    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.game)
  }

  private returnToMenu(): void {
    this.scene.stop(SCENE_KEYS.game)
    this.scene.start(SCENE_KEYS.menu)
  }
}
