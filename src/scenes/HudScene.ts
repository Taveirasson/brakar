import Phaser from 'phaser'
import { SCENE_KEYS } from '../config/sceneKeys'
import { formatTime } from '../run/records'
import { sfx } from '../audio/sfx'
import { FONT_FAMILY, THEME } from '../ui/theme'

const VIGNETTE_TEXTURE = 'danger-vignette'

/** Camada fixa por cima do jogo: cronômetro, vagalumes e vinheta de perigo. */
export class HudScene extends Phaser.Scene {
  private timer!: Phaser.GameObjects.Text
  private fireflies!: Phaser.GameObjects.Text
  private nightLabel!: Phaser.GameObjects.Text
  private vignette!: Phaser.GameObjects.Image
  private staminaBar!: Phaser.GameObjects.Graphics
  private staminaValue = 1
  private staminaExhausted = false
  private hiddenLabel!: Phaser.GameObjects.Text
  private danger = 0
  private nextBeatAt = 0

  constructor() {
    super(SCENE_KEYS.hud)
  }

  create(): void {
    this.danger = 0
    this.nextBeatAt = 0
    this.createVignetteTexture()

    this.vignette = this.add
      .image(0, 0, VIGNETTE_TEXTURE)
      .setOrigin(0)
      .setDisplaySize(this.scale.width, this.scale.height)
      .setAlpha(0)

    const style = {
      fontFamily: FONT_FAMILY,
      fontSize: '20px',
      color: THEME.text,
      stroke: '#050a07',
      strokeThickness: 4,
    }

    this.timer = this.add.text(16, 12, '0:00.0', style)
    this.nightLabel = this.add.text(16, 62, '', {
      ...style,
      fontSize: '16px',
      color: THEME.muted,
    })
    this.staminaBar = this.add.graphics()
    this.add.text(16, 86, 'SHIFT: correr  ·  moitas escondem  ·  M: som', {
      ...style,
      fontSize: '13px',
      strokeThickness: 3,
      color: THEME.muted,
    })
    this.hiddenLabel = this.add
      .text(this.scale.width / 2, this.scale.height - 40, 'ESCONDIDO', {
        ...style,
        color: '#9fe870',
      })
      .setOrigin(0.5)
      .setAlpha(0)
    this.fireflies = this.add.text(16, 38, '', {
      ...style,
      color: THEME.title,
    })
  }

  update(time: number): void {
    // pulsa como batimento quanto mais perto o Estouro está
    const pulse = 0.75 + 0.25 * Math.sin(time / (260 - this.danger * 120))

    this.vignette?.setAlpha(this.danger * pulse)

    if (this.danger > 0.15 && time >= this.nextBeatAt) {
      sfx.heartbeat(this.danger)
      this.nextBeatAt = time + 1100 - this.danger * 600
    }
  }

  setTime(ms: number): void {
    this.timer?.setText(formatTime(ms))
  }

  setStamina(value: number, exhausted: boolean): void {
    this.staminaValue = value
    this.staminaExhausted = exhausted
    this.drawStamina()
  }

  private drawStamina(): void {
    const bar = this.staminaBar

    if (!bar) {
      return
    }

    const width = 110
    const color = this.staminaExhausted ? 0xc0504f : 0x9fe870

    bar.clear()
    bar.fillStyle(0x050a07, 0.7)
    bar.fillRoundedRect(16, 106, width + 4, 10, 4)
    bar.fillStyle(color, 1)
    bar.fillRoundedRect(18, 108, Math.max(0, width * this.staminaValue), 6, 3)
  }

  setHidden(hidden: boolean): void {
    this.hiddenLabel?.setAlpha(hidden ? 1 : 0)
  }

  setNight(night: number): void {
    this.nightLabel?.setText(`Noite ${night}`)
  }

  setFireflies(collected: number, required: number | null): void {
    this.fireflies?.setText(
      required === null ? '' : `Vagalumes ${collected}/${required}`,
    )
  }

  /** 0 = longe, 1 = encostando. */
  setDanger(level: number): void {
    this.danger = Phaser.Math.Clamp(level, 0, 1)
  }

  private createVignetteTexture(): void {
    if (this.textures.exists(VIGNETTE_TEXTURE)) {
      return
    }

    const width = 480
    const height = 270
    const texture = this.textures.createCanvas(VIGNETTE_TEXTURE, width, height)
    const context = texture?.getContext()

    if (!texture || !context) {
      return
    }

    const gradient = context.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.35,
      width / 2,
      height / 2,
      width * 0.62,
    )
    gradient.addColorStop(0, 'rgba(120, 0, 10, 0)')
    gradient.addColorStop(1, 'rgba(160, 10, 20, 0.85)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)
    texture.refresh()
  }
}
